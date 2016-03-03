var mongoose = require('mongoose')
var findOrCreate = require('mongoose-findorcreate')

var models = {}

var UserSchema = new mongoose.Schema({
    username: {type:String, unique: true, required: true},
    password: {type:String, required: true},
    first_name: {type:String, required: true},
    last_name: {type:String, required: true},
    email: {type:String, unique: true, required: true}
})
UserSchema.methods.verifyPassword = function (password) {
    "use strict";
    return this.password == password;

}
UserSchema.methods.validatePassword = function() {
    return !!this.password.match(/^[\d\w]{8,}$/);

}
UserSchema.plugin(findOrCreate)
models.User = mongoose.model('User', UserSchema)
module.exports = models