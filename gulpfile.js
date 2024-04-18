// Include gulp
var gulp = require('gulp');

// Include Our Plugins
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var jade = require('gulp-jade');
var less = require('gulp-less');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var uglifyjs = require('gulp-uglifyjs');
var minify = require('gulp-minify-css');
var rename = require('gulp-rename');
var nodemon    = require('gulp-nodemon');
var open       = require('gulp-open');
var livereload = require('gulp-livereload');
var browserSync = require('browser-sync').create();


process.env.NODE_ENV = process.env.NODE_ENV || 'development';


gulp.task('serve',function(){
    
    return nodemon({
        script: 'app.js',
        ext: 'js',
        env: { 'NODE_ENV': 'development' },
        ignore: ['dist', 'node_modules', 'gulpfile.js']
    })
    .on('start', function () {
        ripe.wait(function () {
            livereload.changed('/');
        });
    });

});

gulp.task('browser', function(){
   return browserSync.init({
        // browser: "google chrome",
        // open: false,
        proxy: 'localhost:8084',
        port: 8080
    }); 
});


// Lint Task
gulp.task('lint', function() {
    return gulp.src('public/javascripts/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass
// gulp.task('sass', function() {
//     return gulp.src('public/sass/*.scss')
//         .pipe(sass())
//         .pipe(gulp.dest('public/stylesheets'));
// });

// Compile Our Less
gulp.task('less', function() {
    return gulp.src('public/less/*.less')
        .pipe(less())
        .pipe(gulp.dest('public/stylesheets'));
});

// Concatenate & Minify JS
gulp.task('js', function() {
    return gulp.src('public/javascripts/**/*.js')
        .pipe(replace(/"use strict"'/g, ';'))
        .pipe(concat('all.js'))
        .pipe(gulp.dest('public/dist'))
        .pipe(uglifyjs('all.min.js', {
            mangle:false
        }))
        .pipe(gulp.dest('public/dist'));
});


// Concatenate & Minify CSS
gulp.task('css', function() {
    return gulp.src('public/stylesheets/**/*.css')
        .pipe(concat('style.css'))
        .pipe(minify())
        .pipe(gulp.dest('public/dist'));
});



gulp.task('dialog', function() {
    return gulp.src('views/dialog/*.jade')
        .pipe(jade())
        .pipe(gulp.dest('public/dist/dialog'));
});




// Watch Files For Changes
gulp.task('watch', function() {
    // gulp.watch('views/dialog/*.jade', ['dialog']);
    gulp.watch('views/**/*.jade', [browserSync.reload]);
    gulp.watch('config/**/*.js', ['serve', browserSync.reload]);
    gulp.watch('routes/**/*.js', ['serve', browserSync.reload]);
    gulp.watch('public/javascripts/**/*.js', ['js', browserSync.reload]);
    // gulp.watch('public/assets/js/**/*.js', [browserSync.reload]);
    // gulp.watch('public/assets/css/**/*.css', [browserSync.reload]);
    gulp.watch('public/stylesheets/**/*.css', ['css', browserSync.reload]);
    // gulp.watch('public/sass/**/*.scss', ['sass', 'css', browserSync.reload]);
    gulp.watch('public/less/*.less', ['less', 'css', browserSync.reload]);
});

// Default Task
gulp.task('default', ['less','css', 'js', 'watch', 'serve', 'browser']);