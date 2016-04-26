var mongoose = require('mongoose')
var Schema = mongoose.Schema
var findOrCreate = require('mongoose-findorcreate')
var emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
var fs = require('fs')
var async = require('async')


var SubmissionSchema = new Schema({
    timestamp: {type: Date, default: Date.now},
    name: {type: String, required: true, match: [/\w+/, 'Name can only include words']},
    desc: String,
    prob: {type: Schema.Types.ObjectId, ref: 'Problem'},
    room: {type: Schema.Types.ObjectId, ref: 'Room'},
    student: {type: Schema.Types.ObjectId, ref: 'Student'},
    files: [
        {type: Schema.Types.ObjectId, ref: 'File'}
    ]
})


var FileSchema = new Schema({
    name: String,
    type: String,
    loc: String,
    sub: {type: Schema.Types.ObjectId, ref: 'Submission'}
})

var StudentSchema = new Schema({
    name: {type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true, match: [emailRegex, '{VALUE} is not a valid email address']},
    submissions: [
        {type: Schema.Types.ObjectId, ref: 'Submission'}
    ]
})

var UserSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true, match: [/^[\d\w]{8,}$/, 'Password must be alphanumeric with at least 8 characters']},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    email: {type: String, unique: true, required: true, match: [emailRegex, '{VALUE} is not a valid email address']},
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
    ],
    problems: [
        {type: Schema.Types.ObjectId, ref: 'Problem'}
    ],
    students: [
        {type: Schema.Types.ObjectId, ref: 'Student'}
    ]
})

var ProblemSchema = new Schema({
    name: {type: String, required: true, unique: true},
    desc: {type: String, required: true},
    room: {type: Schema.Types.ObjectId, ref: 'Room'},
    test: {
        cases: [{
            in: {type: String, required: true},
            out: {type: String, required: true}
        }],
        matches: [{
            text: String
        }]
    },
    submissions: [
        {type: Schema.Types.ObjectId, ref: 'Submission'}
    ]
})

var AttemptSchema = new Schema({
    timestamp: {type: Date, default: Date.now},
    stacktrace: {type: String, required: true},
    status: {type: String, enum: ['FAILED', 'OK']}
})

//Model Hooks
ProblemSchema.pre('remove', function (next) {
    models.Submission.find({
        prob: this._id
    }, function (err, subs) {
        if (err) throw err
        else {
            subs.forEach(function (sub) {
                sub.update({
                    prob: null
                }, (err) => {
                    if (err) throw err
                })
            })
            next()
        }
    })
    models.Room.findOneAndUpdate({
        _id: this.room._id
    }, {
        $pull: {
            problems: this._id
        }
    }, (err) => {
        if (err) throw err
    })
})

SubmissionSchema.pre('remove', function (next) {
    sub = this
    models.Submission
        .findOne({
            _id: this._id
        })
        .populate('files')
        .populate({
            path: 'student',
            populate: {
                path: 'submissions',
                model: 'Submission'
            }
        })
        .exec(function(err, submission) {
            if (err) throw err
            else if (!submission) throw new Error('Submission not found')
            else {
                //Pulls submission from student submission array
                submission.student.submissions.pull({
                    _id: submission._id
                })
                //Removes all files associated with submission
                async.each(submission.files, function (file, cb) {
                    file.remove((err) => {
                        if (err) cb(err)
                        else cb()
                    })
                }, function (err) {
                    if (err) throw err
                })
            }
        })
    models.Room.findOneAndUpdate({_id: sub.room}, {
        $pull: {
            submissions: sub._id
        }
    }, function (err, room) {
        if (err) throw err
        if (!room) throw new Error('Room not found')
        models.Problem.findOneAndUpdate({_id: sub.prob}, {
            $pull: {
                submissions: sub._id
            }
        }, (err) => {
            if (err) throw err
            else next()
        })
    })
})

RoomSchema.pre('remove', function (next) {
    var Room = this
    models.User.findOneAndUpdate({_id: this.owner}, {
        $pull: {
            rooms: this._id
        }
    }, (err, user) => {
        if (err) throw err
        else if (!user) throw new Error('User not found')
        else {
            Room.problems.forEach(function (prob) {
                models.Problem.findOneAndRemove({_id: prob}, (err) => {
                    if (err) throw err
                })
                Room.submissions.forEach(function (sub) {
                    models.Submission.findOneAndRemove({_id: sub}, (err) => {
                        if (err) throw err
                    })
                })
            })
            next()
        }
    })
})

FileSchema.pre('remove', function(next) {
    fs.unlink('uploads/' + this.loc, (err) => {
        if (err) throw err
        else next()
    })
})


//Validation


//Other Methods
RoomSchema.methods.verifyID = function (id) {
    this.findById(id, function (err, found) {
        if (err) throw err
        return !found
    })
}

UserSchema.methods = {
    verifyPassword: function (password) {
        return this.password == password;
    }
}

// StudentSchema.methods =  {
//     compareNames: function(name1, name2) {
//         if (name1.toLowerCase().trim() == name2.toLowerCase().trim()) {
//             return true
//         }
//         return false
//     }
// }


//Plugins
UserSchema.plugin(findOrCreate)
RoomSchema.plugin(findOrCreate)
ProblemSchema.plugin(findOrCreate)
SubmissionSchema.plugin(findOrCreate)
StudentSchema.plugin(findOrCreate)

var models = {}

models.File = mongoose.model('File', FileSchema)
models.Submission = mongoose.model('Submission', SubmissionSchema)
models.Room = mongoose.model('Room', RoomSchema)
models.User = mongoose.model('User', UserSchema)
models.Problem = mongoose.model('Problem', ProblemSchema)
models.Student = mongoose.model('Student', StudentSchema)
models.Atttempt = mongoose.model('Attempt', AttemptSchema)

module.exports = models