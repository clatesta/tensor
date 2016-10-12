/*jshint node:true*/
module.exports = function(grunt) {
    'use strict';
    var dest = 'dist/';
    var src = 'src/app/';

    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({
        bower_concat: {
            basic: {
                dest: {
                    js: dest + 'static/js/lib.js',
                    css: dest + 'static/css/lib.css'
                },
                dependencies: {
                    'angular': 'bootstrap'
                },
                mainFiles: {
                    'dashjs':  [
                        'dist/dash.mediaplayer.min.js',
                        'dist/dash.mediaplayer.min.map'
                    ],
                    'd3': [
                        'd3.min.js'
                    ],
                    'bootstrap': [
                        'dist/css/bootstrap.min.css',
                        'dist/js/bootstrap.min.js'
                    ],
                    'jquery': [
                        'dist/jquery.min.js',
                        'dist/jquery.min.map'
                    ]
                }
            }
        },
        ngtemplates:  {
            app: {
                cwd: 'src/',
                src: ['app/charts/*.html', 'app/dashboard/*.html'],
                dest: 'tmp/templates.js'
            }
        },
        concat: {
            options: {
                seperator: ';'
            },
            js: {
              src: [src + 'app.js',
                    src + 'app.config.js',
                    'tmp/templates.js',
                    src + 'app.routes.js',
                    src + 'app.widgets.js',
                    src + 'charts/*.js',
                    src + 'datamodels/*.js',
                    src + 'metrics/*.js',
                    src + 'services/*.js',
                    src + 'dashboard/*.js'],
              dest: dest + '/static/js/app.js'
            },
            css:{
                src: [src + '/*.css'],
                dest: dest + '/static/css/app.css'
            }
        },
        uglify: {
            all: {
                files: [{
                    expand: true,
                    cwd: dest + 'static/js/',
                    src: ['*.js'],
                    dest: dest + 'static/js/'
                }],
                options: {
                    mangle: false
                }
            }
        },
        copy: {
            html: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: '*.html',
                    dest: dest + 'templates/'
                }]
            },
            fonts: {
                files:[{
                    expand: true,
                    cwd: 'bower_components/font-awesome/',
                    src: 'fonts/*.*',
                    dest: dest + 'static/'
                },{
                    expand: true,
                    cwd: 'bower_components/bootstrap/',
                    src: 'fonts/*.*',
                    dest: dest + 'static/'
                }]
            },
            dash: {
                files:[{
                    expand: true,
                    cwd: 'bower_components/dashjs/dist/',
                    src: 'dash.mediaplayer.min.js.map',
                    dest: dest + 'static/js/'
                }]
            },
            img: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['assets/**/*.*'],
                    dest: dest + 'static/'
                },{
                    expand: true,
                    cwd: 'src/',
                    src: ['favicon32x32.png'],
                    dest: dest + 'static/'
                }]
            },
            dev: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*.*'],
                    dest: 'app/'
                }]
            },
            prod: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*.*'],
                    dest: 'app/'
                }]
            }
        },
        jshint: {
            options: {
                reporter: require('jshint-stylish')
            },
            all: [
                src + '**/*.js'
            ]
        },
        jscs: {
            all: [
                src + '**/*.js'
            ]
        },
        clean: {
            dist: [dest],
            tmp: ['tmp'],
            app: ['app/static', 'app/templates']
        },
        watch: {
            app: {
                files: [src + '**/*.*'],
                tasks: ['dev']
            }
        }
    });

    grunt.event.on('watch', function(action, filepath, target) {
        grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
    });

    grunt.registerTask('concat_all', ['bower_concat', 'ngtemplates',
                                      'concat', 'clean:tmp']);

    grunt.registerTask('def_copy', ['copy:html', 'copy:fonts', 'copy:img', 'copy:dash']);
    grunt.registerTask('copy_prod', ['def_copy', 'copy:prod']);
    grunt.registerTask('copy_dev', ['def_copy', 'copy:dev']);

    grunt.registerTask('prod', ['clean', 'concat_all', 'uglify', 'copy_prod']);
    grunt.registerTask('dev', ['jshint', 'jscs', 'clean', 'concat_all', 'copy_dev']);

    grunt.registerTask('default', ['clean', 'concat_all', 'def_copy', 'uglify']);
};
