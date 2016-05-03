angular.module('controllers.student', [])
    .controller('StudentCtrl', function($scope, $http, $location) {
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length-3]
        $scope.student_id = loc[loc.length-1]
        $scope.student = $scope.success = $scope.error = null
        
        $scope.selectedTab = 'submissions'

        $scope.loadStudent = function() {
            $http.get('/api/students/'+$scope.student_id, {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function(succ) {
                console.log(succ.data)
                $scope.student = succ.data.student
            }, function(err) {
                $scope.error = err.error
            })
        }
        //Init Fn
        $scope.loadStudent()
    })