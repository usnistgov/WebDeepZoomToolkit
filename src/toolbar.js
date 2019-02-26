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

    $$.Toolbar = function(options) {

        $.extend(true, this, {
            /**
             * The id of this toolbar's container
             */
            id: null,
            /**
             * The viewer associated with this toolbar
             */
            viewer: null,
            /**
             * The hash of this toolbar
             */
            hash: $$.guid()
        }, options);

        var _this = this;
        this.$container = $("#" + this.id);

        this.menuButtonId = "wdzt-toolbar-menu-" + this.hash;

        this.zoomInButtonId = "wdzt-toolbar-zoom-in-" + this.hash;
        this.zoomOutButtonId = "wdzt-toolbar-zoom-out-" + this.hash;
        this.homeButtonId = "wdzt-toolbar-home-" + this.hash;
        this.enterFullPageButtonId = "wdzt-toolbar-enter-full-page-" + this.hash;
        this.exitFullPageButtonId = "wdzt-toolbar-exit-full-page-" + this.hash;

        this.skipBackId = "wdzt-toolbar-skip-backward-" + this.hash;
        this.seekBackId = "wdzt-toolbar-seek-backward-" + this.hash;
        this.playId = "wdzt-toolbar-play-" + this.hash;
        this.pauseId = "wdzt-toolbar-pause-" + this.hash;
        this.seekForwardId = "wdzt-toolbar-seek-forward-" + this.hash;
        this.skipForwardId = "wdzt-toolbar-skip-forward-" + this.hash;

        this.sliderId = "wdzt-toolbar-slider-" + this.hash;
        this.currentFrameId = "wdzt-toolbar-current-frame-" + this.hash;
        this.totalFramesId = "wdzt-toolbar-total-frames-" + this.hash;

        this.sliceSliderId = "wdzt-toolbar-slice-slider-" + this.hash;
        this.currentSliceId = "wdzt-toolbar-current-slice-" + this.hash;
        this.totalSlicesId = "wdzt-toolbar-total-slices" + this.hash;

        this.$container.html(
                Handlebars.compile([
                    '<div class="wdzt-toolbar-buttons">',
                    '    <img id="{{menuButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}menu-icon.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="Toggle menu" title="Toggle menu"/>',
                    '    <img id="{{zoomInButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}zoom-in.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="Zoom in" title="Zoom in"/>',
                    '    <img id="{{zoomOutButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}zoom-out.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="Zoom out" title="Zoom out"/>',
                    '    <img id="{{homeButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}home.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="Go home" title="Go home"/>',
                    '    <img id="{{enterFullPageButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}enter-fullscreen.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="Enter full page mode"',
                    '         title="Enter full page mode"/>',
                    '    <img id="{{exitFullPageButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}exit-fullscreen.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="Enter full page mode"',
                    '         title="Enter full page mode"/>',
                    '    <img id="{{skipBackId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}skip-backward.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="|<" title="Go to the beginning"/>',
                    '    <img id="{{seekBackId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}seek-backward.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="<<" title="Go to previous frame"/>',
                    '    <img id="{{playId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}play.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt=">" title="Play"/>',
                    '    <img id="{{pauseId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}pause.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt="||" title="Pause"/>',
                    '    <img id="{{seekForwardId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}seek-forward.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt=">>" title="Go to next frame"/>',
                    '    <img id="{{skipForwardId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}skip-forward.svg"',
                    '         width="24"',
                    '         height="24"',
                    '         alt=">|" title="Go to the end"/>',
                    '</div>',
                    '<div class="wdzt-toolbar-movie-position">',
                    '    Frame <input type="text" id="{{currentFrameId}}"/>/',
                    '    <span id="{{totalFramesId}}"/>',
                    '</div>',
                    '<div class="wdzt-toolbar-slider-container">',
                    '    <div id="{{sliderId}}" class="wdzt-toolbar-slider"/>',
                    '</div>',
                    '<div class="wdzt-toolbar-movie-position">',
                    '    Slice <input type="text" id="{{currentSliceId}}"/>/',
                    '    <span id="{{totalSlicesId}}"/>',
                    '</div>',
                    '<div class="wdzt-toolbar-slider-container">',
                    '    <div id="{{sliceSliderId}}" class="wdzt-toolbar-slider"/>',
                    '</div>'
                ].join(''))({
            menuButtonId: this.menuButtonId,
            zoomInButtonId: this.zoomInButtonId,
            zoomOutButtonId: this.zoomOutButtonId,
            homeButtonId: this.homeButtonId,
            enterFullPageButtonId: this.enterFullPageButtonId,
            exitFullPageButtonId: this.exitFullPageButtonId,
            skipBackId: this.skipBackId,
            seekBackId: this.seekBackId,
            playId: this.playId,
            pauseId: this.pauseId,
            seekForwardId: this.seekForwardId,
            skipForwardId: this.skipForwardId,
            sliderId: this.sliderId,
            currentFrameId: this.currentFrameId,
            totalFramesId: this.totalFramesId,
            sliceSliderId: this.sliceSliderId,
            currentSliceId: this.currentSliceId,
            totalSlicesId: this.totalSlicesId,
            imagesPrefix: this.viewer.imagesPrefix
        }));

        $("#" + this.menuButtonId).click(function() {
            _this.viewer.toggleMenu();
        });

        this.viewer.addHandler("open", function() {
            initSlider(_this);
            initSliceSlider(_this);
            initVideoControls(_this);
        });
        this.viewer.addHandler("full-page", function(event) {
            if (event.fullPage) {
                $("#" + _this.enterFullPageButtonId).hide();
                $("#" + _this.exitFullPageButtonId).show();
            } else {
                $("#" + _this.enterFullPageButtonId).show();
                $("#" + _this.exitFullPageButtonId).hide();
            }
        });
        $("#" + _this.enterFullPageButtonId).click(function() {
           _this.viewer.toggleFullScreen();
        });
        $("#" + _this.exitFullPageButtonId).click(function() {
           _this.viewer.toggleFullScreen();
        });
        $("#" + _this.exitFullPageButtonId).hide();
    };

    $$.Toolbar.prototype = {
    };

    function initSlider(_this) {
        var movie = _this.viewer.osdMovie;

        var isChangingMovie = false;
        var numberOfFrames = _this.viewer.zslice ? 1 : movie.getNumberOfFrames();
        $("#" + _this.sliderId).slider({
            value: 1,
            min: 1,
            step: 1,
            max: numberOfFrames,
            change: function(event, ui) {
                /*jshint unused:true */
                if (!isChangingMovie) {
                    movie.displayFrame(ui.value);
                }
            }
        });

        var changeHandler = function() {
            isChangingMovie = true;
        };
        movie.addHandler("frame-change", changeHandler);
        movie.addHandler("movie-change", changeHandler);

        var updateSliders = function() {
          var frameNumber = movie.getCurrentFrame();
          var numberOfFrames = movie.getNumberOfFrames();
          var length = (numberOfFrames + "").length;
          if (!_this.viewer.zslice) {
            $("#" + _this.currentFrameId).val(frameNumber);
            $("#" + _this.currentFrameId).prop("size", length);
            $("#" + _this.currentFrameId).prop("maxlength", length);
            $("#" + _this.totalFramesId).text(numberOfFrames);
            $("#" + _this.sliderId).slider("option", "value", frameNumber);
            $("#" + _this.sliderId).slider("option", "max", numberOfFrames);
            isChangingMovie = false;
          } else {
            $("#" + _this.currentFrameId).val(1);
            $("#" + _this.currentFrameId).prop("size", length);
            $("#" + _this.totalFramesId).text(1);
            $("#" + _this.sliderId).slider("option", "value", 1);
            $("#" + _this.sliderId).slider("option", "max", 1);
          }
        };
        movie.addHandler("frame-changed", updateSliders);
        movie.addHandler("movie-changed", updateSliders);

        $("#" + _this.currentFrameId).keyup(function(event) {
            if (event.keyCode === 13) {
                var frameIndex = parseInt($("#" + _this.currentFrameId).val());
                if (frameIndex > 0 && frameIndex <= movie.getNumberOfFrames()) {
                    movie.displayFrame(frameIndex);
                } else {
                    _this.viewer.displayError("Invalid frame index.");
                }
            }
        });
    }

    function initSliceSlider(_this) {
        var movie = _this.viewer.osdMovie;

        var isChangingMovie = false;
        var numberOfSlices = movie.getNumberOfFrames();
        $("#" + _this.sliceSliderId).slider({
            value: 1,
            min: 1,
            step: 1,
            max: numberOfSlices,
            change: function(event, ui) {
                /*jshint unused:true */
                if (!isChangingMovie) {
                    movie.displayFrame(ui.value);
                }
            }
        });

        var changeHandler = function() {
            isChangingMovie = true;
        };
        movie.addHandler("frame-change", changeHandler);
        movie.addHandler("movie-change", changeHandler);

        var updateSliders = function() {
          var sliceNumber = movie.getCurrentFrame();
          var numberOfSlices = movie.getNumberOfFrames();
          var length = (numberOfSlices + "").length;
          if (_this.viewer.zslice) {
            $("#" + _this.currentSliceId).val(sliceNumber);
            $("#" + _this.currentSliceId).prop("size", length);
            $("#" + _this.currentSliceId).prop("maxlength", length);
            $("#" + _this.totalSlicesId).text(numberOfSlices);
            $("#" + _this.sliceSliderId).slider("option", "value", sliceNumber);
            $("#" + _this.sliceSliderId).slider("option", "max", numberOfSlices);
            isChangingMovie = false;
          } else {
            $("#" + _this.currentSliceId).val(1);
            $("#" + _this.currentSliceId).prop("size", length);
            $("#" + _this.totalSlicesId).text(1);
            $("#" + _this.sliceSliderId).slider("option", "value", 1);
            $("#" + _this.sliceSliderId).slider("option", "max", 1);
          }
        };
        movie.addHandler("frame-changed", updateSliders);
        movie.addHandler("movie-changed", updateSliders);

        $("#" + _this.currentSliceId).keyup(function(event) {
            if (event.keyCode === 13) {
                var sliceIndex = parseInt($("#" + _this.currentSliceId).val());
                if (sliceIndex > 0 && sliceIndex <= movie.getNumberOfFrames()) {
                    movie.displayFrame(sliceIndex);
                } else {
                    _this.viewer.displayError("Invalid slice index.");
                }
            }
        });
    }

    function initVideoControls(_this) {
        var movie = _this.viewer.osdMovie;

        $("#" + _this.skipBackId).click(function() {
            movie.displayFirstFrame();
        });
        $("#" + _this.seekBackId).click(function() {
            movie.displayPreviousFrame();
        });
        $("#" + _this.playId).click(function() {
            movie.startVideo();
        });
        $("#" + _this.pauseId).click(function() {
            movie.stopVideo();
        });
        $("#" + _this.seekForwardId).click(function() {
            movie.displayNextFrame();
        });
        $("#" + _this.skipForwardId).click(function() {
            movie.displayLastFrame();
        });
        movie.addHandler("video-started", function() {
            $("#" + _this.playId).hide();
            $("#" + _this.pauseId).show();
        });
        movie.addHandler("video-stopped", function() {
            $("#" + _this.pauseId).hide();
            $("#" + _this.playId).show();
        });
        $("#" + _this.pauseId).hide();
        $("#" + _this.playId).show();
    }

}(WDZT));
