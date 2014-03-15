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

// Parse and compress JS and JSX files

gulp.task('javascript', function() {
  return gulp.src('frontend/**/*.js')
    .pipe(react())
    .pipe(gulp.dest('build/'))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest('build/'));
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
});

// Local development (live reloading)

gulp.task('watch', ['clean'], function() {
  var watching = false;
  gulp.start('browserify', 'styles', function() {
    // Protect against this function being called twice
    if (!watching) {
      watching = true;
      gulp.watch('frontend/**/*.js', ['javascript']);
      gulp.watch('build/javascript/client.js', ['browserify_nodep']);
      gulp.watch('frontend/**/*.less', ['styles']);
      nodemon({
        script: 'server.js',
        watch: ['build/javascript/compiled.js', 'server.js', 'gulpfile.js', 'env.json']
      });
    }
  });
});

gulp.task('default', ['clean'], function() {
  return gulp.start('browserify', 'styles');
});