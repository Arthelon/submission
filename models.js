var mongoose = require('mongoose')
var Schema = mongoose.Schema
var findOrCreate = require('mongoose-findorcreate')

//Model Schemas
// var SubmissionSchema = new Schema({
//     timestamp: {type: Date, default: Date.now},
//     name: String,
//     desc: String,
//     user: {type: String, required: true},
//     prob: {type: Schema.Types.ObjectId, ref: 'Problem'},
//     room: {type: Schema.Types.ObjectId, ref: 'Room'},
//     files: [
//         {type: Schema.Types.ObjectId, ref: 'File'}
//     ]
// })

var SubmissionSchema = new Schema({
    timestamp: {type: Date, default: Date.now},
    name: {type: String, required: true},
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
    email: {type: String, unique: true, required: true},
    submissions: [
        {type: Schema.Types.ObjectId, ref: 'Submission'}
    ]
})

var UserSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    email: {type: String, unique: true, required: true},
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
})

SubmissionSchema.pre('remove', function (next) {
    sub = this
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
        }, (err, prob) => {
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

//Other Methods
RoomSchema.methods.verifyID = function (id) {
    this.findById(id, function (err, found) {
        if (err) throw err
        return !found
    })
}

UserSchema.methods.verifyPassword = function (password) {
    return this.password == password;

}
UserSchema.methods.validatePassword = function () {
    return !!this.password.match(/^[\d\w]{8,}$/);
}

StudentSchema.methods.compareNames = function(name1, name2) {
    
}


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