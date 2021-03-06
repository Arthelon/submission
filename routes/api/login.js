var router = require('express').Router()
var User = require('../../models').User

var util = require('../../util')
var handleResp = util.handleResp

router.route('/')
    /**
     * @api {post} /api/login Get JWT token
     *
     * @apiParam {String} username User's unique username
     * @apiParam {String} password Corresponding password
     */
    .post(util.validateBody(['username', 'password']), function(req, res) {
        User.findOne({
            username: req.body.username
        }, function(err, user) {
            if (err) return handleResp(res, 400, {error: err.message})
            else if (!user) return handleResp(res, 401, {error: 'User not found'})
            else if (!user.verifyPassword(req.body.password)) return handleResp(res, 401, 'Invalid Password')
            else {
                req.user = user
                var token = util.generateToken(user)
                console.log(token)
                return handleResp(res, 200, {
                    success: 'Authentication successful',
                    token: token
                })
            }
        })
    })
module.exports = router