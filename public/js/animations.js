angular.module('rootApp.animations', ['ngAnimate'])
    .animation('.tableItem', [function() {
        return {
            leave: function(element, done) {
                element = jQuery(element)
                element.fadeOut(300, done)
            }
         }
    }])