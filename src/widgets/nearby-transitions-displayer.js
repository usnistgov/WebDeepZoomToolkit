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

(function($$) {

    $$.NearbyTransitionsDisplayer = function(options) {

        $.extend(true, this, {
            hash: $$.guid(),
            onReady: function() {
            }
        }, options);

        var energyId = "wdzt-transition-energy-" + this.hash;
        var tableId = "wdzt-transition-table-" + this.hash;
        var transitionValueLineClass = "wdzt-transition-value-line-" + this.hash;
        var xray = $$.XRay.getInstance(this.xrayUrl, this.onReady);

        this.$element.html(
                "Energy: <span id=\"" + energyId + "\">0.000 eV</span>" +
                "<table id=\"" + tableId + "\" class=\"wdzt-transition-table\">" +
                "<tr>" +
                "<th>Transition</th>" +
                "<th>Energy</th>" +
                "<th>Weight</th>" +
                "</tr>" +
                "</table>");

        this.setEnergy = function(energy) {
            $("#" + energyId).text(energy.toFixed(3) + " eV");
            $("." + transitionValueLineClass).remove();
            var transitions = xray.getNearbyTransitions(energy, 20);
            transitions.forEach(function(transition) {
                var line = $(
                        "<tr class=\"" + transitionValueLineClass + "\">" +
                        "<td class=\"transitionName\">" + transition.name + "</td>" +
                        "<td class=\"transitionEnergy\">" + transition.energy.toFixed(3) + "eV</td>" +
                        "<td class=\"transitionWeight\">" + transition.weight.toFixed(3) + "</td>" +
                        "</tr>");
                $("#" + tableId).append(line);
            });
        };
    };

}(WDZT));
