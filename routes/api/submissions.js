var router = require('express').Router()

var models = require('../../models')
var Room = models.Room
var Submission = models.Submission
var async = require('async')
var fs = require('fs')

var multer = require('multer')

var upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 100000000 //100 MB
    }
})
var Student = models.Student
var Problem = models.Problem
var File = models.File

var util = require('../../util')
var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateBody = util.validateBody

router.route('/')
    /**
     * @api {get} /api/submissions Retrieve submissions
     *
     * @apiSuccess {String} success Success message
     * @apiSuccess {Object[]} submissions Submissions list
     */
    .get(validateRoom, function (req, res) {
        Room
            .findOne({
                path: req.room.path
            })
            .populate({
                path: 'submissions',
                populate: {path: 'student', model: 'Student'}
            })
            .sort('timestamp')
            .exec(function (err, room) {
                if (err) return handleResp(res, 400, err.message)
                if (!room) {
                    return handleResp(res, 404, 'Room not found')
                } else
                    return handleResp(res, 200, {
                        success: 'Submissions retrieved',
                        submissions: room.submissions
                    })
            })
    })
    /**
     * @api {delete} /api/submissions Remove submission
     *
     * @apiParam {String} room_path Room path
     * @apiParam {String} submission Submission name
     *
     * @apiSuccess {String} success Success message
     * @apiSuccess {Object[]} submissions Submissions list
     */
    .delete(validateRoom, validateBody(['submission']), function (req, res) {
        Submission.findOne({name: req.body.submission}, function (err, sub) {
            if (err) {
                return handleResp(res, 500, {error: err.message})
            } else if (sub) {
                sub.remove((err) => {
                    if (err) {
                        return handleResp(res, 500, {error: err.message})
                    } else {
                        return handleResp(res, 200, {success: 'Submission deleted'})
                    }
                })
            } else {
                return handleResp(res, 404, {error: 'Submission not found'})
            }
        })
    })
    .post(upload.array('file'), validateRoom, validateBody(['name', 'desc', 'email', 'user']), function (req, res) {
        var submissions = new Submission({
            name: req.body.name,
            desc: req.body.desc
        })
        var prob_name = req.body.prob
        new Promise((resolve) => {
            Student.findOne({
                email: req.body.email
            }, (err, stud) => {
                var student
                if (err) {
                    handleFail(req, res, err.message)
                    reject()
                }
                else if (!stud) {
                    student = new Student({
                        email: req.body.email,
                        name: req.body.user,
                        submissions: []
                    })
                } else {
                    student = stud
                }
                resolve(student)
            })
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
                        prob.runTest(req.files).then(() => {
                            submissions.prob = prob._id
                            prob.update({
                                $push: {submissions: submissions._id}
                            }, (err) => {
                                if (err) return handleResp(res, 500, {error: err.message})
                            })
                            createSubCb(req, res, submissions, student)
                        }, (err) => {
                            handleFail(req, res, err)
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
    sub.save((err, submission) => {
        if (err) {
            return handleResp(res, 500, {error: err.message})
        } else {
            student.submissions.push(submission)
            student.save()
            submission.student = student
            Room.findOneAndUpdate({
                _id: req.room._id
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
module.exports = router
