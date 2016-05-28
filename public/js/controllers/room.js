angular.module('controllers.room', ['ngAnimate', 'app.services', 'ui.ace'])
    .controller('RoomCtrl', ['$scope', '$http', '$location', function($scope, $http, $location, $log) {
        $scope.room_path, $scope.room_path, $scope.students, $scope.problems = null
        $scope.selectedTab = 'submissions'
        $scope.msg = {
            success: null,
            error: null
        }


        $scope.loadPath = function() {
            var loc = $location.absUrl().split('/')
            $scope.room_path = loc[loc.length-1]
        }
        $scope.loadSubmissions = function() {
            $http.get('/api/submissions', {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function(res) {
                $scope.setSuccess(res.data.success)
                $scope.submissions = res.data.submissions
            }, function(err) {
                $scope.setError(err.data.error)
                console.log(err)
            })
        }
        $scope.loadStudents = function() {
            $http.get('/api/students/room/'+$scope.room_path).then(function(succ) {
                $scope.setSuccess(succ.data.success)
                $scope.students = succ.data.students
                console.log(succ.data)
            }, function(err) {
                $scope.setError(err.error)
            })
        }
        $scope.loadProblems = function() {
            if (!$scope.problems) {
                $http.get('/api/problems', {
                    params: {
                        room_path: $scope.room_path
                    }
                }).then(function(res) {
                    $scope.setSuccess(res.data.success)
                    $scope.problems = res.data.problems
                    console.log(res.data)
                }, function(err) {
                    $scope.setError(err.data.error)
                    console.log(err)
                })
            }
        }
        $scope.removeSubmission = function(index) {
            $http.delete('/api/submissions', {
                data: {
                    submission: $scope.submissions[index].name,
                    room_path: $scope.room_path
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.setSuccess(res.data.success)
                $scope.submissions.splice(index, 1)
            }, function(err) {
                $scope.setError(err.data.error)
            })

        }
        $scope.removeProblem = function(index) {
            $http.delete('/api/problems/'+$scope.problems[index].name, {
                data: {
                    room_path: $scope.room_path,
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.setSuccess(res.data.success)
                $scope.problems.splice(index, 1)
            }, function(err) {
                $scope.setError(err.data.error)
            })
        }
        $scope.setSuccess = function(msg) {
            $scope.msg.error = null;
            $scope.msg.success = msg
        }
        $scope.setError = function(msg) {
            $scope.msg.error = msg
        }
        $scope.setStack = function(stack) {
            $scope.stack = stack
        }
        //Init Fns
        $scope.loadPath()
    }])
    .animation('.tableItem', [function() {
        return {
            enter: function(element, done) {
                var $element = $(element)
                $element.css({
                    opacity: 0
                })
                $element.fadeIn(400, done)
            },
            leave: function(element, done) {
                var $element = $(element)
                $element.fadeOut(300, done)
            }
        }
    }])
    .controller('RoomFormControl', ['$scope', '$http', '$window', function($scope, $http, $window) {
        hljs.initHighlightingOnLoad(); //HighlightJS initialization
        $scope.loadProblems()
        var fillerText = '# Enter code here'
        var defaultForm = {
            name: '',
            user: '',
            prob: 'None',
            desc: '',
            email: ''
        }
        $scope.form = jQuery.extend({}, defaultForm)
        $scope.editor = fillerText
        $scope.clearAttempts = function() {
            $window.localStorage.setItem('attempts', null)
        }
        $scope.submit = function() {
            if ($scope.editor != fillerText && $scope.file) {
                $scope.error = 'Can\'t accept submissions from both file(s) and text editor'
            } else if ($scope.editor == fillerText && !$scope.file) {
                $scope.error = 'Please submit data'
            } else {
                var fd = new FormData()
                for (var key in $scope.form) {
                    if ($scope.form.hasOwnProperty(key))
                        fd.append(key, $scope.form[key])
                }
                if ($window.localStorage.getItem('attempts')) {
                    fd.append('attempts', $window.localStorage.getItem('attempts'))
                }
                if ($scope.file)
                    fd.append('file', $scope.file);
                else {
                    var editor_file = new Blob([$scope.editor], {type: 'text/x-script.python'})
                    fd.append('file', editor_file, $scope.form.name + '.py')
                }
                fd.append('room_path', $scope.room_path)
                $http.post('/api/submissions', fd, {
                        transformRequest: angular.identity,
                        headers: {'Content-Type': undefined}
                    })
                    .then(function (res) {
                        console.log(res)
                        $scope.setSuccess(res.data.success)
                        $window.localStorage.setItem('attempts', null)
                        $scope.form = jQuery.extend({}, defaultForm)
                        $scope.editor = fillerText
                        fd = new FormData()
                    }, function (err) {
                        console.log(err)
                        if (err.data.stack) {
                            $scope.setStack(err.data.stack)
                        }
                        if (err.data.attempt) {
                            var attempts = JSON.parse($window.localStorage.getItem('attempts')) || []
                            attempts.push(err.data.attempt)
                            $window.localStorage.setItem('attempts', JSON.stringify(attempts))
                            console.log(attempts)
                        }
                        $scope.setError(err.data.error)
                    });
                }
            }
        }])
    .directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                var model = $parse(attrs.fileModel);
                var modelSetter = model.assign;
                element.bind('change', function(){
                    scope.$apply(function(){
                        modelSetter(scope, element[0].files[0]);
                    });
                });
            }
        };
    }]);
