const { body, validationResult } = require("express-validator");
const { pool, bookinstanceUrl, bookUrl, toYYYMMDDformat } = require('../db/index.js');
//const { debuglog } = require('../db/index.js');

// Display list of all BookInstances.
exports.bookinstance_list = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT models.bookinstance.id, title, imprint, due_back, current_status
      FROM models.bookinstance
      INNER JOIN models.book
      ON models.bookinstance.book = models.book.id;
    `)
      .then((results) => {
          res.render("bookinstance_list", {
            bookinstanceUrl, toYYYMMDDformat,
            title: "Book Instance List",
            bookinstance_list: results.rows,
          });
        });
  } catch (err) {
    res.send(err); 
  } finally {
    client.release();
    //debuglog('in finally bookinstance_list');
  }
}

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async(req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT
        models.bookinstance.id,
        imprint,
        due_back,
        current_status,
        title,
        models.book.id AS bookid
      FROM models.bookinstance
      INNER JOIN models.book
      ON
        models.bookinstance.id = ${req.params.id} AND
        models.bookinstance.book = models.book.id;      
    `)
      .then((results) => {
        if (!results.rows[0]) {
          const err = new Error("Book copy not found");
          err.status = 404;
          throw err;
        }
        res.render("bookinstance_detail", {
          bookinstanceUrl, bookUrl, toYYYMMDDformat,
          title: `Copy: ${results.rows[0].title}`,
          bookinstance: results.rows[0]
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`); 
  } finally {
    client.release();
    //debuglog('in finally bookinstance_detail');
  }
}

// Display BookInstance create form on GET.
exports.bookinstance_create_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT id, title FROM models.book ORDER BY title ASC;      
      `),
      client.query(`
        SELECT pg_enum.enumlabel
        FROM pg_type 
        INNER JOIN pg_enum 
        ON pg_type.typname = 'status' AND pg_enum.enumtypid = pg_type.oid;     
      `)
    ])
      .then((results) => {
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: results[0].rows,
          status_enum: results[1].rows
        });
      });
  } catch (err) {
    res.send(err.message);
  } finally {
    client.release();
    //debuglog('in finally bookinstance_create get');
  }
}

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async(req, res,) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      const client = await pool.connect();
      try {
        await Promise.all([
          client.query(`
            SELECT id, title FROM models.book ORDER BY title ASC;      
          `),
          client.query(`
            SELECT pg_enum.enumlabel
            FROM pg_type 
            INNER JOIN pg_enum 
            ON pg_type.typname = 'status' AND pg_enum.enumtypid = pg_type.oid;     
          `)
        ])
          .then((results) => {
            res.render("bookinstance_form", {
              toYYYMMDDformat,
              title: "Create BookInstance",
              book_list: results[0].rows,
              status_enum: results[1].rows,
              bookinstance: req.body,
              errors: errors.array()
            });
          });
      } catch (err) {
        res.send(err.message);
      } finally {
        client.release();
        //debuglog('in finally bookinstance_create rerender post');
      }
      return;
    }

    // Data from form is valid.
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO models.bookinstance (book, imprint, due_back, current_status)
        VALUES($1, $2, $3, $4) RETURNING id`,
        [
          req.body.book,
          req.body.imprint,
          req.body.due_back instanceof Date ? req.body.due_back : null,
          req.body.status
        ])
        .then((results) => {
          res.redirect(bookinstanceUrl(results.rows[0].id));
      });        
    } catch (err) {
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally bookinstance_create post after insertion');
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT
        models.bookinstance.id,
        imprint,
        due_back,
        current_status,
        title,
        models.book.id AS bookid
      FROM models.bookinstance
      INNER JOIN models.book
      ON
        models.bookinstance.id = ${req.params.id} AND
        models.bookinstance.book = models.book.id;      
    `)
      .then((results) => {
        if (!results.rows[0]) {
        res.redirect("/catalog/bookinstances");
        return;
        }
        res.render("bookinstance_delete", {
          bookUrl, toYYYMMDDformat,
          title: "Delete BookInstance",
          bookinstance: results.rows[0]
        });
      });
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`); 
  } finally {
    client.release();
    //debuglog('in finally bookinstance_delete get');
  }
}

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async(req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM models.bookinstance WHERE id = ${req.body.id};`)
      .then(() => res.redirect("/catalog/bookinstances"));
  } catch (err) {
    res.send(`${err}. Status: ${err.status}`);
  } finally {
    client.release();
    //debuglog('in finally bookinstance_delete post');
  }
}

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async(req, res) => {
  const client = await pool.connect();
  try {
    await Promise.all([
      client.query(`
        SELECT id, title FROM models.book ORDER BY title ASC;      
      `),
      client.query(`
        SELECT pg_enum.enumlabel
        FROM pg_type 
        INNER JOIN pg_enum 
        ON pg_type.typname = 'status' AND pg_enum.enumtypid = pg_type.oid;     
      `),
      client.query(`
        SELECT * FROM models.bookinstance WHERE id = ${req.params.id};      
      `),
    ])
      .then((results) => {
        if (!results[2].rows[0]) {
          const err = new Error("Bookinstance not found");
          err.status = 404;
          throw err;
        }
//res.send(results[2].rows[0])
        res.render("bookinstance_form", {
          toYYYMMDDformat,
          title: "Update BookInstance",
          book_list: results[0].rows,
          status_enum: results[1].rows,
          bookinstance: results[2].rows[0]
        });
      });
  } catch (err) {
    res.send(err.message);
  } finally {
    client.release();
    //debuglog('in finally bookinstance_update get');
  }
}

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async(req, res,) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      const client = await pool.connect();
      try {
        await Promise.all([
          client.query(`
            SELECT id, title FROM models.book ORDER BY title ASC;      
          `),
          client.query(`
            SELECT pg_enum.enumlabel
            FROM pg_type 
            INNER JOIN pg_enum 
            ON pg_type.typname = 'status' AND pg_enum.enumtypid = pg_type.oid;     
          `),
          client.query(`
            SELECT * FROM models.bookinstance WHERE id = ${req.params.id};      
          `),
        ])
          .then((results) => {
            res.render("bookinstance_form", {
              toYYYMMDDformat,
              title: "Update BookInstance",
              book_list: results[0].rows,
              status_enum: results[1].rows,
              bookinstance: results[2].rows[0],
              errors: errors.array()
            });
          });
      } catch (err) {
        res.send(err.message);
      } finally {
        client.release();
        //debuglog('in finally bookinstance_create rerender post');
      }
      return;
    }

    // Data from form is valid.
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE models.bookinstance SET book = $1, imprint = $2, due_back = $3, current_status = $4 WHERE id = ${req.params.id};`,
        [
          req.body.book,
          req.body.imprint,
          req.body.due_back instanceof Date ? req.body.due_back : null,
          req.body.status
        ])
        .then((results) => {
          res.redirect(bookinstanceUrl(req.params.id));
      });        
    } catch (err) {
      res.send(err.message);
    } finally {
      client.release();
      //debuglog('in finally bookinstance_update post after insertion');
    }
  }
];
