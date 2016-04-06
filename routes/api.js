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
            .populate('submissions')
            .sort('timestamp')
            .findOne({
                path: req.room.path
            }, function(err, room) {
                if (err) return handleResp(res, 400, err.message)
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



module.exports = router