var express = require('express')
var router = express.Router()
var models = require('../models')
var multer = require('multer')
var fs = require('fs')
var archiver = require('archiver')
var validateRoom = require('../mid').validateRoom

var upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 100000000 //100 MB
    }
    //changeDest: function (dest, req, res) {
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
    //},
})

var Room = models.Room
var File = models.File
var Submission = models.Submission
var Problem = models.Problem

router.route('/:room_name')
    .get(function(req, res) {
        var room_name = req.params.room_name
        Room
        .findOne({
            path: room_name
        })
        .populate('submissions problems')
        .sort({'submissions.timestamp': -1})
        .exec(function(err, room) {
            if (err) throw err
            if (!room) {
                res.status(404)
                res.render('error', {
                    message: 'Room does not exist, did you enter in the room path correctly?',
                    error: {}
                })
            } else {
                var payload = {
                    room_name: room.name,
                    room_desc: room.desc,
                    problems: room.problems,
                    errors: req.flash('error')
                }
                if (req.user && req.user._id.toString() == room.owner.toString()) {
                    payload.submissions = room.submissions
                    res.render('room', payload)
                } else {
                    res.render('room', payload)
                }
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
            createSubCb(submissions, req, res)
        } else {
            Problem.findOne({name: prob_name}, (err, prob) => {
                if (err) {
                    req.flash('error', err.message)
                    res.status(400)
                    res.redirect('back')
                } else if (!prob) {
                    req.flash('error', 'Problem not found')
                    res.status(404)
                    res.redirect('back')
                } else {
                    prob.update({
                        $push: {submissions: submissions._id}
                    }, (err) => {
                        if (err) throw err
                        prob.save()
                    })
                    submissions.prob = prob._id
                    createSubCb(submissions, req, res)
                }
            })
        }
    })

function createSubCb(sub, req, res) {
    sub.save((err, submission) => {
        if (err) {
            req.flash('error', err.message)
            res.status(400)
            res.redirect('back')
        } else {
            Room.findOneAndUpdate({
                name: req.params.room_name
            }, {$push: {submissions: submission._id}}, (err, room) => {
                if (err) throw err
                if (!room) {
                    req.flash('error', 'Room not found')
                    res.status(404)
                    res.redirect('back')
                } else {
                    submission.room = room._id
                    submission.save()
                }
            })
            for (var i in req.files) {
                var file = req.files[i]
                File.create({
                    name: file.originalname,
                    type: file.mimetype,
                    loc: file.filename
                }, function (err, created_file) {
                    if (err) throw err
                    submission.update({
                        $push: {
                            files: created_file._id
                        }
                    }, (err) => {
                        if (err) throw err
                        submission.save()
                    })
                })
            }
        }
    })
}

router.get('/_download/:room_name/:submission', validateRoom,
    function(req, res) {
        Submission
            .findOne({
                name: req.params.submission
            })
            .populate('files')
            .exec(function(err, sub) {
                if (err) throw err
                if (sub.files.length == 1) {
                    res.download('uploads/'+sub.files[0].loc, sub.files[0].name, (err) => {
                        if (err) throw err
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
    }
)

router.delete('/_remove_sub', validateRoom,
    function(req, res) {
        Submission.findOne({name: req.body.sub_name}, function(err, sub) {
            if (err) throw err
            if (sub) {
                sub.remove((err) => {
                    if (err) {
                        req.flash('error', err.message)
                        res.status(400)
                        res.redirect('back')
                    } else {
                        sub.files.forEach(function(id) {
                            File.findOneAndRemove({_id: id}, (err, file) => {
                                if (err) throw err
                                fs.unlink('uploads/'+file.loc, (err) => {
                                    if (err) throw err
                                })
                                res.sendStatus(200)
                            })
                        })
                    }
                })
            } else {
                req.flash('error', 'Submission not found')
                res.status(404)
                res.redirect('back')
            }
         })
    })


module.exports = router