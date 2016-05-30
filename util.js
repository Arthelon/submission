var util = {}
var Room = require('./models').Room

var async = require('async')
var jwt = require('jsonwebtoken')

//Helper function that sends JSON responses
function handleResp(res, status, data) {
    if (!(typeof data == 'object')) {
        // console.log(data)
        data = {error: data}
    }
    res.status(status)
    res.json(data)
    res.end()
}

//Function used for validating request when a room is accessed
util.validateRoom = function (req, res, next) {
    var room_path = null
    //Pulls room_path identifier from body, path, or query string
    if (req.body.room_path) {
        room_path = req.body.room_path
    } else if (req.params.room_path) {
        room_path = req.params.room_path
    } else {
        room_path = req.query.room_path
    }
    // console.log('Room Path: '+room_path)
    Room.findOne({path: room_path}, function (err, room) {
        if (err) {
            return next(err)
        } else if (!room) {
            return handleResp(res, 404, 'Room not found')
        } else if (req.user && req.user._id != room.owner.toString()) {
            return handleResp(res, 406, 'User does not own room') //Matches req.user against the owner of the Room
        } else {
            req.room = room
            next()
        }
    })
}

//Verifies the presence of an authenticated user
util.clientValidateUser = function(req, res, next) {
    if (!req.user) {
        res.redirect('/')
    } else {
        next()
    }
}

util.clientValidateRoom = function(req, res, next) {
    var room_path = null
    //Pulls room_path identifier from body, path, or query string
    if (!req.user) {
        res.redirect('/')
    } else {
        if (req.body.room_path) {
            room_path = req.body.room_path
        } else if (req.params.room_path) {
            room_path = req.params.room_path
        } else {
            room_path = req.query.room_path
        }
        if (!req.user) {

        }
        Room.findOne({path: room_path}, function (err, room) {
            if (err) {
                return next(err)
            } else if (!room) {
                next(new Error('Room not found'))
            } else if (req.user && req.user._id != room.owner.toString()) {
                next(new Error('User does not own room'))
            } else {
                req.room = room
                next()
            }
        })
    }
}

//Helper function used to verify the presence of certain fields in the request body
util.validateBody = function(fields) {
    return function(req, res, next) {
        async.each(fields, function(field, done) {
            if (!Object.prototype.hasOwnProperty.call(req.body, field)) { //If field is not found in request body
                return done('Invalid Fields')
            } else {
                done()
            }
        }, function(err) {
            if (!err) { //Passes request onto next route middleware if all fields are present
                next()
            } else {
                handleResp(res, 400, {error: 'Invalid fields'})
            }
        })
    }
}

//Helper function used for generating jsonwebtoken containing a user instance
util.generateToken = function(user) {
    return jwt.sign(user.toObject(), process.env.SECRET || 'dev_secret')
}

util.handleResp = handleResp

module.exports = util