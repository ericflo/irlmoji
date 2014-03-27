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
//var livereload = require('gulp-livereload')
var utils = require('./frontend/javascript/utils');
var mocha = require('gulp-mocha');

utils.readEnv();

gulp.task('clean', function() {
  return gulp.src(['build/*'], {read: false}).pipe(clean());
});

// Parse and compress JS and JSX files

gulp.task('javascript', function() {
  return gulp.src('frontend/javascript/**/*.js')
    .pipe(react())
    .pipe(gulp.dest('build/javascript/'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/javascript/'));
});

// Browserify the source tree into a client-side library

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

// Compile and minify less

gulp.task('styles', function() {
  return gulp.src('frontend/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('build/'))
    .pipe(minifycss())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/'));
    //.pipe(livereload());
});

// Images

gulp.task('images', function() {
  return gulp.src('frontend/images/**/*')
    .pipe(gulp.dest('build/images/'));
});

// Testing

gulp.task('javascript_test', function() {
  return gulp.src('frontend/tests/**/*.js')
    .pipe(gulp.dest('build/tests/'));
});

gulp.task('test', ['javascript', 'javascript_test'], function() {
  return gulp.src('build/tests/**/*.js').pipe(mocha());
});

// Local development (live reloading)

gulp.task('watch', ['clean'], function() {
  var watching = false;
  gulp.start('browserify', 'styles', 'images', function() {
    // Protect against this function being called twice
    if (!watching) {
      watching = true;
      gulp.watch('frontend/**/*.js', ['javascript']);
      gulp.watch('build/javascript/client.js', ['browserify_nodep']);
      gulp.watch('frontend/**/*.less', ['styles']);
      nodemon({
        script: 'server.js',
        watch: 'build'
      });
    }
  });
});

gulp.task('default', ['clean'], function() {
  return gulp.start('browserify', 'styles', 'images');
});