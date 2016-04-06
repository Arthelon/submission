var express = require('express')
var router = express.Router()
var models = require('../models')

router.route('/')
    .get(function (req, res) {
        if (req.user) {
            res.render('dashboard', {
                name: req.user.username,
                title: 'submission | Dashboard'
            })
        } else {
            res.redirect('/')
        }

    })

module.exports = router