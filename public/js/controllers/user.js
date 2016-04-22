angular.module('controllers.user', [])
    .controller('UserCtrl', function($window, $log, $http) {
        var vm = this
        vm.user = JSON.parse($window.localStorage.getItem('user'))
        vm.fields = [
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
                key: 'password',
                templateOptions: {
                    type: 'password',
                    label: 'Password'
                }
            },
            {
                type: 'input',
                key: 'password2',
                templateOptions: {
                    type: 'password',
                    label: 'Confirm Password'
                }
            }
        ]
        vm.model = angular.copy(vm.user)
        delete vm.model._id
        delete vm.model.password

        vm.updateUserData = function() {

        }
    })