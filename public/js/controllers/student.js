angular.module('controllers.student', ['vesparny.fancyModal'])
    .controller('StudentCtrl', function($scope, $http, $location, $fancyModal, $timeout) {
        var loc = $location.absUrl().split('/')
        $scope.room_path = loc[loc.length-3]
        $scope.student_id = loc[loc.length-1]
        $scope.student = $scope.success = $scope.error = null
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
                $scope.error = err.error
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
                $scope.success = res.data.success
                $scope.student.submissions.splice(index, 1)
            }, function(err) {
                $scope.error = err.data.error || err.error
            })
        }
        $scope.sendMail = function() {
            if (!$scope.emailMsg) {
                $scope.error = 'Please enter email content'
            } else {
                $http.post('/api/students/email/' + $scope.student._id, {
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
        $scope.openEmailModal = function() {
            $fancyModal.open({
                template: `
                <div ng-controller="StudentCtrl">
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
        //Init Fn
        $scope.loadStudent()
    })