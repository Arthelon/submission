angular.module('controllers.student', ['vesparny.fancyModal'])
    .controller('StudentCtrl', function($scope, $http, $location, $fancyModal, $timeout) {
        var loc = $location.absUrl().split('/')
        $scope.msg = {
            success: null,
            error: null
        }
        $scope.room_path = loc[loc.length-3]
        $scope.student_id = loc[loc.length-1]
        $scope.student = null
        $scope.emailMsg = ''
        
        $scope.selectedTab = 'submissions'

        $scope.loadStudent = function() {
            $http.get('/api/students/' + $scope.student_id, {
                params: {
                    room_path: $scope.room_path
                }
            }).then(function (succ) {
                console.log(succ.data)
                $scope.student = succ.data.student
            }, function (err) {
                console.log(err.data)
            })
        }
        $scope.removeSubmission = function(index) {
            $http.delete('/api/submissions', {
                data: {
                    submission: $scope.student.submissions[index].name,
                    room_path: $scope.room_path
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(function(res) {
                $scope.student.submissions.splice(index, 1)
            }, function(err) {
                console.log(err.data.error)
            })
        }
        $scope.sendMail = function() {
            if (!$scope.emailMsg) {
                $scope.msg.error = 'Please enter email content'
            } else {
                $http.post('/api/students/email/' + $scope.student._id, {
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
                    console.log(err.data)
                })
            }
        }
        $scope.openEmailModal = function() {
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
        //Init Fn
        $scope.loadStudent()
    })