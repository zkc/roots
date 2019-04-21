const Knex = require('knex');


function connect() {
  const config = {
    user: process.env.DB_USER || 'postgres', 
    password: process.env.DB_PASS || 'nativeDB', // Don't actually do this here
    database: process.env.DB_NAME || 'native',
  };

  config.host = `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME || 'native-roots-kz:us-central1:native-roots-kz'}`;

  // Establish a connection to the database
  const knex = Knex({
    client: 'pg',
    connection: config,
  });

  return knex;
}


module.exports = connect
