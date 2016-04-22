var router = require('express').Router()
var User = require('../../models').User
var util = require('../../util')

var handleResp = require('../../util').handleResp
var validateBody = require('../../util').validateBody

router.route('/')
    .put(function(req, res) {
        console.log(req.user._id)
        User.findOneAndUpdate({
            _id: req.user._id
        }, req.body, (err, user) => {
            if (err) return handleResp(res, 400, err.message)
            else if (!user) return handleResp(res, 400, 'User not found')
            else {
                var token = util.generateToken(user)
                return handleResp(res, 200, {
                    success: 'User updated',
                    token: token
                })
            }
        })
    })
    /**
     * @api {post} /api/users Create new User
     *
     * @apiParam {String} username Users unique ID
     * @apiParam {String} password Users password
     * @apiParam {String} email Users contact email
     * @apiParam {String} first_name Users first name
     * @apiParam {String} last_name Users last name
     *
     * @apiSuccess {String} success Success message
     */
    .post(validateBody(['username', 'password', 'email', 'first_name', 'last_name']), function(req, res) {
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