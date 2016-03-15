var router = require('express').Router()
var models = require('../models')

router.route('/')
    .get(function(req, res) {
        if (req.user) {
            res.render('create_prob')
        } else {
            res.redirect('/')
        }
    })
    .post(function(req, res) {

    })

module.exports = router