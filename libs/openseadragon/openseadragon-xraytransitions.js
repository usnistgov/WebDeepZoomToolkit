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


(function($) {

    $.Viewer.prototype.xRayTransitions = function() {
        if (!this.xRayTransitionsInstance) {
            this.xRayTransitionsInstance = new $.XRayTransitions(this);
        }
        return this.xRayTransitionsInstance;
    };

    $.XRayTransitions = function(viewer) {
        if (!viewer) {
            throw new Error("A viewer must be specified.");
        }

        var index = 0;
        var transitions = {};

        this.addTransition = function(transition, binSize) {
            var color = transition.color || "red";
            binSize = binSize || 10;
            
            index++;
            transitions[transition.name] =  {
                transition: transition,
                index: index
            };
            
            var px = transition.energy / binSize;
            var height = viewer.source.dimensions.y;
            var div = document.createElement("div");
            div.id = "xraytransition-layer-" + index;
            div.style.backgroundColor = color;
            div.style.opacity = "0.4";

            var tooltip = document.createElement("div");
            tooltip.id = "xraytransition-layer-tooltip-" + index;
            tooltip.style.display = "none";
            tooltip.style.color = "black";
            tooltip.style.backgroundColor = "white";
            tooltip.style.border = "1px solid #0A7EbE";
            tooltip.style.opacity = "0.4";
            tooltip.innerHTML = transition.name + "<br>"+ transition.energy +
                " eV<br>Weight: " + transition.weight;
            var tip = jQuery(tooltip);
            jQuery(div).hover(function(e) {
                div.style.opacity = "0.9";
                var screenPixel = $.getMousePosition(e).minus(
                    $.getElementPosition(viewer.element));
                var x = screenPixel.x + 20;
                var y = screenPixel.y + 20;
                var tipWidth = tip.width();
                var tipHeight = tip.height();
                var viewerWidth = jQuery(viewer.element).width();
                var viewerHeight = jQuery(viewer.element).height();
                if (x + tipWidth > viewerWidth) {
                    x = screenPixel.x - tipWidth - 20;
                }
                if (y + tipHeight > viewerHeight) {
                    y = screenPixel.y - tipHeight - 20;
                }
                tip.css({left: x, top: y, position: "absolute"});
                tip.show();
            }, function() {
                div.style.opacity = "0.4";
                tip.hide();
            });
            viewer.container.appendChild(tooltip);

            var rect = viewer.viewport.imageToViewportRectangle(px, 0, 1, height);
            viewer.addOverlay(div, rect);
        };

        this.removeTransition = function(transition) {
            var tuple = transitions[transition.name];
            if (!tuple) {
                return;
            }
            delete transitions[transition.name];
            viewer.removeOverlay("xraytransition-layer-" + tuple.index);
            viewer.container.removeChild(document.getElementById(
                "xraytransition-layer-tooltip-" + tuple.index));
        };
        
        this.removeAllTransitions = function() {
            for (var transition in transitions) {
                this.removeTransition(transition);
            }
        };
    };

}(OpenSeadragon));
