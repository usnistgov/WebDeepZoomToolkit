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

    var name = "ScalebarModule";

    $$.ScalebarModule = function(options) {

        this.name = name;
        this.title = "Scalebar options";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        this.enabledId = "wdzt-scalebar-enabled-" + this.hash;
        this.locationId = "wdzt-scalebar-location-" + this.hash;
        this.colorId = "wdzt-scalebar-color-" + this.hash;
        this.backgroundId = "wdzt-scalebar-background-" + this.hash;

        this.$container.html(
                Handlebars.compile([
                    '<form class="wdzt-scalebar-form">',
                    '    <ol>',
                    '        <li>',
                    '            <label for="{{enabledId}}">Display scale bar: </label>',
                    '            <input type="checkbox" id="{{enabledId}}" checked />',
                    '        </li>',
                    '        <li>',
                    '            <label for="{{locationId}}">Location: </label>',
                    '            <select id="{{locationId}}">',
                    '                <option value="TOP_LEFT">Top left</option>',
                    '                <option value="TOP_RIGHT">Top right</option>',
                    '                <option value="BOTTOM_LEFT">Bottom left</option>',
                    '                <option value="BOTTOM_RIGHT" selected>Bottom right</option>',
                    '            </select>',
                    '        </li>',
                    '        <li>',
                    '            <label for="{{colorId}}">Color: </label>',
                    '            <select id="{{colorId}}">',
                    '                <option value="black">Black</option>',
                    '                <option value="white">White</option>',
                    '            </select>',
                    '        </li>',
                    '        <li>',
                    '            <label for="{{backgroundId}}">Background: </label>',
                    '            <input type="checkbox" id="{{backgroundId}}" checked />',
                    '        </li>',
                    '    </ol>',
                    '</form>'
                ].join(''))({
            enabledId: this.enabledId,
            locationId: this.locationId,
            colorId: this.colorId,
            backgroundId: this.backgroundId
        }));

        this._updateScalebar = function() {
            var options = {
                minWidth: "10em",
                pixelsPerMeter: 0,
                xOffset: 10,
                yOffset: 10
            };
            var displayScalebar = $("#" + _this.enabledId).prop("checked");
            var layerOptions = _this.viewer.selectedLayer.scalebar;
            if (displayScalebar && layerOptions) {
                options.pixelsPerMeter = layerOptions.pixelsPerMeter;
                switch (layerOptions.unitType) {
                    case "time":
                        options.sizeAndTextRenderer = OpenSeadragon.
                                ScalebarSizeAndTextRenderer.STANDARD_TIME;
                        break;
                    case "energy":
                        options.sizeAndTextRenderer = function(ppeV, minSize) {
                            return OpenSeadragon.ScalebarSizeAndTextRenderer.
                                    METRIC_GENERIC(ppeV, minSize, "eV");
                        };
                        break;
                    default:
                        options.sizeAndTextRenderer = OpenSeadragon.
                                ScalebarSizeAndTextRenderer.METRIC_LENGTH;
                }
                switch ($("#" + _this.locationId).val()) {
                    case "TOP_LEFT":
                        options.location = OpenSeadragon.ScalebarLocation.TOP_LEFT;
                        break;
                    case "TOP_RIGHT":
                        options.location = OpenSeadragon.ScalebarLocation.TOP_RIGHT;
                        break;
                    case "BOTTOM_LEFT":
                        options.location = OpenSeadragon.ScalebarLocation.BOTTOM_LEFT;
                        break;
                    default:
                        options.location = OpenSeadragon.ScalebarLocation.BOTTOM_RIGHT;
                }
                var color = $("#" + _this.colorId).val();
                options.color = color;
                options.fontColor = color;
                options.backgroundColor = "rgba(255, 255, 255, 0)"; // no background
                if ($("#" + _this.backgroundId).prop("checked")) {
                    switch (color) {
                        case "white":
                            //transparent black
                            options.backgroundColor = "rgba(0, 0, 0, 0.5)";
                            break;
                        default:
                            //transparent white
                            options.backgroundColor = "rgba(255, 255, 255, 0.5)";
                    }
                }
            }
            _this.viewer.osd.scalebar(options);
        };

        $("#" + this.enabledId).change(this._updateScalebar);
        $("#" + this.locationId).change(this._updateScalebar);
        $("#" + this.colorId).change(this._updateScalebar);
        $("#" + this.backgroundId).change(this._updateScalebar);

        this.viewer.addHandler("layer-changed", this._updateScalebar);
    };

    // Register itself
    $$.Module.MODULES[name] = $$.ScalebarModule;

    $.extend($$.ScalebarModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 90;
        },
        supportLayer: function(layer) {
            return !!layer.scalebar;
        },
        destroy: function() {
            this.viewer.removeHandler("layer-changed", this._updateScalebar);
        }
    });

}(WDZT));
