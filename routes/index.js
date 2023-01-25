// ./routes/index.js
const home = require('./home');
const users = require('./users');
const catalog = require('./catalog');
 
module.exports = (app) => {
  app.use('/', home);
  app.use('/users', users);
  app.use('/catalog', catalog);
  // etc..
}
