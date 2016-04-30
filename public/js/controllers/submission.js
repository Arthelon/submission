angular.module('controllers.submission', [])
    .controller('SubmissionCtrl', function($scope, $http, $location) {
        //Path variable init
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length-3]
        $scope.submission_id = loc[loc.length-1]

        $scope.success, $scope.error, $scope.submission = null
        $scope.selectedTab = 'info'

        $scope.loadSubmission = function() {
            $http.get('/api/submissions/'+$scope.submission_id, {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function(succ) {
                $scope.submission = succ.data.submission
                $scope.success = succ.data.success
            }, function(err) {
                console.log(err.error)
                $scope.error= err.error
            })
        }
        //Init
        $scope.loadSubmission()
    })