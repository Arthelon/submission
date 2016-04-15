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