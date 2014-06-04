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

    var name = "TransitionsOverlayModule";

    $$.TransitionsOverlayModule = function(options) {

        this.name = name;
        this.title = "Display transitions";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        var selector = new $$.TransitionsTreeSelector({
            $element: this.$container,
            hash: this.hash,
            xrayUrl: this.xrayUrl,
            selectionChangedCallBack: function(transition, selected) {
                var xRayTransitions = _this.viewer.osd.xRayTransitions();
                if (selected) {
                    xRayTransitions.addTransition(transition);
                } else {
                    xRayTransitions.removeTransition(transition);
                }
            }
        });

        this.initLayerTransition = function() {
            var layer = _this.viewer.selectedLayer;
            var xrayTransitions = _this.viewer.osd.xRayTransitions();
            if (!layer.xrayTransitions) {
                xrayTransitions.removeAllTransitions();
            } else {
                var transitions = selector.getSelectedTransitions();
                transitions.forEach(function(transition) {
                    xrayTransitions.addTransition(transition);
                });
            }
        };

        this.viewer.osdMovie.addHandler("movie-changed", this.initLayerTransition);
        this.viewer.osdMovie.addHandler("frame-changed", this.initLayerTransition);
    };

    // Register itself
    $$.Module.MODULES[name] = $$.TransitionsOverlayModule;

    $.extend($$.TransitionsOverlayModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 40;
        },
        supportLayer: function(layer) {
            return !!layer.xrayTransitions;
        },
        destroy: function() {
            this.viewer.osdMovie.removeHandler("movie-changed", this.initLayerTransition);
            this.viewer.osdMovie.removeHandler("frame-changed", this.initLayerTransition);
        }
    });

}(WDZT));
