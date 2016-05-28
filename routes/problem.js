var router = require('express').Router()
var models = require('../models')
var validateRoom = require('../util').clientValidateRoom

router.route('/:room_path')
    .get(validateRoom, function (req, res) {
        if (req.user) {
            res.render('pages/create_prob', {
                room_name: req.room.name,
            })
        } else {
            res.redirect('/')
        }
    })

router.route('/:room_path/:problem')
    .get(validateRoom, function (req, res) {
        if (req.user) {
            res.render('pages/problem', {
                title: 'Problem | '+req.params.problem,
                prob_name: req.params.problem,
            })
        } else {
            res.redirect('/')
        }
    })

module.exports = router