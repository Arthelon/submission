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
var PythonShell = require('python-shell')
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
        var student;
        var submissions = new Submission({
            name: req.body.name,
            desc: req.body.desc
        })
        var prob_name = req.body.prob
        Student.findOne({
            email: req.body.email
        }, (err, stud) => {
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
            if (prob_name == 'None') {
                createSubCb(req, res, submissions, student)
            } else {
                Problem.findOne({name: prob_name}, (err, prob) => {
                    if (err) {
                        return handleFail(req, res, err.message)
                    } else if (!prob) {
                        return handleFail(req, res, 'Problem not found', 404)
                    } else if (prob.test.matches.length == 0 && prob.test.cases.length == 0) {
                        return createSubCb(req, res, submissions, student)
                    } else {
                        req.files.forEach(function (file, findex) {
                            fs.readFile(file.path, 'utf8', function (err, data) {
                                if (err) return handleFail(req, res, err.message)
                                else if (!data) return handleFail(req, res, 'File not found')
                                else async.each(prob.test.matches, function (match, cb) {
                                        if (data.search(new RegExp(match.text)) == -1) cb('Failed match. \"' + match.text + '\" not found.')
                                        else cb()
                                    }, function (err) {
                                        if (err) return handleFail(req, res, err)
                                        else if (!prob.test.cases) {
                                            PythonShell.run(file.path, function (err) {
                                                if (err) {
                                                    if (!err.stacktrace) err.stacktrace = 'Error Occured'
                                                    return handleFail(req, res, err.stacktrace)
                                                } else {
                                                    createSubCb(req, res, submissions, student)
                                                }
                                            })
                                        } else {
                                            prob.test.cases.forEach(function (c, index) {
                                                var pyshell = new PythonShell(file.path, {mode: 'text'})
                                                pyshell.send("\'" + c.in + "\'")
                                                pyshell.on('message', function (data) {
                                                    if (data != c.out) {
                                                        return handleFail(req, res, 'Failed Test. \"' + data + '\" != ' + c.out)
                                                    }
                                                })
                                                pyshell.end(function (err) {
                                                    if (err) {
                                                        console.log(err.stack)
                                                        if (!err.stack) err.stack = 'Error Occured'
                                                        return handleFail(req, res, err.stack)
                                                    } else if (findex + 1 == req.files.length && index + 1 == prob.test.cases.length) {
                                                        submissions.prob = prob._id
                                                        prob.update({
                                                            $push: {submissions: submissions._id}
                                                        }, (err) => {
                                                            if (err) return handleResp(res, 500, {error: err.message})
                                                            else createSubCb(req, res, submissions, student)
                                                        })
                                                    }
                                                })
                                            })
                                        }
                                    })
                            })
                        })
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
