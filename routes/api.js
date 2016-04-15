var express = require('express')
var router = express.Router()
var util = require('../util')
var models = require('../models')

var register = require('./api/register')
var login = require('./api/login')
var rooms = require('./api/rooms')
var submissions = require('./api/submissions')
var problems = require('./api/problems')
var sub = require('./api/sub')

router.use('/register', register)
router.use('/login', login)
router.use('/rooms', rooms)
router.use('/submissions', submissions)
router.use('/problems', problems)
router.sub('/sub', sub)


module.exports = router