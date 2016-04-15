var jade = require('gulp-jade');
var gulp = require('gulp')

gulp.task('templates', function() {
    gulp.src('./views/*.jade')
        .pipe(jade())
        .pipe(gulp.dest('./views/dist/'))
})