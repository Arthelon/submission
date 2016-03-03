var express = require('express')
var router = express.Router()

router.route('/')
    .get(function(req, res) {
        if (req.isAuthenticated()) {
            res.render('dashboard', {
                name: req.user.username,
                title: 'submission | Dashboard'
            })
        } else {
            res.redirect('/')
        }
    })


module.exports = router