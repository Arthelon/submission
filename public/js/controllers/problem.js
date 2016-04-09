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
        $scope.removeTest = function(id, type) {
            $http.delete('/api/tests', {
                data: {
                    id: id,
                    problem: $scope.prob_name,
                    type: type
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.success = res.data.success
            }, function(err) {
                $scope.error = err.data.error
                console.log(err)
            })
        }
        $scope.setSuccess = function(msg) {
            $scope.success = msg
        }
        $scope.setError = function(msg) {
            $scope.error = msg
        }
    }])
    .controller('FormControl', ['$scope', '$http', function($scope, $http) {
        $scope.case = {
            in: '',
            out: ''
        }
        $scope.match = ''
        $scope.submitCase = function() {
            $http.post('/api/tests', {
                room_path: $scope.room_path,
                problem: $scope.prob_name,
                in: $scope.case.in,
                out: $scope.case.out
            }).then(function(res) {
                $scope.setSuccess(res.data.success)
                $scope.case = {in:'', out:''}
            }, function(err) {
                $scope.setError(err.data.error)
                console.log(err)
            })
        }
        $scope.submitMatch = function() {
            $http.post('/api/tests', {
                room_path: $scope.room_path,
                problem: $scope.prob_name,
                match: $scope.match
            }).then(function(res) {
                $scope.setSuccess(res.data.success)
                $scope.match = ''
            }, function(err) {
                $scope.setError(err.data.error)
                console.log(err)
            })
        }
    }])