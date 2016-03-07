var express = require('express')
var router = express.Router()
var models = require('../models')

var Room = models.Room

router.route('/:room_name')
    .get(function(req, res) {
        var room_name = req.params.room_name
        Room.findOne({
            path: room_name
        }, function(err, room) {
            if (err) throw err
            if (!room) {
                res.status(404)
                res.render('error', {
                    message: 'Room does not exist, did you enter in the room path correctly?',
                    error: {}
                })
            } else {
                res.render('room', {
                    room_name: room.name,
                    room_desc: room.desc
                })
            }
        })
    })

module.exports = router