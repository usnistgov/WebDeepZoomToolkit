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

    module("layer-selection-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt, "LayerSelectionModule");
        },
        teardown: function() {
            $("#" + containerId).remove();
        }
    });

    test("getOrderIndex", function() {
        equal(moduleInstance.getOrderIndex(), 0,
                "Layer selection module should have index 0.");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer(),
                "Layer selection module should support any layer.");
    });

    asyncTest("loadLayers", function() {
        equal(moduleInstance.layers.length, 0,
                "No layer should be present before opening.");
        equal($("#" + moduleInstance.selectId + " option").length, 0,
                "No option should be present before opening.");

        wdzt.addHandler("open", function() {
            equal(moduleInstance.layers.length, 12,
                    "12 layers should be present after opening.");
            equal($("#" + moduleInstance.selectId + " option").length, 12,
                    "12 options should be present after opening.");
            start();
        });

        wdzt.open("data/manifest.json");
    });

    asyncTest("updateSelected", function() {
        wdzt.addHandler("open", function() {

            setTimeout(function() {
                equal($("#" + moduleInstance.selectId).val(), "phasecontrast",
                        "Selected layer should be phasecontrast");

                wdzt.addHandler("layer-changed", function() {
                    setTimeout(function() {
                        equal($("#" + moduleInstance.selectId).val(), "moche_xye",
                                "Selected layer should be moche_xye");
                        start();
                    }, 0);
                });
                wdzt.displayLayer(wdzt.manifest.getLayer("moche_xye"));
            }, 0);
        });

        wdzt.open("data/manifest.json");
    });

})();
