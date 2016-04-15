angular.module('app', [
    'app.services',
    'app.controllers',
    'angular-jwt',
    'ngRoute'
])
.config(['$httpProvider', 'jwtInterceptorProvider', '$routeProvider',
    function ($httpProvider, jwtInterceptorProvider, $routeProvider) {
        jwtInterceptorProvider.tokenGetter = ['$window', function($window) {
            return $window.localStorage.getItem('JWT');
        }]
        $httpProvider.interceptors.push('jwtInterceptor');
        $routeProvider
            .when('login', {
                url: '/login',
                controller: 'LoginCtrl',
                templateUrl: 'views/dist/login.html'
            })
    }])
