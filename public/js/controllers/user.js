angular.module('controllers.user', ['angular-jwt'])
    .controller('UserCtrl', function($window, $log, $http, jwtHelper) {
        var vm = this
        loadUser()
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

        vm.updateUserData = function() {
            var data = {}
            //Filters out changed user data
            for (var key in vm.model) {
                if (vm.model.hasOwnProperty(key) && vm.user[key] != vm.model[key]) {
                    data[key] = vm.model[key]
                }
            }
            $http.put('/api/users', data).then(function(res) {
                $log.log(res.data)
                vm.success = res.data.success
                var userData = jwtHelper.decodeToken(res.data.token)
                $window.localStorage.setItem('JWT', res.data.token)
                $window.localStorage.setItem('user', JSON.stringify(userData))
                loadUser()
                vm.model = angular.copy(vm.user)
            }, function(err) {
                vm.error = err.data.error
            })
        }

        function loadUser() {
            var userData = JSON.parse($window.localStorage.getItem('user'))
            vm.user = {
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email
            }
        }

    })