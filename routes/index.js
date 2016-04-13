var express = require('express');
var router = express.Router();
var passport = require('passport')
var models = require('../models')

var User = models.User
var Room = models.Room

var handleResp = require('../util').handleResp
var validateRoom = require('../util').validateRoom

/* GET home page. */
router.get('/', function (req, res) {
    if (req.user) {
        res.redirect('/dashboard')
    } else {
        res.render('index', {
            title: 'submission | Home'
        });
    }
});

router.get('/logout', function (req, res) {
    if (req.user) {
        req.logout()
    }
    res.redirect('/')
})

router.route('/register')
    .get(function (req, res) {
        payload = {
            errors: req.flash('error'),
            title: 'submission | Register',
            user: false,
            ngApp: 'app.register'
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
                errors: req.flash('error'),
                title: 'submission | Login',
                ngApp: 'app.login'
            })
        }
    })

router.route('/create_room')
    .get(function (req, res) {
        if (req.user) {
            res.render('create_room', {
                title: 'submission | Create Room',
                ngApp: 'app.createRoom'
            })
        } else {
            res.redirect('/')
        }
    })


module.exports = router;
