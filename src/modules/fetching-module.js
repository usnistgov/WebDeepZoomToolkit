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
        this.manualSettingsFormId = "wdzt-fetching-manual-settings-form-" + this.hash;
        this.formOriginalResolutionId = "wdzt-fetching-form-original-resolution-" + this.hash;
        this.formZoomLevelId = "wdzt-fetching-form-zoom-level-" + this.hash;
        this.formXId = "wdzt-fetching-form-x-" + this.hash;
        this.formYId = "wdzt-fetching-form-y-" + this.hash;
        this.formWidthId = "wdzt-fetching-form-width-" + this.hash;
        this.formHeightId = "wdzt-fetching-form-height-" + this.hash;
        this.layersDivId = "wdzt-fetching-layers-div-" + this.hash;
        this.formFramesRangeId = "wdzt-fetching-form-frames-range-" + this.hash;
        this.formFetchButtonId = "wdzt-fetching-form-fetch-button-" + this.hash;

        this.$container.html(
                Handlebars.compile([
                    '<div id="{{fetchingFormId}}" class="wdzt-fetching-form">',
                    '    <input id="{{manualSettingsId}}" type="checkbox"/>',
                    '    <label for="{{manualSettingsId}}">Manually set bounds</label>',
                    '    <form id="{{manualSettingsFormId}}">',
                    '        <fieldset>',
                    '            <legend>Fetching bounds</legend>',
                    '            <div class="wdzt-table-layout">',
                    '                <div class="wdzt-row-layout">',
                    '                    <label for="{{formOriginalResolutionId}}"',
                    '                           class="wdzt-cell-layout wdzt-no-wrap">',
                    '                        Original resolution',
                    '                    </label>',
                    '                    <input type="checkbox"',
                    '                           id="{{formOriginalResolutionId}}"',
                    '                           class="wdzt-cell-layout"/>',
                    '                </div>',
                    '                <div class="wdzt-row-layout">',
                    '                    <label for="{{formZoomLevelId}}"',
                    '                           class="wdzt-cell-layout wdzt-no-wrap">',
                    '                        Zoom (%)',
                    '                    </label>',
                    '                    <input type="text"',
                    '                           id="{{formZoomLevelId}}"',
                    '                           class="ui-widget-content ui-corner-all wdzt-cell-layout"/>',
                    '                </div>',
                    '                <div class="wdzt-row-layout">',
                    '                    <label for="{{formXId}}"',
                    '                           class="wdzt-cell-layout wdzt-no-wrap">',
                    '                        x (top left)',
                    '                    </label>',
                    '                    <input type="text"',
                    '                           id="{{formXId}}"',
                    '                           class="ui-widget-content ui-corner-all wdzt-cell-layout"/>',
                    '                </div>',
                    '                <div class="wdzt-row-layout">',
                    '                    <label for="{{formYId}}"',
                    '                           class="wdzt-cell-layout wdzt-no-wrap">',
                    '                        y (top left)</label>',
                    '                    <input type="text"',
                    '                           id="{{formYId}}"',
                    '                           class="ui-widget-content ui-corner-all wdzt-cell-layout"/>',
                    '                </div>',
                    '                <div class="wdzt-row-layout">',
                    '                    <label for="{{formWidthId}}"',
                    '                           class="wdzt-cell-layout wdzt-no-wrap">',
                    '                        Width',
                    '                    </label>',
                    '                    <input type="text"',
                    '                           id="{{formWidthId}}"',
                    '                           class="ui-widget-content ui-corner-all wdzt-cell-layout"/>',
                    '                </div>',
                    '                <div class="wdzt-row-layout">',
                    '                    <label for="{{formHeightId}}"',
                    '                           class="wdzt-cell-layout wdzt-no-wrap">',
                    '                        Height',
                    '                    </label>',
                    '                    <input type="text"',
                    '                           id="{{formHeightId}}"',
                    '                           class="ui-widget-content ui-corner-all wdzt-cell-layout"/>',
                    '                </div>',
                    '            </div>',
                    '        </fieldset>',
                    '    </form>',
                    '    <div id="{{layersDivId}}"/>',
                    '    <label for="{{formFramesRangeId}}">',
                    '        Frame range',
                    '        <img src="{{imagesPrefix}}help-browser-2.png"',
                    '             title="For example, type 1,3 or 5-12 to retrieve a selection of frames"',
                    '             alt="help">',
                    '    </label>',
                    '    <input type="text"',
                    '           id="{{formFramesRangeId}}"',
                    '           class="ui-widget-content ui-corner-all"/>',
                    '    <button id="{{formFetchButtonId}}">Fetch</button>',
                    '</div>'
                ].join(''))({
            fetchingFormId: this.fetchingFormId,
            manualSettingsId: this.manualSettingsId,
            manualSettingsFormId: this.manualSettingsFormId,
            formOriginalResolutionId: this.formOriginalResolutionId,
            formZoomLevelId: this.formZoomLevelId,
            formXId: this.formXId,
            formYId: this.formYId,
            formWidthId: this.formWidthId,
            formHeightId: this.formHeightId,
            layersDivId: this.layersDivId,
            formFramesRangeId: this.formFramesRangeId,
            formFetchButtonId: this.formFetchButtonId,
            imagesPrefix: this.viewer.imagesPrefix
        }));

        $("#" + this.manualSettingsId).change(function() {
            var manual = $("#" + _this.manualSettingsId).prop("checked");
            $("#" + _this.manualSettingsFormId + " input").prop("disabled", !manual);
            if (manual) {
                $("#" + _this.manualSettingsFormId).removeClass("ui-state-disabled");
            } else {
                $("#" + _this.manualSettingsFormId).addClass("ui-state-disabled");
                $("#" + _this.formOriginalResolutionId).prop("checked", false).change();
            }
            refreshEventsRegistration(_this);
        }).change();

        $("#" + this.formOriginalResolutionId).change(function() {
            var original = $("#" + _this.formOriginalResolutionId).prop("checked");
            $("#" + _this.formZoomLevelId).prop("disabled", original);
            if (original) {
                $("#" + _this.formZoomLevelId).addClass("ui-state-disabled");
                $("#" + _this.formZoomLevelId).val(100);
            } else {
                $("#" + _this.formZoomLevelId).removeClass("ui-state-disabled");
            }
        });

        $("#" + this.formFetchButtonId).click(function() {
            $("#" + _this.layersDivId + " input:checked").each(function() {
                var layerId = $(this).attr("name");
                var layer = _this.viewer.manifest.getLayer(layerId);
                getProbingVideo({
                    url: layer.fetching.url,
                    zoom: parseFloat($("#" + _this.formZoomLevelId).val()) / 100,
                    x: parseInt($("#" + _this.formXId).val()),
                    y: parseInt($("#" + _this.formYId).val()),
                    width: parseInt($("#" + _this.formWidthId).val()),
                    height: parseInt($("#" + _this.formHeightId).val()),
                    frames: $("#" + _this.formFramesRangeId).val(),
                    failCallback: function(responseHtml) {
                        var text = "Error while requesting probing for layer \"" + layer.name + "\".";
                        if (responseHtml) {
                            text += "\n" + responseHtml;
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

        var layersTemplate = Handlebars.compile([
            '{{#if layers}}',
            '<fieldset>',
            '    <legend>Layers to fetch</legend>',
            '    <div class="wdzt-table-layout">',
            '        {{#each layers}}',
            '        <div class="wdzt-row-layout">',
            '            <label for="{{../prefix}}-{{id}}-{{../suffix}}"',
            '                   class="wdzt-cell-layout wdzt-no-wrap">',
            '                {{name}}',
            '            </label>',
            '            <input type="checkbox"',
            '                   id="{{../prefix}}-{{id}}-{{../suffix}}"',
            '                   class="wdzt-cell-layout"',
            '                   name="{{id}}" />',
            '        </div>',
            '        {{/each}}',
            '    </div>',
            '</fieldset>',
            '{{/if}}'
        ].join(''));

        this._layerChangedHandler = function(event) {
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
        };
        this.viewer.addHandler("layer-changed", this._layerChangedHandler);

        this._updateBounds = function() {
            var viewport = _this.viewer.osd.viewport;
            if (!viewport) {
                $("#" + _this.manualSettingsFormId + " input").val("");
            } else {
                var bounds = viewport.viewportToImageRectangle(
                        viewport.getBounds(true));
                var zoom = viewport.viewportToImageZoom(viewport.getZoom(true)) * 100;
                $("#" + _this.formZoomLevelId).val(zoom.toPrecision(4));
                $("#" + _this.formXId).val(Math.round(bounds.x));
                $("#" + _this.formYId).val(Math.round(bounds.y));
                $("#" + _this.formWidthId).val(Math.round(bounds.width));
                $("#" + _this.formHeightId).val(Math.round(bounds.height));
            }
        };

        this.isEnabled = false;
        this.isRegistered = false;
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

        var url = settings.url + "/probing" +
                "?x=" + settings.x +
                "&y=" + settings.y +
                "&width=" + settings.width +
                "&height=" + settings.height +
                "&zoom=" + settings.zoom;

        if (settings.frames) {
            url += "&frames=" + settings.frames;
        }

        $.fileDownload(url, {
            prepareCallback: settings.prepareCallback,
            successCallback: settings.successCallback,
            failCallback: settings.failCallback
        });

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

}(WDZT));
