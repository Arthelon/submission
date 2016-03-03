var express = require('express')
var router = express.Router()
var passport = require('passport')

router.route('/')
    .get(function(req, res) {
        res.render('login', {
            errors: req.flash('error'),
            title: 'submission | login'
        })
    })
    .post(passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }), function(req, res) {
        res.send('Successful')
    })

module.exports = router