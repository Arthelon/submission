angular.module('rootApp.controllers', ['rootApp.animations'])
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
        $scope.subToggle = true
        $scope.room_path
        $scope.loadSubmissions = function() {
            var loc = $location.absUrl().split('/')
            $scope.room_path = loc[loc.length-1]
            $http.get('/api/submissions', {
                data: {
                    room_path: $scope.room_path
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.success = res.data.success
            }, function(err) {
                $scope.error = err.data.error
                console.log(err)
            })
        }
        $scope.loadProblems = function() {
            $http.get('/api/problems', {
                data: {
                    room_path: $scope.room_path
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
        $scope.deleteSubmission = function(index) {

        }
    }])