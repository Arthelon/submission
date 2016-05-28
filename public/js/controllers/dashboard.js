angular.module('controllers.dashboard', [])
    .controller('DashCtrl', ['$scope', '$http', function($scope, $http) {
        $scope.loadRooms = function() {
            $http.get('/api/rooms').then(function(res) {
                $scope.rooms = res.data.rooms
            }, function(err) {
                console.log(err.data)
            })
        }
        $scope.removeRoom = function(index) {
            $http.delete('/api/rooms', {
                data: {
                    room_path: $scope.rooms[index].path
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.rooms.splice(index, 1)
            }, function(err) {
                console.log(err.data)
            })
        }

        $scope.loadRooms()
    }])
