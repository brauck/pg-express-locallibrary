const { Pool } = require('pg');
const { config_db, schema, author, genre, book, bookinstance } = require('../config');
const pool = new Pool(config_db);

const schema_init = `CREATE SCHEMA ${schema};`;

const status = `CREATE TYPE status AS ENUM ('Available', 'Maintenance', 'Loaned', 'Reserved');`;

const author_table = `
  CREATE TABLE ${author}(
    id            SERIAL PRIMARY KEY,
    first_name    TEXT   NOT NULL,
    family_name   TEXT   NOT NULL,
    date_of_birth DATE,
    date_of_death DATE
  );
`;

const genre_table = `
  CREATE TABLE ${genre}(
    id   SERIAL PRIMARY KEY,
    name TEXT   NOT NULL UNIQUE
  );
`;

const book_table = `
   CREATE TABLE ${book}(
    id      SERIAL PRIMARY KEY,
    title   TEXT   NOT NULL,
    author  INT    NOT NULL references ${author}(id),
    summary TEXT   NOT NULL,
    isbn    TEXT   NOT NULL,
    genre   TEXT[]
  );
`;

const bookinstance_table = `
  CREATE TABLE ${bookinstance}(
    id             SERIAL PRIMARY KEY,
    book           INT    NOT NULL references ${book}(id),
    imprint        TEXT   NOT NULL,
    due_back       DATE,
    current_status status DEFAULT 'Maintenance'
  );
`;

// note: we don't try/catch this because if connecting throws an exception
// we don't need to dispose of the client (it will be undefined)
(async () => {
const client = await pool.connect();
 
  try {
    await client.query('BEGIN');
    await client.query(schema_init);
    await client.query(status);
    await client.query(author_table);
    await client.query(genre_table);
    await client.query(book_table); 
    await client.query(bookinstance_table);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    pool.end();
  }
})();
