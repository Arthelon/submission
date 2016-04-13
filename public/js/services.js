angular.module('app.services', [])
    .service('loadName', function() {
        this.getBase = function($location) {
            var loc = $location.absUrl().split('/')
            return loc[loc.length-1]
        }
    })
    .constant('SERVER_URL', 'http://localhost:3000')