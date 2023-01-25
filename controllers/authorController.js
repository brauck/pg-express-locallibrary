const { pool, author_url } = require('../db/index.js');
const { DateTime } = require("luxon");

function lifespan(author) {
  let date_of_birth = "";
  let date_of_death = "";

  if (author.date_of_birth) {
    date_of_birth = DateTime.fromJSDate(author.date_of_birth).toLocaleString(DateTime.DATE_MED);
  }
  if (author.date_of_death) {
    date_of_death = DateTime.fromJSDate(author.date_of_death).toLocaleString(DateTime.DATE_MED);
  }

  return (date_of_birth + " - " + date_of_death);
};

// Display list of all Authors.
exports.author_list = async (req, res) => {
  const list_authors = [];
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT * FROM models.author
      ORDER BY family_name;      
    `)
      .then((res) => {
          res.rows.forEach(element => list_authors.push(element));
        });
  } catch (err) {
    res.send(err);
  } finally {
    client.release();
  }
  res.render("author_list", { author_url, lifespan, title: "Author List", author_list: list_authors });
};

// Display detail page for a specific Author.
exports.author_detail = (req, res) => {
  res.send(`NOT IMPLEMENTED: Author detail: ${req.params.id}`);
};

// Display Author create form on GET.
exports.author_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Author create GET");
};

// Handle Author create on POST.
exports.author_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Author create POST");
};

// Display Author delete form on GET.
exports.author_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Author delete GET");
};

// Handle Author delete on POST.
exports.author_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Author delete POST");
};

// Display Author update form on GET.
exports.author_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Author update GET");
};

// Handle Author update on POST.
exports.author_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Author update POST");
};
