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

    var name = "LayerSelectionModule";

    $$.LayerSelectionModule = function(options) {

        this.name = name;
        this.title = "Layer selection";

        $.extend(true, this, {
            id: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        this.layers = [];
        this.selectId = "wdzt-layers-selection-" + this.id;
        var _this = this;

        this.$container.html(
                Handlebars.compile([
                    '<div>',
                    '    <label for="{{selectId}}">Layer</label>',
                    '    <select id="{{selectId}}"></select>',
                    '</div>'
                ].join(''))({selectId: this.selectId}));

        this._loadLayers = function() {
            $("#" + _this.selectId).empty();
            _this.layers = _this.viewer.manifest.getLayers();
            _this.layers.forEach(function(layer) {
                $("<option/>")
                        .val(layer.id)
                        .text(layer.name)
                        .appendTo($("#" + _this.selectId));
            });
        };
        this.viewer.addHandler("open", this._loadLayers);

        this._updateSelected = function(event) {
            $("#" + _this.selectId).val(event.layer.id);
        };
        this.viewer.addHandler("layer-changed", this._updateSelected);

        this._selectionChangedHandler = function() {
            var selectedLayerIdx = $("#" + _this.selectId + " option").index(
                    $("#" + _this.selectId + " option:selected"));
            var layer = _this.layers[selectedLayerIdx];
            _this.viewer.displayLayer(layer);
        };
        $("#" + this.selectId).bind("change", this._selectionChangedHandler);

    };

    // Register itself
    $$.Module.MODULES[name] = $$.LayerSelectionModule;

    $.extend($$.LayerSelectionModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 0;
        },
        supportLayer: function() {
            return true;
        },
        destroy: function() {
            this.viewer.removeHandler("open", this._loadLayers);
            this.viewer.removeHandler("layer-changed", this._updateSelected);
            $("#" + this.selectId).unbind("change", this._selectionChangedHandler);
        }

    });

}(WDZT));
