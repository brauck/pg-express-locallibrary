const { pool, book_url } = require('../db/index.js');

// Display list of all BookInstances.
exports.bookinstance_list = async (req, res) => {
  const list_bookinstances = [];
  const client = await pool.connect();
  try {
    await client.query(
      `SELECT models.book.id, title, imprint, due_back, current_status
      FROM models.bookinstance
      INNER JOIN models.book
      ON models.bookinstance.book = models.book.id;
      `
    )
      .then((res) => {
          res.rows.forEach(element => list_bookinstances.push(element));
        });
  } catch (err) {
    res.send(err); 
  } finally {
    client.release();
  }
  res.render("bookinstance_list", {
    book_url,
    title: "Book Instance List",
    bookinstance_list: list_bookinstances,
  });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res) => {
  res.send(`NOT IMPLEMENTED: BookInstance detail: ${req.params.id}`);
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance create GET");
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance create POST");
};

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance delete GET");
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance delete POST");
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance update GET");
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: BookInstance update POST");
};
