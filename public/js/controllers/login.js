angular.module('app.login', [])
    .controller('LoginCtrl', function($scope, $http, $window) {
        $scope.user = {
            username: '',
            password: ''
        }
        $scope.login = function() {
            $http({
                method: 'post',
                url:'http://'+$scope.user.username+':'+$scope.user.password+'@localhost:3000/api/login',
                data: {}
            }).then(
                function() {
                    $window.location = '/dashboard'
                },
                function(err) {
                    $scope.error = err.data.error
                }
            )
        }
    })