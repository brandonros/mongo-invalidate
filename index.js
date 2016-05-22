'use strict';

import MongoDB from 'mongodb';

const db = module.exports;

db.ObjectId = str => MongoDB.ObjectId(str);

db.init = async url => {
	return await MongoDB.MongoClient.connect(url);
};

db.stream = (collection, query, fields) => {
	let docs = [];
		
	let cursor = collection.find(query, fields);

	return new Promise((resolve, reject) => {
		cursor.on('data', doc => docs.push(doc));

		cursor.once('end', () => resolve(docs));
	});
};

db.update = async (collection, query, update, options) => {
	let docs = await module.exports.stream(collection, query, { _id: 1 });
	let _ids = docs.map( doc => doc._id );

	return await collection.update(query, update, options)
		.then( res => {
			if (res.result.upserted) {
				_ids = _ids.concat(res.result.upserted.map( r => r._id ));
			}

			return {
				writeRes: res,
				_ids: _ids
			};
		});
};

db.remove = async (collection, query) => {
	let docs = await db.stream(collection, query, { _id: 1 });
	let _ids = docs.map( doc => doc._id );

	return await collection.remove(query).then( res => ({ writeRes: res, _ids: _ids }));
};

db.insert = async (collection, docs) => {
	let _ids = docs.map( doc => doc._id );

	return await collection.insertMany(docs).then( res => ({ writeRes: res, _ids: _ids }));
};