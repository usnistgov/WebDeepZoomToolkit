/*global module:false*/
module.exports = function(grunt) {

    var srcFiles = [
        'src/wdzt.js',
        'src/viewer.js',
        'src/toolbar.js',
        'src/manifest.js',
        'src/module.js',
        'src/logic/*.js',
        'src/modules/*.js',
        'src/widgets/*.js'];

    var libSrcFiles = [
        'libs/jquery/js/*.js',
        '!libs/jquery/js/*.min.js',
        'libs/noty/jquery.noty.js',
        'libs/noty/layouts/bottomRight.js',
        'libs/noty/themes/default.js',
        'libs/openseadragon/openseadragon.js',
        'libs/openseadragon/*.js',
        '!libs/openseadragon/*.min.js',
        'libs/handlebars/handlebars-v1.3.0.js',
        'libs/jszip/jszip.js',
        'libs/filesaver/FileSaver.js'
    ];

    var allSrcFiles = libSrcFiles.concat(srcFiles);

    var cssFiles = [
        'css/*.css'
    ];

    var libCssFiles = [
        'libs/jquery/css/smoothness/jquery-ui.css',
        'libs/jquery/css/smoothness/jquery.ui.theme.css',
        'libs/jquery/css/jquery.tree.min.css'
    ];

    var allCssFiles = libCssFiles.concat(cssFiles);

    var images = ['images/*'];

    var libImages = ['libs/jquery/css/images/*'];

    var allImages = libImages.concat(images);

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '* This software was developed at the National Institute of Standards and\n' +
                '* Technology by employees of the Federal Government in the course of\n' +
                '* their official duties. Pursuant to title 17 Section 105 of the United\n' +
                '* States Code this software is not subject to copyright protection and is\n' +
                '* in the public domain. This software is an experimental system. NIST assumes\n' +
                '* no responsibility whatsoever for its use by other parties, and makes no\n' +
                '* guarantees, expressed or implied, about its quality, reliability, or\n' +
                '* any other characteristic. We would appreciate acknowledgement if the\n' +
                '* software is used.\n' +
                '*/\n',
        // Task configuration.
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            basic: {
                src: srcFiles,
                dest: 'build/basic/<%= pkg.name %>.js'
            },
            deps: {
                src: allSrcFiles,
                dest: 'build/deps/<%= pkg.name %>-deps.js'
            }
        },
        cssmin: {
            options: {
                banner: '<%= banner %>'
            },
            basic: {
                src: cssFiles,
                dest: "build/basic/wdzt.css"
            },
            deps: {
                src: allCssFiles,
                dest: "build/deps/wdzt-deps.css"
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            basic: {
                src: '<%= concat.basic.dest %>',
                dest: 'build/basic/<%= pkg.name %>.min.js'
            },
            deps: {
                src: '<%= concat.deps.dest %>',
                dest: 'build/deps/<%= pkg.name %>-deps.min.js'
            }
        },
        closureCompiler: {
            options: {
                compilerFile: 'closure-compiler/compiler.jar',
                compilerOpts: {
                    compilation_level: 'ADVANCED_OPTIMIZATIONS'
                },
                TieredCompilation: true
            },
            basic: {
                src: '<%= concat.basic.dest %>',
                dest: 'build/basic/<%= pkg.name %>.closure.js'
            },
            deps: {
                src: '<%= concat.deps.dest %>',
                dest: 'build/deps/<%= pkg.name %>-deps.closure.js'
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: "strict",
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    $: true,
                    OpenSeadragon: true,
                    Handlebars: true,
                    noty: true,
                    saveAs: true,
                    WDZT: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib_test: {
                src: ['src/**/*.js']
            }
        },
        qunit: {
            files: ['test.html']
        },
        qunit_junit: {
            options: {
                dest: 'build/test-reports'
            }
        },
        copy: {
            images: {
                files: [{
                        expand: true,
                        src: images,
                        dest: "build/basic/images",
                        flatten: true
                    }
                ]
            },
            imagesDeps: {
                files: [{
                        expand: true,
                        src: allImages,
                        dest: "build/deps/images",
                        flatten: true
                    }
                ]
            }
        },
        clean: ["build"],
        compress: {
            basic: {
                options: {
                    archive: 'build/WDZT-basic.zip'
                },
                files: [{
                        expand: true,
                        cwd: "build/basic/",
                        src: ["**"],
                        dest: "/WDZT/"
                    }]
            },
            deps: {
                options: {
                    archive: 'build/WDZT-deps.zip'
                },
                files: [{
                        expand: true,
                        cwd: "build/deps/",
                        src: ["**"],
                        dest: "/WDZT/"
                    }]
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            lib_test: {
                files: '<%= jshint.lib_test.src %>',
                tasks: ['jshint:lib_test', 'qunit']
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-closure-tools');
    grunt.loadNpmTasks('grunt-qunit-junit');

    // Default task.
    grunt.registerTask('default', [
        'clean', 
        'jshint',
        'concat:basic',
        'cssmin:basic', 
        'uglify:basic'
    ]);
    
    grunt.registerTask('all', [
        'clean', 
        'jshint', 
        'concat',
        'cssmin', 
        'uglify', 
        'copy', 
        'qunit_junit', 
        'qunit', 
        'compress'
    ]);

};
