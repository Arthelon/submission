var express = require('express')
var router = express.Router()
var models = require('../models')
var multer = require('multer')
var fs = require('fs')
var archiver = require('archiver');

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
        Room.findOne({
            path: room_name
        }, function(err, room) {
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
                    errors: req.flash('error')
                }
                if (req.user && req.user._id.toString() == room.owner.toString()) {
                    Submission.find()
                        .sort({'-timestamp': 'desc'})
                        .exec((err, submissions) => {
                            if (err) throw err
                            payload.submissions = submissions
                            Problem.find({}, function(err, problems) {
                                payload.problems = problems
                                res.render('room', payload)
                            })
                        })
                } else {
                    res.render('room', payload)
                }
            }
        })
    })
    .post(upload.array('file'), function(req, res) {
        Submission.findOne({
            name: req.body.name
        }, (err, doc) => {
            if (err) throw err
            if (doc) {
                req.flash('', 'Submission name already exists')
                res.redirect('back')
            } else {
                res.redirect('back')
                console.log(req.body)
                Submission.create({
                    name: req.body.name,
                    desc: req.body.desc,
                    user: req.body.user
                }, function (err, submission) {
                    if (err) throw err
                    Room.findOneAndUpdate({
                        name: req.params.room_name
                    }, {
                        $push: {
                            submissions: submission._id
                        }
                    }, (err) => {
                        if (err) throw err
                    })
                    console.log(req.files)
                    for (var i in req.files) {
                        var file = req.files[i]
                        File.create({
                            name: file.originalname,
                            type: file.mimetype,
                            loc: file.filename
                        }, function (err, created_file) {
                            if (err) throw err
                            Submission.findByIdAndUpdate(submission._id, {
                                $push: {
                                    files: created_file._id
                                }
                            }, (err) => {
                                if (err) throw err
                            })
                        })
                    }
                })
            }
        })
    })

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
                    res.sendStatus(200)
                }
            })
    }
)

router.delete('/_remove_sub', validateRoom,
    function(req, res) {
        Submission.findOneAndRemove({name: req.body.sub_name}, function(err, sub) {
            if (err) throw err
            Room.findOneAndUpdate({name: req.room},  {
                $pull: {
                    submissions: sub._id
                }
            }, function(err) {
                if (err) throw err
            })
            sub.files.forEach(function(id) {
                File.findOneAndRemove({_id: id}, (err, file) => {
                    if (err) throw err
                    fs.unlink('uploads/'+file.loc, (err) => {
                        if (err) throw err
                    })
                    res.sendStatus(200)
                })
            })
         })
    })
//
//router.get('/_problems', validateRoom, function(req, res) {
//    Problem.find({}, function(err, problems) {
//        if (err) throw err
//        var payload = {
//            status: 'OK',
//            problems: []
//        }
//        problems.forEach(function(problem) {
//            payload.problems.push({
//                name: problem.name,
//                desc: problem.desc,
//                count: problem.submissions.length
//            })
//        })
//        res.status(200)
//        res.end(JSON.stringify(payload))
//    })
//})

function validateRoom(req, res, next) {
    var room_name = req.body.room_name ? req.body.room_name : req.params.room_name
    if (!req.user) {
        res.status(401)
        res.end(JSON.stringify({
            status: 'FAILED',
            msg: 'Unvalidated user'
        }))
    } else {
        Room.findOne({name:room_name}, function(err, room) {
            if (err) throw err
            if (req.user._id.toString() != room.owner.toString()) {
                res.status(406)
                res.end(JSON.stringify({
                    status: 'FAILED',
                    msg: 'User does not own room'
                }))
            } else {
                req.room = room_name
                next()
            }
        })
    }
}

module.exports = router