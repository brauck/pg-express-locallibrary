const Router = require('express-promise-router');
// create a new express-promise-router
// this has the same API as the normal express router except
// it allows you to use async functions as route handlers
const router = new Router();

/* GET users listing. */
//router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
router.get("/", (req, res, next) => {
  res.render("users", { title: "Express" });
});

router.get('/cool/', function(req, res, next) {
  res.send(`You're so cool'`);
});

module.exports = router;
