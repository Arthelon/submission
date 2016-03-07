var express = require('express');
var router = express.Router();
var passport = require('passport')
var models = require('../models')

var User = models.User
var Room = models.Room

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
    }
    res.redirect('/')
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
        failureFlash: true,
        successRedirect: '/'
    }))

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
    }))
router.route('/create_room')
    .get(function(req, res) {
        if (req.isAuthenticated()) {
            res.render('create_room', {
                title: 'submission | Create Room',
                errors: req.flash('error')
            })
        } else {
            res.redirect('/')
        }
    })
    .post(function(req, res) {
        if (req.isAuthenticated()) {
            Room.findOrCreate({
                path: req.body.path,
                name: req.body.name,
                desc: req.body.desc,
                owner: req.user._id
            }, function (err, room, created) {
                if (err) {
                    req.flash('error', 'Error Occured')
                    res.redirect('/create_room')
                } else if (!created) {
                    req.flash('error', 'Room already exists')
                    res.redirect('/create_room')
                } else {
                    User.findOneAndUpdate({username: req.user.username}, {
                        $push: {rooms: room._id}
                    }, (err, doc) => {
                        if(err) throw err
                    })
                    req.flash('msg', 'Room created')
                    res.redirect('/dashboard')
                }
            })
        } else {
            res.redirect('/')
        }
    })

router.delete('/_remove_room', function(req, res) {
    if (req.isAuthenticated()) {
        Room.findOneAndRemove({
            name: req.query.room_name
        }, (err, room) => {
            User.findOneAndUpdate({
                username: req.user.username
            }, {
                $pull: {rooms: room._id}
            }, (err, docs) => {
                if (err) throw err
            })
            if (err) res.end(JSON.stringify({status: 'FAILED', msg: err.message}))
            else res.end(JSON.stringify({status: 'OK', msg: 'Success'}))
        })
    } else {
        res.end(JSON.stringify({
            status: 'FAILED',
            msg: 'Unvalidated user'
        }))
    }
})

module.exports = router;
