angular.module('controllers.problem', [])
    .controller('ProblemCtrl', ['$scope', '$http', '$location', '$log', function($scope, $http, $location, $log) {
        $scope.toggle = true
        $scope.msg = {
            success: null,
            error: null
        }
        $scope.toggleForm = false
        $scope.loadPath = function() {
            var loc = $location.absUrl().split('/')
            $scope.room_path = loc[loc.length-2]
            $scope.prob_name = loc[loc.length-1]
        }
        $scope.loadData = function() {
            $log.log($scope.prob_name, $scope.room_path)
            if (!$scope.hasOwnProperty('problems')) {
                $http.get('/api/problems/'+$scope.prob_name, {
                    params: {
                        room_path: $scope.room_path
                    }
                }).then(function(res) {
                    $scope.problems = res.data.problems
                    $scope.submissions = res.data.submissions
                    $scope.tests = res.data.tests
                    $scope.desc = res.data.prob_desc
                }, function(err) {
                    console.log(err.data)
                })
            }
        }
        $scope.removeSubmission = function(index) {
            $http.delete('/api/submissions', {
                data: {
                    room_path: $scope.room_path,
                    submission: $scope.submissions[index].name
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.submissions.splice(index, 1)
            }, function(err) {
                console.log(err.data)
            })
        }
        $scope.removeTest = function(id, type, index) {
            $http.delete('/api/tests', {
                data: {
                    room_path: $scope.room_path,
                    id: id,
                    problem: $scope.prob_name,
                    type: type
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.tests[type].splice(index, 1)
            }, function(err) {
                console.log(err.data)
            })
        }
        $scope.setSuccess = function(msg) {
            $scope.msg.success = msg
        }
        $scope.setError = function(msg) {
            $scope.msg.error = msg
        }
        $scope.addCase = function(inp, out) {
            $scope.tests.cases.push({in: inp, out: out})
        }
        $scope.addMatch = function(match) {
            $scope.tests.matches.push(match)
        }
        $scope.loadPath()
        $scope.loadData()
    }])
    .controller('ProblemFormCtrl', ['$scope', '$http', '$log', function($scope, $http, $log) {
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
                // $scope.addCase($scope.case.in, $scope.case.out)
                $scope.case = {in:'', out:''}
            }, function(err) {
                $scope.setError(err.data.error)
                console.log(err.data)
            })
        }
        $scope.submitMatch = function() {
            $http.post('/api/tests', {
                room_path: $scope.room_path,
                problem: $scope.prob_name,
                match: $scope.match
            }).then(function(res) {
                $scope.setSuccess(res.data.success)
                // $scope.addMatch($scope.match)
                $scope.match = ''
            }, function(err) {
                $scope.setError(err.data.error)
                console.log(err)
            })
        }
    }])