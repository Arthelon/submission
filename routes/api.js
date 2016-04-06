var express = require('express')
var router = express.Router
var util = require('../util')
var models = require('../models')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateUser = util.validateUser



router.route('/rooms')
    .get(validateUser, function(req, res) {
        models.User
            .findOne({
                username: req.user.username
            })
            .populate('rooms')
            .sort('username')
            .exec(function (err, user) {
                if (err) handleResp(res, 400, err.message)
                res.status(200)
                res.json({
                    rooms: user.rooms,
                    success: 'Rooms retrieved'
                })
                res.end()
            })
    })

module.exports = router