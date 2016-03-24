var express = require('express')
var router = express.Router()
var models = require('../models')

router.route('/')
    .get(function (req, res) {
        if (req.user) {
            models.User
                .findOne({
                    username: req.user.username
                })
                .populate('rooms')
                .sort('username')
                .exec(function (err, user) {
                    res.render('dashboard', {
                        name: user.username,
                        title: 'submission | Dashboard',
                        rooms: user.rooms
                    })
                    res.end()
                })
        } else {
            res.redirect('/')
        }
    })

module.exports = router