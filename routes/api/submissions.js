var router = require('express').Router()

var models = require('../../models')
var Room = models.Room
var Submission = models.Submission
var Problem = models.Problem
var File = models.File
var async = require('async')
var fs = require('fs')

var multer = require('multer')
var PythonShell = require('python-shell')

var upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 100000000 //100 MB
    }
})
var util = require('../../util')
var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateBody = util.validateBody

router.route('/')
    /**
     * @api {get} /api/submissions Retrieve submissions
     *
     * @apiSuccess {String} success Success message
     * @apiSuccess {Object[]} submissions Submissions list
     */
    .get(validateRoom, function (req, res) {
        Room
            .findOne({
                path: req.room.path
            })
            .populate({
                path: 'submissions',
                populate: {path: 'student', model: 'Student'}
            })
            .sort('timestamp')
            .exec(function (err, room) {
                if (err) return handleResp(res, 400, err.message)
                if (!room) {
                    return handleResp(res, 404, 'Room not found')
                } else
                    console.log(room.submissions)
                    return handleResp(res, 200, {
                        success: 'Submissions retrieved',
                        submissions: room.submissions
                    })
            })
    })
    /**
     * @api {delete} /api/submissions Remove submission
     *
     * @apiParam {String} room_path Room path
     * @apiParam {String} submission Submission name
     *
     * @apiSuccess {String} success Success message
     * @apiSuccess {Object[]} submissions Submissions list
     */
    .delete(validateRoom, validateBody(['submission']), function (req, res) {
        Submission.findOne({name: req.body.submission}, function (err, sub) {
            if (err) {
                return handleResp(res, 500, {error: err.message})
            } else if (sub) {
                sub.remove((err) => {
                    if (err) {
                        return handleResp(res, 500, {error: err.message})
                    } else {
                        async.each(sub.files, function (id, cb) {
                            File.findOneAndRemove({_id: id}, (err, file) => {
                                if (err) cb(err)
                                fs.unlink('uploads/' + file.loc, (err) => {
                                    if (err) cb(err)
                                    else cb()
                                })
                            })
                        }, function (err) {
                            if (err) return handleResp(res, 500, {error: err.message})
                            return handleResp(res, 200, {success: 'Submission deleted'})
                        })
                    }
                })
            } else {
                return handleResp(res, 404, {error: 'Submission not found'})
            }
        })
    })
module.exports = router
