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

    function isFovUpdated(assert) {
        var viewport = wdzt.osd.viewport;
        var bounds = viewport.viewportToImageRectangle(
                viewport.getBounds());
        var zoom = (viewport.viewportToImageZoom(
                viewport.getZoom(true)) * 100).toPrecision(4);
        assert($("#" + moduleInstance.topLeftXId).text(), bounds.x.toFixed(0), "x");
        assert($("#" + moduleInstance.topLeftYId).text(), bounds.y.toFixed(0), "y");
        assert($("#" + moduleInstance.widthId).text(), bounds.width.toFixed(0), "width");
        assert($("#" + moduleInstance.heightId).text(), bounds.height.toFixed(0), "height");
        assert($("#" + moduleInstance.formZoomLevelId).val(), zoom, "zoom");
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
                            1, 1, 150, 150);
                    viewport.fitBounds(bounds, true);
                },
                handler: function() {
                    isFovUpdated(equal);
                }
            }, {
                eventSource: wdzt.osd,
                eventName: "animation-finish",
                trigger: function() {
                    moduleInstance.disable();
                    ok(!moduleInstance.isEnabled, "Module should be disabled.");

                    var bounds = viewport.imageToViewportRectangle(
                            10, 10, 100, 100);
                    viewport.fitBounds(bounds, true);
                },
                handler: function() {
                    isFovUpdated(notEqual);

                    moduleInstance.enable();
                    ok(moduleInstance.isEnabled, "Module should be enabled.");
                }
            }], start);
    });

})();
