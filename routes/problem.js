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
                room_name: req.room,
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
                    desc: req.body.desc
                }, (err, prob, created) => {
                    if (err) {
                        req.flash('error', err.message)
                        res.redirect('back')
                    } else if (!created) {
                        req.flash('error', 'Problem already exists')
                        res.redirect('back')
                    } else {
                        Room.findOneAndUpdate({
                            name: req.room
                        }, {$push: {problems: prob._id}}, (err, room) => {
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
        Room
        .findOne({name:req.room})
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
                            room_name: req.room,
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

module.exports = router