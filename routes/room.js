var express = require('express')
var router = express.Router()
var models = require('../models')

var Room = models.Room
var Student = models.Student
var Problem = models.Problem
var File = models.File
var Submission = models.Submission
var async = require('async')
var fs = require('fs')
var util = require('../util')

var handleResp = util.handleResp

var multer = require('multer')
var archiver = require('archiver')

var validateRoom = util.validateRoom

var upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 100000000 //100 MB
    }
})
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
    .post(upload.array('file'), function (req, res) {
        var submissions = new Submission({
            name: req.body.name,
            desc: req.body.desc
        })
        var prob_name = req.body.prob
        Student.findOne({
            email: req.body.email
        }, (err, stud) => {
            var student
            if (err) handleFail(req, res, err.message)
            else if (!stud) {
                student = new Student({
                    email: req.body.email,
                    name: req.body.user,
                    submissions: []
                })
            } else {
                student = stud
            }
            return student
        }).then((student) => {
            if (prob_name == 'None') {
                createSubCb(req, res, submissions, student)
            } else {
                Problem.findOne({name: prob_name}, (err, prob) => {
                    if (err) {
                        handleFail(req, res, err.message)
                    } else if (!prob) {
                        handleFail(req, res, 'Problem not found', 404)
                    } else if (prob.test.matches.length == 0 && prob.test.cases.length == 0) {
                        createSubCb(req, res, submissions, student)
                    } else {
                        var testResult = prob.runTest(req.files)
                        if (testResult instanceof Error) {
                            handleFail(req, res, testResult.message)
                        } else {
                            submissions.prob = prob._id
                            prob.update({
                                $push: {submissions: submissions._id}
                            }, (err) => {
                                if (err) return handleResp(res, 500, {error: err.message})
                                else return true
                            })
                            createSubCb(req, res, submissions, student)
                        }
                    }
                })
            }
        })
    })



function handleFail(req, res, msg, status) {
    req.files.forEach(function (file) {
        fs.unlink(file.path, (err) => {
            if (err) return handleResp(res, 500, {error: err.message})
        })
    })
    return handleResp(res, status || 500, {error: msg})
}

function createSubCb(req, res, sub, student) {
    console.log(student)
    sub.save((err, submission) => {
        if (err) {
            console.log(err)
            return handleResp(res, 500, {error: err.message})
        } else {
            student.submissions.push(submission)
            student.save()
            submission.student = student
            Room.findOneAndUpdate({
                path: req.params.room_path
            }, {$push: {submissions: submission._id}}, (err, room) => {
                if (err) {
                    return handleResp(res, 500, {error: err.message})
                } else if (!room) {
                    return handleResp(res, 404, {error: 'Room not found'})
                } else {
                    submission.room = room._id
                    submission.save()
                    async.each(req.files, function (file, cb) {
                        File.create({
                            name: file.originalname,
                            type: file.mimetype,
                            loc: file.filename
                        }, function (err, created_file) {
                            if (err) cb(err)
                            submission.update({
                                $push: {
                                    files: created_file._id
                                }
                            }, (err) => {
                                if (err) cb(err)
                                else cb()
                            })
                        })
                    }, function (err) {
                        if (err) return handleResp(res, 500, {error: err.message})
                        else return handleResp(res, 200, {success: 'Success'})
                    })
                }
            })
        }
    })
}

router.route('/:room_path/:submission')
    .get(validateRoom, function(req, res) {
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
