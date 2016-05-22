'use strict';

var DB = require('./index');

/*
async function run () {
	try {
		let db = await invalidate.init('mongodb://127.0.0.1:27017/db');

		let collection = db.collection('orders');

		//console.log(JSON.stringify(await invalidate.insert(collection, [{ _id: invalidate.ObjectId(), number: '123', total: 456 }])));

		let query = {
			_id: invalidate.ObjectId('57413255bbb3de9608d01853')
		};

		let update = {
			$set: {
				total: 7777
			}
		};

		let options = {
			upsert: true
		};

		console.log(JSON.stringify(await invalidate.update(collection, query, update, options)));
	}

	catch (err) {
		console.error(err['stack']);
	}
}

run();*/

async function run() {
	try {
		let conn = new DB('mongodb://127.0.0.1:27017/db');

		await conn.init();

		let query = {
			_id: DB.ObjectId('57413255bbb3de9608d01859')
		};

		let update = {
			$set: {
				total: 7777
			}
		};

		let options = {
			upsert: true
		};

		console.log(JSON.stringify(await conn.update('orders', query, update, options)));
		console.log(JSON.stringify(await conn.remove('orders', query, update, options)));
		console.log(conn.consume());
		console.log(conn.modifications);
	}

	catch (err) {
		console.error(err['stack']);
	}
}

run();