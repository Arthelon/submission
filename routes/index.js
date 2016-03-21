var express = require('express');
var router = express.Router();
var passport = require('passport')
var models = require('../models')

var User = models.User
var Room = models.Room

var handleResp = require('../util')

/* GET home page. */
router.get('/', function(req, res) {
    if (req.user) {
        res.redirect('/dashboard')
    } else {
        res.render('index', {
            title: 'submission | Home'
        });
    }
});

router.get('/logout', function(req, res) {
    if (req.user) {
        req.logout()
    }
    res.redirect('/')
})

router.route('/register')
    .get(function(req, res) {
        payload = {
            errors: req.flash('error'),
            title: 'submission | Register',
            user: false
        }
        if (req.user) {
            payload.user = true
        }
        res.render('register', payload)
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
                    handleResp(res, 400, 'Error Occurred')
                } else if (!created) {
                    handleResp(res, 409, 'Room already exists')
                } else {
                    User.findOneAndUpdate({username: req.user.username}, {
                        $push: {rooms: room._id}
                    }, (err) => {
                        if (err) {
                            handleResp(res, 400, err.message)
                        }
                    })
                    handleResp(res, 201, 'Room created')
                }
            })
        } else {
            handleResp(res, 401, 'Unvalidated user')
        }
    })

router.delete('/_remove_room', function(req, res) {
    if (req.user) {
        Room.findOne({
            name: req.query.room_name
        }, (err, room) => {
            if (err) {
                handleResp(res, 400, err.message)
            } else if (!room) {
                handleResp(res, 404, 'Room not found')
            } else if (!req.user._id == room.owner) {
                handleResp(res, 406, 'Room does not belong to you')
            } else {
                Room.findOneAndRemove({
                    name: req.query.room_name
                }, (err, room) => {
                    if (err) throw err
                    if (!room) {
                        handleResp(res, 404, 'Room not found')
                    }
                })
                handleResp(res, 200, 'Success')
            }
        })
    } else {
        handleResp(res, 401, 'Unvalidated user')
    }
})


module.exports = router;
