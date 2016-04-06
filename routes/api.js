var express = require('express')
var router = express.Router()
var util = require('../util')
var models = require('../models')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateUser = util.validateUser

var Submission = models.Submission
var Room = models.Submission


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
                return handleResp(res, 200, null, 'Rooms retrieved', {
                    rooms: user.rooms
                })
            })
    })
    .delete(validateRoom, function(req, res) {
        req.room.remove((err) => {
            if (err) return handleResp(res, 500, err.message)
            else return handleResp(res, 200, null, 'Room deleted')
        })
    })

router.route('submissions')
    .get(validateRoom, function(req, res) {
        Room
            .populate('submissions')
            .findOne({
                name: req.room.name
            }, function(err, room) {
                if (err) return handleResp(res, 400, err.message)
                return handleResp(res, 200, null, 'Submissions retrieved', {
                    submissions: room.submissions
                })
            })
    })



module.exports = router