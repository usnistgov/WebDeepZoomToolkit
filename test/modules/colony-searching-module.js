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
    var getBoundingBoxBackup;
    var boundingBox = {
        x: 90,
        y: 62,
        width: 400,
        height: 340
    };

    module("colony-searching-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "ColonySearchingModule");
            getBoundingBoxBackup = WDZT.ColonyHelper.getBoundingBox;
            WDZT.ColonyHelper.getBoundingBox = function(options) {
                options.onSuccess(boundingBox);
            };
        },
        teardown: function() {
            $("#" + containerId).remove();
            WDZT.ColonyHelper.getBoundingBox = getBoundingBoxBackup;
        }
    });

    test("getOrderIndex", function() {
        equal(moduleInstance.getOrderIndex(), 40,
                "Colony searching module should have index 40.");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer({
            "colonySearching": {
                "serviceUrl": "/colonyfeatures",
                "dataset": "stemcells"
            }
        }), "Colony searching module should support layers with colonySearching properties.");
        ok(!moduleInstance.supportLayer({}),
                "Colony searching module should not support layers with no colonySearching property.");
    });

    asyncTest("openOnColony", function() {
        var $overlay = $("#" + moduleInstance.overlayId);
        equal($overlay.length, 0, "No overlay should be present before opening.");

        wdzt.osd.addHandler("tile-drawn", function openHandler() {
            wdzt.osd.removeHandler("tile-drawn", openHandler);
            var $overlay = $("#" + moduleInstance.overlayId);
            equal($overlay.length, 1, "The overlay should be present.");

            var viewport = moduleInstance.viewer.osd.viewport;
            var boundBoxLocation = viewport.imageToWindowCoordinates(
                    new OpenSeadragon.Point(boundingBox.x, boundingBox.y));
            boundBoxLocation = boundBoxLocation.apply(Math.floor);
            equalPlusMinusOne($overlay.offset().left, boundBoxLocation.x,
                    "Incorrect x location.");
            equalPlusMinusOne($overlay.offset().top, boundBoxLocation.y,
                    "Incorrect y location.");

            start();
        });
        wdzt.open("data/manifest.json", {
            layer: "gfp",
            ColonySearchingModule: {
                colony: 2
            }
        });
    });

    asyncTest("findColony", function() {
        var $overlay = $("#" + moduleInstance.overlayId);
        equal($overlay.length, 0, "No overlay should be present before opening.");

        wdzt.osd.addHandler("tile-drawn", function openHandler() {
            wdzt.osd.removeHandler("tile-drawn", openHandler);
            var $overlay = $("#" + moduleInstance.overlayId);
            equal($overlay.length, 0, "No overlay should be present.");

            var $input = $("#" + moduleInstance.colonySearchingInputId);
            $input.val(2);
            // Simulate keyup
            $(function() {
                var e = $.Event('keyup');
                e.keyCode = 13;
                $input.trigger(e);
            });

            $overlay = $("#" + moduleInstance.overlayId);
            var viewport = moduleInstance.viewer.osd.viewport;
            var boundBoxLocation = viewport.imageToWindowCoordinates(
                    new OpenSeadragon.Point(boundingBox.x, boundingBox.y));
            boundBoxLocation = boundBoxLocation.apply(Math.floor);
            equalPlusMinusOne($overlay.offset().left, boundBoxLocation.x,
                    "Incorrect x location.");
            equalPlusMinusOne($overlay.offset().top, boundBoxLocation.y,
                    "Incorrect y location.");

            start();
        });
        wdzt.open("data/manifest.json", {
            layer: "gfp"
        });
    });

    // Necessary due to some rounding errors
    function equalPlusMinusOne(actual, expected, message) {
        var diff = actual - expected;
        if (diff > 1 || diff < -1) {
            equal(actual, expected, message);
        } else {
            ok(true);
        }
    }

})();
