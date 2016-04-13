angular.module('app.register', [])
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