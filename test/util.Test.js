var chai = require('chai')
var assert = chai.assert
var sinon = require('sinon')

var util = require('../util')
var mongoose = require('mongoose')
var models = require('../models')

var Room = models.Room

var handleResp = util.handleResp
var validateRoom = util.validateRoom


describe('util', function() {
    before(function() {
        mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/random', function (err) {
            if (err) throw err
        })
    })
        
    
    // after(function() {
    //     mongoose.connection.close()
    // })
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
        before(function() {
            Room.create({
                name: 'TestRoom',
                desc: 'room for tests'
            })
        })
        after(function() {
            Room.findOneAndRemove({name: 'TestRoom'}, function(err) {
                if (err) throw err
            })
        })
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
                assert.isTrue(res.status.calledOnce)
                done()
            }, 500)
        })
    })
})
