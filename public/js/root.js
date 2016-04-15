angular.module('app', [
    'app.services',
    'app.controllers',
    'angular-jwt',
])
.config(['$httpProvider', 'jwtInterceptorProvider',
    function ($httpProvider, jwtInterceptorProvider) {
        jwtInterceptorProvider.tokenGetter = ['$window', function($window) {
            return $window.localStorage.getItem('JWT');
        }]
        $httpProvider.interceptors.push('jwtInterceptor');
    }])
