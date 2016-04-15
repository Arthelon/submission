var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');

//routes
var routes = require('./routes')

//JWT setup
var jwt = require('jsonwebtoken')
var expressJwt = require('express-jwt')
var token = expressJwt({secret: 'dev_secret'})

//Passport setup
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

//Mongoose
var mongoose = require('mongoose')
var models = require('./models')

//Misc
var cors = require('cors')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/api', token.unless({path: ['/api/login']}))
app.use(expressSession({secret: 'dev_session', resave: 'false', saveUninitialized: 'false'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')))
app.use(cors())

//Models
var User = models.User
var Room = models.Room

var handleResp = require('./util').handleResp

//Passport setup
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return handleResp(res, 400, {error: err.message}) }
            if (!user) { return handleResp(res, 404, {error: 'User not found'}) }
            if (!user.verifyPassword(password)) { return handleResp(res, 401, {error: 'Invalid password'}) }
            return done(null, user);
        });
    }
));

//Routing
var dashboard = require('./routes/dashboard')
var problem = require('./routes/problem')
var index = require('./routes/index')
var room = require('./routes/room')

app.use('/dashboard', dashboard)
app.use('/problem', problem)
app.use('/room', room)

//API Routes
var apiRegister = require('./routes/api/register')
var apiLogin = require('./routes/api/login')
var apiRooms = require('./routes/api/rooms')
var apiSubmissions = require('./routes/api/submissions')
var apiProblems = require('./routes/api/problems')
var apiSub = require('./routes/api/sub')

app.use('/api/register', apiRegister)
app.use('/api/login', apiLogin)
app.use('/api/rooms', apiRooms)
app.use('/api/submissions', apiSubmissions)
app.use('/api/problems', apiProblems)
app.use('/api/sub', apiSub)

//Fallback Route
app.use('/', index)

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
