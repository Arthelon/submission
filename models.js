var mongoose = require('mongoose')
var Schema = mongoose.Schema
var findOrCreate = require('mongoose-findorcreate')

var SubmissionSchema = new Schema({
    timestamp: {type: Date, default: Date.now},
    name: {type: String, required: true, unique: true},
    desc: String,
    files: [
        {type: Schema.Types.ObjectId, ref: 'File'}
    ]
})

var FileSchema = new Schema({
    name: String,
    type: String,
    loc: String
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

var RoomSchema = new Schema({
    path: {type: String, required: true, unique: true},
    name: {type: String, required: true, unique: true},
    desc: String,
    owner: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    submissions: [
        {type: Schema.Types.ObjectId, ref: 'Submission'}
    ]
})
RoomSchema.methods.verifyID = function(id) {
    this.findById(id, function(err, found) {
        if (err) throw err
        return !found
    })
}


var models = {}

UserSchema.methods.verifyPassword = function (password) {
    "use strict";
    return this.password == password;

}
UserSchema.methods.validatePassword = function() {
    return !!this.password.match(/^[\d\w]{8,}$/);
}

//Plugins
UserSchema.plugin(findOrCreate)
RoomSchema.plugin(findOrCreate)

models.File = mongoose.model('File', FileSchema)
models.Submission = mongoose.model('Submission', SubmissionSchema)
models.Room = mongoose.model('Room', RoomSchema)
models.User = mongoose.model('User', UserSchema)

module.exports = models