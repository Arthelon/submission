var express = require('express');
var router = express.Router();
var passport = require('passport')
var models = require('../models')

var Room = models.Room
var clientValidateUser = require('../util').clientValidateUser

router.get('/', function (req, res) {
    if (req.user) {
        res.redirect('/dashboard')
    } else {
        res.render('pages/index', {
            title: 'submission | Main'
        })
    }
})

router.get('/logout', function (req, res) {
    if (req.user) {
        req.logout()
    }
    res.redirect('/')
})

router.route('/register')
    .get(function (req, res) {
        payload = {
            title: 'submission | Register',
            user: false,
        }
        if (req.user) {
            payload.user = true
        }
        res.render('pages/register', payload)
    })

router.route('/login')
    .get(function (req, res) {
        if (req.user) {
            res.redirect('/dashboard')
        } else {
            res.render('pages/login', {
                title: 'submission | Login',
                ngApp: 'app.login'
            })
        }
    })
    .post(passport.authenticate('local'), function (req, res) {
        res.redirect('/login/google') //If login successful
    })

router.route('/create_room')
    .get(clientValidateUser, function (req, res) {
        res.render('pages/create_room', {
            title: 'submission | Create Room',
        })
    })

router.route('/user')
    .get(clientValidateUser, function(req, res) {
        res.render('pages/user')
    })

router.route('/login/google')
    .get(passport.authenticate("google"))
    
router.route("/login/google/return")
    .get(passport.authenticate("google", { failureRedirect: '/login' }), function(req, res) {
        res.redirect("/dashboard")
    })

module.exports = router

