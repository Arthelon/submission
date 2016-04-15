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
    .controller('IndexCtrl', function(){})
