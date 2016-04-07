angular.module('rootApp.controllers', ['ngAnimate', 'rootApp.services', 'ui.ace'])
    .controller('dashboard', ['$scope', '$http', function($scope, $http) {
        $scope.loadRooms = function() {
            $http.get('/api/rooms').then(function(res) {
                $scope.rooms = res.data.rooms
            }, function(err) {
                $scope.error = err.data.error
            })
        }
        $scope.removeRoom = function(index) {
            $http.delete('/api/rooms', {
                data: {
                    room_path: $scope.rooms[index].path
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.success = res.data.success
                $scope.rooms.splice(index, 1)
            }, function(err) {
                $scope.error = err.data.error
                console.log(err)
            })
        }
    }])
    .controller('room', ['$scope', '$http', '$location', 'loadName', function($scope, $http, $location, loadName) {
        $scope.loadPath = function() {
            $scope.room_path = loadName.getBase($location)
        }
        $scope.error = null
        $scope.success = null
        $scope.subToggle = true
        $scope.room_path = null
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
                $scope.error = err.data.error
            })

        }
        $scope.removeProblem = function(index) {
            $http.delete('/api/problems', {
                data: {
                    room_path: $scope.room_path,
                    submission: $scope.problems[index].name
                },
                headers: {
                    'Content-Type': 'application/json'
                }
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
    .controller('FormControl', ['$scope', '$http', function($scope, $http) {
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
                $http.post('/room/'+$scope.room_path, fd, {
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