// This script populates some test books, authors, genres and bookinstances to the database.

const { Pool } = require('pg');
const { config_db } = require('../config');
const pool = new Pool(config_db);

function genreCreate(name) {
  const query = {text: '', values: []};
  query.text = 'INSERT INTO models.genre (name) VALUES($1)';
  query.values = [name];
  return query;
}

function authorCreate(first_name, family_name, d_birth, d_death) {
  const query = {text: '', values: []};

  if (d_birth && d_death) {
    query.text = 'INSERT INTO models.author (first_name, family_name, date_of_birth, date_of_death) VALUES($1, $2, $3, $4)';
    query.values = [first_name, family_name, d_birth, d_death];
    return query;
  }
  if (d_birth && !d_death) {
    query.text = 'INSERT INTO models.author (first_name, family_name, date_of_birth) VALUES($1, $2, $3)';
    query.values = [first_name, family_name, d_birth];
    return query;
  } 
  if (!d_birth && !d_death){
    query.text = 'INSERT INTO models.author (first_name, family_name) VALUES($1, $2)';
    query.values = [first_name, family_name];
    return query;
  }
}

function bookCreate(title, author, summary, isbn) {
  const query = {text: '', values: []};
  query.text = 'INSERT INTO models.book (title, author, summary, isbn) VALUES($1, $2, $3, $4)';
  query.values =  [title, author, summary, isbn];
  return query; 
}

function bookGenreCreate(book, genre) {
  const query = {text: '', values: []};
  query.text = 'INSERT INTO models.book_genre (book_id, genre_id) VALUES($1, $2)';
  query.values =  [book, genre];
  return query; 
}

function bookInstanceCreate(book, imprint, status = 'Maintenance', due_back) {
  const query = {text: '', values: []};

  if (due_back) {
    query.text = 'INSERT INTO models.bookinstance (book, imprint, current_status, due_back) VALUES($1, $2, $3, $4)';
    query.values =  [book, imprint, status, due_back];
    return query;
  }
  if (!due_back) {
    query.text = 'INSERT INTO models.bookinstance (book, imprint, current_status) VALUES($1, $2, $3)';
    query.values =  [book, imprint, status];
    return query;
  }
}

// Populate database.
(async () => {
  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
  const client = await pool.connect();
 
  try {
    await client.query('BEGIN');
    // Populate genres:
    await client.query(genreCreate(''));
    await client.query(genreCreate('Fantasy'));
    await client.query(genreCreate('Science Fiction'));
    await client.query(genreCreate('French Poetry'));
    // Populate authors:
    await client.query(authorCreate('Patrick', 'Rothfuss', '1973-06-06'));
    await client.query(authorCreate('Ben', 'Bova', '1932-11-08'));
    await client.query(authorCreate('Isaac', 'Asimov', '1920-01-02', '1992-04-06'));
    await client.query(authorCreate('Bob', 'Billings'));
    await client.query(authorCreate('Jim', 'Jones', '1971-12-16'));
    // Populate books:
    await client.query(bookCreate('The Name of the Wind (The Kingkiller Chronicle, #1)', 1, 'I have stolen princesses back from sleeping barrow kings. I burned down the town of Trebon. I have spent the night with Felurian and left with both my sanity and my life. I was expelled from the University at a younger age than most people are allowed in. I tread paths by moonlight that others fear to speak of during day. I have talked to Gods, loved women, and written songs that make the minstrels weep.', '9781473211896'));
    await client.query(bookCreate("The Wise Man's Fear (The Kingkiller Chronicle, #2)", 1, 'Picking up the tale of Kvothe Kingkiller once again, we follow him into exile, into political intrigue, courtship, adventure, love and magic... and further along the path that has turned Kvothe, the mightiest magician of his age, a legend in his own time, into Kote, the unassuming pub landlord.', '9788401352836'));
    await client.query(bookCreate("The Slow Regard of Silent Things (Kingkiller Chronicle)", 1, 'Deep below the University, there is a dark place. Few people know of it: a broken web of ancient passageways and abandoned rooms. A young woman lives there, tucked among the sprawling tunnels of the Underthing, snug in the heart of this forgotten place.', '9780756411336'));
    await client.query(bookCreate("Apes and Angels", 2, "Humankind headed out to the stars not for conquest, nor exploration, nor even for curiosity. Humans went to the stars in a desperate crusade to save intelligent life wherever they found it. A wave of death is spreading through the Milky Way galaxy, an expanding sphere of lethal gamma ...", '9780765379528'));
    await client.query(bookCreate("Death Wave", 2, "In Ben Bova's previous novel New Earth, Jordan Kell led the first human mission beyond the solar system. They discovered the ruins of an ancient alien civilization. But one alien AI survived, and it revealed to Jordan Kell that an explosion in the black hole at the heart of the Milky Way galaxy has created a wave of deadly radiation, expanding out from the core toward Earth. Unless the human race acts to save itself, all life on Earth will be wiped out...", '9780765379504'));
    await client.query(bookCreate('Test Book 1', 5, 'Summary of test book 1', 'ISBN111111'));
    await client.query(bookCreate('Test Book 2', 5, 'Summary of test book 2', 'ISBN222222'));
    // Populate book_genres:
    await Promise.all([
      client.query(bookGenreCreate(1, 2)),
      client.query(bookGenreCreate(2, 2)),
      client.query(bookGenreCreate(3, 2)),
      client.query(bookGenreCreate(4, 3)),
      client.query(bookGenreCreate(5, 3)),
      client.query(bookGenreCreate(6, 2)),
      client.query(bookGenreCreate(6, 3)),
      client.query(bookGenreCreate(7, 1))
    ]);
    // Populate bookinstances:
    await Promise.all([
      client.query(bookInstanceCreate(1, 'London Gollancz, 2014.', 'Available')),
      client.query(bookInstanceCreate(2, ' Gollancz, 2011.', 'Loaned')),
      client.query(bookInstanceCreate(3, ' Gollancz, 2015.')),
      client.query(bookInstanceCreate(4, 'New York Tom Doherty Associates, 2016.', 'Available')),
      client.query(bookInstanceCreate(4, 'New York Tom Doherty Associates, 2016.', 'Available')),
      client.query(bookInstanceCreate(4, 'New York Tom Doherty Associates, 2016.', 'Available')),
      client.query(bookInstanceCreate(5, 'New York, NY Tom Doherty Associates, LLC, 2015.', 'Available')),
      client.query(bookInstanceCreate(5, 'New York, NY Tom Doherty Associates, LLC, 2015.', 'Maintenance')),
      client.query(bookInstanceCreate(5, 'New York, NY Tom Doherty Associates, LLC, 2015.', 'Loaned')),
      client.query(bookInstanceCreate(1, 'Imprint XXX2')),
      client.query(bookInstanceCreate(2, 'Imprint XXX2'))
    ]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    pool.end();
  }
})();
