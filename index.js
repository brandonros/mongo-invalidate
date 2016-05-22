'use strict';

let MongoDB = require('mongodb');

module.exports = {
	init: async function (url) {
		return await MongoDB.MongoClient.connect(url);
	},
	stream: function (collection, query, fields) {
		let docs = [];
			
		let cursor = collection.find(query, fields);

		return new Promise(function (resolve, reject) {
			cursor.on('data', function (doc) {
				docs.push(doc);
			});

			cursor.once('end', function () {
				resolve(docs);
			});
		});
	},
	update: async function (collection, query, update, options) {
		let _ids = await this.stream(collection, query, { _id: 1 }).map(function (doc) {
			return doc._id;
		});

		return await collection.update(query, update, options)
			.then(function (res) {
				return {
					writeRes: res,
					_ids: _ids
				};
			});
	},
	remove: async function (collection, query) {
		let _ids = await this.stream(collection, query, { _id: 1 }).map(function (doc) {
			return doc._id;
		});

		return await collection.remove(query)
			.then(function (res) {
				return {
					writeRes: res,
					_ids: _ids
				};
			});
	},
	insert: async function (collection, docs) {
		let _ids = docs.map(function (d) {
			return doc._id;
		});

		return await collection.insertMany(docs)
			.then(function (res) {
				return {
					writeRes: res,
					_ids: _ids
				};
			});
	}
};