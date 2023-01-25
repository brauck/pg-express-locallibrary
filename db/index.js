const { config_db } = require('./config');
const { Pool } = require('pg');
 
exports.pool = new Pool(config_db);

exports.author_url = (author) => '/catalog/author/' + author.id;
exports.genre_url = (genre) => '/catalog/genre/' + genre.id;
exports.book_url = (book) => '/catalog/book/' + book.id;
exports.bookinstance_url = (bookinstance) => '/catalog/bookinstance/' + bookinstance.id;
/*module.exports = {
  query: (text, params) => pool.query(text, params),
  simple_query: (text, callback) => pool.query(text, callback),
  
};*/

