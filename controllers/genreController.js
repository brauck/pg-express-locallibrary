const { pool, genre_url } = require('../db/index.js');

// Display list of all Genre.
exports.genre_list = async(req, res) => {
  const list_genres = [];
  const client = await pool.connect();
  try {
    await client.query(`
      SELECT * FROM models.genre
      ORDER BY name;      
    `)
      .then((res) => {
          res.rows.forEach(element => list_genres.push(element));
        });
  } catch (err) {
    res.send(err);
  } finally {
    client.release();
  }
  res.render("genre_list", { genre_url, title: "Author List", genre_list: list_genres });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res) => {
  res.send(`NOT IMPLEMENTED: Genre detail: ${req.params.id}`);
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Genre create GET");
};

// Handle Genre create on POST.
exports.genre_create_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Genre create POST");
};

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Genre delete GET");
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Genre delete POST");
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
  res.send("NOT IMPLEMENTED: Genre update GET");
};

// Handle Genre update on POST.
exports.genre_update_post = (req, res) => {
  res.send("NOT IMPLEMENTED: Genre update POST");
};
