angular.module('rootApp.controllers', ['ngAnimate'])
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
    .controller('room', ['$scope', '$http', '$location', function($scope, $http, $location) {
        $scope.loadPath = function() {
            var loc = $location.absUrl().split('/')
            $scope.room_path = loc[loc.length-1]
        }
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
    }])
    .animation('.tableItem', [function() {
        return {
            enter: function(element, done) {
                element = jQuery(element)
                element.css({
                    opacity: 0
                })
                element.fadeIn(400, done)
            },
            leave: function(element, done) {
                element = jQuery(element)
                element.fadeOut(300, done)
            }
        }
    }])