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
    var wdzt, moduleInstance;

    module("display-info-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "DisplayInfoModule");

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
        equal(moduleInstance.getOrderIndex(), 10,
                "Layer selection module should have index 10.");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer(),
                "Layer selection module should support any layer.");
    });

    function isFovUpdated() {
        var osd = wdzt.osd;
        var viewport = osd.viewport;
        var bounds = viewport.viewportToImageRectangle(
                viewport.getBounds());
        var zoom = (viewport.viewportToImageZoom(
                viewport.getZoom(true)) * 100).toPrecision(4);
        return $("#" + moduleInstance.topLeftXId).text() == bounds.x.toFixed(0)
                && $("#" + moduleInstance.topLeftYId).text() == bounds.y.toFixed(0)
                && $("#" + moduleInstance.widthId).text() == bounds.width.toFixed(0)
                && $("#" + moduleInstance.heightId).text() == bounds.height.toFixed(0)
                && $("#" + moduleInstance.formZoomLevelId).val() == zoom;
    }

    asyncTest("enable disable", function() {
        var osd = wdzt.osd;
        var viewport = osd.viewport;

        TestsTools.chainTriggersHandlers([{
                eventSource: wdzt.osd,
                eventName: "animation-finish",
                trigger: function() {
                    ok(moduleInstance.isEnabled, "Module should be enabled.");
                    var bounds = viewport.imageToViewportRectangle(
                            0, 0, 150, 150);
                    viewport.fitBounds(bounds, true);
                },
                handler: function() {
                    ok(isFovUpdated(), "Fov should have been updated.");
                }
            }, {
                eventSource: wdzt.osd,
                eventName: "animation-finish",
                trigger: function() {
                    moduleInstance.disable();
                    ok(!moduleInstance.isEnabled, "Module should be diabled.");

                    var bounds = viewport.imageToViewportRectangle(
                            150, 150, 150, 150);
                    viewport.fitBounds(bounds, true);
                },
                handler: function() {
                    ok(!isFovUpdated(), "Fov should not have been updated.");

                    moduleInstance.enable();
                    ok(moduleInstance.isEnabled, "Module should be enabled.");
                }
            }], start);
    });

})();
