var router = require('express').Router()
var Room = require('./models').Room

router.validateRoom = function(req, res, next) {
    var room_name = req.body.room_name ? req.body.room_name : req.params.room_name
    if (!req.user) {
        res.status(401)
        res.end(JSON.stringify({
            status: 'FAILED',
            msg: 'Unvalidated user'
        }))
    } else {
        Room.findOne({name:room_name}, function(err, room) {
            if (err) {
                res.status(400)
                res.send(JSON.stringify({
                    status: 'FAILED',
                    msg: err.message
                }))
            }
            else if (!room) {
                res.status(404)
                res.end(JSON.stringify({
                    status: 'FAILED',
                    msg: 'Room not found'
                }))
            } else if (req.user._id.toString() != room.owner.toString()) {
                res.status(406)
                res.end(JSON.stringify({
                    status: 'FAILED',
                    msg: 'User does not own room'
                }))
            } else {
                req.room = room
                next()
            }
        })
    }
}

module.exports = router