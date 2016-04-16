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
    // changeDest: function (dest, req, res) {
    //    var newDestination = dest + req.params.room_name;
    //    var stat = null;
    //    try {
    //        stat = fs.statSync(newDestination);
    //    } catch (err) {
    //        fs.mkdirSync(newDestination);
    //    }
    //    if (stat && !stat.isDirectory()) {
    //        throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
    //    }
    //    return newDestination
    // },
})
var util = require('../../util')
var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateUser = util.validateUser

router.route('/')
    .get(validateRoom, function (req, res) {
        Room
            .findOne({
                path: req.room.path
            })
            .populate('submissions')
            .sort('timestamp')
            .exec(function (err, room) {
                if (err) return handleResp(res, 400, err.message)
                if (!room) {
                    return handleResp(res, 404, 'Room not found')
                } else
                    return handleResp(res, 200, {
                        success: 'Submissions retrieved',
                        submissions: room.submissions
                    })
            })
    })
    .delete(validateRoom, function (req, res) {
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
    .post(upload.array('file'), function (req, res) {
        var prob_name = req.body.prob
        var submissions = new Submission({
            name: req.body.name,
            desc: req.body.desc,
            user: req.body.user
        })
        if (prob_name == 'None') {
            createSubCb(req, res, submissions)
        } else {
            Problem.findOne({name: prob_name}, (err, prob) => {
                if (err) {
                    return handleTestFail(req, res, err.message)
                } else if (!prob) {
                    return handleTestFail(req, res, 'Problem not found', 404)
                } else if (prob.test.matches.length == 0 && prob.test.cases.length == 0) {
                    return createSubCb(req, res, submissions)
                } else {
                    req.files.forEach(function (file, findex) {
                        fs.readFile(file.path, 'utf8', function (err, data) {
                            if (err) return handleTestFail(req, res, err.message)
                            else if (!data) return handleTestFail(req, res, 'File not found')
                            else async.each(prob.test.matches, function (match, cb) {
                                    if (data.search(new RegExp(match.text)) == -1) cb('Failed match. \"' + match.text + '\" not found.')
                                    else cb()
                                }, function (err) {
                                    if (err) return handleTestFail(req, res, err)
                                    else if (!prob.test.cases) {
                                        PythonShell.run(file.path, function (err) {
                                            if (err) {
                                                if (!err.stacktrace) err.stacktrace = 'Error Occured'
                                                return handleTestFail(req, res, err.stacktrace)
                                            } else {
                                                createSubCb(req, res, submissions)
                                            }
                                        })
                                    } else {
                                        prob.test.cases.forEach(function (c, index) {
                                            var pyshell = new PythonShell(file.path, {mode: 'text'})
                                            pyshell.send("\'" + c.in + "\'")
                                            pyshell.on('message', function (data) {
                                                if (data != c.out) {
                                                    return handleTestFail(req, res, 'Failed Test. \"' + data + '\" != ' + c.out)
                                                }
                                            })
                                            pyshell.end(function (err) {
                                                if (err) {
                                                    console.log(err.stack)
                                                    if (!err.stack) err.stack = 'Error Occured'
                                                    return handleTestFail(req, res, err.stack)
                                                } else if (findex + 1 == req.files.length && index + 1 == prob.test.cases.length) {
                                                    submissions.prob = prob._id
                                                    prob.update({
                                                        $push: {submissions: submissions._id}
                                                    }, (err) => {
                                                        if (err) return handleResp(res, 500, {error: err.message})
                                                        else createSubCb(req, res, submissions)
                                                    })
                                                }
                                            })
                                        })
                                    }
                                })
                        })
                    })
                }
            })
        }
    })

function handleTestFail(req, res, msg, status) {
    req.files.forEach(function (file) {
        fs.unlink(file.path, (err) => {
            if (err) return handleResp(res, 500, {error: err.message})
        })
    })
    return handleResp(res, status || 500, {error: msg})
}

function createSubCb(req, res, sub) {
    sub.save((err, submission) => {
        if (err) {
            return handleResp(res, 500, {error: err.message})
        } else {
            Room.findOneAndUpdate({
                path: req.body.room_path
            }, {$push: {submissions: submission._id}}, (err, room) => {
                if (err) {
                    return handleResp(res, 500, {error: err.message})
                } else if (!room) {
                    return handleResp(res, 404, {error: 'Room not found'})
                } else {
                    submission.room = room._id
                    submission.save()
                    async.each(req.files, function (file, cb) {
                        File.create({
                            name: file.originalname,
                            type: file.mimetype,
                            loc: file.filename
                        }, function (err, created_file) {
                            if (err) cb(err)
                            submission.update({
                                $push: {
                                    files: created_file._id
                                }
                            }, (err) => {
                                if (err) cb(err)
                                else cb()
                            })
                        })
                    }, function (err) {
                        if (err) return handleResp(res, 500, {error: err.message})
                        else return handleResp(res, 200, {success: 'Success'})
                    })
                }
            })
        }
    })
}
module.exports = router
