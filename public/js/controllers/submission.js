angular.module('controllers.submission', [])
    .controller('SubmissionCtrl', function($scope, $http, $location) {
        //Path variable init
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length-3]
        $scope.submission_id = loc[loc.length-1]

        $scope.success, $scope.error, $scope.submission, $scope.attempts = null
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
                $scope.attempts = succ.data.attempts
                $scope.success = succ.data.success
            }, function(err) {
                console.log(err.error)
                $scope.error= err.error
            })
        }
        //Init
        $scope.loadSubmission()
        $scope.loadAttempts()
    })
    .directive('attemptgraph', function() {
        return {
            restrict: 'A',
            scope: {
                attempts: '=attempts'
            },
            link: function(scope, element) {
                scope.ctx = element[0].getContext('2d')
                var myChart = new Chart(scope.ctx, {
                    type: 'bar',
                    data: {
                        labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
                        datasets: [{
                            label: '# of Votes',
                            data: [12, 19, 3, 5, 2, 3]
                        }]
                    },
                    options: {
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero:true
                                }
                            }]
                        }
                    }
                });
            },
            controller: function() {
                
            }
        }
    })
