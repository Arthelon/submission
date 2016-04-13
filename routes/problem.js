var router = require('express').Router()
var models = require('../models')
var validateRoom = require('../util').validateRoom
var fs = require('fs')

router.route('/:room_path')
    .get(validateRoom, function (req, res) {
        if (req.user) {
            res.render('create_prob', {
                room_name: req.room.name,
                errors: req.flash('error'),
                ngApp: 'app.createProb'
            })
        } else {
            res.redirect('/')
        }
    })

router.route('/:room_path/:problem')
    .get(validateRoom, function (req, res) {
        if (req.user) {
            res.render('problem', {
                title: 'submission | '+req.params.problem,
                prob_name: req.params.problem,
                ngApp: 'app.problem'
            })
        } else {
            res.redirect('/')
        }
    })

module.exports = router