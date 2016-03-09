var express = require('express')
var router = express.Router()
var models = require('../models')
var multer = require('multer')
var fs = require('fs')

var upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 100000000 //100 MB
    }
})

var Room = models.Room
var File = models.File
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
    .post(upload.array('file'), function(req, res) {
        Submission.create({
            name: req.body.name,
            desc: req.body.desc,
        }, function(err, submission) {
            if (err) throw err
            Room.findOneAndUpdate({
                name: req.params.room_name
            }, {
                $push: {
                    submissions: submission._id
                }
            }, (err) => {
                if (err) throw err
            })
            for (var i in req.files) {
                var file = req.files[i]
                File.create({
                    name: file.originalname,
                    type: file.mimetype,
                    loc: file.filename
                }, function (err, created_file) {
                    if (err) throw err
                    Submission.findByIdAndUpdate(submission._id, {
                        $push: {
                            files: created_file._id
                        }
                    }, (err) => {
                        if (err) throw err
                    })
                })
            }
        })
        res.redirect('back')
    })


module.exports = router