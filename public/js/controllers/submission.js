angular.module('controllers.submission', ['chart.js', 'vesparny.fancyModal'])
    .controller('SubmissionCtrl', function($scope, $http, $location, $fancyModal) {
        //Path variable init
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length-3]
        $scope.submission_id = loc[loc.length-1]
        $scope.emailMsg = ''

        $scope.success, $scope.error, $scope.submission, $scope.attempts = null
        $scope.chart = {
            data: [[]],
            labels: []
        }
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
                    $scope.chart.data[0].push(val.rating)
                    var date = new Date(val.timestamp)
                    $scope.chart.labels.push(date.getDay()+'/'+date.getMonth()+'/'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes())
                })
            }, function(err) {
                console.log(err.error)
                $scope.error= err.error
            })
        }
        $scope.sendMail = function() {
            // console.log(text)
            $http.post('/api/students/email/'+$scope.submission.student._id, {
                message: $scope.emailMsg,
                room_path: $scope.room_path
            }).then(function(succ) {
                $scope.emailMsg = ''
                console.log(succ.data)
                $scope.success = succ.data.success
            }, function(err) {
                $scope.error = err.error
                console.log(err.error)
            })
        }
        $scope.openEmailModal = function() {
            $fancyModal.open({
                template: `
                <div ng-controller="SubmissionCtrl">
                    <h3>Enter response message here</h3>
                    <textarea ng-model="emailMsg" id='emailContent'></textarea>
                    <button class="btn btn-info" ng-click="sendMail()">Submit Email</button>
                </div>`,
            })
        }
        //Init
        $scope.loadSubmission()
        $scope.loadAttempts()
    })
