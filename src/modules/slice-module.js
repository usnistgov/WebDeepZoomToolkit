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

    var name = "SliceModule";

    $$.SliceModule = function(options) {

        this.name = name;
        this.title = "Slice Navigation";

        $.extend(true, this, {
            id: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        this.$container.html(
                Handlebars.compile([
                    '<div>',
                    '    <p>menu</p>',
                    '</div>'
                ].join(''))());

        //this.viewer.addHandler("layer-changed", this._updateTestModule);
    };

    // Register itself
    $$.Module.MODULES[name] = $$.SliceModule;

    $.extend($$.SliceModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 2;
        },
        supportLayer: function(layer) {
            return !!layer.zslice;
        },
        destroy: function() {
            //this.viewer.removeHandler("layer-changed", this._updateScalebar);
        }

    });

}(WDZT));
