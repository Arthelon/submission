var mongoose = require('mongoose')

var models = {}

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
})
UserSchema.methods.verifyPassword = function (password) {
    "use strict";
    if (this.password == password) {
        return true
    }
    return false
}
models.User = mongoose.model('User', UserSchema)
module.exports = models