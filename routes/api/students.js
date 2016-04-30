var router = require('express').Router()

var util = require('../../util')
var models = require('../../models')

var Student = models.Student
var Room = models.Room

var validateRoom = util.validateRoom
var handleResp = util.handleResp

router.route('/:student_id')

router.route('/room/:room_path')
    /**
     * @api {get} /api/students/room Get students from room
     *
     * @apiParam {String} room_path Path to room
     * @apiSuccess {String} success Success message
     * @apiSuccess {Object[]} students Array of student documents
     */
    .get(validateRoom, (req, res) => {
        Room
            .populate('students')
            .findOne({_id: req.room._id}, (err, room) => {
                if (err) handleResp(res, 500, err.message)
                else {
                    handleResp(res, 200, {
                        success: 'Students retrieved from room',
                        students: room.students
                    })
                }
            })
    })

module.exports = router