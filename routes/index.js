var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    req.flash('msg', 'hi')
    res.render('index', {
        title: 'submission | Home',
        flash: req.flash('msg')
    });
});

module.exports = router;
