var express = require('express')
var router = express.Router()
var util = require('../util')
var models = require('../models')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateUser = util.validateUser

var Submission = models.Submission
var Room = models.Room
var Problem = models.Problem


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
    .delete(validateRoom, function(req, res) {
        req.room.remove((err) => {
            if (err) return handleResp(res, 500, err.message)
            else return handleResp(res, 200, {
                success: 'Room deleted'
            })
        })
    })

router.route('/submissions')
    .get(validateRoom, function(req, res) {
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
    .delete(validateRoom, function(req, res) {
        Submission.findOne({name: req.params.submission}, function (err, sub) {
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
    .get(validateRoom, function(req, res) {
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
    })
    .delete(validateRoom, function(req, res) {
        var prob_name = req.body.problem
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
                                    return handleResp(res, 200, {success: 'Success'})
                                }
                            })
                        }
                    })
                } else {
                    return handleResp(res, 401, 'Room doesn\'t belong to user')
                }
            })
    })


// router.route('/tests')


module.exports = router