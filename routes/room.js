var express = require('express')
var router = express.Router()
var multer = require('multer')
var fs = require('fs')

var validateRoom = require('../util').validateRoom

router.route('/:room_path')
    .get(validateRoom, function (req, res) {
        payload = {
            room_name: req.room.name,
            room_desc: req.room.desc,
            ngApp: 'app.room'
        }
        payload.user_authenticated = req.user ? true : false
        res.render('room', payload)
    })

module.exports = router