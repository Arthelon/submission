var router = require('express').Router()

var models = require('../../models')
var Room = models.Room
var Submission = models.Submission
var Problem = models.Problem


var util = require('../../util')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateBody = util.validateBody

router.route('/:problem')
    /**
     * @api {get} /api/problems/:problem Get problems details
     * 
     * @apiSuccess {Object} tests Object containing problem tests
     * @apiSuccess {String} prob_desc Problem Description
     * @apiSuccess {String} success Success message
     * @apiSuccess {Object[]} submissions List of submissions
     */
    .get(validateRoom, function(req, res) {
        Room.findOne({path: req.room.path})
            .populate({
                path: 'problems',
                populate: {
                    path: 'submissions',
                    model: 'Submission'
                }
            })
            .populate({
                path: 'problems',
                populate: {
                    path: 'student',
                    model: 'Student'
                }
            })
            .exec(function (err, room) {
                if (err) return handleResp(res, 400, err.message)
                else {
                    room.problems.forEach(function (prob) {
                        if (prob.name == req.params.problem) {
                            return handleResp(res, 200, {
                                submissions: prob.submissions,
                                tests: prob.test,
                                prob_desc: prob.desc,
                                success: 'Problem data loaded'
                            })
                        }
                    }, function () {
                        return handleResp(res, 404, {error: 'Problem not found'})
                    })
                }
            })
    })
    /**
     * @api {delete} /api/problems/:problem Remove problem
     *
     * @apiParam {String} room_path Room path
     * @apiSuccess {String} success Success message
     */
    .delete(validateRoom, function(req, res) {
        var prob_name = req.params.problem
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

router.route('/')
    /**
     * @api {get} /api/problems Get Problems
     * @apiParam {String} room_path Room path
     *
     * @apiSuccess {Object[]} problems List of problems
     * @apiSuccess {String} success Success message
     */
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
    /**
     * @api {post} /api/problems Create Problem
     *
     * @apiParam {String} room_path Room path
     * @apiParam {String} name Problem name
     * @apiParam {String} desc Problem description
     *
     * @apiSuccess {String} success Success message
     */
    .post(validateRoom, validateBody(['name', 'desc']), function(req, res) {
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