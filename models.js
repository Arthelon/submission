var mongoose = require('mongoose')
var schema = mongoose.Schema

var UserSchema = new schema({
    username: String,
    password: String,
    email: String
})

mongoose.model('User', UserSchema)