var express = require('express')
var router = express.Router()
var models = require('../models')

router.route('/')
    .get(function (req, res) {
        if (req.user) {
            res.render('dashboard', {
                name: req.user.username,
                title: 'submission | Dashboard',
                ngApp: 'app.dashboard'
            })
        } else {
            res.redirect('/')
        }

    })

module.exports = router