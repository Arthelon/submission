var express = require('express')
var router = express.Router()
var util = require('../util')
var models = require('../models')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateUser = util.validateUser

var Submission = models.Submission
var Room = models.Room
var File = models.File
var Problem = models.Problem

var async = require('async')
var fs = require('fs')


router.route('/rooms')
    .get(validateUser, function(req, res) {
        models.User
            .findOne({
                username: req.user.username
            })
            .populate('rooms')
            .sort('username')
            .exec(function (err, user) {
                if (err) return handleResp(res, 400, err.message)
                return handleResp(res, 200, {
                    success: 'Rooms retrieved',
                    rooms: user.rooms
                })
            })
    })
    .delete(validateUser, validateRoom, function(req, res) {
        req.room.remove((err) => {
            if (err) return handleResp(res, 500, err.message)
            else return handleResp(res, 200, {
                success: 'Room deleted'
            })
        })
    })

router.route('/submissions')
    .get(validateUser, validateRoom, function(req, res) {
        Room
            .findOne({
                path: req.room.path
            })
            .populate('submissions')
            .sort('timestamp')
            .exec(function(err, room) {
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
    .delete(validateUser, validateRoom, function(req, res) {
        Submission.findOne({name: req.body.submission}, function (err, sub) {
            if (err) {
                return handleResp(res, 500, {error: err.message})
            } else if (sub) {
                sub.remove((err) => {
                    if (err) {
                        return handleResp(res, 500, {error: err.message})
                    } else {
                        async.each(sub.files, function (id, cb) {
                            File.findOneAndRemove({_id: id}, (err, file) => {
                                if (err) cb(err)
                                fs.unlink('uploads/' + file.loc, (err) => {
                                    if (err) cb(err)
                                    else cb()
                                })
                            })
                        }, function (err) {
                            if (err) return handleResp(res, 500, {error:err.message})
                            return handleResp(res, 200, {success:'Submission deleted'})
                        })
                    }
                })
            } else {
                return handleResp(res, 404, {error: 'Submission not found'})
            }
        })
    })

router.route('/problems')
    .get(validateUser, validateRoom, function(req, res) {
        if (req.query.problem) {
            Room.findOne({path: req.room.path})
                .populate({
                    path: 'problems',
                    populate: {
                        path: 'submissions',
                        model: 'Submission'
                    }
                })
                .exec(function (err, room) {
                    if (err) return handleResp(res, 400, err.message)
                    else {
                        room.problems.forEach(function (prob) {
                            if (prob.name == req.query.problem) {
                                return handleResp(res, 200, {
                                    submissions: prob.submissions,
                                    tests: prob.test,
                                    prob_desc: prob.desc,
                                    success: 'Problem data loaded'
                                })
                            }
                        }, function () {
                            return handleResp(res, 404, 'Problem not found')
                        })
                    }
                })
        }
        else {
            Room
                .findOne({path: req.room.path})
                .populate('problems')
                .exec(function(err, room) {
                    if(err) return handleResp(res, 500, {error: err.message})
                    else if (!room) return handleResp(res, 400, {error: 'Room not found'})
                    else
                        return handleResp(res, 200, {
                            success: 'Problems retrieved',
                            problems: room.problems
                        })
                })
        }
    })
    .delete(validateUser, validateRoom, function(req, res) {
        var prob_name = req.body.problem
        console.log(prob_name)
        if (!prob_name) {
            return handleResp(res, 400, 'Invalid Request. Please enter problem name')
        }
        Problem.findOne({name: prob_name},
            function (err, prob) {
                if (err) {
                    return handleResp(res, 500, err.message)
                } else if (!prob) {
                    return handleResp(res, 404, 'Problem not found')
                } else if (prob.room.toString() == req.room._id.toString()) {
                    prob.remove(function (err) {
                        if (err) {
                            return handleResp(res, 500, err.message)
                        } else {
                            req.room.update({
                                $pull: {
                                    problems: prob._id
                                }
                            }, (err) => {
                                if (err) {
                                    return handleResp(res, 500, err.message)
                                } else {
                                    return handleResp(res, 200, {success: 'Problem deleted'})
                                }
                            })
                        }
                    })
                } else {
                    return handleResp(res, 401, 'Room doesn\'t belong to user')
                }
            })
    })


router.route('/tests')
    .delete(validateUser, validateRoom, function (req, res) {
        var prob_name = req.body.problem
        var test_id = req.body.id
        var test_type = req.body.type
        if (test_type != 'matches' && test_type != 'cases') {
            return handleResp(res, 400, 'Invalid test type')
        }
        Problem.findOne({name: prob_name}, function (err, prob) {
            if (err) {
                return handleResp(res, 500, err.message)
            } else if (!prob) {
                return handleResp(res, 404, 'Problem not found')
            } else if (prob.room.toString() == req.room._id.toString()) {
                prob.update({
                    $pull: {
                        ['test.' + test_type]: { //Dynamic object key
                            _id: test_id
                        }
                    }
                }, (err) => {
                    if (err) return handleResp(res, 500, err.message)
                    else return handleResp(res, 200, {success: 'Test deleted'})
                })
            }
        })
    })


module.exports = router