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

    module("recording-module", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "RecordingModule");

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
        equal(moduleInstance.getOrderIndex(), 50,
                "Recording module should have index 50.");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer(),
                "Recording module should support any layer.");
    });

    test("snapshot", function() {
        var saveAsBackup = window.saveAs;
        window.saveAs = function(blob, filename) {
            notEqual(blob, undefined, "blob should be defined.");
            equal(filename, "snapshot.zip",
                    "The filename should be snapshot.zip");
            window.saveAs = saveAsBackup;
        };
        $("#" + moduleInstance.snapshotDivId).click();
    });

    asyncTest("recording", function() {
        var $start = $("#" + moduleInstance.startRecordingDivId);
        var $download = $("#" + moduleInstance.downloadDivId);
        var $stop = $("#" + moduleInstance.stopRecordingDivId);

        ok($start.is(":visible"), "Start button should be visible.");
        ok(!$download.is(":visible"), "Download button should be hidden.");
        ok(!$stop.is(":visible"), "Stop button should be hidden.");

        $("#" + moduleInstance.startButtonId).click();

        ok(!$start.is(":visible"), "Start button should be hidden.");
        ok(!$download.is(":visible"), "Download button should be hidden.");
        ok($stop.is(":visible"), "Stop button should be visible.");

        $("#" + moduleInstance.stopButtonId).click();

        setTimeout(function() {
            ok($start.is(":visible"), "Start button should be visible.");
            ok($download.is(":visible"), "Download button should be visible.");
            ok(!$stop.is(":visible"), "Stop button should be hidden.");
            start();
        }, 101);
    });

})();
