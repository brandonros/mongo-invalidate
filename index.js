'use strict';

import MongoDB from 'mongodb';

module.exports = class DB {
	constructor(url) { 
		this.url = url;
		this.conn = null; 
		this.removals = new Set();
		this.modifications = new Set();
	}

	async init() { 
		this.conn = await MongoDB.MongoClient.connect(this.url);
	};

	static ObjectId(str) { return MongoDB.ObjectId(str); }

	async stream(collection, query, fields) {
		let docs = [];
			
		let cursor = this.conn.collection(collection).find(query, fields);

		return new Promise((resolve, reject) => {
			cursor.on('data', doc => docs.push(doc));

			cursor.once('end', () => resolve(docs));
		});
	}

	async update(collection, query, update, options) {
		let docs = await this.stream(collection, query, { _id: 1 });
		let _ids = docs.map( doc => doc._id );

		return await this.conn.collection(collection).update(query, update, options)
			.then( res => {
				if (res.result.upserted) {
					_ids = _ids.concat(res.result.upserted.map( r => r._id ));
				}

				if (res.result.nModified || res.result.upserted) {
					_ids.forEach( _id => this.modifications.add(_id.toString()) );
				}

				return res;
			});
	}

	async remove(collection, query) {
		let docs = await this.stream(collection, query, { _id: 1 });
		let _ids = docs.map( doc => doc._id );

		_ids.forEach( _id => this.removals.add(_id.toString()) );

		return await this.conn.collection(collection).remove(query);
	}

	async insert(collection, docs) {
		let _ids = docs.map( doc => doc._id );

		_ids.forEach( _id => this.modifications.add(_id.toString()) );

		return await this.conn.collection(collection).insertMany(docs);
	}

	consume() {
		let invalidations = {
			modifications: Array.from(this.modifications).filter( m => !this.removals.has(m) ),
			removals: Array.from(this.removals)
		};

		this.modifications = new Set();
		this.removals = new Set();

		return invalidations;
	}
};