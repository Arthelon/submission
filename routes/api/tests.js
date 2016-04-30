var router = require('express').Router()

var models = require('../../models')
var Room = models.Room
var Problem = models.Problem


var util = require('../../util')

var validateRoom = util.validateRoom
var handleResp = util.handleResp
var validateBody = util.validateBody

router.route('/')
    /**
     * @api {delete} /api/tests Remove test
     *
     * @apiParam {String} room_path Room path
     * @apiParam {String} problem Problem name
     * @apiParam {String} id Test id
     * @apiParam {String='cases', 'matches'} type Test type
     *
     * @apiSuccess {String} success Success message
     */
    .delete(validateRoom, validateBody(['type', 'id', 'problem']), function (req, res) {
        var prob_name = req.body.problem
        var test_id = req.body.id
        var test_type = req.body.type
        if (test_type != 'matches' && test_type != 'cases') {
            return handleResp(res, 400, 'Invalid test type')
        }
        Problem.findOne({name: prob_name}, function (err, prob) {
            if (err) {
                return handleResp(res, 500, err.message)
            } else if (!prob) {
                return handleResp(res, 404, 'Problem not found')
            } else if (prob.room.toString() == req.room._id.toString()) {
                prob.update({
                    $pull: {
                        ['test.' + test_type]: { //Dynamic object key
                            _id: test_id
                        }
                    }
                }, (err) => {
                    if (err) return handleResp(res, 500, err.message)
                    else return handleResp(res, 200, {success: 'Test deleted'})
                })
            }
        })
    })
    /**
     * @api {post} /api/tests Create test
     *
     * @apiParam {String} room_path Room path
     * @apiParam {String} problem Problem name
     * @apiParam {String} [in] Test input
     * @apiParam {String} [out] Test output
     * @apiParam {String} [match] Test match string
     *
     * @apiSuccess {String} success Success message
     */
    .post(validateRoom, function (req, res) {
        var prob_name = req.body.problem
        console.log(prob_name)
        Problem.findOne({name: prob_name}, function (err, prob) {
            if (err) {
                return handleResp(res, 500, err.message)
            } else if (!prob) {
                return handleResp(res, 404, 'Problem not found')
            } else if (prob.room.toString() == req.room._id.toString()) {
                var inp = req.body.in
                var out = req.body.out
                if (inp && out) {
                    prob.test.cases.push({
                        in: inp,
                        out: out
                    })
                } else if (req.body.match) {
                    prob.test.matches.push({text: req.body.match})
                }
                prob.save((err) => {
                    if (err) {
                        return handleResp(res, 500, err.message)
                    } else {
                        return handleResp(res, 200, {success: 'Test created'})
                    }
                })
            } else {
                return handleResp(res, 401, 'Room doesn\'t belong to user')
            }
        })
    })
module.exports = router