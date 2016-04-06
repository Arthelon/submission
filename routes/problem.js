var router = require('express').Router()
var models = require('../models')
var validateRoom = require('../util').validateRoom
var handleResp = require('../util').handleResp
var fs = require('fs')

//Models
var Room = models.Room
var Problem = models.Problem

router.route('/:room_name')
    .get(validateRoom, function (req, res) {
        res.render('create_prob', {
            room_name: req.room.name,
            errors: req.flash('error')
        })
    })
    .post(validateRoom, function (req, res) {
        if (req.user) {
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
        } else {
            return handleResp(res, 401, 'User not authenticated')
        }
    })
    .delete(validateRoom, function (req, res) {
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

router.route('/:room_name/:problem')
    .get(validateRoom, function (req, res) {
        Room.findOne({_id: req.room._id})
            .populate({
                path: 'problems',
                populate: {
                    path: 'submissions',
                    model: 'Submission'
                }
            })
            .exec(function (err, room) {
                if (err) {
                    res.status(400)
                    req.flash('error', err.message)
                    res.redirect('back')
                } else {
                    room.problems.forEach(function (prob) {
                        if (prob.name == req.params.problem) {
                            res.render('problem', {
                                prob_name: prob.name,
                                prob_desc: prob.desc,
                                prob_subs: prob.submissions,
                                room_name: req.room.name,
                                test: prob.test,
                                errors: req.flash('error'),
                                title: 'submission | ' + prob.name
                            })
                        }
                    }, function () {
                        handleResp(res, 404, 'Room not found')
                    })
                }
            })
    })
    .post(validateRoom, function (req, res) {
        var prob_name = req.params.problem
        Problem.findOne({name: prob_name}, function (err, prob) {
            if (err) {
                return handleResp(res, 500, err.message)
            } else if (!prob) {
                return handleResp(res, 404, 'Problem not found')
            } else if (prob.room.toString() == req.room._id.toString()) {
                var inp = req.body.in
                var out = req.body.out
                if (inp && out) {
                    prob.test.cases.push({
                        in: inp,
                        out: out
                    })
                } else if (req.body.match) {
                    prob.test.matches.push({text: req.body.match})
                }
                prob.save((err) => {
                    if (err) {
                        return handleResp(res, 500, err.message)
                    } else {
                        return handleResp(res, 200,{success: 'Success'})
                    }
                })
            } else {
                return handleResp(res, 401, 'Room doesn\'t belong to user')
            }
        })
    })
    .delete(validateRoom, function (req, res) {
        var prob_name = req.params.problem
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