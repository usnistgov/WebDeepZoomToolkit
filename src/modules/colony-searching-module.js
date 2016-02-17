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

    var name = "ColonySearchingModule";

    $$.ColonySearchingModule = function(options) {

        this.name = name;
        this.title = "Colony searching";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        this.colonySearchingDivId = "wdzt-colony-searching-div-" + this.hash;
        this.colonySearchingInputId = "wdzt-colony-searching-input-" + this.hash;

        this.overlayId = "wdzt-colony-searching-overlay-" + this.hash;

        this.$container.html(
                Handlebars.compile([
                    '<div id="{{colonySearchingDivId}}" class="wdzt-colony-searching-div">',
                    '    <div>',
                    '        <label for="{{colonySearchingInputId}}">Colony:</label>',
                    '        <input type="text" id="{{colonySearchingInputId}}" />',
                    '    </div>',
                    '</div>'
                ].join(''))({
            colonySearchingDivId: this.colonySearchingDivId,
            colonySearchingInputId: this.colonySearchingInputId
        }));

        $("#" + this.colonySearchingInputId).on('keyup', function(e) {
            if (e.keyCode === 13) {
                requestColonyDisplay(_this);
            }
        });
    };

    // Register itself
    $$.Module.MODULES[name] = $$.ColonySearchingModule;

    $.extend($$.ColonySearchingModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 40;
        },
        supportLayer: function(layer) {
            return !!layer.colonySearching;
        },
        loadState: function(options) {
            options = options || {};
            var colony = options.colony;
            if (colony) {
                var _this = this;

                var loadColony = function() {
                    $("#" + _this.colonySearchingInputId).val(colony);
                    requestColonyDisplay(_this);
                };

                var osdMovie = this.viewer.osdMovie;
                if (!this.viewer.osd.drawer || !osdMovie.isOpen()) {
                    osdMovie.addHandler("movie-changed", function openHandler() {
                        osdMovie.removeHandler("movie-changed", openHandler);
                        loadColony();
                    });
                } else {
                    loadColony();
                }
            } else {
                $("#" + this.colonySearchingInputId).val("");
            }
            return this;
        }
    });

    function requestColonyDisplay(_this) {
        _this.viewer.osd.removeOverlay(_this.overlayId);
        $("#" + _this.overlayId).remove();

        var colony = $("#" + _this.colonySearchingInputId).val();
        if (!colony) {
            return;
        }

        var viewer = _this.viewer;
        var osd = viewer.osd;
        var viewport = osd.viewport;
        var movie = viewer.osdMovie;
        var frame = movie.getCurrentFrame();
        var settings = viewer.selectedLayer.colonySearching;
        $$.ColonyHelper.getBoundingBox({
            serviceUrl: settings.serviceUrl,
            dataset: settings.dataset,
            frame: frame,
            colony: colony,
            onSuccess: function(boundBox) {
                function onOsdReady() {
                    osd.removeHandler("tile-drawn", onOsdReady);
                    var boundBoxRect = viewport.imageToViewportRectangle(
                            boundBox.x,
                            boundBox.y,
                            boundBox.width,
                            boundBox.height);
                    var $overlay = $("<div id=\"" + _this.overlayId + "\"/>");
                    $overlay.css({
                        border: "3px solid red"
                    });
                    osd.addOverlay($overlay.get(0), boundBoxRect);
                    fitBoundsWithZoomConstraints(boundBoxRect, viewport);
                }
                if (osd.world.getItemCount() === 0) {
                    // We must wait that OSD is ready.
                    osd.addHandler("tile-drawn", onOsdReady);
                } else {
                    onOsdReady();
                }
            },
            onError: function(request) {
                var message = "Cannot get colony " + colony + " in frame " + frame;
                if (request.response) {
                    message += ":<br>" + request.response;
                }
                viewer.displayWarning(message);
            }
        });
    }

    function fitBoundsWithZoomConstraints(bounds, viewport) {
        var aspect = viewport.getAspectRatio();
        var newBounds = new OpenSeadragon.Rect(
                bounds.x,
                bounds.y,
                bounds.width,
                bounds.height);
        var center = newBounds.getCenter();
        if (newBounds.getAspectRatio() >= aspect) {
            newBounds.height = bounds.width / aspect;
            newBounds.y = center.y - newBounds.height / 2;
        } else {
            newBounds.width = bounds.height * aspect;
            newBounds.x = center.x - newBounds.width / 2;
        }
        var zoom = Math.min(1 / newBounds.width, viewport.getMaxZoom());
        viewport.panTo(center);
        viewport.zoomTo(zoom);
    }

}(WDZT));
