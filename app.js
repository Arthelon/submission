var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//routes
var root = require('./routes/index');
var api = require('./routes/api');
var room = require('./routes/room');
var dashboard = require('./routes/dashboard')
var problem = require('./routes/problem')

//Authentication setup
var passport = require('passport');
var session = require('express-session');
var BasicStrategy = require('passport-http').BasicStrategy

//Mongoose
var mongoose = require('mongoose')
var models = require('./models')

//Misc
var flash = require('express-flash')
var handleResp = require('./util').handleResp

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({secret: 'mySecretKey', resave: false, saveUninitialized: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')))
app.use(flash())

//Passport and express-session
var User = models.User
var Room = models.Room
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function (user, done) {
    done(null, user._id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//Passport Strategies
passport.use('login', new BasicStrategy(
    function (username, password, done) {
        User.findOne({username: username},
            function (err, user) {
                if (err)
                    return done(err);
                else if (!user) {
                    return done(new Error('User not found'), false)
                }
                else if (!user.verifyPassword(password)) {
                    return done(new Error('Incorrect password'), false)
                }
                else {
                    return done(null, user);
                }
            }
        );
    }));

//Routing
app.use('/', root);
app.use('/room', room)
app.use('/dashboard', dashboard)
app.use('/problem', problem)
app.use('/api', api)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({error: err.message || 'Internal server error'})
    console.log(err.message)
});

//Mongoose
mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/test', function (err) {
    if (err) throw err
    // User.findOrCreate({
    //    username: 'Arthelon',
    //    password: '123456789',
    //    email: 'hsing.daniel@gmail.com',
    //    first_name: 'Daniel',
    //    last_name: 'Hsing',
    // }, (err, doc, created) => {
    //    if (err) throw err
    //    Room.findOrCreate({
    //        path: 'hello',
    //        name: 'MyRoom',
    //        desc: 'test',
    //        owner: doc._id
    //    }, (err, room, created) => {
    //        User.findOneAndUpdate({
    //            username: doc.username
    //        }, {
    //            $push: {
    //                rooms: room._id
    //            }
    //        }, (err) => {
    //            if (err) throw err
    //        })
    //    })
    // })
})

module.exports = app;
