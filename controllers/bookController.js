const { body, validationResult } = require("express-validator");
const { pool, authorUrl, genreUrl, bookUrl, bookinstanceUrl, toYYYMMDDformat } = require('../db/index.js');
//const { debuglog } = require('../db/index.js');

// Display home page.
exports.index = async (req, res) => {
  const data = {};
  const client = await pool.connect();
 
  try {
    await Promise.all([
      client.query('SELECT COUNT(*) FROM models.book;'),
      client.query('SELECT COUNT(*) FROM models.bookinstance;'),
      client.query(`
        SELECT COUNT(*) FROM models.bookinstance
        WHERE current_status='Available';        
      `),
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
    //debuglog('in finally home_index');
  }
  res.render("index", {
    title: "Local Library Home",
    data
  });
}

// Display list of all books.
exports.book_list = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT models.book.id, title, family_name, first_name
      FROM models.book
      INNER JOIN models.author
      ON models.book.author = models.author.id
      ORDER BY title ASC;
    `)
      .then((results) => {
        res.render("book_list", {
          bookUrl,
          title: "Book List",
          book_list: results.rows
        });
      });
  } catch (err) {
    res.send(err);
  } finally {
    client.release();
    //debuglog('in finally book_list');
  }
}

// Display detail page for a specific book.
exports.book_detail = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT
          models.book.id,
          title,
          summary,
          author,
          isbn,
          family_name,
          first_name,
          models.author.id AS authorid
        FROM models.book
        INNER JOIN models.author
        ON
          models.book.id = ${req.params.id} AND
          models.book.author = models.author.id;      
      `),
      client.query(`
        SELECT * FROM models.genre
        WHERE id IN(
          SELECT genre_id FROM models.book_genre
          WHERE book_id = ${req.params.id}
          );     
      `),
      client.query(`
        SELECT id, imprint, due_back, current_status FROM models.bookinstance
        WHERE book = ${req.params.id};     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
          const err = new Error("Book not found");
          err.status = 404;
          throw err;
        }
        res.render("book_detail", {
          authorUrl, genreUrl, bookUrl, bookinstanceUrl, toYYYMMDDformat,
          title: results[0].rows[0].title,
          book: results[0].rows[0],
          genre: results[1].rows,
          book_instances: results[2].rows
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally book_detail');
  }
}

// Display book create form on GET.
exports.book_create_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT * FROM models.author ORDER BY family_name, first_name ASC;      
      `),
      client.query(`
        SELECT * FROM models.genre;     
      `)
    ])
      .then((results) => {
        res.render("book_form", {
          title: "Create Book",
          authors: results[0].rows,
          genres: results[1].rows
        });
      });
  } catch (err) {
    res.send(err.message);
  } finally {
    client.release();
    //debuglog('in finally book_create get');
  }
}


// Handle book create on POST.
exports.book_create_post = [
  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  async(req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const client = await pool.connect();
      try {
        await Promise.all([
          client.query(`
            SELECT * FROM models.author ORDER BY family_name, first_name ASC;      
          `),
          client.query(`
            SELECT * FROM models.genre;     
          `)
        ])
          .then((results) => {
            const request_genres = [];
            const checked_genres = request_genres.concat(req.body.genre);
            res.render("book_form", {
              title: "Create Book",
              authors: results[0].rows,
              genres: results[1].rows,
              book: req.body,
              errors: errors.array(),
              checked_genres: checked_genres
            });
          });
      } catch (err) {
        res.send(err.message);
      } finally {
        client.release();
        //debuglog(`in finally book_create rerender post`);
      }
      return;
    }
//res.send(req.body);
    // Data from form is valid. Save book.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const request_genres = [];
      const checked_genres = request_genres.concat(req.body.genre);
      const new_book_id = await client.query(
        'INSERT INTO models.book (title, author, summary, isbn) VALUES($1, $2, $3, $4) RETURNING id;',
        [req.body.title, req.body.author, req.body.summary, req.body.isbn]
      );
      if (checked_genres[0]) {
        for (const element of checked_genres) {
          await client.query(
            'INSERT INTO models.book_genre (book_id, genre_id) VALUES($1, $2);',
            [new_book_id.rows[0].id, element]
          );
        }
      }
      await client.query('COMMIT')
        .then(() => {
          res.redirect(bookUrl(new_book_id.rows[0].id));
        });
    } catch (err) {
      await client.query('ROLLBACK');
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally book_create insert post');
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT id, title FROM models.book WHERE id = ${req.params.id};      
      `),
      client.query(`
        SELECT id FROM models.bookinstance WHERE book = ${req.params.id};     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
          res.redirect("/catalog/books");
          return;
        }
        res.render("book_delete", {
          bookinstanceUrl,
          title: "Delete Book",
          book: results[0].rows[0],
          book_instances: results[1].rows
        });
      });
  } catch (err) {
    throw err;
  } finally {
    client.release();
    //debuglog('in finally book_delete get');
  }
}

