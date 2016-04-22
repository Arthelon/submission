angular.module('app', [
    'app.services',
    'app.controllers',
    'angular-jwt',
    'controllers.room',
    'controllers.problem',
    'controllers.dashboard',
    'controllers.user',
    'formly',
    'formlyBootstrap'
])
    .config(['$httpProvider', 'jwtInterceptorProvider', 'formlyConfigProvider',
        function ($httpProvider, jwtInterceptorProvider, formlyConfigProvider) {
            //JWT
            jwtInterceptorProvider.tokenGetter = ['$window', function($window) {
                return $window.localStorage.getItem('JWT');
            }]
            $httpProvider.interceptors.push('jwtInterceptor');

            //Formly Setup
            formlyConfigProvider.setWrapper([
                {
                    templateUrl: 'templates/form.html'
                },
                {
                    template: [
                        '<div class="checkbox formly-template-wrapper-for-checkboxes form-group">',
                        '<label for="{{::id}}">',
                        '<formly-transclude></formly-transclude>',
                        '</label>',
                        '</div>'
                    ].join(' '),
                    types: 'checkbox'
                }
            ]);

        }])
    .run(function(formlyConfig, formlyValidationMessages) {

        //Formly Messages
        formlyValidationMessages.addStringMessage('required', 'Field cannot be left blank')
    })

