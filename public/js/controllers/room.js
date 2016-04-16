angular.module('controllers.room', ['ngAnimate', 'app.services', 'ui.ace'])
    .controller('RoomCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
        $scope.room_path = null
        $scope.error = null
        $scope.success = null
        $scope.subToggle = true
        $scope.room_path = null
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
                $scope.success = res.data.success
                $scope.submissions = res.data.submissions
            }, function(err) {
                $scope.error = err.data.error
                console.log(err)
            })
        }
        $scope.loadProblems = function() {
            if (!$scope.hasOwnProperty('problems')) {
                $http.get('/api/problems', {
                    params: {
                        room_path: $scope.room_path
                    }
                }).then(function(res) {
                    $scope.success = res.data.success
                    $scope.problems = res.data.problems
                    console.log(res.data)
                }, function(err) {
                    $scope.error = err.data.error
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
                $scope.success = res.data.success
                $scope.submissions.splice(index, 1)
            }, function(err) {
                $scope.error = err.data.error || err.error
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
                $scope.success = res.data.success
                $scope.problems.splice(index, 1)
            }, function(err) {
                $scope.error = err.data.error || err.error
            })
        }
        $scope.setSuccess = function(msg) {
            $scope.success = msg
        }
        $scope.setError = function(msg) {
            $scope.error = msg
        }
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
        .controller('RoomFormControl', ['$scope', '$http', function($scope, $http) {
            var fillerText = '# Enter code here'
            var defaultForm = {
                name: '',
                user: '',
                prob: 'None',
                desc: ''
            }
            $scope.form = jQuery.extend({}, defaultForm)
            $scope.editor = fillerText
            $scope.submit = function() {
                if ($scope.editor != fillerText && $scope.file) {
                    $scope.error = 'Can\'t accept submissions from both file(s) and text editor'
                } else if ($scope.editor == fillerText && !$scope.file) {
                    $scope.error = 'Please submit data'
                } else {
                    var fd = new FormData();
                    for (var key in $scope.form) {
                        if (!$scope.form.hasOwnProperty(key))
                            continue
                        else {
                            fd.append(key, $scope.form[key])
                        }
                    }
                    if ($scope.file)
                        fd.append('file', $scope.file);
                    else {
                        var editor_file = new Blob([$scope.editor], {type: 'text/x-script.python'})
                        fd.append('file', editor_file, $scope.form.name+'.py')
                    }
                    fd.append('room_path', $scope.room_path)
                    $http.post('/api/submissions/', fd, {
                            transformRequest: angular.identity,
                            headers: {'Content-Type': undefined}
                        })
                        .success(function(res){
                            console.log(res)
                            $scope.setSuccess(res.success)
                            $scope.form = jQuery.extend({}, defaultForm)
                            $scope.editor = fillerText
                        })
                        .error(function(err){
                            console.log(err)
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