var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//routes
var root = require('./routes/index');
var room = require('./routes/room');
var dashboard = require('./routes/dashboard')

//Authentication setup
var passport = require('passport');
var session = require('express-session');
var LocalStrategy = require('passport-local').Strategy
var CustomStrategy = require('passport-custom').Strategy

//Mongoose
var mongoose = require('mongoose')
var models = require('./models')

//Misc
var flash = require('connect-flash')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({secret: 'mySecretKey', resave: false, saveUninitialized: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash())

//Passport and express-session
var User = models.User
var Room = models.Room
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

//Passport Strategies
passport.use('login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        User.findOne({username: username},
            function(err, user) {
                if (err)
                    return done(err);
                if (!user){
                    return done(null, false,
                        req.flash('error', 'User Not found.'));
                }
                if (!user.verifyPassword(password)){
                    return done(null, false,
                        req.flash('error', 'Invalid Password'));
                }
                return done(null, user);
            }
        );
    }));


passport.use('register', new LocalStrategy({
        passReqToCallback: true
    },
    function(req, username, password, done) {
        User.findOne({username: username}, function(err, user) {
            if (err) {
                return done(err, false,
                    req.flash('error', 'Error occurred'))
            } else if (user) {
                return done(null, false,
                    req.flash('error', 'Username already exists'))
            } else if (req.body.password2 != password) {
                return done(null, false,
                    req.flash('error', 'Passwords don\'t match'))
            } else {
                var new_user = new User({
                    username: username,
                    password: password,
                    email: req.body.email,
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                })
                if (new_user.validatePassword()) {
                    new_user.save(function(err) {
                        if (err) {
                            return done(err, false,
                                req.flash('error', 'Error occurred'))
                        }
                        else {
                            return done(null, user,
                                req.flash('msg', 'Success'))
                        }
                    })
                } else {
                    return done(null, false,
                        req.flash('error', 'Invalid password'))
                }
            }
        })
}))

//Routing
app.use('/', root);
app.use('/room', room)
app.use('/dashboard', dashboard)

app.use(function(req, res, next) {
    "use strict";
    res.locals.err_msg = req.flash('err_msg')
    next()
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

 //development error handler
 //will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

//Mongoose
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/test', function(err) {
    if (err) throw err
    //Room.findOrCreate({
    //    path: 'hello',
    //    name: 'MyRoom',
    //    desc: 'test'
    //}, (err, room, created) => {
    //    User.findOrCreate({
    //        username: 'Arthelon',
    //        password: '123456789',
    //        email: 'hsing.daniel@gmail.com',
    //        first_name: 'Daniel',
    //        last_name: 'Hsing',
    //        rooms: [room._id]
    //    }, (err, doc, created) => {
    //        if (err) throw err
    //    })
    //})
})

module.exports = app;
