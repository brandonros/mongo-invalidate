'use strict';

import MongoDB from 'mongodb';

var DB = require('./index');

async function run() {
	try {
		let conn = await MongoDB.MongoClient.connect('mongodb://127.0.0.1:27017/db');

		let db = new DB(conn);

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

		console.log(JSON.stringify(await db.update('orders', query, update, options)));
		console.log(JSON.stringify(await db.remove('orders', query)));
		console.log(db.consume('orders'));
		console.log(db.modifications);
		console.log(db.removals);
	}

	catch (err) {
		console.error(err['stack']);
	}
}

run();