var util = {}
var Room = require('./models').Room

var async = require('async')
var jwt = require('jsonwebtoken')

function handleResp(res, status, data) {
    if (!(typeof data == 'object')) {
        data = {error: data}
    }
    res.status(status)
    res.json(data)
    res.end()
}

util.validateRoom = function (req, res, next) {
    var room_path = null
    if (req.body.room_path) {
        room_path = req.body.room_path
    } else if (req.params.room_path) {
        room_path = req.params.room_path
    } else {
        room_path = req.query.room_path
    }
    Room.findOne({path: room_path}, function (err, room) {
        if (err) {
            return next(err)
        } else if (!room) {
            return handleResp(res, 404, 'Room not found')
        } else if (req.user && req.user._id != room.owner.toString()) {
            return handleResp(res, 406, 'User does not own room')
        } else {
            req.room = room
            next()
        }
    })
}

util.validateUser = function(req, res, next) {
    if (!req.user) {
        return handleResp(res, 401, 'User not authenticated')
    } else {
        next()
    }
}

util.handleErr = function(next, status, msg) {
    var err = new Error(msg || '');
    err.status = status;
    next(err)
}

util.validateBody = function(fields) {
    return function(req, res, next) {

        async.each(fields, function(field, done) {
            if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
                handleResp(res, 400, {error: 'Invalid fields'})
                return done('Invalid Fields')
            } else {
                done()
            }
        }, function(err) {
            if (!err) {
                next()
            }
        })
    }
}

util.generateToken = function(user) {
    return jwt.sign(user.toObject(), process.env.SECRET || 'dev_secret')
}

util.handleResp = handleResp

module.exports = util