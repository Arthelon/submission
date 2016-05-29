var mongoose = require('mongoose')
var Schema = mongoose.Schema
var findOrCreate = require('mongoose-findorcreate')
var emailRegex = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
var fs = require('fs')
var async = require('async')
var PythonShell = require('python-shell')


var SubmissionSchema = new Schema({
    timestamp: {type: Number, default: new Date().getTime()},
    name: {type: String, required: true, match: [/\w+/, 'Name can only include words']},
    desc: String,
    prob: {type: Schema.Types.ObjectId, ref: 'Problem'},
    room: {type: Schema.Types.ObjectId, ref: 'Room'},
    student: {type: Schema.Types.ObjectId, ref: 'Student'},
    files: [
        {type: Schema.Types.ObjectId, ref: 'File'}
    ],
    attempts: [
        {type: Schema.Types.ObjectId, ref: 'Attempt'}
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
    email: {type: String, unique: true, required: true,  match: [emailRegex, '{VALUE} is not a valid email address']},
    submissions: [
        {type: Schema.Types.ObjectId, ref: 'Submission'}
    ]
})

var UserSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true, match: [/^[\d\w]{8,}$/, 'Password must be alphanumeric with at least 8 characters']},
    refresh_token: {type: String, unique: true},
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
    timestamp: {type: Number, default: new Date().getTime()},
    stack: {type: String},
    status: {type: String, enum: ['FAILED', 'OK'], required: true},
    rating: {type: Number, min: 0, max: 5, required: true}
})

//Model Hooks
ProblemSchema.pre('remove', function (next) {
    models.Submission.find({
        prob: this._id
    }, function (err, subs) {
        if (err) throw err
        else {
            //Removes problem reference from all submissions associated with this problem
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
    //Pulls problem reference from parent room document
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
        .populate('attempts')
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
                //Remove all submission attempts
                submission.attempts.forEach(attempt => {
                    attempt.remove((err) => {
                        if (err) throw err
                    })
                })
            }
        })
    //Removes submission reference from parent Room document
    models.Room.findOneAndUpdate({_id: sub.room}, {
        $pull: {
            submissions: sub._id
        }
    }, function (err, room) {
        if (err) throw err
        else if (!room) throw new Error('Room not found')
        if (sub.prob) { //If submission references a problem document
            models.Problem.findOneAndUpdate({_id: sub.prob}, {
                $pull: {
                    submissions: sub._id
                }
            }, (err) => {
                if (err) throw err
                else next()
            })
        } else {
            next()
        }
    })
})

RoomSchema.pre('remove', function (next) {
    var Room = this
    models.User.findOneAndUpdate({_id: this.owner}, { //Pulls room reference from room owner
        $pull: {
            rooms: this._id
        }
    }, (err, user) => {
        if (err) throw err
        else if (!user) throw new Error('User not found')
        else {
            Room.problems.forEach(function (prob) {
                //Removes all problems that fall under the room
                models.Problem.findOneAndRemove({_id: prob}, (err) => {
                    if (err) throw err
                })
                //Removes all submission that are part of the room
                Room.submissions.forEach(function (sub) {
                    models.Submission.findOneAndRemove({_id: sub}, (err) => {
                        if (err) throw err
                    })
                    // sub.remove()
                })
            })
            next()
        }
    })
})


FileSchema.pre('remove', function(next) {
    //Removes server-side file associated with the File document
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

StudentSchema.statics = {
    getStudent: function (name, email) {
        var formattedName = name.toLowerCase().trim()
        var defaultStudent = new models.Student({
            name: name,
            email: email
        })
        return new Promise((resolve, reject) => {
            models.Student.findOne({email: email}, (err, student) => {
                if (err) reject(err.message)
                else if (student) { //If Student found
                    resolve(student)
                } else {
                    //Find by formatted name (lower-case, trimmed)
                    models.Student.find({name: {$regex: new RegExp("^" + formattedName, "i")}}, (err, students) => {
                        if (err) reject(err.message)
                        else if (students.length == 1) { //Only one student document found
                            resolve(students[0])
                        } else if (students.length > 1) {  //If multiple documents found
                            models.Student.getClosestMatch(email, students).then(function (student) {
                                resolve(student)
                            }, () => {
                                var name_parts = formattedName.split(' ')
                                if (name_parts.length > 1) {
                                    name_parts.forEach((word) => {

                                    })
                                } else {
                                    resolve(defaultStudent)
                                }
                            })
                        } else {
                            resolve(defaultStudent)
                        }
                    })
                }
            })
        })
    },
    getClosestMatch: function (email, list) {
        var DIFFERENCE_THRESHOLD = 4
        var matchList = []
        return new Promise((resolve, reject) => {
            list.forEach((student) => {
                var diffCount = getDifference(email, student.email)
                if (diffCount <= DIFFERENCE_THRESHOLD) {
                    matchList.append({count: diffCount, student: student})
                }
            }, () => {
                if (matchList.length == 0) {
                    reject()
                } else {
                    var min
                    for (var i in matchList) {
                        if (!min || matchList[i].count < matchList[min].count) {
                            min = i
                        }
                    }
                    return matchList[min].student
                }
            })
        })
    }
}

function getDifference(first, second) {
    var i = 0;
    var j = 0;
    var result = 0;

    while (j < b.length) {
        if (first[i] != second[j] || i == first.length)
            result ++;
        else
            i++;
        j++;
    }
    return result;
}

ProblemSchema.methods = {
    /**
     * Functions that run problem tests against a list of files
     *
     * @param{File[]} files List of File mongoose documents
     * @returns {Promise} Returns true if tests succeed, otherwise an error
     */
    runTest: function(files) {
        var prob = this
        return new Promise((resolve, reject) => {
            files.forEach((file, findex) => {
                fs.readFile(file.path, 'utf8', function (err, data) {
                    if (err || !data) reject({error: 'File not found', rating: 5})
                    else async.each(prob.test.matches, function (match, cb) {
                        if (data.search(new RegExp(match.text)) == -1) {
                            return reject({error: 'Failed match. \"' + match.text + '\" not found.', rating: 1})
                        }
                        else cb()
                    }, (err) => {
                        if (err) reject({error: err.message, rating: 3})
                        // If no I/O cases are found
                        else if (prob.test.cases.length == 0) {
                            PythonShell.run(file.path, function (err) {
                                if (err) reject({stack: err.stack, rating: 3})
                                else resolve()
                            })
                        } else {
                            prob.test.cases.forEach(function (c, index) {
                                var outputSeen = false
                                var pyshell = new PythonShell(file.path, {mode: 'text'})
                                pyshell.send("\'" + c.in + "\'")
                                pyshell.on('message', function (data) {
                                    outputSeen = true
                                    if (data != c.out) {
                                        return reject({error: 'Failed Test. \"' + data + '\" != ' + c.out, rating: 4})
                                    }
                                })
                                pyshell.end(function (err) {
                                    if (err) {
                                        reject({stack: err.stack, rating: 3})
                                    } else if (!outputSeen) {
                                        reject({error: 'No program output!', rating: 2})
                                    } if (findex + 1 == files.length && index + 1 == prob.test.cases.length) {
                                        resolve()
                                    }
                                })
                            })
                        }
                    })
                })
            })
        })
    }

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
models.Attempt = mongoose.model('Attempt', AttemptSchema)

module.exports = models