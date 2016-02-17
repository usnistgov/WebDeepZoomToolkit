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

    var name = "LayerCompositionModule";

    $$.LayerCompositionModule = function(options) {

        this.name = name;
        this.title = "Layer composition";

        $.extend(true, this, {
            id: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        this.sortableId = "wdzt-layer-composition-sortable-" + this.id;
        this.inputClass = "wdzt-layer-composition-input-" + this.id;
        this.sliderClass = "wdzt-layer-composition-slider-" + this.id;
        var _this = this;

        var template = Handlebars.compile([
            '<div id="{{sortableId}}" class="wdzt-table-layout">',
            '    {{#each layers}}',
            '    <div class="wdzt-row-layout">',
            '        <div class="wdzt-cell-layout">',
            '            <div class="ui-icon ui-icon-arrowthick-2-n-s">',
            '            </div>',
            '        </div>',
            '        <div class="wdzt-cell-layout">',
            '            <input id="{{../prefix}}-{{id}}-{{../suffix}}"',
            '                   class="{{../inputClass}}"',
            '                   data-layer-id="{{id}}"',
            '                   type="checkbox"/>',
            '        </div>',
            '        <div class="wdzt-cell-layout wdzt-no-wrap">',
            '            <label for="{{../prefix}}-{{id}}-{{../suffix}}">{{name}}</label>',
            '        </div>',
            '        <div class="wdzt-cell-layout wdzt-full-width">',
            '            <div class="{{../sliderClass}} wdzt-menu-slider"',
            '                 data-layer-id="{{id}}">',
            '            </div>',
            '        </div>',
            '    </div>',
            '    {{/each}}',
            '</div>'
        ].join(''));

        var superposedLayers = {};

        function addSuperposedLayer(layerId) {
            var layer = _this.viewer.manifest.getLayer(layerId);
            var url = _this.viewer.manifest.getFrameUrlFunc(layer)(
                    _this.viewer.osdMovie.getCurrentFrame());
            var checkBox = $("." + _this.inputClass +
                    "[data-layer-id='" + layer.id + "']");
            var slider = $("." + _this.sliderClass +
                    "[data-layer-id='" + layer.id + "']");
            var opacity = slider.slider("value");
            var index = getLayerIndex(layerId);

            var options = {
                tileSource: url,
                opacity: opacity,
                index: index,
                error: function(event) {
                    checkBox.prop("checked", false);
                    slider.slider("disable");
                    _this.viewer.displayError("Cannot superpose layer \"" +
                            layer.name + "\": " + event.message);
                },
                success: function(event) {
                    superposedLayers[layer.id] = event.item;
                    checkBox.prop("checked", true);
                    slider.slider("enable");
                }
            };
            _this.viewer.osd.addTiledImage(options);
        }

        function removeSuperposedLayer(layerId) {
            var item = superposedLayers[layerId];
            if (item !== undefined) {
                delete superposedLayers[layerId];
                _this.viewer.osd.world.removeItem(item);
            }
            $("." + _this.inputClass + "[data-layer-id='" + layerId + "']").
                    prop("checked", false);
            $("." + _this.sliderClass + "[data-layer-id='" + layerId + "']").
                    slider("disable");
        }

        function refreshLayersOrder() {
            var osd = _this.viewer.osd;
            var layersCount = osd.world.getItemCount();
            $("." + _this.inputClass + ":checked").each(function(index) {
                var layerId = $(this).attr("data-layer-id");
                var item = superposedLayers[layerId];
                if (item) {
                    osd.world.setItemIndex(item, layersCount - index - 1);
                }
            });
        }

        function getLayerIndex(layerId) {
            var $layer = $("." + _this.inputClass + "[data-layer-id='" +
                    layerId + "']");
            var layersCount = _this.viewer.osd.world.getItemCount();
            return layersCount -
                    $("." + _this.inputClass + ":checked").index($layer);
        }

        this._layerChangedHandler = function(event) {
            superposedLayers = {};
            var layer = event.layer;
            if (!_this.supportLayer(layer)) {
                _this.$container.html("");
                return;
            }
            var layers = getOtherLayersOfGroup(_this.viewer.manifest, layer);
            _this.$container.html(template({
                layers: layers,
                sortableId: _this.sortableId,
                inputClass: _this.inputClass,
                prefix: "wdzt-layer-composition",
                suffix: _this.id,
                sliderClass: _this.sliderClass
            }));

            // Ensure that the label and slider stay the same size during a
            // sorting drag.
            $("#" + _this.sortableId + " label").parent().
                    add("#" + _this.sortableId + " .wdzt-last-cell-layout").
                    each(function() {
                        var width = $(this).width();
                        $(this).width(width);
                    });

            $("#" + _this.sortableId).sortable({
                containment: "parent",
                axis: "y",
                tolerance: "pointer",
                update: refreshLayersOrder
            });

            $("." + _this.sliderClass).slider({
                min: 0,
                max: 1,
                step: 0.01,
                value: 0.5,
                disabled: true,
                slide: function(event, ui) {
                    var opacity = ui.value;
                    var layerId = $(event.target).attr("data-layer-id");
                    var item = superposedLayers[layerId];
                    if (item) {
                        item.setOpacity(opacity);
                    }
                }
            });

            $("." + _this.inputClass).change(function(checkboxEvent) {
                var layerId = $(checkboxEvent.target).attr("data-layer-id");
                var checked = $(checkboxEvent.target).prop("checked");
                if (checked) {
                    addSuperposedLayer(layerId);
                } else {
                    removeSuperposedLayer(layerId);
                }
            });
        };

        this._frameChangeHandler = function() {
            var world = _this.viewer.osd.world;
            var count  = world.getItemCount();
            for (var i = count - 1; i > 0; i--) {
                world.removeItem(world.getItemAt(i));
            }
            superposedLayers = {};
        };

        this._frameChangedHandler = function() {
            $("." + _this.inputClass + ":checked").each(function() {
                var layerId = $(this).attr("data-layer-id");
                addSuperposedLayer(layerId);
            });
        };

        this.viewer.addHandler("layer-changed", this._layerChangedHandler);
        this.viewer.osdMovie.addHandler("frame-change", this._frameChangeHandler);
        this.viewer.osdMovie.addHandler("frame-changed", this._frameChangedHandler);
    };

    // Register itself
    $$.Module.MODULES[name] = $$.LayerCompositionModule;

    $.extend($$.LayerCompositionModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 5;
        },
        supportLayer: function(layer) {
            return this.viewer.manifest.getLayerGroup(layer).layers.length > 1;
        },
        destroy: function() {
            this.viewer.removeHandler("layer-changed", this._layerChangedHandler);
            this.viewer.osdMovie.removeHandler("frame-change", this._frameChangeHandler);
            this.viewer.osdMovie.removeHandler("frame-changed", this._frameChangedHandler);
        }
    });

    function getOtherLayersOfGroup(manifest, layer) {
        var result = [];
        var allLayers = manifest.getLayerGroup(layer).layers;
        for (var i = 0; i < allLayers.length; i++) {
            var l = allLayers[i];
            if (l !== layer) {
                result.push(l);
            }
        }
        return result;
    }

}(WDZT));
