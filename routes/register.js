var express = require('express')
var passport = require('passport')
var router = express.Router()

router.route('/')
    .get(function(req, res) {
        res.render('register')
    })
    .post(passport.authenticate('register', {
        failureRedirect: '/'
    }), function(req, res) {
        res.redirect('/')
    })

module.exports = router