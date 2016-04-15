var router = require('express').Router()

var models = require('../../models')
var Room = models.Room
var Submission = models.Submission
var Problem = models.Problem


var util = require('../../util')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateUser = util.validateUser

router.route('/')
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
        .post(validateUser, validateRoom, function(req, res) {
            if (req.body.name && req.body.desc) {
                if (!req.body.name.match(/^[\d\w]+$/)) {
                    return handleResp(res, 400, 'Name can only consist of alphanumeric characters')
                }
                Problem.findOrCreate({
                    name: req.body.name,
                    desc: req.body.desc,
                    room: req.room._id
                }, (err, prob, created) => {
                    if (err) {
                        return handleResp(res, 500, err.message)
                    }
                    else if (!created) {
                        return handleResp(res, 404, 'Problem already exists')
                    } else {
                        Room.findOneAndUpdate({
                            _id: req.room._id
                        }, {$push: {problems: prob._id}}, (err) => {
                            if (err) return handleResp(res, 500, err.message)
                        })
                        return handleResp(res, 200, {success: 'Problem Created'})
                    }
                })
            } else {
                return handleResp(res, 400, 'Fields not filled')
            }
        })
module.exports = router