const { Pool } = require('pg');

const pool = new Pool(
{
    user: 'postgres',
    host: 'localhost',
    database: 'populate',
    password: '123',
    port: 5432
});

const genres = [];

function genreCreate(name) {
  genres.push(name);
  const query = {text: '', values: []};

  query.text = 'INSERT INTO models.genre (name) VALUES($1)';
  query.values = [name];
  return query;
  
  return query;
}

(async () => {
const client = await pool.connect();
 
  try {
    await client.query('BEGIN');
    await client.query(genreCreate("Fhgh"));
 
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
console.log(genres);
    client.release();
    pool.end();
  }
})();

