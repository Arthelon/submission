angular.module('app.controllers', [])
    .controller('LoginCtrl', function($scope, $http, $window, $log) {
        $scope.user = {
            username: '',
            password: ''
        }
        $scope.login = function() {
            $http({
                method: 'post',
                url:'http://localhost:3000/login',
                data: $scope.user
            }).then(
                function(res) {
                    $log.log(res.data.token)
                    $window.localStorage.setItem('JWT', res.data.token)
                    $window.location = '/dashboard'
                },
                function(err) {
                    $scope.error = err.data.error
                }
            )
        }
    })
    .controller('CreateProbCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
        $scope.form = {
            name: '',
            desc: ''
        }
        $scope.submit = function() {
            var loc = $location.absUrl().split('/')
            $http.post('/api/problems', {
                room_path: loc[loc.length-1], //Room path
                name: $scope.form.name,
                desc: $scope.form.desc
            }).then(function(res) {
                $scope.success = res.data.success
                $scope.form = {
                    name: '',
                    desc: ''
                }
            }, function(err) {
                $scope.error = err.data.error
            })
        }
    }])
    .controller('CreateRoomCtrl', function($scope, $http, $log) {
        $scope.form = {}
        $scope.submit = function() {
            $http.post('/api/rooms' , $scope.form).then(function(res) {
                $scope.success = res.data.success || res.data
                $scope.form = {}
            }, function(err) {
                $scope.error = err.data.error || err.data
            })
        }
    })
    .controller('RegisterCtrl', function($scope, $http, $log) {
        $scope.form = {
            username: '',
            password: '',
            password2: '',
            first_name: '',
            last_name: '',
            email: ''
        }
        $scope.register = function() {
            if ($scope.form.password != $scope.form.password2) {
                $scope.error = 'Passwords do not match'
                $scope.form.password2 = ''
            } else {
                $http.post('/api/register', $scope.form).then(function(res) {
                    $scope.success = res.data.success
                    $scope.form = {}
                }, function(err) {
                    $log.log(err)
                    $scope.error = err.data.error
                })
            }
        }
    })
    .controller('LoginCtrl', function($scope, $http, $window, $log) {
        $scope.user = {
            username: '',
            password: ''
        }
        $scope.login = function() {
            $http({
                method: 'post',
                url:'http://localhost:3000/api/login',
                data: $scope.user
            }).then(
                function(res) {
                    $log.log(res.data)
                    $window.localStorage.setItem('JWT', res.data.token)
                    $window.location = '/dashboard'
                },
                function(err) {
                    $scope.error = err.data.error
                }
            )
        }
    })
