var express = require('express')
var router = express.Router()

router.get('/', function(req, res) {
    "use strict";
    res.redirect('/')
})

module.exports = router