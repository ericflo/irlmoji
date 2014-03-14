var _ = require('lodash/dist/lodash.underscore');
var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('gulp-less');
var react = require('./frontend/javascript/vendor/gulp-react');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var browserify = require('gulp-browserify');
var rename = require('gulp-rename');
var minifycss = require('gulp-minify-css');
var nodemon = require('gulp-nodemon');

gulp.task('clean', function() {
  return gulp.src(['build/*'], {read: false}).pipe(clean());
});

gulp.task('javascript', function() {
  return gulp.src('frontend/**/*.js')
    .pipe(react())
    .pipe(gulp.dest('build/'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/'));
});

function browserifyTask() {
  return gulp.src('build/javascript/client.js')
    .pipe(browserify({
      transform: ['envify']
    }))
    .pipe(rename('compiled.js'))
    .pipe(gulp.dest('build/javascript/'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/javascript/'));
}

gulp.task('browserify', ['javascript'], browserifyTask);
gulp.task('browserify_nodep', browserifyTask);

gulp.task('styles', function() {
  return gulp.src('frontend/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('build/'))
    .pipe(minifycss())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/'));
});

gulp.task('watch', ['clean'], function() {
  var i = 0;
  gulp.start('browserify', 'styles', function() {
    gulp.watch('frontend/**/*.js', ['javascript']);
    gulp.watch('build/javascript/client.js', ['browserify_nodep']);
    gulp.watch('frontend/**/*.less', ['styles']);
    if (++i === 1) {
      nodemon({
        script: 'server.js',
        watch: ['build/javascript/compiled.js', 'server.js', 'gulpfile.js', 'env.json']/*,
        delay: 0.5*/
      });
    }
  });
});

gulp.task('default', ['clean'], function() {
  return gulp.start('browserify', 'styles');
});