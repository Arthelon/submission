angular.module('rootApp.controllers', [])
    .controller('dashboard', ['$scope', function($scope) {
        $scope.removeItem = function() {

        }
        $scope.loadRooms = function() {
            $http.get('/api/rooms')
        }
        $scope.rooms =
    }])