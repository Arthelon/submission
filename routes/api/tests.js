var router = require('express').Router()

var models = require('../../models')
var Room = models.Room
var Problem = models.Problem


var util = require('../../util')

var validateRoom = util.validateRoom
var validateUser = util.validateUser
var handleResp = util.handleResp

router.route('/')
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
    .post(validateUser, validateRoom, function (req, res) {
        var prob_name = req.body.problem
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
                        return handleResp(res, 200, {success: 'Success'})
                    }
                })
            } else {
                return handleResp(res, 401, 'Room doesn\'t belong to user')
            }
        })
    })