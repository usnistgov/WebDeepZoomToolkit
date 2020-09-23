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

    var name = "FetchingModule";

    $$.FetchingModule = function(options) {

        this.name = name;
        this.title = "Data fetching";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;
        this.fetchingFormId = "wdzt-fetching-form-" + this.hash;
        this.manualSettingsId = "wdzt-fetching-manual-settings-" + this.hash;
        this.originalResolutionId = "wdzt-fetching-original-resolution-" + this.hash;
        this.manualSettingsFormId = "wdzt-fetching-manual-settings-form-" + this.hash;
        this.formZoomLevelId = "wdzt-fetching-form-zoom-level-" + this.hash;
        this.formXId = "wdzt-fetching-form-x-" + this.hash;
        this.formYId = "wdzt-fetching-form-y-" + this.hash;
        this.formWidthId = "wdzt-fetching-form-width-" + this.hash;
        this.formHeightId = "wdzt-fetching-form-height-" + this.hash;
        this.layersDivId = "wdzt-fetching-layers-div-" + this.hash;
        this.formFramesRangeId = "wdzt-fetching-form-frames-range-" + this.hash;
        this.formFetchButtonId = "wdzt-fetching-form-fetch-button-" + this.hash;

        $$.getHbsTemplates([
            'src/modules/fetching-module-template.hbs',
            'src/modules/fetching-module-layers-template.hbs'],
                function(templates) {
                    onTemplateReceived(templates[0], templates[1]);
                });

        this.isEnabled = false;
        this.isRegistered = false;

        this._updateBounds = function() {
            var viewport = _this.viewer.osd.viewport;
            var item = _this.viewer.osd.world.getItemAt(0);
            if (!viewport || !item) {
                $("#" + _this.manualSettingsFormId + " input").val("");
            } else {
                if (!$("#" + _this.originalResolutionId).prop("checked")) {
                    var zoom = item.viewportToImageZoom(
                            viewport.getZoom(true)) * 100;
                    $("#" + _this.formZoomLevelId).val(zoom.toPrecision(4));
                } else {
                    $("#" + _this.formZoomLevelId).val(100);
                }
                var bounds = item.viewportToImageRectangle(
                        viewport.getBounds(true));
                $("#" + _this.formXId).val(Math.round(bounds.x));
                $("#" + _this.formYId).val(Math.round(bounds.y));
                $("#" + _this.formWidthId).val(Math.round(bounds.width));
                $("#" + _this.formHeightId).val(Math.round(bounds.height));
            }
        };

        function onTemplateReceived(template, layersTemplate) {
            _this.$container.html(template({
                fetchingFormId: _this.fetchingFormId,
                manualSettingsId: _this.manualSettingsId,
                manualSettingsFormId: _this.manualSettingsFormId,
                originalResolutionId: _this.originalResolutionId,
                formZoomLevelId: _this.formZoomLevelId,
                formXId: _this.formXId,
                formYId: _this.formYId,
                formWidthId: _this.formWidthId,
                formHeightId: _this.formHeightId,
                layersDivId: _this.layersDivId,
                formFramesRangeId: _this.formFramesRangeId,
                formFetchButtonId: _this.formFetchButtonId,
                imagesPrefix: _this.viewer.imagesPrefix
            }));

            var $originalResolution = $("#" + _this.originalResolutionId);
            var $formZoomLevel = $("#" + _this.formZoomLevelId);
            var $manualSetting = $("#" + _this.manualSettingsId);
            var $manualSettingForm = $("#" + _this.manualSettingsFormId);

            _this._layerChangedHandler = function(event) {
                var layer = event.layer;
                if (!layer.fetching) {
                    return;
                }

                var group = _this.viewer.manifest.getLayerGroup(layer);
                var layers = group.layers;
                var fetchingLayers = [layer];
                for (var i = 0; i < layers.length; i++) {
                    var l = layers[i];
                    if (l !== layer && l.fetching) {
                        fetchingLayers.push(l);
                    }
                }

                var html = layersTemplate({
                    layers: fetchingLayers,
                    prefix: "wdzt-fetching",
                    suffix: _this.hash
                });
                $("#" + _this.layersDivId).html(html);
                $("#" + _this.layersDivId + " input[name='" + layer.id + "']").
                        prop("checked", true);

                var originalResolutionOnly = !!layer.fetching.originalResolutionOnly;
                $originalResolution.prop("disabled", originalResolutionOnly);
                if (originalResolutionOnly) {
                    $originalResolution.addClass("ui-state-disabled");
                } else {
                    $originalResolution.removeClass("ui-state-disabled");
                }
                $originalResolution.change();
            };
            _this.viewer.addHandler("layer-changed", _this._layerChangedHandler);
            // If a layer is already selected, manually call the event.
            if (_this.viewer.selectedLayer) {
                _this._layerChangedHandler({
                    layer: _this.viewer.selectedLayer
                });
            }

            $manualSetting.change(function() {
                var manual = $manualSetting.prop("checked");
                $("#" + _this.manualSettingsFormId + " input").prop("disabled", !manual);
                if (manual) {
                    $manualSettingForm.removeClass("ui-state-disabled");
                } else {
                    $manualSettingForm.addClass("ui-state-disabled");
                }
                $originalResolution.change();
                refreshEventsRegistration(_this);
            }).change();

            $originalResolution.change(function() {
                var original = $originalResolution.prop("checked");
                $formZoomLevel.prop("disabled", original);
                if (original) {
                    $formZoomLevel.addClass("ui-state-disabled");
                } else {
                    $formZoomLevel.removeClass("ui-state-disabled");
                }
                _this._updateBounds();
            });

            $("#" + _this.formFetchButtonId).click(function() {
                $("#" + _this.layersDivId + " input:checked").each(function() {
                    var layerId = $(this).attr("name");
                    var layer = _this.viewer.manifest.getLayer(layerId);
                    getProbingVideo({
                        url: layer.fetching.url,
                        zoom: parseFloat($formZoomLevel.val()) / 100,
                        x: parseInt($("#" + _this.formXId).val()),
                        y: parseInt($("#" + _this.formYId).val()),
                        width: parseInt($("#" + _this.formWidthId).val()),
                        height: parseInt($("#" + _this.formHeightId).val()),
                        frames: $("#" + _this.formFramesRangeId).val(),
                        framesOffset: layer.framesOffset,
                        failCallback: function(responseHtml) {
                            var text = "Error while requesting probing for layer \"" + layer.name + "\".";
                            if (responseHtml) {
                                text += "<br>" + responseHtml;
                            } else {
                                text += "<br>The requested ROI is probably too big.";
                            }
                            _this.viewer.displayError(text);
                            enableForm(_this, true);
                        },
                        successCallback: function() {
                            _this.viewer.displayNotification(
                                    "Fetching completed for layer \"" + layer.name + "\".");
                            enableForm(_this, true);
                        },
                        prepareCallback: function() {
                            _this.viewer.displayNotification(
                                    "Fetching started for layer \"" + layer.name + "\".");
                            enableForm(_this, false);
                        }
                    }, _this.viewer);
                });
            });
        }
    };

    // Register itself
    $$.Module.MODULES[name] = $$.FetchingModule;

    $.extend($$.FetchingModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 51;
        },
        supportLayer: function(layer) {
            return !!layer.fetching;
        },
        enable: function() {
            if (!this.isEnabled) {
                this.isEnabled = true;
                refreshEventsRegistration(this);
            }
            return this;
        },
        disable: function() {
            if (this.isEnabled) {
                this.isEnabled = false;
                refreshEventsRegistration(this);
            }
            return this;
        },
        destroy: function() {
            this.disable();
            this.viewer.removeHandler("layer-changed", this._layerChangedHandler);
        }
    });

    function refreshEventsRegistration(_this) {
        var manual = $("#" + _this.manualSettingsId).prop("checked");
        var register = _this.isEnabled && !manual;
        if (register !== _this.isRegistered) {
            if (register) {
                _this.viewer.osd.addHandler("open", _this._updateBounds);
                _this.viewer.osd.addHandler("animation", _this._updateBounds);
                _this._updateBounds();
            } else {
                _this.viewer.osd.removeHandler("open", _this._updateBounds);
                _this.viewer.osd.removeHandler("animation", _this._updateBounds);
            }
            _this.isRegistered = register;
        }
    }

    function enableForm(_this, enabled) {
        $("#" + _this.fetchingFormId + " input").prop("disabled", !enabled);
        $("#" + _this.fetchingFormId + " button").prop("disabled", !enabled);
        if (enabled) {
            $("#" + _this.fetchingFormId).removeClass("ui-state-disabled");
        } else {
            $("#" + _this.fetchingFormId).addClass("ui-state-disabled");
        }
    }

    function getProbingVideo(options, viewer) {

        var settings = $.extend({
            prepareCallback: function(url) {
                /*jshint unused:vars */
            },
            successCallback: function(url) {
                /*jshint unused:vars */
            },
            failCallback: function(responseHtml, url) {
                /*jshint unused:vars */
            }
        }, options);

        if (!settings.url) {
            settings.failCallback("No web service URL set.", "");
            return;
        }

        if (settings.x === undefined ||
                settings.y === undefined ||
                settings.width === undefined ||
                settings.height === undefined ||
                settings.zoom === undefined) {
            settings.failCallback("x, y, width, height and zoom must be defined.", "");
            return;
        }

        if (settings.zoom <= 0 || settings.zoom > 2) {
            settings.failCallback("Zoom must be between 0 and 2.");
            return;
        }

        if (settings.width * settings.zoom < 1 || settings.height * settings.zoom < 1) {
            settings.failCallback("Zoom too small for width and height.");
            return;
        }

        var url = settings.url +
                "?x=" + settings.x +
                "&y=" + settings.y +
                "&width=" + settings.width +
                "&height=" + settings.height +
                "&zoom=" + settings.zoom;

        if (settings.frames) {
            url += "&frames=" + settings.frames;
            if (settings.framesOffset) {
                url += "&framesOffset=" + settings.framesOffset;
            }
        }

        // Two-steps fetching is auth headers are present
        if(!$.isEmptyObject(viewer.osd.ajaxHeaders)) {
            var requestFetchingOptions = {
                url: url,
                headers: viewer.osd.ajaxHeaders,
                withCredentials: false,
                success: function(result) {
                    console.log(result);
                    var downloadLink = JSON.parse(result.response);
                    if ($.isEmptyObject(downloadLink) || !downloadLink.hasOwnProperty('url')) {
                        console.log("fail")
                        settings.failCallback();
                        return;
                    }
                    fetchImages(downloadLink.url, settings);
                },
                error: settings.failCallback
            };
            OpenSeadragon.makeAjaxRequest(requestFetchingOptions);
        } else {
            fetchImages(url, settings);
        }


        // We need to manually remove the iframes from file download before
        // going or leaving fullscreen to avoid to restart the download.
        // See https://github.com/johnculviner/jquery.fileDownload/issues/36
        viewer.addHandler("pre-full-page", function removeIframe() {
            viewer.removeHandler("pre-full-page", removeIframe);
            $("iframe").each(function() {
                // We can't test for equality due to relative URLs.
                if ($(this).prop("src").indexOf(url) > -1) {
                    $(this).remove();
                }
            });
        });
    }

    function fetchImages(url, settings) {
        $.fileDownload(url, {
            prepareCallback: settings.prepareCallback,
            successCallback: settings.successCallback,
            failCallback: settings.failCallback
        });
    }

}(WDZT));
