angular.module('controllers.user', ['angular-jwt', 'ngMessages', 'formly'])
    .controller('UserCtrl', function($window, $log, $http, jwtHelper, $scope) {
        $scope.msg = {
            success: null,
            error: null
        }
        loadUser()
        // updateForm = FormlyFormController
        $scope.fields = [
            {
                type: 'input',
                key: 'username',
                templateOptions: {
                    type: 'text',
                    label: 'Username',
                    required: true
                }
            },
            {
                type: 'input',
                key: 'first_name',
                templateOptions: {
                    type: 'text',
                    label: 'First Name',
                    required: true
                }
            },
            {
                type: 'input',
                key: 'last_name',
                templateOptions: {
                    type: 'text',
                    label: 'Last Name',
                    required: true
                }
            },
            {
                type: 'input',
                key: 'email',
                templateOptions: {
                    type: 'email',
                    label: 'Email',
                    required: true
                }
            },
            {
                type: 'input',
                key: 'email_password',
                templateOptions: {
                    type: 'password',
                    label: 'Email Password'
                }
            },
            {
                type: 'input',
                key: 'password',
                templateOptions: {
                    type: 'password',
                    label: 'Password'
                },
                validators: {
                    lengthValidator: {
                        expression: '$viewValue.length >= 8 || !$viewValue',
                        message: '"Password length has to be at least 8 characters"'
                    }
                }
            },
            {
                type: 'input',
                key: 'password2',
                templateOptions: {
                    type: 'password',
                    label: 'Confirm Password'
                },
                expressionProperties: {
                    'templateOptions.disabled': '!model.password'
                },
                validators: {
                    confirmPasswordValidator: {
                        expression: '$viewValue == model.password',
                        message: '"Passwords do not match"'
                    }
                }
            }
        ]
        $scope.model = angular.copy($scope.user)

        $scope.updateUserData = function() {
            var data = {}
            //Filters out changed user data
            for (var key in $scope.model) {
                if ($scope.model.hasOwnProperty(key) && $scope.user[key] != $scope.model[key]) {
                    data[key] = $scope.model[key]
                }
            }
            $http.put('/api/users', data).then(function(res) {
                $log.log(res.data)
                $scope.msg.success = res.data.success
                var userData = jwtHelper.decodeToken(res.data.token)
                $window.localStorage.setItem('JWT', res.data.token)
                $window.localStorage.setItem('user', JSON.stringify(userData))
                loadUser()
                $scope.model = angular.copy($scope.user)
            }, function(err) {
                $scope.msg.error = err.data.error
            })
        }

        function loadUser() {
            var userData = JSON.parse($window.localStorage.getItem('user'))
            $scope.user = {
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                email_password: userData.email_password
            }
        }

    })