var mongoose = require('mongoose')
var Schema = mongoose.Schema
var findOrCreate = require('mongoose-findorcreate')

var models = {}

var SubmissionSchema = new Schema({
    timestamp: {type: Date, default: Date.now},
    name: String,
    desc: String,
    user: {type: String, require: true},
    file: {type: Buffer, required: true}
})

var RoomSchema = new Schema({
    _id: {type: String, required:true, unique: true},
    name: {type: String, required:true},
    desc: String,
    submissions: [
        {type: Schema.Types.ObjectId, ref: 'Submission'}
    ]
})

var UserSchema = new Schema({
    username: {type:String, unique: true, required: true},
    password: {type:String, required: true},
    first_name: {type:String, required: true},
    last_name: {type:String, required: true},
    email: {type:String, unique: true, required: true},
    rooms: [
        {type: Schema.Types.ObjectId, ref: 'Room'}
    ]
})
UserSchema.methods.verifyPassword = function (password) {
    "use strict";
    return this.password == password;

}
UserSchema.methods.validatePassword = function() {
    return !!this.password.match(/^[\d\w]{8,}$/);
}
UserSchema.plugin(findOrCreate)

models.Submission = mongoose.model('Submission', SubmissionSchema)
models.Room = mongoose.model('Room', RoomSchema)
models.User = mongoose.model('User', UserSchema)

module.exports = models