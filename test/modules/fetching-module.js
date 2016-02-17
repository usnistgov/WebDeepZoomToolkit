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

    module("fetching-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "FetchingModule");

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
        equal(moduleInstance.getOrderIndex(), 51,
                "Fetching module should have index 51.");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer({
            fetching: {
                url: "fetchingurl"
            }
        }), "Fetching module should support layer with fetching property.");
        ok(!moduleInstance.supportLayer({}),
                "Fetching module should not support layer with no fetching property.");
    });

    function isFovUpdated() {
        var osd = wdzt.osd;
        var viewport = osd.viewport;
        var bounds = viewport.viewportToImageRectangle(
                viewport.getBounds());
        return $("#" + moduleInstance.formXId).val() == bounds.x.toFixed(0)
                && $("#" + moduleInstance.formYId).val() == bounds.y.toFixed(0)
                && $("#" + moduleInstance.formWidthId).val() == bounds.width.toFixed(0)
                && $("#" + moduleInstance.formHeightId).val() == bounds.height.toFixed(0);
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

    test("fetch", function() {

        var x = 1, y = 2,
                width = 1001, height = 1002,
                zoom = 0.1,
                frames = "1-3,5";

        $("#" + moduleInstance.manualSettingsId).click();
        $("#" + moduleInstance.formZoomLevelId).val(zoom);
        $("#" + moduleInstance.formXId).val(x);
        $("#" + moduleInstance.formYId).val(y);
        $("#" + moduleInstance.formWidthId).val(width);
        $("#" + moduleInstance.formHeightId).val(height);
        $("#" + moduleInstance.formFramesRangeId).val(frames);

        var fileDownloadBackup = $.fileDownload;
        $.fileDownload = function(url, options) {
            var z = zoom / 100;
            equal(url, "/fetching/phasecontrast?x=" + x + "&y=" + y +
                    "&width=" + width + "&height=" + height + "&zoom=" + z +
                    "&frames=" + frames,
                    "Wrong computed url.");
        };

        try {
            $("#" + moduleInstance.formFetchButtonId).click();
        } finally {
            $.fileDownload = fileDownloadBackup;
        }

    });

})();
