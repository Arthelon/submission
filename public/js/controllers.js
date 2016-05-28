angular.module('app.controllers', ['angular-jwt'])
    .controller('CreateProbCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {
        $scope.msg = {
            success: null,
            error: null
        }
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
                $scope.msg.success = res.data.success
                $scope.form = {
                    name: '',
                    desc: ''
                }
            }, function(err) {
                $scope.msg.error = err.data.error
            })
        }
    }])
    .controller('CreateRoomCtrl', function($scope, $http) {
        $scope.msg = {
            success: null,
            error: null
        }
        $scope.form = {}
        $scope.submit = function() {
            $http.post('/api/rooms' , $scope.form).then(function(res) {
                $scope.msg.success = res.data.success
                $scope.form = {}
            }, function(err) {
                $scope.msg.error = err.data.error
            })
        }
    })
    .controller('RegisterCtrl', function($scope, $http, $log) {
        $scope.msg = {
            success: null,
            error: null
        }
        $scope.form = {
            username: '',
            password: '',
            password2: '',
            first_name: '',
            last_name: '',
            email: '',
            emailPass: ''
        }
        $scope.register = function() {
            if ($scope.form.password != $scope.form.password2) {
                $scope.msg.error = 'Passwords do not match'
                $scope.form.password2 = ''
            } else {
                $http.post('/api/users', $scope.form).then(function(res) {
                    $scope.msg.success = res.data.success
                    $scope.form = {}
                }, function(err) {
                    $log.log(err)
                    $scope.msg.error = err.data.error
                })
            }
        }
    })
    .controller('LoginCtrl', function($scope, $http, $window, jwtHelper) {
        $scope.user = {
            username: '',
            password: ''
        }
        $scope.msg = {
            success: null,
            error: null
        }
        $scope.login = function() {
            $http({
                method: 'post',
                url:'/api/login',
                data: $scope.user
            }).then(
                function(res) {
                    $window.localStorage.setItem('JWT', res.data.token)
                    $window.localStorage.setItem('user', JSON.stringify(jwtHelper.decodeToken(res.data.token)))
                    $http.post('/login', $scope.user).then(function(){
                        $window.location = '/dashboard'
                    }, function(err) {
                        $scope.msg.error = err.data.error
                    })
                },
                function(err) {
                    console.log(err)
                    $scope.msg.error = err.data.error
                }
            )
        }
    })
