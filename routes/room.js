var express = require('express')
var router = express.Router()
var models = require('../models')

var Room = models.Room
var Submission = models.Submission
var fs = require('fs')
var util = require('../util')

var handleResp = util.handleResp

var multer = require('multer')
var archiver = require('archiver')

var validateRoom = util.validateRoom

var NotFoundError = require('../errors').NotFoundError

//Room page route
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

//Submission page Route
router.route('/:room_path/:submission_id')
    .get(validateRoom, function(req, res) {

    })

//Student page route
router.get('/:room_path/student/:student_name', validateRoom, function(req, res) {
    
})

//Submission download route
router.get('/:room_path/download/:submission_id', validateRoom, function(req, res) {
    Submission
        .findOne({
            name: req.params.submission
        })
        .populate('files')
        .exec(function (err, sub) {
            if (err) return handleResp(res, 500, {error: err.message})
            else if (!sub) {
                return handleResp(res, 404, {error: 'Submission not found'})
            } else if (sub.files.length == 1) {
                res.download('uploads/' + sub.files[0].loc, sub.files[0].name, (err) => {
                    if (err) return handleResp(res, 500, {error: err.message})
                })
            } else {
                var file_bundle = archiver.create('zip', {})
                file_bundle.pipe(res)
                sub.files.forEach(function (file) {
                    file_bundle.append(fs.createReadStream('uploads/' + file.loc), {
                        name: file.name
                    })
                })
                file_bundle.finalize()
            }
        })
})

module.exports = router