// Handle book delete on POST.
exports.book_delete_post = async(req, res) => {
  const client = await pool.connect();
  try {
    const results = await Promise.all([
      client.query(`
        SELECT id, title FROM models.book WHERE id = ${req.body.bookid};      
      `),
      client.query(`
        SELECT id FROM models.bookinstance WHERE book = ${req.body.bookid};     
      `)
    ]);
    if (results[1].rows[0]) {        
      res.render("book_delete", {
        bookinstanceUrl,
        title: "Delete Book",
        book: results[0].rows[0],
        book_instances: results[1].rows
      });
      return;
    }
    await client.query('BEGIN');
    await client.query(`DELETE FROM models.book_genre WHERE book_id = ${req.body.bookid};`);
    await client.query(`DELETE FROM models.book WHERE id = ${req.body.bookid};`);
    await client.query('COMMIT')
      .then(() => {
        res.redirect("/catalog/books");
      });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    //debuglog('in finally book_delete post');
  }
}

// Display book update form on GET.
exports.book_update_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT
          models.book.id,
          title,
          summary,
          author,
          isbn,
          family_name,
          first_name,
          models.author.id AS authorid
        FROM models.book
        INNER JOIN models.author
        ON
          models.book.id = ${req.params.id} AND
          models.book.author = models.author.id;      
      `),
      client.query(`
        SELECT * FROM models.author ORDER BY family_name, first_name ASC;      
      `),
      client.query(`
        SELECT * FROM models.genre;     
      `),
      client.query(`
        SELECT genre_id FROM models.book_genre WHERE book_id = ${req.params.id};     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
          const err = new Error("Book not found");
          err.status = 404;
          throw err;
        }
        const checked_genres = [];
        results[3].rows.forEach(element => checked_genres.push(element.genre_id));
        res.render("book_form", {
          book: results[0].rows[0],
          title: "Create Book",
          authors: results[1].rows,
          genres: results[2].rows,
          checked_genres: checked_genres
        });
      });
  } catch (err) {
    res.send(err.message);
  } finally {
    client.release();
    //debuglog('in finally book_update get');
  }
}

// Handle book update on POST.
exports.book_update_post = [
  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  async(req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const client = await pool.connect();
      try {
        await Promise.all([
          client.query(`
            SELECT * FROM models.author ORDER BY family_name, first_name ASC;      
          `),
          client.query(`
            SELECT * FROM models.genre;     
          `)
        ])
          .then((results) => {
            const request_genres = [];
            const checked_genres = request_genres.concat(req.body.genre);
            res.render("book_form", {
              title: "Create Book",
              authors: results[0].rows,
              genres: results[1].rows,
              book: req.body,
              errors: errors.array(),
              checked_genres: checked_genres
            });
          });
      } catch (err) {
        res.send(err.message);
      } finally {
        client.release();
        //debuglog('in finally book_update rerender post');
      }
      return;
    }
//res.send(req.body);
    // Data from form is valid. Update book.
    const client = await pool.connect();
    try {
      const request_genres = [];
      const checked_genres = request_genres.concat(req.body.genre);
      await client.query('BEGIN');
      await client.query(`DELETE FROM models.book_genre WHERE book_id = ${req.params.id}`);
      await client.query(
        `UPDATE models.book SET title = $1, author = $2, summary = $3, isbn = $4 WHERE id = ${req.params.id};`,
        [req.body.title, req.body.author, req.body.summary, req.body.isbn]
      );
      if (checked_genres[0]) {
        for (const element of checked_genres) {
          await client.query(
            'INSERT INTO models.book_genre (book_id, genre_id) VALUES($1, $2);',
            [req.params.id, element]
          );
        }
      }
      await client.query('COMMIT')
        .then(() => {
      //debuglog('in then finally book_update set post');
          res.redirect(bookUrl(req.params.id));
        });
    } catch (err) {
      await client.query('ROLLBACK');
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally book_update set post');
    }
  },
];

