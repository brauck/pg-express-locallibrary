const schema = 'models';

module.exports = {
  config_db: {
    user: 'postgres',
    host: 'localhost',
    database: 'populate',
    password: '123',
    port: 5432,
  },
  schema: schema,
  author: `${schema}.author`,
  genre: `${schema}.genre`,
  book: `${schema}.book`,
  bookinstance: `${schema}.bookinstance`
};
