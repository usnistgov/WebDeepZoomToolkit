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

    'use strict';

    var name = "NearbyTransitionsModule";

    $$.NearbyTransitionsModule = function(options) {

        this.name = name;
        this.title = "Nearby transitions";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        var displayer = new $$.NearbyTransitionsDisplayer({
            $element: this.$container,
            hash: this.hash,
            xrayUrl: this.xrayUrl
        });
        this.mouseTracker = new OpenSeadragon.MouseTracker({
            element: this.viewer.osd.element,
            moveHandler: function(event) {
                var position = event.position;
                var imagePosition = _this.viewer.osd.viewport.
                        viewerElementToImageCoordinates(position);
                displayer.setEnergy(imagePosition.x * 10);
            }
        });
        this.mouseTracker.setTracking(false);
        this.isEnabled = false;
    };


    // Register itself
    $$.Module.MODULES[name] = $$.NearbyTransitionsModule;

    $.extend($$.NearbyTransitionsModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 41;
        },
        supportLayer: function(layer) {
            return !!layer.xrayTransitions;
        },
        enable: function() {
            if (!this.isEnabled) {
                this.mouseTracker.setTracking(true);
                this.isEnabled = true;
            }
            return this;
        },
        disable: function() {
            if (this.isEnabled) {
                this.mouseTracker.setTracking(false);
                this.isEnabled = false;
            }
            return this;
        },
        destroy: function() {
            this.disable();
        }
    });

}(WDZT));
