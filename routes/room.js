var express = require('express')
var router = express.Router()
var models = require('../models')
var fs = require('fs')

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
        var files = req.files //gives you a FileStream object
        var submission_data = []
        //{ $push: { <field>: { $each: [ <value1>, <value2> ... ] } } }

        for (var key in files) {
            var data = ''
            //var buf = files[key].data.read(1024)
            //while (buf) {
            //    data += buf
            //    buf = files[key].data.read(1024)
            //}
            //fs.readFile(files[key].path, function (err, data) {
            //    var newPath = __dirname+"/uploads/uploadedFileName";
            //    fs.writeFile(newPath, data, function (err) {
            //        res.redirect("back");
            //    });
            //});
        }
        //Submission.create({
        //
        //}, function(err, submission) {
        //    Room.findOneAndUpdate({
        //        name: room_name,
        //        $push: {submissions: submission._id}
        //    }, (err, room) => {
        //        if (err) throw err
        //    })
        //})
        res.redirect('back')
    })

module.exports = router