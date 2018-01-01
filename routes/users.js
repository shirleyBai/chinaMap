var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/users', function(req, res, next) {
  // res.send('respond with a resource user');
  res.render('users', { title: 'Express' });
});

module.exports = router;
