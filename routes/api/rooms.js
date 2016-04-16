var router = require('express').Router()

var models = require('../../models')
var Room = models.Room
var User = models.User

var util = require('../../util')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateUser = util.validateUser

router.route('/')
    .get(function(req, res) {
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
    .post(function(req, res) {
        Room.findOrCreate({
            path: req.body.room_path,
            name: req.body.name,
            desc: req.body.desc,
            owner: req.user._id
        }, function (err, room, created) {
            if (err) {
                return handleResp(res, 500, err.message)
            } else if (!created) {
                return handleResp(res, 409, 'Room already exists')
            } else {
                User.findOneAndUpdate({username: req.user.username}, {
                    $push: {rooms: room._id}
                }, (err) => {
                    if (err) {
                        return handleResp(res, 500, err.message)
                    }
                })
                return handleResp(res, 200, {success: 'Room Created'})
            }
        })
    })
module.exports = router