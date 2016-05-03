var router = require('express').Router()

var util = require('../../util')
var models = require('../../models')

var Student = models.Student
var Room = models.Room

var validateRoom = util.validateRoom
var handleResp = util.handleResp

router.route('/:student_id')
    .get(validateRoom, (req, res) => {
        var student_id = req.params.student_id
        if (!student_id) return handleResp(res, 400, 'Student ID not found')
        Room.findOne({
            students: student_id
        }, (err, room) => {
            if (err || !room) handleResp(res, 500, err.message || 'Room not found')
            else {
                Student.findOne({_id: student_id})
                    .populate('submissions')
                    .exec(function(err, student) {
                    if (err || !student) handleResp(res, 500, err.message || 'Student not found')
                    else {
                        handleResp(res, 200, {success: 'Student data retrieved', student: student})
                    }
                })
            }
        })
    })

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
            .findOne({_id: req.room._id})
            .populate('students')
            .exec((err, room) => {
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