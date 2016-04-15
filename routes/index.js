var express = require('express');
var router = express.Router();
var passport = require('passport')
var models = require('../models')

var Room = models.Room

router.get('/', function (req, res) {
    if (req.user) {
        res.redirect('/dashboard')
    } else {
        res.render('index', {
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
        res.render('register', payload)
    })

router.route('/login')
    .get(function (req, res) {
        if (req.user) {
            res.redirect('/dashboard')
        } else {
            res.render('login', {
                title: 'submission | Login',
                ngApp: 'app.login'
            })
        }
    })
    .post(passport.authenticate('local'), function (req, res) {
        res.redirect('/dashboard') //If login successful
    })

router.route('/create_room')
    .get(function (req, res) {
        if (req.user) {
            res.render('create_room', {
                title: 'submission | Create Room',
            })
        } else {
            res.redirect('/')
        }
    })
module.exports = router

