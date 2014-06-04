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

    var name = "DisplayInfoModule";

    $$.DisplayInfoModule = function(options) {

        var _this = this;
        this.name = name;
        this.title = "Display info";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        this.imageCoordsId = "wdzt-display-info-image-coords-" + this.hash;
        this.screenCoordsId = "wdzt-display-info-screen-coords-" + this.hash;
        this.intensityId = "wdzt-display-info-intensity-" + this.hash;
        this.formZoomLevelId = "wdzt-display-info-zoom-" + this.hash;
        this.topLeftXId = "wdzt-display-info-top-left-x-" + this.hash;
        this.topLeftYId = "wdzt-display-info-top-left-y-" + this.hash;
        this.widthId = "wdzt-display-info-width-" + this.hash;
        this.heightId = "wdzt-display-info-height-" + this.hash;

        this.$container.html(
                Handlebars.compile([
                    '<div class="wdzt-display-info-div">',
                    '    <fieldset class="wdzt-display-cursor-info-fs">',
                    '        <legend>Cursor info</legend>',
                    '        <ol>',
                    '            <li>',
                    '                <div class="wdzt-display-label">Image coords:</div>',
                    '                <div class="wdzt-dispay-value" id="{{imageCoordsId}}"/>',
                    '            </li>',
                    '            <li>',
                    '                <div class="wdzt-display-label">Screen coords:</div>',
                    '                <div class="wdzt-dispay-value" id="{{screenCoordsId}}"/>',
                    '            </li>',
                    '            <li>',
                    '                <div class="wdzt-display-label">Intensity:</div>',
                    '                <div class="wdzt-dispay-value" id="{{intensityId}}"/>',
                    '            </li>',
                    '        </ol>',
                    '    </fieldset>',
                    '    <fieldset class="wdzt-display-fov-info-fs">',
                    '        <legend>Field of view info</legend>',
                    '        <ol>',
                    '            <li>',
                    '                <div class="wdzt-display-label">Zoom:</div>',
                    '                <div class="wdzt-dispay-value">',
                    '                    <input type="text" name="editable-zoom-level" ',
                    '                           id="{{formZoomLevelId}}"',
                    '                           size="4"',
                    '                           class="ui-widget-content ui-corner-all"/>',
                    '                    %',
                    '                </div>',
                    '            </li>',
                    '            <li>',
                    '                <div class="wdzt-display-label">X (top left):</div>',
                    '                <div class="wdzt-dispay-value" id={{topLeftXId}}/>',
                    '            </li>',
                    '            <li>',
                    '                <div class="wdzt-display-label">Y (top left):</div>',
                    '                <div class="wdzt-dispay-value" id={{topLeftYId}}/>',
                    '            </li>',
                    '            <li>',
                    '                <div class="wdzt-display-label">Width:</div>',
                    '                <div class="wdzt-dispay-value" id={{widthId}}/>',
                    '            </li>',
                    '            <li>',
                    '                <div class="wdzt-display-label">Height:</div>',
                    '                <div class="wdzt-dispay-value" id={{heightId}}/>',
                    '            </li>',
                    '        </ol>',
                    '    </fieldset>',
                    '</div>'
                ].join(''))({
            imageCoordsId: this.imageCoordsId,
            screenCoordsId: this.screenCoordsId,
            intensityId: this.intensityId,
            formZoomLevelId: this.formZoomLevelId,
            topLeftXId: this.topLeftXId,
            topLeftYId: this.topLeftYId,
            widthId: this.widthId,
            heightId: this.heightId
        }));

        var $spinner = $("#" + this.formZoomLevelId).spinner({
            spin: function(event, ui) {
                if (!_this.viewer.osd.viewport) {
                    return;
                }
                var direction = ui.value - $spinner.spinner("value");
                if (direction > 0) {
                    _this.viewer.osd.viewport.zoomBy(1.1);
                } else {
                    _this.viewer.osd.viewport.zoomBy(1 / 1.1);
                }
                event.preventDefault();
            }
        });

        this._zoomLevelKeyPressHandler = function(e) {
            if (e.keyCode === 13 && _this.viewer.osd.viewport) {
                var zoom = parseFloat($("#" + _this.formZoomLevelId).val()) / 100;
                var viewport = _this.viewer.osd.viewport;
                viewport.zoomTo(viewport.imageToViewportZoom(zoom), null, true);
            }
        };

        this.updateFovHandler = function() {
            var viewport = _this.viewer.osd.viewport;
            var zoom = "";
            var x = "";
            var y = "";
            var width = "";
            var height = "";
            if (viewport) {
                zoom = (viewport.viewportToImageZoom(viewport.getZoom(true)) * 100).toPrecision(4);
                var bounds = viewport.viewportToImageRectangle(viewport.getBounds(true));
                x = bounds.x.toFixed(0);
                y = bounds.y.toFixed(0);
                width = bounds.width.toFixed(0);
                height = bounds.height.toFixed(0);
            }
            $("#" + _this.formZoomLevelId).val(zoom);
            $("#" + _this.topLeftXId).text(x);
            $("#" + _this.topLeftYId).text(y);
            $("#" + _this.widthId).text(width);
            $("#" + _this.heightId).text(height);
        };

        this.mouseTracker = new OpenSeadragon.MouseTracker({
            element: _this.viewer.osd.element,
            stopHandler: function(event) {
                var position = event.position;

                $("#" + _this.screenCoordsId).text(
                        position.x.toFixed(0) + "," + position.y.toFixed(0));

                if (!_this.viewer.osd.viewport) {
                    return;
                }
                var imagePosition = _this.viewer.osd.viewport.
                        viewerElementToImageCoordinates(position);
                $("#" + _this.imageCoordsId).text(
                        imagePosition.x.toFixed(0) + "," + imagePosition.y.toFixed(0));

                var colorData = _this.viewer.osd.getPixelColor(position);
                if (colorData !== null) {
                    var intensity = (colorData[0] + colorData[1] + colorData[2]) / 3;
                    $("#" + _this.intensityId).text(intensity);
                }
            }
        }).setTracking(false);

        this.isEnabled = false;
    };

    // Register itself
    $$.Module.MODULES[name] = $$.DisplayInfoModule;

    $.extend($$.DisplayInfoModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 10;
        },
        supportLayer: function() {
            return true;
        },
        enable: function() {
            if (!this.isEnabled) {
                this.mouseTracker.setTracking(true);
                this.viewer.addHandler("layer-changed", this.updateFovHandler);
                this.viewer.osd.addHandler("open", this.updateFovHandler);
                this.viewer.osd.addHandler("animation", this.updateFovHandler);
                this.updateFovHandler();
                $("#" + this.formZoomLevelId).bind("keyup", this._zoomLevelKeyPressHandler);
                this.isEnabled = true;
            }
            return this;
        },
        disable: function() {
            if (this.isEnabled) {
                this.mouseTracker.setTracking(false);
                this.viewer.removeHandler("movie-changed", this.updateFovHandler);
                this.viewer.osd.removeHandler("open", this.updateFovHandler);
                this.viewer.osd.removeHandler("animation", this.updateFovHandler);
                $("#" + this.formZoomLevelId).unbind("keyup", this._zoomLevelKeyPressHandler);
                this.isEnabled = false;
            }
            return this;
        },
        destroy: function() {
            this.disable();
        }

    });

}(WDZT));
