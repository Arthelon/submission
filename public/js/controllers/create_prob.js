angular.module('app.createProb', [])
    .controller('create_prob', ['$scope', '$http', '$location', function($scope, $http, $location) {
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
