const { pool, book_url } = require('../db/index.js');

// Display home page.
exports.index = async (req, res) => {
  const data = {};
  const client = await pool.connect();
 
  try {
    await Promise.all([
      client.query('SELECT COUNT(*) FROM models.book;'),
      client.query('SELECT COUNT(*) FROM models.bookinstance;'),
      client.query(
        `SELECT COUNT(*) FROM models.bookinstance
        WHERE current_status='Available';
        `
      ),
      client.query('SELECT COUNT(*) FROM models.author;'),
      client.query('SELECT COUNT(*) FROM models.genre;')
    ])
      .then((values) => {
        data.book_count = values[0].rows[0].count;
        data.book_instance_count = values[1].rows[0].count;
        data.book_instance_available_count = values[2].rows[0].count;
        data.author_count = values[3].rows[0].count;
        data.genre_count = values[4].rows[0].count;
    });
  } catch (err) {
    data.error = err;
  } finally {
    client.release();
  }
  res.render("index", {
    title: "Local Library Home",
    data
  });
};

// Display list of all books.
exports.book_list = async (req, res) => {
  const list_books = [];
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT models.book.id, title, family_name, first_name
      FROM models.book
      INNER JOIN models.author
      ON models.book.author = models.author.id
      ORDER BY title ASC;
    `)
      .then((res) => {
          res.rows.forEach(element => list_books.push(element));
        });
  } catch (err) {
    res.send(err);
  } finally {
    client.release();
  }
  res.render("book_list", { book_url, title: "Book List", book_list: list_books });
};

// Display detail page for a specific book.
exports.book_detail = (req, res) => {
  res.send(`NOT IMPLEMENTED: Book detail: ${req.params.id}`);
};

// Display book create form on GET.
exports.book_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Book create GET");
};

// Handle book create on POST.
exports.book_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Book create POST");
};

// Display book delete form on GET.
exports.book_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Book delete GET");
};

// Handle book delete on POST.
exports.book_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Book delete POST");
};

// Display book update form on GET.
exports.book_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Book update GET");
};

// Handle book update on POST.
exports.book_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Book update POST");
};
