var express = require('express')
var router = express.Router()
var models = require('../models')

var validateUser = require('../util').validateUser

router.route('/')
    .get(validateUser, function (req, res) {
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
            })
    })

module.exports = router