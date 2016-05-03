var chai = require('chai')
var assert = chai.assert
var sinon = require('sinon')

var util = require('../util')
var mongoose = require('mongoose')
var models = require('../models')

var Room = models.Room
var User = models.User

var handleResp = util.handleResp
var validateRoom = util.validateRoom
var validateBody = util.validateBody


describe('util', function() {
    before(function() {
        mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/random', function (err) {
            if (err) throw err
        })
    })

    describe('#handleResp()', function() {
        var res = {
            json: sinon.spy(),
            status: sinon.spy(),
            end: function(){}
        }
        handleResp(res, 200, 'Hello')
        it('should convert data argument into JSON object and send it in the response', function() {
            assert.isTrue(res.json.calledWith({error: 'Hello'}))
        })
        it('should send the correct HTTP status code based on passed arguments', function() {
            assert.isTrue(res.status.calledWith(200), 'Called with the correct HTTP status code argument')
        })
    })
    describe('#validateRoom()', function() {
        var room_user;
        //Hooks
        before(function() {
            User.create({
                username: 'test_user',
                email: 'test@randomdomain.com',
                password: '123456789',
                first_name: 'test_first',
                last_name: 'test_last'
            }, function(err, user) {
                if (err) throw err
                else {
                    room_user = user
                    Room.create({
                        name: 'TestRoom',
                        path: 'test_path',
                        desc: 'room for tests',
                        owner: user
                    }, function(err) {
                        if (err) throw err
                    })
                }
            })
        })
        after(function() {
            Room.findOneAndRemove({name: 'TestRoom'}, function(err) {
                if (err) throw err
            })
            User.findOneAndRemove({username: 'test_user'}, function(err) {
                if (err) throw err
            })
        })

        //Test Suites
        it('should pass 404 status code to response when invalid room name is entered', function(done) {
            var req, res, next
            req = next = {body:{}}
            res = {
                status: sinon.spy(),
                json: function(){},
                end: function(){}
            }
            req.body.room_path = 'random'
            validateRoom(req, res, next)
            setTimeout(function(){
                assert.isTrue(res.status.calledWith(404))
                done()
            }, 100)
        })
        it('should return with 406 status code to response when unauthorized user tries to access room', function(done) {
            var req, res, next
            req = {
                body: {room_path: 'test_path'},
                user: {_id: 'random_id'}
            }
            res = {
                status: sinon.spy(),
                json: function(){},
                end: function(){}
            }
            next = function(){}
            validateRoom(req, res, next)
            setTimeout(function(){
                assert.isTrue(res.status.calledWith(406))
                done()
            }, 100)
        })
        it('should call next callback function if room validation is successful', function(done) {
            var req, res, next
            next = sinon.spy()
            req = {
                body: {room_path: 'test_path'},
                user: room_user
            }
            res = {
                status: function(){},
                json: function(){},
                end: function(){}
            }
            validateRoom(req, res, next)
            setTimeout(function() {
                assert.isTrue(next.calledOnce)
                done()
            }, 100)
        })
    })
    describe('#validateBody()', function() {
        it('should return an express middleware function', function() {
            assert.typeOf(validateBody([]), 'function')
        })
        it('should send error to response if fields are not found on req.body object', function(done) {
            var req, res, next
            req = {
                body: {}
            }
            res = {
                status: sinon.spy(),
                json: function() {},
                end: function(){}
            }
            next = function(){}
            validateBody(['sample_field'])(req, res, next)
            assert.isTrue(res.status.calledWith(400))
            done()
        })
        it('should invoke next callback if fields are present', function(done) {
            var req, res, next
            req = {
                body: {
                    field1: '',
                    field2: ''
                }
            }
            res = {status:function() {}, json: function() {}, end: function() {}}
            next = sinon.spy()
            validateBody(['field1', 'field2'])(req, res, next)
            assert.isTrue(next.calledOnce)
            done()
        })
    })
})
