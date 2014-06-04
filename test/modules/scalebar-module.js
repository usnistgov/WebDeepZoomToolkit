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

    module("scalebar-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "ScalebarModule");

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
        equal(moduleInstance.getOrderIndex(), 90,
                "Scalebar module should have index 90.");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer({
            "scalebar": {
                "pixelsPerMeter": 1552795,
                "unitType": "length"
            }
        }), "Scalebar module should support any layer with a scalebar field.");
        ok(!moduleInstance.supportLayer({}),
                "Scalebar module should not support layers without a scalebar field.");
    });

    test("actions", function() {
        var scalebar = wdzt.osd.scalebarInstance;
        equal(scalebar.pixelsPerMeter, 1552795,
                "Scalebar should be visible by default.");
        equal(scalebar.location, OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT,
                "Scalebar should be located on the bottom right corner by default.");
        equal(scalebar.color, "black", "Scalebar should be black by default.");
        equal(scalebar.fontColor, "black",
                "Scalebar font should be black by default.");
        equal(scalebar.backgroundColor, "rgba(255, 255, 255, 0.5)",
                "Scalebar background should be transparent white by default.");

        $("#" + moduleInstance.enabledId).click();
        equal(scalebar.pixelsPerMeter, 0,
                "Scalebar should be hidden.");

        $("#" + moduleInstance.enabledId).click();
        equal(scalebar.pixelsPerMeter, 1552795, "Scalebar should be visible.");

        $("#" + moduleInstance.locationId).val("TOP_LEFT");
        $("#" + moduleInstance.locationId).change();
        equal(scalebar.location, OpenSeadragon.ScalebarLocation.TOP_LEFT,
                "Scalebar should be located on the top left corner.");

        $("#" + moduleInstance.colorId).val("white");
        $("#" + moduleInstance.colorId).change();
        equal(scalebar.color, "white", "Scalebar should be white.");
        equal(scalebar.fontColor, "white", "Scalebar font should be white.");
        equal(scalebar.backgroundColor, "rgba(0, 0, 0, 0.5)",
                "Scalebar background should be transparent black.");

        $("#" + moduleInstance.backgroundId).click();
        equal(scalebar.backgroundColor, "rgba(255, 255, 255, 0)",
                "Scalebar background should be transparent.");
    });

})();
