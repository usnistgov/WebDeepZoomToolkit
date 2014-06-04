/* 
 * This software was developed at the National Institute of Standards and
 * Technology by employees of the Federal Government in the course of
 * their official duties. Pursuant to title 17 Section 105 of the United
 * States Code this software is not subject to copyright protection and is
 * in the public domain. This software is an experimental system. NIST assumes
 * no responsibility whatsoever for its use by other parties, and makes no
 * guarantees, expressed or implied, about its quality, reliability, or
 * any other characteristic. We would appreciate acknowledgement if the
 * software is used.
 */

(function() {

    var containerId;
    var wdzt;

    module("toolbar", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
        },
        teardown: function() {
            $("#" + containerId).remove();
        }
    });

    asyncTest("slider", function() {
        wdzt.osdMovie.addHandler("movie-changed", function layerChangedHandler() {
            wdzt.osdMovie.removeHandler("movie-changed", layerChangedHandler);

            // We want to run the test only once all "movie-changed" handlers
            // have been executed.
            setTimeout(function() {
                var toolbar = wdzt.toolbar;
                var slider = $("#" + toolbar.sliderId);

                equal(slider.slider("option", "min"), 1, "Slider min should be 1.");
                equal(slider.slider("option", "max"), 5, "Slider max should be 5.");

                start();
            }, 0);
        });

        wdzt.open("data/manifest.json");
    });

    asyncTest("controls", function() {
        var movie = wdzt.osdMovie;
        movie.addHandler("movie-changed", function layerChangedHandler() {
            movie.removeHandler("movie-changed", layerChangedHandler);

            var toolbar = wdzt.toolbar;
            TestsTools.chainTriggersHandlers([{
                    eventSource: movie,
                    eventName: "frame-changed",
                    trigger: function() {
                        $("#" + toolbar.seekForwardId).trigger("click");
                    },
                    handler: function() {
                        equal(movie.getCurrentFrame(), 2,
                                "Current frame should be #2");
                    }
                }, {
                    eventSource: movie,
                    eventName: "frame-changed",
                    trigger: function() {
                        $("#" + toolbar.skipForwardId).trigger("click");
                    },
                    handler: function() {
                        equal(movie.getCurrentFrame(), 5,
                                "Current frame should be #5");
                    }
                }, {
                    eventSource: movie,
                    eventName: "frame-changed",
                    trigger: function() {
                        $("#" + toolbar.seekBackId).trigger("click");
                    },
                    handler: function() {
                        equal(movie.getCurrentFrame(), 4,
                                "Current frame should be #4");
                    }
                }, {
                    eventSource: movie,
                    eventName: "frame-changed",
                    trigger: function() {
                        $("#" + toolbar.skipBackId).trigger("click");
                    },
                    handler: function() {
                        equal(movie.getCurrentFrame(), 1,
                                "Current frame should be #1");
                    }
                }, {
                    eventSource: movie,
                    eventName: "frame-changed",
                    trigger: function() {
                        $("#" + toolbar.playId).trigger("click");
                    },
                    handler: function() {
                        equal(movie.getCurrentFrame(), 2,
                                "Current frame should be #2 after starting video.");
                        ok(!$("#" + toolbar.playId).is(":visible"),
                            "Play button should be hidden.");
                        ok($("#" + toolbar.pauseId).is(":visible"),
                            "Pause button should be visible.");
                            
                        $("#" + toolbar.pauseId).trigger("click");
                        equal(movie.getCurrentFrame(), 2,
                                "Current frame should be #2 after stopping video.");
                        ok($("#" + toolbar.playId).is(":visible"),
                            "Play button should be visible.");
                        ok(!$("#" + toolbar.pauseId).is(":visible"),
                            "Pause button should be hidden.");
                    }
                }

            ], start);
        });
        wdzt.open("data/manifest.json");
    });

})();
