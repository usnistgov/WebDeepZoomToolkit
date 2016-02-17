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

    module("colony-feature-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "ColonyFeatureModule");

            wdzt.osd.addHandler("open", function openHandler() {
                wdzt.osd.removeHandler("open", openHandler);
                start();
            });
            wdzt.open("data/manifest.json", {
                layer: "gfp"
            });
            stop();
        },
        teardown: function() {
            $("#" + containerId).remove();
        }
    });

    test("getOrderIndex", function() {
        equal(moduleInstance.getOrderIndex(), 100,
                "Colony feature module should have index 100 (not set).");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer({
            "colonyFeatures": {
                "serviceUrl": "/colonyfeatures",
                "featuresUrl": "/features",
                "lineageUrl": "/lineage",
                "dataset": "stemcells",
                "layer": "gfp"
            }
        }), "Colony features module should support layers with colonyFeatures properties.");
        ok(!moduleInstance.supportLayer({}),
                "Colony features module should not support layers with no colonyFeatures property.");
    });

    asyncTest("showColonyFeatures", function() {
        var imageClickPosition = new OpenSeadragon.Point(284, 194);

        var getFeaturesBackup = WDZT.ColonyHelper.getFeatures;
        WDZT.ColonyHelper.getFeatures = function(options) {
            equal(options.serviceUrl, "/colonyfeatures", "Service URL.");
            equal(options.dataset, "stemcells", "Dataset.");
            equal(options.layer, "gfp", "Layer.");
            equal(options.x, imageClickPosition.x, "x coordinate.");
            equal(options.y, imageClickPosition.y, "y coordinate.");
            options.onSuccess({
                colony: 1,
                boundingBox: {
                    x: 90,
                    y: 62,
                    width: 400,
                    height: 340
                },
                centroid: {
                    x: 271,
                    y: 207
                },
                featuresGroup: {}
            });
        };

        try {
            wdzt.osd.innerTracker.clickHandler({
                quick: true,
                position: wdzt.osd.viewport.imageToViewerElementCoordinates(
                        imageClickPosition)
            });

            setTimeout(function() {
                var hash = 1 + "-" + moduleInstance.hash;
                var boundBoxId = "wdzt-features-overlay-boundbox-colony-" + hash;
                var centroidId = "wdzt-features-overlay-centroid-colony-" + hash;

                equal($(".wdzt-features-dialog").length, 1,
                        "One dialog should be present.");
                equal($("#" + boundBoxId).length, 1,
                        "One boundbox should be present.");
                equal($("#" + centroidId).length, 1,
                        "One centroid should be present.");

                $(".ui-dialog-content").dialogHtmlTitle("close");

                equal($(".wdzt-features-dialog").length, 0,
                        "No dialog should be present.");
                equal($("#" + boundBoxId).length, 0,
                        "No boundbox should be present.");
                equal($("#" + centroidId).length, 0,
                        "No centroid should be present.");

                start();
            }, 0);

        } finally {
            WDZT.ColonyHelper.getFeatures = getFeaturesBackup;
        }

        ok(true);
    });

})();
