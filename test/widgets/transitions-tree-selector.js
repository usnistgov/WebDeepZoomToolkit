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

    var selector;
    var xray;

    module("transitions-tree-selector", {
        setup: function() {
            if (!selector) {
                selector = new WDZT.TransitionsTreeSelector({
                    $element: $("#qunit-fixture"),
                    xrayUrl: "data/xrays.xml",
                    onReady: start
                });
                stop();
            }
            if (!xray) {
                xray = WDZT.XRay.getInstance("data/xrays.xml", start);
                stop();
            }
        }
    });

    test("getSelectedTransitions", function() {
        equal(selector.getSelectedTransitions(), 0,
                "There should be no selected transitions after init.");

        var $input = $("#wdzt-transitions-tree-selector-input-" + selector.hash);
        $input.val("Cu");
        $input.keyup();

        equal(selector.getSelectedTransitions(), 0,
                "There should be no selected transitions after input change.");

        var $transitionsLines = $(".wdzt-transition-name");
        equal($transitionsLines.length, xray.getTransitionsOfElement("Cu").length,
                "Wrong number of transitions.");

        $transitionsLines.first().click();
        equal(selector.getSelectedTransitions().length, 1,
                "1 transition should be selected.");

        $transitionsLines.last().click();
        equal(selector.getSelectedTransitions().length, 2,
                "2 transitions should be selected.");

        $transitionsLines.first().click();
        equal(selector.getSelectedTransitions().length, 1,
                "1 transition should be selected.");

        $input.val("Au");
        $input.keyup();

        equal(selector.getSelectedTransitions().length, 1,
                "1 transition should be selected.");

        $transitionsLines = $(".wdzt-transition-name");
        $transitionsLines.last().click();
        equal(selector.getSelectedTransitions().length, 2,
                "2 transitions should be selected.");
    });

})();
