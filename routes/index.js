var express = require('express');
var router = express.Router();
var passport = require('passport')
var models = require('../models')

var User = models.User
var Room = models.Room

/* GET home page. */
router.get('/', function(req, res) {
    if (req.user) {
        res.redirect('/dashboard')
    }
    res.render('index', {
        title: 'submission | Home'
    });
});

router.get('/logout', function(req, res) {
    if (req.user) {
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
        if (req.user) {
            res.redirect('/dashboard')
        } else {
            res.render('login', {
                errors: req.flash('error'),
                title: 'submission | Login'
            })
        }
    })
    .post(passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true
    }))

router.route('/create_room')
    .get(function(req, res) {
        if (req.user) {
            res.render('create_room', {
                title: 'submission | Create Room',
                errors: req.flash('error')
            })
        } else {
            res.redirect('/')
        }
    })
    .post(function(req, res) {
        if (req.user) {
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
    if (req.user) {
        Room.findOne({
            name: req.query.room_name
        }, (err, room) => {
            if (err) throw err
            if (!room) {
                res.status(404)
                res.end(JSON.stringify({status: 'FAILED', msg: 'Room not found'}))
            } else if (!req.user._id == room.owner) {
                res.status(406)
                res.end(JSON.stringify({status: 'FAILED', msg: 'Room does not belong to you'}))
            } else {
                Room.findOneAndRemove({
                    name: req.query.room_name
                }, (err, room) => {
                    if (err) throw err
                    if (!room) {
                        res.status(404)
                        res.end(JSON.stringify({status: 'FAILED', msg: 'Room not found'}))
                    }
                })
                User.findOneAndUpdate({
                    username: req.user.username
                }, {
                    $pull: {rooms: room._id}
                }, (err, docs) => {
                    if (err) throw err
                })
                res.sendStatus(200)
            }
        })
    } else {
        res.sendStatus(401)
    }
})


module.exports = router;
