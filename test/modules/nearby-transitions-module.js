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

    module("nearby-transitions-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "NearbyTransitionsModule");

            wdzt.osd.addHandler("open", function openHandler() {
                wdzt.osd.removeHandler("open", openHandler);
                start();
            });
            wdzt.open("data/manifest.json", {
                layer: "moche_eyx"
            });
            stop();
        },
        teardown: function() {
            $("#" + containerId).remove();
        }
    });

    test("getOrderIndex", function() {
        equal(moduleInstance.getOrderIndex(), 41,
                "Nearby transitions module should have index 41.");
    });

    test("supportLayer", function() {
        var manifest = wdzt.manifest;

        ok(moduleInstance.supportLayer(manifest.getLayer("moche_eyx")),
                "Nearby transitions module should support layer moche_exy.");
        ok(!moduleInstance.supportLayer(manifest.getLayer("moche_xye")),
                "Nearby transitions module should support layer moche_xye.");
    });

    test("enable disable", function() {
        ok(moduleInstance.mouseTracker.isTracking(),
                "The mouse should be tracked");

        moduleInstance.disable();
        ok(!moduleInstance.mouseTracker.isTracking(),
                "The mouse should not be tracked");

        moduleInstance.enable();
        ok(moduleInstance.mouseTracker.isTracking(),
                "The mouse should be tracked");
    });

})();
