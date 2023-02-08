const { body, validationResult } = require("express-validator");
const { pool, authorUrl, bookUrl, toYYYMMDDformat, lifespan } = require('../db/index.js');
//const { debuglog } = require('../db/index.js');

// Display list of all Authors.
exports.author_list = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT * FROM models.author
      ORDER BY family_name;      
    `)
      .then((results) => {
        res.render(
          "author_list",
          { authorUrl, lifespan, title: "Author List", author_list: results.rows });
        });
  } catch (err) {
    res.send(err);
  } finally {
    client.release();
    //debuglog('in finally author_list');
  }
}

// Display detail page for a specific Author.
exports.author_detail = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT * from models.author
        WHERE id = ${req.params.id};
      `),
      client.query(`
        SELECT id, title, summary FROM models.book
        WHERE author = ${req.params.id};     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
          const err = new Error("Author not found");
          err.status = 404;
          throw err;
        }
        res.render("author_detail", {
          authorUrl, bookUrl, lifespan,
          title: "Author Detail",
          author: results[0].rows[0],
          author_books: results[1].rows
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally author_detail');
  }
}

// Display Author create form on GET.
exports.author_create_get = (req, res) => {
  res.render("author_form", { title: "Create Author" });
}

exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  async(req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        toYYYMMDDformat,
        title: "Create Author",
        author: req.body,
        errors: errors.array(),
      });
      return;
    }
    // Data from form is valid.
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO models.author (first_name, family_name, date_of_birth, date_of_death)
        VALUES($1, $2, $3, $4) RETURNING id;`,        
        [
          req.body.first_name,
          req.body.family_name,
          req.body.date_of_birth instanceof Date ? req.body.date_of_birth : null,
          req.body.date_of_death instanceof Date ? req.body.date_of_death : null
        ])
        .then((results) => {
          res.redirect(authorUrl(results.rows[0].id));
      });        
    } catch (err) {
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally author_create post');
    }
  }
];

// Display Author delete form on GET.
exports.author_delete_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT * from models.author
        WHERE id = ${req.params.id};
      `),
      client.query(`
        SELECT id, title, summary FROM models.book
        WHERE author = ${req.params.id};     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
          res.redirect("/catalog/authors");
          return;          
        }
        res.render("author_delete", {
          bookUrl, lifespan,
          title: "Delete Author",
          author: results[0].rows[0],
          author_books: results[1].rows
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally author_delete get');
  }
}

// Handle Author delete on POST.
exports.author_delete_post = async(req, res) => {
  const client = await pool.connect();
  try {
    const results = await Promise.all([
      client.query(`
        SELECT * from models.author
        WHERE id = ${req.body.authorid};
      `),
      client.query(`
        SELECT id, title, summary FROM models.book
        WHERE author = ${req.body.authorid};     
      `)
    ]);

    if (results[1].rows[0]) {
      res.render("author_delete", {
        bookUrl, lifespan,
        title: "Delete Author",
        author: results[0].rows[0],
        author_books: results[1].rows
      });
      return;
    }
    await client.query(`DELETE FROM models.author WHERE id = ${req.body.authorid};`)
      .then(() => res.redirect("/catalog/authors"));
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally author_delete post');
  }
}

// Display Author update form on GET.
exports.author_update_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT * from models.author
        WHERE id = ${req.params.id};
      `),
      client.query(`
        SELECT id, title, summary FROM models.book
        WHERE author = ${req.params.id};     
      `)
    ])
      .then((results) => {
        if (!results[0].rows[0]) {
          const err = new Error("Author not found");
          err.status = 404;
          throw err;
        }
        res.render("author_form", {
          authorUrl, bookUrl, lifespan, toYYYMMDDformat,
          title: "Update Author",
          author: results[0].rows[0],
          author_books: results[1].rows
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally author_update get');
  }
}

// Handle Author update on POST.
exports.author_update_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 2 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  async(req, res) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        toYYYMMDDformat,
        title: "Update Author",
        author: req.body,
        errors: errors.array(),
      });
      //debuglog('in finally author_update post');
      return;
    }
    // Data from form is valid.
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE models.author SET first_name = $1, family_name = $2, date_of_birth = $3, date_of_death = $4 WHERE id = ${req.params.id};`,        
        [
          req.body.first_name,
          req.body.family_name,
          req.body.date_of_birth instanceof Date ? req.body.date_of_birth : null,
          req.body.date_of_death instanceof Date ? req.body.date_of_death : null
        ])
        .then((results) => {
          res.redirect(authorUrl(req.params.id));
      });        
    } catch (err) {
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally author_update post');
    }
  }
];
