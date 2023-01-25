const Router = require('express-promise-router');
// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router();

// GET home page.
router.get("/", function (req, res) {
  res.redirect("/catalog");
});

module.exports = router;
