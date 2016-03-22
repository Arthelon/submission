var util = {}
var Room = require('./models').Room

function handleResp(res, status, err, succ) {
    if (status) {
        res.status(status)
    }
    payload = {}
    if (err) payload.error = err
    if (succ) payload.success = succ
    console.log(payload)
    res.json(payload)
    res.end()
}

util.validateRoom = function(req, res, next) {
    var room_name = req.body.room_name ? req.body.room_name : req.params.room_name
    if (!req.user) {
        return handleResp(res, 401, 'User not logged in')
    } else {
        Room.findOne({name:room_name}, function(err, room) {
            if (err) {
                return next(err)
            } else if (!room) {
                return handleResp(res, 404, 'Room not found')
            } else if (req.user._id.toString() != room.owner.toString()) {
                return handleResp(res, 406, 'User does not own room')
            } else {
                req.room = room
                next()
            }
        })
    }
}

util.handleResp = handleResp

module.exports = util