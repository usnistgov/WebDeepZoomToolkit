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

    var displayer;

    module("nearby-transitions-displayer", {
        setup: function() {
            if (!displayer) {
                displayer = new WDZT.NearbyTransitionsDisplayer({
                    $element: $("#qunit-fixture"),
                    xrayUrl: "data/xrays.xml",
                    onReady: start
                });
                stop();
            }
        }
    });

    test("setEnergy", function() {
        displayer.setEnergy(0);
        var text = $("#wdzt-transition-energy-" + displayer.hash).text();
        equal(text, "0.000 eV");
        var nbRows = $("#wdzt-transition-table-" + displayer.hash + " tr").length;
        equal(nbRows, 21, "21 rows should be presents.");

        displayer.setEnergy(1000);
        var text = $("#wdzt-transition-energy-" + displayer.hash).text();
        equal(text, "1000.000 eV");
        var nbRows = $("#wdzt-transition-table-" + displayer.hash + " tr").length;
        equal(nbRows, 21, "21 rows should be presents.");
    });

})();
