module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    bower_concat: {
      all: {
        dest: {
          js: 'dist/assets/js/vendor.js',
          css: 'build/assets/css/vendor.css',
          scss: 'build/assets/css/vendor.scss',
        }
      }
    },

    browserify: {
      options: {
        browserifyOptions: { debug: true }
      },
      dist: {
        options: {
          transform: [["babelify", { presets: 'es2015', sourceMaps: 'inline' }], ['hbsfy']]
        },
        files: {
          'dist/assets/js/buoyancy-poc.js': 'app/app.js'
        }
      }
    },

    // concat: {
    //   dist: {
    //     src: ['build/assets/js/*.js'],
    //     dest: 'dist/assets/js/latitude.js'
    //   }
    // },

    sass: {
      options: { sourceMap: true },
      dist: {
        files: {
          'dist/assets/css/vendor.css': ['build/assets/css/vendor.scss', 'build/assets/css/vendor.css'],
          'dist/assets/css/buoyancy-poc.css': 'app/styles/app.scss'
        }
      }
    },

    copy: {
      main: {
        files: [
          { src: 'app/index.html', dest: 'dist/index.html' },
          { expand: true, cwd: 'app/public', src: '**', dest: 'dist/' }
        ]
      }
    },

    watch: {
      scripts: {
        files: ['app/**/*.*'],
        tasks: ['browserify', 'sass', 'copy']
      }
    },

    connect: {
      server: {
        options: {
          port: 4200,
          livereload: true,
          base: 'dist/'
        }
      }
    },

    clean: ['dist/', 'build/']
  });

  grunt.registerTask('build', ['bower_concat', 'browserify', 'sass', 'copy']);
  grunt.registerTask('default', ['build']);
  grunt.registerTask('serve', ['build', 'connect', 'watch']);

}
