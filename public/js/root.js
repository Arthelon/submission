angular.module('app', [
    'app.services',
    'app.controllers',
    'angular-jwt',
    'controllers.room',
    'controllers.problem',
    'controllers.dashboard'
])
.config(['$httpProvider', 'jwtInterceptorProvider',
    function ($httpProvider, jwtInterceptorProvider) {
        jwtInterceptorProvider.tokenGetter = ['$window', function($window) {
            return $window.localStorage.getItem('JWT');
        }]
        $httpProvider.interceptors.push('jwtInterceptor');
    }])
