const { body, validationResult } = require("express-validator");
const Router = require('express-promise-router');
const router = new Router();
const fs = require('fs');

router.get("/", (req, res) => {
  res.render("idb_form", { title: "Initialazation DB" });
});

router.post('/',
([
    // Validate and sanitize the name field.
    body("name", "Genre name required").trim().isLength({ min: 1 }),

    // Process request after validation and sanitization.
    (req, res) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("idb_form", {
          title: "Initialazation DB",
          errors: errors.array(),
        });
        return;
      }
      const content = req.body.name;

      fs.writeFile('./db/config.js', content, err => {
        if (err) {
          res.send(err.message);
        }
        // file written successfully
      });
    }
  ])
);

module.exports = router;
