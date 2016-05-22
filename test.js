'use strict';

var invalidate = require('./index');

async function run () {
	try {
		let db = await invalidate.init('mongodb://127.0.0.1:27017/db');

		let collection = db.collection('orders');

		console.log(JSON.stringify(await invalidate.insert(collection, [{ _id: MongoDB.ObjectId(), number: '123', total: 456 }])));
	}

	catch (err) {
		console.error(err['stack']);
	}
}

run();