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
    var xray;

    module("xraytransitions", {
        setup: function() {
            if (!xray) {
                xray = new WDZT.XRay("data/xrays.xml", start);
                stop();
            }
        }
    });



    test("getTransitionByName", function() {
        equal(xray.getTransitionByName("unknown"), undefined,
                "Unknown transition should return undefined.");

        deepEqual(xray.getTransitionByName("Cu K-L2"), {
            "color": "#c88033",
            "element": "Cu",
            "energy": 8027.899999999999,
            "family": "K",
            "name": "Cu K-L2",
            "weight": 0.2967204881456124
        },
        "Erroneous Cu K-L2 transition.");
    });

    test("getTransitionsOfElement", function() {
        equal(xray.getTransitionsOfElement("H").length, 0,
                "H should have no transitions.");

        equal(xray.getTransitionsOfElement("Cu").length, 14,
                "Cu should have 14 transitions.");
    });

    test("getFamiliesOfElement", function() {
        deepEqual(xray.getFamiliesOfElement("H"), {},
                "H should have no family.");

        deepEqual(xray.getFamiliesOfElement("Be"), {
            K: [{
                    "color": "#c2ff00",
                    "element": "Be",
                    "energy": 108.5,
                    "family": "K",
                    "name": "Be K-L2",
                    "weight": 1
                }]
        }, "Unexpected Be families.");
    });

    QUnit.assert.isNearestTransition = function(transition, energy, message) {
        var transitions = xray.getTransitions();
        var diff = Math.abs(transition.energy - energy);
        var nearest = transition;
        transitions.forEach(function(t) {
            var distance = Math.abs(t.energy - energy);
            if (distance < diff) {
                nearest = t;
                diff = distance;
            }
        });
        QUnit.push(nearest === transition, transition, nearest, message);
    };

    test("getNearestTransition", function() {
        QUnit.assert.isNearestTransition(xray.getNearestTransition(10500),
                10500, "Wrong closest transition for energy 10500");

        QUnit.assert.isNearestTransition(xray.getNearestTransition(0),
                0, "Wrong closest transition for energy 0");

        QUnit.assert.isNearestTransition(xray.getNearestTransition(122000),
                122000, "Wrong closest transition for energy 122000");
    });

    function checkNearbyTransitions(energy, number) {
        var transitions = xray.getNearbyTransitions(energy, number);
        equal(transitions.length, number,
                "Wrong number of transitions for energy " + energy +
                " and number " + number);

        equal(transitions[0], xray.getNearestTransition(energy),
                "Nearest transition is not the first one in nearest for energy "
                + energy + " and number " + number);

        var dist = Math.abs(transitions[0].energy - energy);
        transitions.forEach(function(t) {
            var newDist = Math.abs(t.energy - energy);
            if (newDist < dist) {
                ok(false, "Transitions not correctly sorted for energy " +
                        energy + " and number " + number);
            }
            dist = newDist;
        });
    }

    test("getNearbyTransitions", function() {
        checkNearbyTransitions(10500, 1);
        checkNearbyTransitions(10500, 10);
        checkNearbyTransitions(0, 1);
        checkNearbyTransitions(0, 10);
        checkNearbyTransitions(122000, 1);
        checkNearbyTransitions(122000, 10);
    });

})();
