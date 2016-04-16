var router = require('express').Router()
var archiver = require('archiver')
var fs = require('fs')

var models = require('../../models')
var Submission = models.Submission

var util = require('../../util')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateBody = util.validateBody



router.route('/')
    /**
     * @api {get} /api/subs Download submission
     *
     * @apiParam {String} submission Submission name
     * @apiParam {String} room_path Room path
     */
    .get(validateRoom, validateBody(['submission']), function(req, res) {
        Submission
            .findOne({
                name: req.body.submission
            })
            .populate('files')
            .exec(function (err, sub) {
                if (err) return handleResp(res, 500, {error: err.message})
                else if (!sub) {
                    return handleResp(res, 404, {error: 'Submission not found'})
                } else if (sub.files.length == 1) {
                    res.download('uploads/' + sub.files[0].loc, sub.files[0].name, (err) => {
                        if (err) return handleResp(res, 500, {error: err.message})
                    })
                } else {
                    var file_bundle = archiver.create('zip', {})
                    file_bundle.pipe(res)
                    sub.files.forEach(function (file) {
                        file_bundle.append(fs.createReadStream('uploads/' + file.loc), {
                            name: file.name
                        })
                    })
                    file_bundle.finalize()
                }
            })
    })
module.exports = router