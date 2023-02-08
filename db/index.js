const { config_db } = require('./config');
const { Pool } = require('pg');
const { DateTime } = require("luxon");
const { writeFile } = require('fs');


const pool = new Pool(config_db);
exports.pool = pool;

exports.authorUrl = (id) => '/catalog/author/' + id;
exports.genreUrl = (id) => '/catalog/genre/' + id;
exports.bookUrl = (id) => '/catalog/book/' + id;
exports.bookinstanceUrl = (id) => '/catalog/bookinstance/' + id;

exports.toYYYMMDDformat = (date) => DateTime.fromJSDate(date).toISODate(); // format 'YYYY-MM-DD'

exports.lifespan = (author) => {
  let date_of_birth = "";
  let date_of_death = "";

  if (author.date_of_birth) {
    date_of_birth = DateTime.fromJSDate(author.date_of_birth).toLocaleString(DateTime.DATE_MED);
  }
  if (author.date_of_death) {
    date_of_death = DateTime.fromJSDate(author.date_of_death).toLocaleString(DateTime.DATE_MED);
  }

  return (date_of_birth + " - " + date_of_death);
}
/*module.exports = {
  query: (text, params) => pool.query(text, params),
  simple_query: (text, callback) => pool.query(text, callback),
  
};*/
exports.debugLog = (content) => {
  writeFile(
    './is_in_finally.txt',
    `${new Date()} ${content}.\nClients in the Pool: ${pool.totalCount}\n\n`,
    { flag: 'a+' },
    err => {
      if (err) {
        throw err;
      }
});
}
