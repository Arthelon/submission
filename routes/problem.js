var router = require('express').Router()
var models = require('../models')
var validateRoom = require('../mid').validateRoom

//Models
var Room = models.Room
var Problem = models.Problem


router.route('/:room_name')
    .get(validateRoom, function(req, res) {
        if (req.user) {
            res.render('create_prob', {
                room_name: req.room.name,
                errors: req.flash('error')
            })
        } else {
            res.redirect('/')
        }
    })
    .post(validateRoom, function(req, res) {
        if (req.user) {
            if (req.body.name && req.body.desc) {
                Problem.findOrCreate({
                    name: req.body.name,
                    desc: req.body.desc,
                    room: req.room._id
                }, (err, prob, created) => {
                    if (err) {
                        req.flash('error', err.message)
                        res.redirect('back')
                    } else if (!created) {
                        req.flash('error', 'Problem already exists')
                        res.redirect('back')
                    } else {
                        Room.findOneAndUpdate({
                            _id: req.room._id
                        }, {$push: {problems: prob._id}}, (err) => {
                            if (err) throw err
                        })
                        res.redirect('/dashboard')
                    }
                })
            } else {
                req.flash('error', 'Fields not filled')
                res.redirect('back')
            }
        } else {
            res.status(401)
            res.end(JSON.stringify({
                msg: 'User not authenticated'
            }))
        }
    })

router.route('/:room_name/:problem')
    .get(validateRoom, function(req, res) {
        Room.findOne({_id: req.room._id})
        .populate({
            path: 'problems',
            populate: {
                path: 'submissions',
                model: 'Submission'
            }
        })
        .exec(function(err, room) {
            if (err) {
                res.status(400)
                req.flash('error', err.message)
                res.redirect('back')
            } else {
                room.problems.forEach(function(prob) {
                    if (prob.name == req.params.problem) {
                        res.render('problem', {
                            prob_name: prob.name,
                            prob_desc: prob.desc,
                            prob_subs: prob.submissions,
                            room_name: req.room.name,
                            errors: req.flash('error'),
                            title: 'submission | ' + prob.name
                        })
                    }
                }, function() {
                    res.status(404)
                    req.flash('error', 'Room not found')
                    res.redirect('back')
                })
            }
        })
    })
    .delete(validateRoom, function(req, res) {
        var prob_name = req.params.problem
        console.log(prob_name)
        Problem.findOne({name: prob_name},
            function(err, prob) {
            if (err) {
                req.flash('error', err.message)
                res.status(400)
                res.redirect('back')
            } else if (!prob) {
                req.flash('error', 'Problem not found')
                res.status(404)
                res.redirect('back')
            } else if (prob.room.toString() == req.room._id.toString()) {
                prob.remove(function(err) {
                    if (err) {
                        req.flash('error', err.message)
                        res.status(400)
                        res.redirect('back')
                    } else {
                        req.room.update({
                            $pull: {
                                problems: prob._id
                            }
                        }, (err) => {
                            if (err) throw err
                            else {
                                req.flash('success', 'Sucess')
                                res.sendStatus(200)
                                res.redirect('back')
                            }
                        })
                    }
                })
            } else {
                req.flash('error', 'Room doesn\'t belong to user')
                res.status(401)
                res.redirect('back')
            }
        })
    })

module.exports = router