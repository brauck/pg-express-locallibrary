// ./routes/index.js
const idb = require('./idb');
const home = require('./home');
const users = require('./users');
const catalog = require('./catalog');
 
module.exports = (app) => {
  app.use('/', home);
  app.use('/idb', idb);
  app.use('/users', users);
  app.use('/catalog', catalog);
  // etc..
}
