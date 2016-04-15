var router = require('express').Router()
var User = require('../../models').User

var handleResp = require('../../util').handleResp

router
    /**
     * @api {post} /register Create new User
     *
     * @apiParam {String} username Users unique ID
     * @apiParam {String} password Users password
     * @apiParam {String} email Users contact email
     * @apiParam {String} first_name Users first name
     * @apiParam {String} last_name Users last name
     */
    .post(function(req, res) {
        User.findOne({username: req.body.username}, function (err, user) {
            if (err) {
                return handleResp(res, 400, {error: err.message})
            } else if (user) {
                return handleResp(res, 400, {error: 'User already exists'})
            } else {
                var new_user = new User({
                    username: req.body.username,
                    password: req.body.password,
                    email: req.body.email,
                    first_name: req.body.first_name,
                    last_name: req.body.last_name
                })
                if (new_user.validatePassword()) {
                    new_user.save(function (err) {
                        if (err) {
                            return handleResp(res, 400, {error: err.message})
                        } else {
                            return handleResp(res, 200, {success: 'User Created'})
                        }
                    })
                } else {
                    return handleResp(res, 400, {error: 'Invalid password'})
                }
            }
        })
    })
module.exports = router