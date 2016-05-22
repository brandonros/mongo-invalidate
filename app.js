var MongoDB = require('mongodb');

async function init(url) {
	return await MongoDB.MongoClient.connect(url);
}

function stream(collection, query, fields) {
	var docs = [];
		
	var cursor = collection.find(query, fields);

	return new Promise(function (resolve, reject) {
		cursor.on('data', function (doc) {
			docs.push(doc);
		});

		cursor.once('end', function () {
			resolve(docs);
		});
	});
}

async function update(collection, query, update, options) {
	var _ids = await stream(collection, query, { _id: 1 }).map(function (doc) {
		return doc._id;
	});

	return await collection.update(query, update, options)
		.then(function (res) {
			return {
				writeRes: res,
				_ids: _ids
			};
		});
}

async function insert(collection, docs) {
	var _ids = docs.map(function (d) {
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

async function remove(collection, query) {
	var _ids = await stream(collection, query, { _id: 1 }).map(function (doc) {
		return doc._id;
	});

	return await collection.remove(query)
		.then(function (res) {
			return {
				writeRes: res,
				_ids: _ids
			};
		});
}

var db = await init('mongodb://127.0.0.1:27017/db');

var collection = db.collection('orders');

console.log(JSON.stringify(await insert(collection, [{ _id: MongoDB.ObjectId(), number: '123', total: 456 }])));