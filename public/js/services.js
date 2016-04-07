angular.module('rootApp.services', [])
    .service('loadName', function() {
        this.getBase = function($location) {
            var loc = $location.absUrl().split('/')
            return loc[loc.length-1]
        }
    })