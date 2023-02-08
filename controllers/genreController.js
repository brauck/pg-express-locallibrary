const { body, validationResult } = require("express-validator");
const { pool, genreUrl, bookUrl } = require('../db/index.js');
//const { debuglog } = require('../db/index.js');

// Display list of all Genre.
exports.genre_list = async(req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT * FROM models.genre
      ORDER BY name;      
    `)
      .then((results) => {
        res.render("genre_list", { genreUrl, title: "Genre List", genre_list: results.rows });
      });
  } catch (err) {
    res.send(err);
  } finally {
    client.release();
    //debuglog('in finally genre_list');
  }
}

// Display detail page for a specific Genre.
exports.genre_detail = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT * FROM models.genre
        WHERE id=${req.params.id};      
      `),
      client.query(`
        SELECT id, title, summary FROM models.book
        WHERE id IN(
          SELECT book_id FROM models.book_genre
          WHERE genre_id=${req.params.id}
          );     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
          const err = new Error("Genre not found");
          err.status = 404;
          throw err;
        }

        res.render("genre_detail", {
          genreUrl, bookUrl,
          title: "Genre Detail",
          genre: results[0].rows[0],
          genre_books: results[1].rows
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally genre_detail');
  }
}

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {  
  res.render("genre_form", {  title: "Create Genre" });
}

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  async(req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        genre_name: req.body.name,
        title: "Create Genre",
        errors: errors.array(),
      });
      return;
    } 

    const client = await pool.connect();
    try {
      const res_if_exists = await client.query(
        'SELECT * FROM models.genre WHERE name = $1;',
        [req.body.name]
      );
      if (res_if_exists.rows[0]) {
        res.redirect(genreUrl(res_if_exists.rows[0].id));
        return;
      }
      await client.query('INSERT INTO models.genre (name) VALUES($1) RETURNING id;', [req.body.name])
        .then((results) => {
          res.redirect(genreUrl(results.rows[0].id));
        });        
    } catch (err) {
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally genre_create post');
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT * FROM models.genre
        WHERE id=${req.params.id};      
      `),
      client.query(`
        SELECT id, title, summary FROM models.book
        WHERE id IN(
          SELECT book_id FROM models.book_genre
          WHERE genre_id=${req.params.id}
          );     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
        res.redirect("/catalog/genres");
        return;
        }
        res.render("genre_delete", {
          bookUrl,
          title: "Delete Genre",
          genre: results[0].rows[0],
          genre_books: results[1].rows
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally genre_delete get');
  }
}

// Handle Genre delete on POST.
exports.genre_delete_post = async(req, res) => {
  const client = await pool.connect();
  try {
    const results = await Promise.all([
      client.query(`
        SELECT * FROM models.genre
        WHERE id=${req.params.id};      
      `),
      client.query(`
        SELECT id, title, summary FROM models.book
        WHERE id IN(
          SELECT book_id FROM models.book_genre
          WHERE genre_id=${req.params.id}
          );     
      `)
    ])

    if (results[1].rows[0]) {
      res.render("genre_delete", {
        bookUrl,
        title: "Delete Genre",
        genre: results[0].rows[0],
        genre_books: results[1].rows
      });
      return;
    }
    await client.query(`DELETE FROM models.genre WHERE id = ${req.body.genreid};`)
      .then(() => res.redirect("/catalog/genres"));
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally genre_delete post');
  }
}

// Display Genre update form on GET.
exports.genre_update_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT * FROM models.genre WHERE id = ${req.params.id};      
    `)
    .then((results) => {
//res.send(results.rows[0])
      if (!results.rows[0]) {
        const err = new Error("Genre not found");
        err.status = 404;
        throw err;
      }
      res.render("genre_form", {
        title: "Update Genre",
        genre_name: results.rows[0].name
      });
    });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally genre_update get');
  }
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 2 }).escape(),

  // Process request after validation and sanitization.
  async(req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        genre_name: req.body.name,
        title: "Update Genre",
        errors: errors.array(),
      });
      return;
    } 

    const client = await pool.connect();
    try {
      const res_if_exists = await client.query(
        'SELECT * FROM models.genre WHERE name = $1;',
        [req.body.name]
      );
      if (res_if_exists.rows[0]) {
        res.redirect(genreUrl(res_if_exists.rows[0].id));
        return;
      }
      await client.query(`UPDATE models.genre SET name = $1 WHERE id = ${req.params.id};`, [req.body.name])
        .then((results) => {
          res.redirect(genreUrl(req.params.id));
        });        
    } catch (err) {
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally genre_update post');
    }
  },
];
