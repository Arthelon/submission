var express = require('express')
var router = express.Router()
var models = require('../models')

router.route('/')
    .get(function(req, res) {
        if (req.isAuthenticated()) {
            models.User
                .findOne({
                    username: req.user.username
                })
                .populate('rooms')
                .exec(function(err, user) {
                    res.render('dashboard', {
                        name: user.username,
                        title: 'submission | Dashboard',
                        rooms: user.rooms
                    })
                })
        } else {
            res.redirect('/')
        }
    })


module.exports = router