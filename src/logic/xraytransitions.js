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

    $$.XRay = function(url, onReady) {
        var transitionsByElements = [];
        var transitionsByNames = {};
        var transitionsSortedByEv = [];

        function loadTransitionsFromXml(xml) {
            if (xml.childNodes.length !== 1 || xml.childNodes[0].nodeName !== "list") {
                throw new Error("Not supported format.");
            }

            transitionsByElements = {};
            transitionsByNames = {};
            transitionsSortedByEv = [];
            var node = xml.childNodes[0].firstElementChild;
            while (node) {
                if (node.nodeName !== "list") {
                    throw new Error("Not supported format.");
                }
                var nameNode = node.firstElementChild;
                if (nameNode.nodeName !== "string") {
                    throw new Error("Not supported format.");
                }
                var weightNode = nameNode.nextElementSibling;
                if (weightNode.nodeName !== "double") {
                    throw new Error("Not supported format.");
                }
                var energyNode = weightNode.nextElementSibling;
                if (energyNode.nodeName !== "double") {
                    throw new Error("Not supported format.");
                }

                var name = nameNode.textContent;
                var spaceSplit = nameNode.textContent.split(" ", 2);
                var element = spaceSplit[0];
                var commaSplit = spaceSplit[1].split("-", 2);
                var family = commaSplit[0];
                var weight = Number(weightNode.textContent);
                var energy = Number(energyNode.textContent);
                var color = $$.ElementColor.getElementColor(element);

                var transition = {
                    name: name,
                    element: element,
                    family: family,
                    weight: weight,
                    energy: energy,
                    color: color
                };
                addToTransitionsByElements(transition);
                transitionsByNames[transition.name] = transition;
                transitionsSortedByEv.push(transition);
                node = node.nextElementSibling;
            }

            transitionsSortedByEv.sort(function(a, b) {
                return a.energy - b.energy;
            });

            if (onReady) {
                onReady();
            }
        }

        function addToTransitionsByElements(transition) {
            var elementTransitions = transitionsByElements[transition.element];
            if (!elementTransitions) {
                transitionsByElements[transition.element] = [transition];
            } else {
                elementTransitions.push(transition);
            }
        }

        this.getTransitions = function() {
            return transitionsSortedByEv.slice();
        };

        this.getTransitionByName = function(name) {
            return transitionsByNames[name];
        };

        this.getTransitionsOfElement = function(element) {
            return transitionsByElements[element] || [];
        };

        this.getFamiliesOfElement = function(element) {
            var transitions = this.getTransitionsOfElement(element);
            var families = {};
            transitions.forEach(function(transition) {
                var familyTransitions = families[transition.family];
                if (!familyTransitions) {
                    families[transition.family] = [transition];
                } else {
                    familyTransitions.push(transition);
                }
            });
            return families;
        };

        function getNearestTransitionIndex(energy) {
            if (transitionsSortedByEv.length === 0) {
                throw new Error("No transition loaded.");
            }

            for (var i = 0; i < transitionsSortedByEv.length; i++) {
                var transition = transitionsSortedByEv[i];
                if (transition.energy >= energy) {
                    if (i === 0) {
                        return 0;
                    }
                    return transition.energy - energy <
                            energy - transitionsSortedByEv[i - 1].energy ?
                            i : i - 1;
                }
            }
            return transitionsSortedByEv.length - 1;
        }

        this.getNearestTransition = function(energy) {
            return transitionsSortedByEv[getNearestTransitionIndex(energy)];
        };

        this.getNearbyTransitions = function(energy, number) {
            if (number > transitionsSortedByEv.length) {
                throw new Error("Less transitions loaded than requested.");
            }

            var result = [];
            var nearestIndex = getNearestTransitionIndex(energy);
            result.push(transitionsSortedByEv[nearestIndex]);

            var belowIndex = nearestIndex - 1;
            var aboveIndex = nearestIndex + 1;
            while (result.length !== number &&
                    belowIndex >= 0 &&
                    aboveIndex < transitionsSortedByEv.length) {
                var belowDistance = energy - transitionsSortedByEv[belowIndex].energy;
                var aboveDistance = transitionsSortedByEv[aboveIndex].energy - energy;
                if (belowDistance < aboveDistance) {
                    result.push(transitionsSortedByEv[belowIndex]);
                    belowIndex--;
                } else {
                    result.push(transitionsSortedByEv[aboveIndex]);
                    aboveIndex++;
                }
            }
            if (result.length !== number) {
                if (belowIndex < 0) {
                    while (result.length !== number) {
                        result.push(transitionsSortedByEv[aboveIndex]);
                        aboveIndex++;
                    }
                } else {
                    while (result.length !== number) {
                        result.push(transitionsSortedByEv[belowIndex]);
                        belowIndex--;
                    }
                }
            }

            return result;
        };

        $.ajax({
            type: "GET",
            url: url,
            dataType: "xml",
            success: loadTransitionsFromXml
        });
    };

    // Singleton
    var instances = {};
    $$.XRay.getInstance = function(url, onReady) {
        url = url || "data/xrays.xml";

        if (!instances[url]) {
            instances[url] = new $$.XRay(url, onReady);
        } else if (onReady) {
            setTimeout(onReady, 0);
        }
        return instances[url];
    };

}(WDZT));
