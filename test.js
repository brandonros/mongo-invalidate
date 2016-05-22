'use strict';

import MongoDB from 'mongodb';
import redis from 'redis';
import Promise from 'bluebird';

Promise.promisifyAll(redis.RedisClient.prototype);

var DB = require('./index');

async function run() {
	try {
		let db_conn = await MongoDB.MongoClient.connect('mongodb://127.0.0.1:27017/db');
		let redis_conn = await redis.createClient(6379, '127.0.0.1');

		let db = new DB(db_conn, redis_conn);

		let query = {
			_id: MongoDB.ObjectId('57413255bbb3de9608d01859')
		};

		let update = {
			$set: {
				total: 77771
			}
		};

		let options = {
			upsert: true
		};

		console.log(JSON.stringify(await db.update('orders', query, update, options)));
		//console.log(JSON.stringify(await db.remove('orders', query)));
		console.log(JSON.stringify(await db.generate_patches('orders')));
	}

	catch (err) {
		console.error(err['stack']);
	}
}

run();