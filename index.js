'use strict';

import MongoDB from 'mongodb';
import jsondiffpatch from 'jsondiffpatch';

module.exports = class DB {
	constructor(db_conn, cache_conn) { 
		this.db_conn = db_conn; 
		this.cache_conn = cache_conn;

		this.removals = {};
		this.modifications = {};
	}

	async stream(collection, query, fields) {
		let docs = [];
			
		let cursor = this.db_conn.collection(collection).find(query, fields);

		return new Promise((resolve, reject) => {
			cursor.on('data', doc => docs.push(doc));

			cursor.once('end', () => resolve(docs));
		});
	}

	async update(collection, query, update, options) {
		let docs = await this.stream(collection, query, { _id: 1 });
		let _ids = docs.map( doc => doc._id );

		return await this.db_conn.collection(collection).update(query, update, options)
			.then( res => {
				if (res.result.upserted) {
					_ids = _ids.concat(res.result.upserted.map( r => r._id ));
				}

				if (res.result.nModified || res.result.upserted) {
					if (!this.modifications[collection]) {
						this.modifications[collection] = new Set();
					}

					_ids.forEach( _id => this.modifications[collection].add(_id.toString()) );
				}

				return res;
			});
	}

	async remove(collection, query) {
		let docs = await this.stream(collection, query, { _id: 1 });
		let _ids = docs.map( doc => doc._id );

		if (!this.removals[collection]) {
			this.removals[collection] = new Set();
		}

		_ids.forEach( _id => this.removals[collection].add(_id.toString()) );

		return await this.db_conn.collection(collection).remove(query);
	}

	async insert(collection, docs) {
		let _ids = docs.map( doc => doc._id );

		if (!this.modifications[collection]) {
			this.modifications[collection] = new Set();
		}

		_ids.forEach( _id => this.modifications[collection].add(_id.toString()) );

		return await this.db_conn.collection(collection).insertMany(docs);
	}

	consume(collection) {
		let invalidations = {
			modifications: [],
			removals: []
		};

		if (this.modifications[collection] && this.removals[collection]) {
			invalidations.modifications = Array.from(this.modifications[collection]).filter( m => !this.removals[collection].has(m) );
			invalidations.removals = Array.from(this.removals[collection]);

			this.modifications[collection].clear();
			this.removals[collection].clear();
		}

		else {
			if (this.modifications[collection]) {
				invalidations.modifications = Array.from(this.modifications[collection]);

				this.modifications[collection].clear();
			}

			if (this.removals[collection]) {
				invalidations.removals = Array.from(this.removals[collection]);

				this.removals[collection].clear();
			}
		}

		return invalidations;
	}

	async generate_patches(collection) {
		let invalidations = this.consume(collection);

		let patches = [];

		if (invalidations.modifications.length) {
			let old_docs = await this.cache_conn.hmgetAsync(collection, invalidations.modifications);
			let new_docs = await this.stream(collection, { _id: { $in: invalidations.modifications.map( _id => MongoDB.ObjectId(_id) ) } });

			console.log(new_docs);
			console.log(old_docs);
			
			new_docs.forEach( (new_doc, index) => {
				let old_doc = old_docs[index];

				if (!old_doc) {
					patches.push({
						type: 'save',
						doc: new_doc
					});
				}

				else {
					patches.push({
						type: 'update',
						_id: old_doc._id,
						patch: jsondiffpatch.diff(old_doc, new_doc)
					});
				}
			});
		}

		invalidations.removals.forEach( removal => patches.push({ type: 'removal', _id: removal }));

		return patches;
	}
};