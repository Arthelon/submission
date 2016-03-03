var express = require('express');
var router = express.Router();
var passport = require('passport')

/* GET home page. */
router.get('/', function(req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard')
    }
    res.render('index', {
        title: 'submission | Home'
    });
});

router.get('/logout', function(req, res) {
    if (req.isAuthenticated()) {
        req.logout()
        res.redirect('/')
    }
})

router.route('/register')
    .get(function(req, res) {
        res.render('register', {
            errors: req.flash('error'),
            title: 'submission | Register'
        })
    })
    .post(passport.authenticate('register', {
        failureRedirect: '/register',
        failureFlash: true
    }), function(req, res) {
        res.redirect('/')
    })

router.route('/login')
    .get(function(req, res) {
        res.render('login', {
            errors: req.flash('error'),
            title: 'submission | Login'
        })
    })
    .post(passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }), function(req, res) {
        res.send('Successful')
    })

module.exports = router;
