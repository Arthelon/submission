angular.module('rootApp.controllers', ['rootApp.animations'])
    .controller('dashboard', ['$scope', '$http', function($scope, $http) {
        $scope.loadRooms = function() {
            $http.get('/api/rooms').then(function(res) {
                $scope.rooms = res.data.rooms
            }, function(err) {
                $scope.error = err.data.error
            })
        }
        $scope.removeRoom = function(index) {
            $http.delete('/api/rooms', {
                data: {
                    room_name: $scope.rooms[index].name
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.success = res.data.success
                $scope.rooms.splice(index, 1)
            }, function(err) {
                $scope.error = err.data.error
                console.log(err)
            })
        }
    }])