angular.module('app.createProb', [])
    .controller('create_prob', ['$scope', '$http', '$location', function($scope, $http, $location) {
        $scope.form = {
            name: '',
            desc: ''
        }
        $scope.submit = function() {
            var loc = $location.absUrl().split('/')
            console.log(loc[loc.length-1])
            $http.post('/problem/'+loc[loc.length-1], $scope.form).then(function(res) {
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
