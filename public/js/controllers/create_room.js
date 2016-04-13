angular.module('app.createRoom', [])
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
