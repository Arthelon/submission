var express = require('express')
var router = express.Router()
var models = require('../models')
var multer = require('multer')
var fs = require('fs')
var archiver = require('archiver')
var PythonShell = require('python-shell')
var async = require('async')

var handleResp = require('../util').handleResp
var validateRoom = require('../util').validateRoom

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

var Room = models.Room
var File = models.File
var Submission = models.Submission
var Problem = models.Problem

router.route('/:room_name')
    .get(function(req, res) {
        var room_name = req.params.room_name
        var payload = {}
        Room
        .findOne({
            path: room_name
        })
        .populate('submissions problems')
        .sort({'submissions.timestamp': -1})
        .exec(function(err, room) {
            if (err) {
                return handleResp(res, 500, err.message)
            } else if (!room) {
                res.status(404)
                res.render('error', {
                    message: 'Room does not exist, did you enter in the room path correctly?',
                    error: {}
                })
            } else {
                payload = {
                    room_name: room.name,
                    room_desc: room.desc,
                    problems: room.problems,
                    errors: req.flash('error')
                }
                if (req.user && req.user._id.toString() == room.owner.toString()) {
                    payload.submissions = room.submissions
                }
                res.render('room', payload)
            }
        })
    })
    .post(upload.array('file'), function(req, res) {
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
                } else {
                    req.files.forEach(function(file, findex) {
                        fs.readFile(file.path, 'utf8', function(err, data) {
                            if (err) return handleTestFail(req, res, err.message)
                            else async.each(prob.test.matches, function(match, cb) {
                                if (data.search(new RegExp(match.text)) == -1) cb('Failed match. \"'+match.text+'\" not found.')
                                else cb()
                            }, function(err) {
                                if (err) return handleTestFail(req, res, err)
                                else if (!prob.test.cases) {
                                    console.log('2')
                                    PythonShell.run(file.path, function(err) {
                                        if (err) {
                                            if (!err.stacktrace) err.stacktrace = 'Error Occured'
                                            return handleTestFail(req, res, err.stacktrace)
                                        } else {
                                            console.log('2')
                                            createSubCb(req, res, submissions)
                                        }
                                    })
                                } else {
                                    console.log('3')
                                    prob.test.cases.forEach(function(c, index) {
                                        var pyshell = new PythonShell(file.path, {mode:'text'})
                                        pyshell.send("\'"+c.in+"\'")
                                        pyshell.on('message', function(data) {
                                            if (data != c.out) {
                                                return handleTestFail(req, res, 'Failed Test. \"'+data+'\" != '+c.out)
                                            }
                                        })
                                        pyshell.on('error', function(err) {
                                            if (!err.stacktrace) err.stacktrace = 'Error Occured'
                                            return handleTestFail(req, res, err.stacktrace)
                                        })
                                        pyshell.end(function(err) {
                                            if (err) {
                                                if (!err.stacktrace) err.stacktrace = 'Error Occured'
                                                return handleTestFail(req, res, err.stacktrace)
                                            } else if (findex+1 == req.files.length && index+1==prob.test.cases.length) {
                                                submissions.prob = prob._id
                                                prob.update({
                                                    $push: {submissions: submissions._id}
                                                }, (err) => {
                                                    if (err) return handleResp(res, 500, err.message)
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
    .delete(validateRoom, function(req, res) {
        req.room.remove((err) => {
            if (err) return handleResp(res, 500, err.message)
            else return handleResp(res, 200, null, 'Room deleted')
        })
    })

function handleTestFail(req, res, msg, status) {
    req.files.forEach(function(file) {
        fs.unlink(file.path, (err) => {
            if (err) return handleResp(res, 500, err.message)
        })
    })
    return handleResp(res, status || 500, msg)
}

function createSubCb(req, res, sub) {
    sub.save((err, submission) => {
        if (err) {
            return handleResp(res, 500, err.message)
        } else {
            Room.findOneAndUpdate({
                name: req.params.room_name
            }, {$push: {submissions: submission._id}}, (err, room) => {
                if (err) {
                    return handleResp(res, 500, err.message)
                } else if (!room) {
                    return handleResp(res, 404, 'Room not found')
                } else {
                    submission.room = room._id
                    submission.save()
                    async.each(req.files, function(file, cb) {
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
                    }, function(err) {
                        if (err) return handleResp(res, 500, err.message)
                        else return handleResp(res, 200, null, 'Success')
                    })
                }
            })
        }
    })
}


router.route('/:room_name/:submission')
    .get(validateRoom, function(req, res) {
        Submission
            .findOne({
                name: req.params.submission
            })
            .populate('files')
            .exec(function(err, sub) {
                if (err) return handleResp(res, 500, err.message)
                else if (!sub) {
                    return handleResp(res, 404, 'Submission not found')
                } else if (sub.files.length == 1) {
                    res.download('uploads/'+sub.files[0].loc, sub.files[0].name, (err) => {
                        if(err) return handleResp(res, 500, err.message)
                    })
                } else {
                    var file_bundle = archiver.create('zip', {})
                    file_bundle.pipe(res)
                    sub.files.forEach(function (file) {
                        file_bundle.append(fs.createReadStream('uploads/'+file.loc), {
                            name: file.name
                        })
                    })
                    file_bundle.finalize()
                }
            })
    })
    .delete(validateRoom, function(req, res) {
        Submission.findOne({name: req.params.submission}, function(err, sub) {
            if (err) {
                return handleResp(res, 500, err.message)
            } else if (sub) {
                sub.remove((err) => {
                    if (err) {
                        return handleResp(res, 500, err.message)
                    } else {
                        async.each(sub.files, function(id, cb) {
                            File.findOneAndRemove({_id: id}, (err, file) => {
                                if (err) cb(err)
                                fs.unlink('uploads/'+file.loc, (err) => {
                                    if (err) cb(err)
                                    else cb()
                                })
                            })
                        }, function(err) {
                            if (err) return handleResp(res, 500, err.message)
                            return handleResp(res, 200, null, 'Submission deleted')
                        })
                    }
                })
            } else {
                return handleResp(res, 404, 'Submission not found')
            }
        })
    })

module.exports = router