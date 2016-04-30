angular.module('controllers.submission', ['chart.js'])
    .controller('SubmissionCtrl', function($scope, $http, $location) {
        //Path variable init
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length-3]
        $scope.submission_id = loc[loc.length-1]

        $scope.success, $scope.error, $scope.submission, $scope.attempts = null
        $scope.chart_data = [[]]
        $scope.chart_labels = []
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
        $scope.loadAttempts = function() {
            $http.get('/api/attempts/'+$scope.submission_id, {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function(succ) {
                $scope.attempts = _.orderBy(succ.data.attempts, ['timestamp'], ['desc'])
                $scope.success = succ.data.success

                _.forEach($scope.attempts, function(val) {
                    $scope.chart_data[0].push(val.rating)
                    $scope.chart_labels.push(val.timestamp)
                    console.log($scope.chart_data, $scope.chart_labels)
                })
            }, function(err) {
                console.log(err.error)
                $scope.error= err.error
            })
        }
        //Init
        $scope.loadSubmission()
        $scope.loadAttempts()
    })
