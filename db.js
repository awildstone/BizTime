/** Database setup for BizTime. */

const { Client } = require('pg');

// Select the db based off of the DB environment settings
const DB_URI = (process.env.NODE_ENV === 'test') ? 'postgresql:///biztime_test' : 'postgresql:///biztime';

// Create Client & assign DB
let db = new Client({connectionString: DB_URI});

//connect to db
db.connect();

module.exports = db;