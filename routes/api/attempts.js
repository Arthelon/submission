var router = require('express').Router()
var Submission = require('../../models').Submission

var util = require('../../util')
var validateRoom = util.validateRoom()
var handleResp = util.handleResp()


router.route('/:submission_id')
    .get(validateRoom, function(req, res) {
        var sub_id = req.params.submission_id
        if (!sub_id) return handleResp(res, 400, {error: 'No submission id'})
        else {
            Submission
                .populate('attempts')
                .findOne({_id: sub_id}, (err, sub) => {
                    if (err || !sub) handleResp(res, 400, err.message || 'Submission not found')
                    else {
                        handleResp(res, 400, {success: 'Attempts retrieved', attempts: sub.attempts})
                    }
                })
        }
    })

module.exports = router