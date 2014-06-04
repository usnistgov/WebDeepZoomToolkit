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
    var moduleInstance;

    module("layer-composition-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "LayerCompositionModule");

            wdzt.osd.addHandler("open", function openHandler() {
                wdzt.osd.removeHandler("open", openHandler);
                start();
            });
            wdzt.open("data/manifest.json");
            stop();
        },
        teardown: function() {
            $("#" + containerId).remove();
        }
    });

    test("getOrderIndex", function() {
        equal(moduleInstance.getOrderIndex(), 5,
                "Layer selection module should have index 5.");
    });

    test("supportLayer", function() {
        var manifest = wdzt.manifest;

        ok(moduleInstance.supportLayer(manifest.getLayer("phasecontrast")),
                "Layer composition module should support phasecontrast layer.");
        ok(moduleInstance.supportLayer(manifest.getLayer("gfp")),
                "Layer composition module should support gfp layer.");
        ok(moduleInstance.supportLayer(manifest.getLayer("masks")),
                "Layer composition module should support masks layer.");

        ok(!moduleInstance.supportLayer(manifest.getLayer("moche_xye")),
                "Layer composition module should not support moche_xye layer.");
        ok(!moduleInstance.supportLayer(manifest.getLayer("moche_eyx")),
                "Layer composition module should not support moche_eyx layer.");
    });

    asyncTest("layer change", function() {
        TestsTools.chainTriggersHandlers([{
                eventSource: wdzt,
                eventName: "layer-changed",
                trigger: function() {
                    wdzt.displayLayer(wdzt.manifest.getLayer("gfp"));
                },
                handler: function() {
                    var otherLayers = $("#" + moduleInstance.sortableId +
                            " ." + moduleInstance.inputClass).map(function() {
                        return $(this).attr("data-layer-id");
                    }).get();

                    equal(otherLayers.length, 2,
                            "There should be 2 other layers.");
                    ok($.inArray("phase_contrast", otherLayers),
                            "Layer phase_contrast should be available.");
                    ok($.inArray("masks", otherLayers),
                            "Layer masks should be available.");
                }
            }], start);
    });

    asyncTest("frame change", function() {
        var osd = wdzt.osd;
        TestsTools.chainTriggersHandlers([{
                eventSource: osd,
                eventName: "add-layer",
                trigger: function() {
                    $("." + moduleInstance.inputClass +
                            "[data-layer-id='masks']").trigger("click");
                },
                handler: function(event) {
                    equal(osd.getLayersCount(), 2,
                            "2 layers should be presents.");
                    equal(osd.getLevelOfLayer(event.drawer), 1,
                            "New layer should be at level 1.");
                }
            }, {
                eventSource: osd,
                eventName: "add-layer",
                trigger: function() {
                    wdzt.osdMovie.displayNextFrame();
                },
                handler: function(event) {
                    equal(osd.getLayersCount(), 2,
                            "2 layers should be presents.");
                    equal(osd.getLevelOfLayer(event.drawer), 1,
                            "Masks layer should be at level 1.");
                }
            }], start);
    });

    asyncTest("ui", function() {
        var osd = wdzt.osd;
        var masksDrawer, gfpDrawer;

        TestsTools.chainTriggersHandlers([{
                eventSource: osd,
                eventName: "add-layer",
                trigger: function() {
                    $("." + moduleInstance.inputClass +
                            "[data-layer-id='masks']").trigger("click");
                },
                handler: function(event) {
                    equal(osd.getLayersCount(), 2,
                            "2 layers should be presents.");
                    masksDrawer = event.drawer;
                    equal(osd.getLevelOfLayer(masksDrawer), 1,
                            "New layer should be at level 1.");
                }
            }, {
                eventSource: osd,
                eventName: "add-layer",
                trigger: function() {
                    $("." + moduleInstance.inputClass + "[data-layer-id='gfp']")
                            .trigger("click");
                },
                handler: function(event) {
                    equal(osd.getLayersCount(), 3,
                            "3 layers should be presents.");
                    gfpDrawer = event.drawer;
                    equal(osd.getLevelOfLayer(gfpDrawer), 2,
                            "New layer should be at level 2.");
                }
            }, {
                eventSource: osd,
                eventName: "layer-level-changed",
                trigger: function() {
                    // Fake drag and drop
                    // First reorder rows
                    var rows = $("#" + moduleInstance.sortableId +
                            " .wdzt-row-layout");
                    rows.last().insertBefore(rows.first());
                    // Then "trigger" the update event
                    var sortable = $("#" + moduleInstance.sortableId);
                    sortable.sortable('option', 'update').call(sortable);
                },
                handler: function() {
                    equal(osd.getLayersCount(), 3,
                            "3 layers should be presents.");
                    equal(osd.getLevelOfLayer(masksDrawer), 2,
                            "Masks layer should be at level 2.");
                    equal(osd.getLevelOfLayer(gfpDrawer), 1,
                            "GFP layer should be at level 1.");

                    // Slider test. No trigger/handler needed.
                    equal(masksDrawer.getOpacity(), 0.5,
                            "Masks opacity should be 0.5");
                    // Fake slide
                    var $slider = $("." + moduleInstance.sliderClass +
                            "[data-layer-id='masks']");
                    $slider.slider("value", 0.3);
                    $slider.slider("option", "slide").call($slider, {
                        target: $slider
                    }, {
                        value: $slider.slider("value")
                    });
                    equal(masksDrawer.getOpacity(), 0.3,
                            "Masks opacity should be 0.3");
                }
            }, {
                eventSource: osd,
                eventName: "remove-layer",
                trigger: function() {
                    $("." + moduleInstance.inputClass +
                            "[data-layer-id='masks']").trigger("click");
                },
                handler: function(event) {
                    equal(osd.getLayersCount(), 2,
                            "2 layers should be presents.");
                    equal(event.drawer, masksDrawer,
                            "The masks drawer should have been removed.");
                }
            }, {
                eventSource: osd,
                eventName: "remove-layer",
                trigger: function() {
                    $("." + moduleInstance.inputClass + "[data-layer-id='gfp']")
                            .trigger("click");
                },
                handler: function(event) {
                    equal(osd.getLayersCount(), 1,
                            "1 layer should be present.");
                    equal(event.drawer, gfpDrawer,
                            "The gfp drawer should have been removed.");
                }
            }], start);
    });

})();
