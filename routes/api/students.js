var router = require('express').Router()

var util = require('../../util')
var models = require('../../models')

var Student = models.Student
var Room = models.Room

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateBody = util.validateBody

var nodemailer = require('nodemailer')
var xoauth2 = require("xoauth2")

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

router.route('/email/:student_id')
    /**
     * @api {post} /api/students/email/:student_id Send email to student
     *
     * @apiParam {String} room_path Path to room
     * @apiParam {String} message Email contents
     * @apiSuccess {String} success Success message
     */
    .post(validateRoom, validateBody(['room_path', 'message']), (req, res) => {
        if (!req.user.refreshToken) {
            res.redirect("/login/google")
        } else {
            Student.findOne({_id: req.params.student_id}, (err, student) => {
                if (err || !student) handleResp(res, 500, err.message || 'Student not found')
                else {
                    var transport = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            xoauth2: xoauth2.createXOAuth2Generator({
                                user: req.user.email,
                                clientId: process.env.CLIENT_ID,
                                clientSecret: process.env.CLIENT_SECRET,
                                refreshToken: req.user.refreshToken,
                            })
                        }
                    })
                    transport.sendMail({
                        from: {
                            name: req.user.first_name + ' ' + req.user.last_name,
                            address: req.user.email
                        },
                        to: student.email,
                        subject: 'Submission - Response from ' + req.user.first_name,
                        text: req.body.message
                    }, function(err) {
                        if (err) handleResp(res, 500, err.message)
                        else {
                            return handleResp(res, 200, {success: 'Email response sent to '+req.user.email})
                        }
                    })
                }
            })
        }
    })

module.exports = router