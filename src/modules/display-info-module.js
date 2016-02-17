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

    var name = "DisplayInfoModule";

    $$.DisplayInfoModule = function(options) {

        var _this = this;
        this.name = name;
        this.title = "Display info";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        this.cursorInfoFsId = "wdzt-display-cursor-info-fs" + this.hash;
        this.formZoomLevelId = "wdzt-display-info-zoom-" + this.hash;
        this.topLeftXId = "wdzt-display-info-top-left-x-" + this.hash;
        this.topLeftYId = "wdzt-display-info-top-left-y-" + this.hash;
        this.widthId = "wdzt-display-info-width-" + this.hash;
        this.heightId = "wdzt-display-info-height-" + this.hash;

        this.moduleTemplate = null;
        this.cursorInfoTemplate = null;
        this.intensityConverterHelpTemplate = null;

        $$.getHbsTemplate('src/modules/display-info-module-template.hbs',
                function(template) {
                    _this.moduleTemplate = template;
                    onTemplateReceived(_this);
                });
        $$.getHbsTemplate('src/modules/display-info-cursor-info-template.hbs',
                function(template) {
                    _this.cursorInfoTemplate = template;
                    onTemplateReceived(_this);
                });
        $$.getHbsTemplate('src/modules/display-info-intensity-converter-template.hbs',
                function(template) {
                    _this.intensityConverterHelpTemplate = template;
                    onTemplateReceived(_this);
                });

        this.allTemplatesLoaded = function() {
            return _this.moduleTemplate !== null &&
                    _this.cursorInfoTemplate !== null &&
                    _this.intensityConverterHelpTemplate !== null;
        };

        this.mouseTracker = new OpenSeadragon.MouseTracker({
            element: _this.viewer.osd.element,
            stopHandler: function(event) {
                _this.refreshCursorInfo(event.position);
            }
        }).setTracking(false);

        this._zoomLevelKeyPressHandler = function(e) {
            if (e.keyCode === 13 && _this.viewer.osd.viewport) {
                var zoom = parseFloat($("#" + _this.formZoomLevelId).val()) / 100;
                var viewport = _this.viewer.osd.viewport;
                viewport.zoomTo(viewport.imageToViewportZoom(zoom), null, true);
            }
        };

        this.updateFovHandler = function() {
            if (!_this.allTemplatesLoaded()) {
                return;
            }
            var viewport = _this.viewer.osd.viewport;
            var item = _this.viewer.osd.world.getItemAt(0);
            var zoom = "";
            var x = "";
            var y = "";
            var width = "";
            var height = "";
            if (viewport && item) {
                zoom = (item.viewportToImageZoom(viewport.getZoom(true)) * 100)
                        .toPrecision(4);
                var bounds = item.viewportToImageRectangle(
                        viewport.getBounds(true));
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

        this.refreshCursorInfo = function(position) {
            if (!_this.allTemplatesLoaded()) {
                return;
            }
            var context = {
                screenCoords: "",
                imageCoords: "",
                intensity: "",
                acquiredIntensity: "",
                imagesPrefix: _this.viewer.imagesPrefix
            };

            if (position) {
                context.screenCoords = position.x.toFixed(0) + "," +
                        position.y.toFixed(0);
                if (_this.viewer.osd.viewport) {
                    var imagePosition = _this.viewer.osd.world.getItemAt(0).
                            viewerElementToImageCoordinates(position);
                    context.imageCoords = imagePosition.x.toFixed(0) + "," +
                            imagePosition.y.toFixed(0);

                    var colorData = null;
                    try {
                        colorData = _this.viewer.osd.getPixelColor(position);
                    } catch (O_o) {
                        // Probably a cross origin policy error
                        window.console.log(O_o);
                        context.intensity = '';
                        context.acquiredIntensity = '';
                    }
                    if (colorData !== null) {
                        var intensity =
                                (colorData[0] + colorData[1] + colorData[2]) / 3;
                        context.intensity = intensity.toFixed(0);
                        if (_this.intensityConverter) {
                            context.acquiredIntensity = _this.intensityConverter(
                                    intensity).toFixed(0);
                        }
                    }
                }
            }
            $("#" + _this.cursorInfoFsId).html(_this.cursorInfoTemplate(context));
            if (context.acquiredIntensity) {
                var options = _this.viewer.selectedLayer.acquiredIntensity;
                var tooltip = _this.intensityConverterHelpTemplate({
                    imagesPrefix: _this.viewer.imagesPrefix,
                    intensityConverter: options.type,
                    min: options.min,
                    max: options.max
                });
                $("#" + _this.cursorInfoFsId +
                        " .wdzt-display-info-acquired-intensity-help")
                        .tooltip({
                            items: ".wdzt-display-info-acquired-intensity-help",
                            content: tooltip,
                            open: function(event, ui) {
                                /*jshint unused:vars */
                                ui.tooltip.css("max-width", "none");
                            }
                        });
            }
        };

        this.isEnabled = false;
    };

    function onTemplateReceived(_this) {
        if (_this.allTemplatesLoaded()) {
            onTemplatesReceived(_this);
        }
    }

    function onTemplatesReceived(_this) {
        _this.$container.html(_this.moduleTemplate({
            cursorInfoFsId: _this.cursorInfoFsId,
            formZoomLevelId: _this.formZoomLevelId,
            topLeftXId: _this.topLeftXId,
            topLeftYId: _this.topLeftYId,
            widthId: _this.widthId,
            heightId: _this.heightId
        }));

        var $spinner = $("#" + _this.formZoomLevelId).spinner({
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

        _this.refreshCursorInfo();

        _this.intensityConverter = undefined;
        function getThresholdingFunction(min, max) {
            var ratio = (max - min) / 255.0;
            return function(intensity) {
                return intensity * ratio + min;
            };
        }
        function getGammaFunction(min, max) {
            var gammaReciprocal = Math.log(max - min) / Math.log(255);
            return function(intensity) {
                return Math.exp(gammaReciprocal * Math.log(intensity)) + min;
            };
        }
        _this.viewer.addHandler("layer-changed", function(event) {
            var layer = event.layer;
            if (!layer.acquiredIntensity) {
                _this.intensityConverter = undefined;
            } else {
                switch (layer.acquiredIntensity.type) {
                    case "threshold":
                        _this.intensityConverter = getThresholdingFunction(
                                layer.acquiredIntensity.min,
                                layer.acquiredIntensity.max);
                        break;
                    case "gamma":
                        _this.intensityConverter = getGammaFunction(
                                layer.acquiredIntensity.min,
                                layer.acquiredIntensity.max);
                        break;
                    default:
                        _this.intensityConverter = undefined;
                }
            }
            _this.refreshCursorInfo();
        });
    }

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
                this.refreshCursorInfo();
                $("#" + this.formZoomLevelId).bind("keyup", this._zoomLevelKeyPressHandler);
                this.isEnabled = true;
            }
            return this;
        },
        disable: function() {
            if (this.isEnabled) {
                this.mouseTracker.setTracking(false);
                this.viewer.removeHandler("layer-changed", this.updateFovHandler);
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
