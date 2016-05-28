angular.module('controllers.submission', ['chart.js', 'vesparny.fancyModal'])
    .controller('SubmissionCtrl', function ($scope, $http, $location, $fancyModal, $timeout) {
        //Path variable init
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length - 3]
        $scope.submission_id = loc[loc.length - 1]
        $scope.emailMsg = ''
        $scope.msg = {
            success: null,
            error: null
        }

        $scope.submission, $scope.attempts = null
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
            }, function (err) {
                console.log(err.data)
            })
        }
        $scope.loadAttempts = function () {
            $http.get('/api/attempts/' + $scope.submission_id, {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function (succ) {
                $scope.attempts = _.orderBy(succ.data.attempts, ['timestamp'], ['desc'])

                _.forEach($scope.attempts, function (val) {
                    $scope.chart.data[0].push(val.rating)
                    var date = new Date(val.timestamp)
                    $scope.chart.labels.push(date.getDay() + '/' + date.getMonth() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes())
                })
            }, function (err) {
                console.log(err.data)
            })
        }
        $scope.sendMail = function () {
            if (!$scope.emailMsg) {
                $scope.msg.error = 'Please enter email content'
            } else {
                $http.post('/api/students/email/' + $scope.submission.student._id, {
                    message: $scope.emailMsg,
                    room_path: $scope.room_path
                }).then(function (succ) {
                    $scope.emailMsg = ''
                    console.log(succ.data)
                    $scope.msg.error = null
                    $scope.msg.success = succ.data.success
                    $timeout($fancyModal.close, 2000)
                }, function (err) {
                    $scope.msg.error = err.data.error
                    console.log(err.data.error)
                })
            }
        }
        $scope.openEmailModal = function () {
            $fancyModal.open({
                template: `
                <div ng-show="msg.error" ng-cloak="ng-cloak" class="alert alert-dismissible alert-danger">
                  <button type="button" ng-click="msg.error = null" class="close">×</button>
                  <p ng-bind="msg.error"></p>
                </div>
                <div ng-show="msg.success" ng-cloak="ng-cloak" class="alert alert-dismissible alert-success">
                  <button type="button" ng-click="msg.success = null" class="close">×</button>
                  <p ng-bind="msg.success"></p>
                </div>
                `
            })
        }
        //Init
        $scope.loadSubmission()
        $scope.loadAttempts()
    })
