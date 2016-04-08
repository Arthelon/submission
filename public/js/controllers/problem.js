angular.module('app.problem', [])
    .controller('problem', ['$scope', '$http', '$location', function($scope, $http, $location) {
        $scope.toggle = true
        $scope.toggleForm = false
        $scope.loadPath = function() {
            var loc = $location.absUrl().split('/')
            $scope.room_path = loc[loc.length-2]
            $scope.prob_name = loc[loc.length-1]
        }
        $scope.loadData = function() {
            if (!$scope.hasOwnProperty('problems')) {
                $http.get('/api/problems', {
                    params: {
                        room_path: $scope.room_path,
                        problem: $scope.prob_name
                    }
                }).then(function(res) {
                    $scope.success = res.data.success
                    $scope.problems = res.data.problems
                    $scope.submissions = res.data.submissions
                    $scope.tests = res.data.tests
                    $scope.desc = res.data.prob_desc
                    console.log(res.data)
                }, function(err) {
                    $scope.error = err.data.error
                    console.log(err)
                })
            }
        }
        $scope.removeSubmission = function(index) {

        }
        $scope.removeTest = function(id) {

        }
    }])
    .controller('FormControl', ['$scope', '$http', function($scope, $http) {

    }])