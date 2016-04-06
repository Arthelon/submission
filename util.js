var util = {}
var Room = require('./models').Room

function handleResp(res, status, data) {
    console.log(data)
    if (!(typeof data == 'object')) {
        data = {error: data}
    }
    res.status(status)
    res.json(data)
    res.end()
}

util.validateRoom = function (req, res, next) {
    var room_name = req.body.room_name ? req.body.room_name : req.params.room_name
    if (!req.user) {
        if (req.method == 'GET') res.redirect('/')
        else return handleResp(res, 401, 'User not authenticated')
    } else {
        Room.findOne({name: room_name}, function (err, room) {
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

util.handleResp = handleResp

module.exports = util