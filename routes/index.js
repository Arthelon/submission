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
    .get(function (req, res) {
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
    .get(function (req, res) {
        if (req.user) {
            res.render('create_room', {
                title: 'submission | Create Room',
                errors: req.flash('error')
            })
        } else {
            res.redirect('/')
        }
    })
    .post(function (req, res) {
        if (req.user) {
            Room.findOrCreate({
                path: req.body.path,
                name: req.body.name,
                desc: req.body.desc,
                owner: req.user._id
            }, function (err, room, created) {
                if (err) {
                    return handleResp(res, 500, err.message)
                } else if (!created) {
                    return handleResp(res, 409, 'Room already exists')
                } else {
                    User.findOneAndUpdate({username: req.user.username}, {
                        $push: {rooms: room._id}
                    }, (err) => {
                        if (err) {
                            return handleResp(res, 500, err.message)
                        }
                    })
                    return handleResp(res, 200, null, 'Room Created')
                }
            })
        } else {
            return handleResp(res, 401, 'Unvalidated user')
        }
    })


module.exports = router;
