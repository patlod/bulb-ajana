'use strict';
var gulp = require('gulp');
var less = require('gulp-less');
var sass = require('gulp-sass');
sass.compiler = require('node-sass');

var path = require('path');



// Create an electron-connect server to enable reloading
var server = require('electron-connect').server.create();
// { stopOnClose: true, // logLevel: 2 }

server.on('closed', function(){
    console.log("Exit process on server side.");
    //process.exit();
    //server.stop();
});

/*var callback = function(electronProcState) {
    console.log('electron process state: ' + electronProcState);
    if (electronProcState == 'stopped') {
      process.exit();
    }
  };*/



gulp.task('startServer', function(done){
  server.start();
  done();
})

gulp.task('less' ,function () {
  return gulp.src('./less/*.less')
    .pipe(less())
    .pipe(gulp.dest('./public/css')); 
});

/**
 * Transpiling the .scss file of the Tagify module. 
 * Makes working easier. As the styling can be done by modifying variables 
 * directly in the scss code of Tagify module..
 */
gulp.task('transpileTagifySass', function(){
  gulp.src('./node_modules/@yaireo/tagify/src/tagify.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('watch', function(){
  gulp.watch('./less/*.less', { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    gulp.src('./less/*.less')
            .pipe(less())
            .pipe(gulp.dest('./public/css')); 
    
    //server.reload();
    //console.log("server: broadcast reload");
    server.restart();
    cb();
  });

  gulp.watch(['./*.js', './*.html'], { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    server.restart();
    cb();
  });

  gulp.watch(['./node_modules/@yaireo/tagify/src/tagify.scss'], { events: 'all'}, function(cb){
      gulp.src('./node_modules/@yaireo/tagify/src/tagify.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('./public/css'));

      server.restart();
      cb();
    });
  
  gulp.watch(['./scripts/*.*'], { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    server.restart();
    cb();
  });

  gulp.watch(['./_views/*.*'], { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    server.restart();
    cb();
  });

  gulp.watch(['./_controllers/*.*'], { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    server.restart();
    cb();
  });

  gulp.watch(['./_models/*.*'], { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    server.restart();
    cb();
  });

  gulp.watch(['./_app/*.*'], { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    server.restart();
    cb();
  });

  gulp.watch(['./_util/*.*'], { events: 'all' }, function(cb){
    /* callback function and event object are async completion code so that 
    watch function not only exectutes once but on every event*/ 
    server.restart();
    cb();
  });
})

/* New way Gulp v4.. with parallel() and series()
   Since wrapping the server start in a gulp task also solves
   the problem with the zombie process. Why did I not see that.
   */
gulp.task('start', gulp.series('less', 'startServer', 'watch'));
//'lessWatch','appWatchBrowser','appWatchRenderer' )));


  /**
   * NOTE: For some reason I could not find out the 
   * reload function does not work. Even though it does
   * broadcast the 'reload' event to the client, calling
   * reload function on the BrowserWindow does not reload
   * the page content (html, css) also clearing the cache
   * has no effect.
   * I DECIDED TO JUST RESTART THE APP on every change.
   * 
   * Also important:
   * Once the gulp script is terminated, one has to 
   * KILL THE LAST PROCESS from activity monitor.
   */

  /* Obsolete from Gulp v3..
  gulp.task('start', ()=>{
    gulp.series('less');
    console.log("============ Wrote .less to .css =============");
    server.start();
    //Watch js files and restart Electron if they change
    gulp.parallel(["appWatchBrowser","appWatchRenderer",'lessWatch']);
    //watch html
    //gulp.watch(['./index.html'], electron.reload);
    //gulp.series();
    //watch css files, but only reload (no restart necessary)
    //gulp.series();
    
  });*/

