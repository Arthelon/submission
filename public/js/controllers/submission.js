angular.module('controllers.submission', ['chart.js', 'vesparny.fancyModal'])
    .controller('SubmissionCtrl', function ($scope, $http, $location, $fancyModal, $timeout) {
        //Path variable init
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length - 3]
        $scope.submission_id = loc[loc.length - 1]
        $scope.emailMsg = ''

        $scope.success, $scope.error, $scope.submission, $scope.attempts = null
        $scope.chart = {
            data: [[]],
            labels: []
        }
        $scope.selectedTab = 'info'

        $scope.loadSubmission = function () {
            $http.get('/api/submissions/' + $scope.submission_id, {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function (succ) {
                $scope.submission = succ.data.submission
                $scope.success = succ.data.success
            }, function (err) {
                console.log(err.error)
                $scope.error = err.error
            })
        }
        $scope.loadAttempts = function () {
            $http.get('/api/attempts/' + $scope.submission_id, {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function (succ) {
                $scope.attempts = _.orderBy(succ.data.attempts, ['timestamp'], ['desc'])
                $scope.success = succ.data.success

                _.forEach($scope.attempts, function (val) {
                    $scope.chart.data[0].push(val.rating)
                    var date = new Date(val.timestamp)
                    $scope.chart.labels.push(date.getDay() + '/' + date.getMonth() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes())
                })
            }, function (err) {
                console.log(err.error)
                $scope.error = err.error
            })
        }
        $scope.sendMail = function () {
            if (!$scope.emailMsg) {
                $scope.error = 'Please enter email content'
            } else {
                $http.post('/api/students/email/' + $scope.submission.student._id, {
                    message: $scope.emailMsg,
                    room_path: $scope.room_path
                }).then(function (succ) {
                    $scope.emailMsg = ''
                    console.log(succ.data)
                    $scope.error = ''
                    $scope.success = succ.data.success
                    $timeout($fancyModal.close, 2000)
                }, function (err) {
                    $scope.error = err.data.error
                    console.log(err.data.error)
                })
            }
        }
        $scope.openEmailModal = function () {
            $fancyModal.open({
                template: `
                <div ng-controller="SubmissionCtrl">
                    <h3>Enter response message here</h3>
                    <textarea id="emailContent" ng-model="emailMsg"></textarea>
                    <button ng-click="sendMail()" class="btn btn-info">Submit Email</button>
                    <div ng-if="error" class="alert alert-dismissible alert-danger">
                        <button type="button" data-dismiss="alert" class="close">×</button>
                        <p ng-bind="error"></p>
                    </div>
                    <div ng-if="success" class="alert alert-dismissible alert-success">
                        <button type="button" data-dismiss="alert" class="close">×</button>
                        <p ng-bind="success"></p>
                    </div>
                </div>
                `
            })
        }
        //Init
        $scope.loadSubmission()
        $scope.loadAttempts()
    })
