var express = require('express')
var router = express.Router()
var passport = require('passport')

router.route('/')
    .get(function(req, res) {
        res.render('login')
    })
    .post(passport.authenticate('login'),
    function(req, res) {
        res.send('Successful')
    })

module.exports = router