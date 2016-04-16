var express = require('express')
var router = express.Router()

var Room = require('../models').Room

var NotFoundError = require('../errors').NotFoundError

router.route('/:room_path')
    .get(function (req, res, next) {
        Room.findOne({path: req.params.room_path}, function(err, room) {
            if (err || !room) next(err || new NotFoundError('404'))
            else {
                payload = {
                    room_name: room.name,
                    room_desc: room.desc
                }
                payload.user_authenticated = req.user ? true : false
                res.render('room', payload)
            }
        })
    })

module.exports = router