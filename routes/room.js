var express = require('express')
var router = express.Router()
var models = require('../models')

var Room = models.Room
var Submission = models.Submission

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
                var payload = {
                    room_name: room.name,
                    room_desc: room.desc
                }
                if (req.isAuthenticated()) {

                }
                res.render('room', payload)
            }
        })
    })
    .post(function(req, res) {
        var room_name = req.params.room_name
        //req.files.sampleFile gives you a FileStream object
        //Room.findOne({
        //    path: room_name
        //}, function(err, room) {
        //
        //})
        res.redirect('back')
    })

module.exports = router