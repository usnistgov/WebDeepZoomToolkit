/*global module:false*/
module.exports = function(grunt) {

    var images = ['images/*'];

    var bootstrap_css = ['bower_components/bootstrap/dist/css/bootstrap.min.css'];
    var bootstrap_fonts = ['bower_components/bootstrap/dist/fonts/*'];

    var libImages = [
        'bower_components/jquery-ui/themes/smoothness/images/*',
        'libs/jquery/css/images/*'
    ];


    var hbsTemplateOutputFile = 'build/hbs-templates.js';
    var handlebarsFilesOption = {};
    handlebarsFilesOption[hbsTemplateOutputFile] = 'src/**/*.hbs';

    var allImages = libImages.concat(images);

    // Project configuration.
    grunt.initConfig({
        // Metadata. Make value inside package.json available in grunt.
        pkg: grunt.file.readJSON('package.json'),
        // set from values read in package.json
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
        bower: {
            install: {
                options: {
                    copy: false
                }
            }
        },
        handlebars: {
            compile: {
                options: {
                    namespace: 'Handlebars.templates'
                },
                files: handlebarsFilesOption
            }
        },
        useminPrepare: {
            wdzt: 'debug.html',
            options: {
                flow: {
                    steps: {
                        wdzt: ['concat'],
                        deps: ['concat'],
                        csswdzt: ['cssmin'],
                        cssdeps: ['cssmin']
                    },
                    post: {
                        wdzt: [{
                                name: 'concat',
                                createConfig: function(context, block) {
                                    context.options.basic.src = 
                                            [hbsTemplateOutputFile].concat(block.src);
                                    context.options.deps.src =
                                            context.options.deps.src.concat(
                                                    context.options.basic.src);
                                }
                            }],
                        deps: [{
                                name: 'concat',
                                createConfig: function(context, block) {
                                    context.options.deps.src = block.src;
                                }

                            }],
                        csswdzt: [{
                                name: 'cssmin',
                                createConfig: function(context, block) {
                                    context.options.basic.src = block.src;
                                    context.options.deps.src = context.options.deps.src.concat(block.src);
                                }
                            }],
                        cssdeps: [{
                                name: 'cssmin',
                                createConfig: function(context, block) {
                                    context.options.deps.src = block.src;
                                    context.options.deps.src = context.options.deps.src.concat(bootstrap_css);
                                }

                            }]
                    }
                }
            }
        },
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            basic: {
                dest: 'build/basic/wdzt.js'
            },
            deps: {
                dest: 'build/deps/wdzt-deps.js'
            }
        },
        cssmin: {
            options: {
                banner: '<%= banner %>'
            },
            basic: {
                dest: "build/basic/wdzt.css"
            },
            deps: {
                dest: "build/deps/wdzt-deps.css"
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            basic: {   
                src: '<%= concat.basic.dest %>',
                dest: 'build/basic/wdzt.min.js'
            },
            deps: {
                options: {
                    compress: {
                        drop_console: true
                    }
                },
                src: '<%= concat.deps.dest %>',
                dest: 'build/deps/wdzt-deps.min.js'
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
                dest: 'build/basic/wdzt.closure.js'
            },
            deps: {
                src: '<%= concat.deps.dest %>',
                dest: 'build/deps/wdzt-deps.closure.js'
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: "nofunc",
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
                    Caman: true,
                    IFJS: true,
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
            },
            fonts: {
                files: [{
                        expand: true,
                        src: bootstrap_fonts,
                        dest: "build/fonts",
                        flatten: true
                    }
                ]
            },
            fontsDeps: {
                files: [{
                        expand: true,
                        src: bootstrap_fonts,
                        dest: "build/fonts",
                        flatten: true
                    }
                ]
            },
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
                    },
                    {
                        expand: true,
                        cwd: "build/fonts/",
                        src: ["**"],
                        dest: "fonts/"
                    }
                    ]
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
                    },
                    {
                        expand: true,
                        cwd: "build/fonts/",
                        src: ["**"],
                        dest: "fonts/"
                    }
                    ]
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
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-closure-tools');
    grunt.loadNpmTasks('grunt-qunit-junit');
    grunt.loadNpmTasks('grunt-bower-task');

    // Default task.
    grunt.registerTask('default', [
        'clean',
    //    'jshint',
        'handlebars',
        'useminPrepare',
        'concat:basic',
        'cssmin:basic',
        'uglify:basic'
    ]);

    grunt.registerTask('all', [
        'clean',
     //   'jshint',
        'handlebars',
        'useminPrepare',
        'concat',
        'cssmin',
        'uglify',
        'copy',
        'qunit_junit',
        'qunit',
        'compress'
    ]);

};
