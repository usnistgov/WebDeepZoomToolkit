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
    var thresholdValue;
    var thresholdingFunc;
    var erosionValue;
    var dilationValue;
    var morphFunc;

    module("filtering-module", {
        setup: function() {
            thresholdingFunc = OpenSeadragon.Filters.THRESHOLDING;
            OpenSeadragon.Filters.THRESHOLDING = function(threshold) {
                thresholdValue = threshold;
                thresholdingFunc(threshold);
            };

            morphFunc = OpenSeadragon.Filters.MORPHOLOGICAL_OPERATION;
            OpenSeadragon.Filters.MORPHOLOGICAL_OPERATION
                    = function(kernelSize, comparator) {
                        if (comparator === Math.min) {
                            erosionValue = kernelSize;
                        } else if (comparator === Math.max) {
                            dilationValue = kernelSize;
                        }
                        morphFunc(kernelSize, comparator);
                    };

            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
            moduleInstance = TestsTools.getModuleInstance(wdzt,
                    "FilteringModule");

            wdzt.osd.addHandler("open", function openHandler() {
                wdzt.osd.removeHandler("open", openHandler);
                start();
            });
            wdzt.open("data/manifest.json");

            stop();
        },
        teardown: function() {
            $("#" + containerId).remove();
            OpenSeadragon.Filters.THRESHOLDING = thresholdingFunc;
            OpenSeadragon.Filters.MORPHOLOGICAL_OPERATION = morphFunc;
            wdzt.osd.setFilterOptions();
        }
    });

    test("getOrderIndex", function() {
        equal(moduleInstance.getOrderIndex(), 60,
                "Filtering module should have index 60.");
    });

    test("supportLayer", function() {
        ok(moduleInstance.supportLayer(),
                "Filtering module should support any layer.");
    });

    test("instantiation", function() {

        var $modifyButton = $("#" + moduleInstance.modifyButtonId);
        $modifyButton.click();

        var $dialog = $("#" + moduleInstance.dialogId).dialog("close");

        var $availables = $dialog.find("#" + moduleInstance.availableFiltersId);
        var $selected = $dialog.find("#" + moduleInstance.selectedFiltersId);
        
        equal($selected.find("li").size(), 0, "No filter should be selected.");
        
        $availables.find("li img").first().click();
        
        equal($selected.find("li").size(), 1, "One filter should be selected.");

        var filterPluginInstance = wdzt.osd.filterPluginInstance;
        ok(filterPluginInstance, "Filter plugin should be instantiated.");
        equal(filterPluginInstance.filters[0].processors.length, 1,
                "One filter should be set");

        $selected.find("li img").first().click();
        
        equal($selected.find("li").size(), 0, "No filter should be selected.");
        equal(filterPluginInstance.filters[0].processors.length, 0,
                "No filter should be set");
    });

})();

