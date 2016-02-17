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

/**
 * Plugin allowing to traverse deep zoom images through time.
 * The zoom and pan position are preserved between two frames.
 * The main difference with providing a collection to an OpenSeadragon viewer is
 * that you provide a method (via options.getTileSourceOfFrame) to retrieve the 
 * URL of a frame.
 * It avoids to load the entire array of frames (usefull when having a huge
 * number of frames).
 */
(function($) {

    if (!$.version || $.version.major < 1) {
        throw new Error('OpenSeadragonMovie requires OpenSeadragon version 1.0.0+');
    }

    $.Movie = function(options) {
        options = options || {};
        if (options.viewer) {
            this.viewer = options.viewer;
        } else {
            this.viewer = new $.Viewer(options);
        }

        $.EventSource.call(this);

        var movieName = null;
        var getTileSourceOfFrame = null;
        var currentTileSource = null;
        var numberOfFrames = 0;
        var currentFrame = 1;
        var isOpeningFrame = false;
        var interval = null;
        var videoInterval = options.videoInterval || 2500;
        var keepZoomOnNewMovieRatio = options.keepZoomOnNewMovieRatio || 0.1;

        // Privileged methods
        this.openMovie = function(options) {
            options = options || {};
            if (options.movieName === movieName
                    && options.getTileSourceOfFrame === getTileSourceOfFrame
                    && options.numberOfFrames === numberOfFrames) {
                return;
            }

            var hadOpenedMovie = movieName !== null;

            var self = this;
            var doOpenMovie = function() {
                if (isOpeningFrame || (hadOpenedMovie && !self.viewer.isOpen())) {
                    setTimeout(doOpenMovie, 0);
                    return;
                }
                isOpeningFrame = true;

                self.raiseEvent("movie-change");
                movieName = options.movieName;
                getTileSourceOfFrame = options.getTileSourceOfFrame;
                // If number of frames different, we do not open at the same
                // position
                if (numberOfFrames !== options.numberOfFrames) {
                    numberOfFrames = options.numberOfFrames;
                    currentFrame = options.openOnFrame ? options.openOnFrame : 1;
                }

                // If another layer is already open,
                // we need to go back to the same frame, zoom and position
                if (hadOpenedMovie) {
                    var refBounds = self.viewer.viewport.getBounds();
                    var refRatio = self.viewer.source.aspectRatio;
                    var zoomBackAnfFireEvent = function() {
                        self.viewer.removeHandler("open", zoomBackAnfFireEvent);
                        var newRatio = self.viewer.source.aspectRatio;
                        var ratioOfRatios = newRatio / refRatio;
                        ratioOfRatios = ratioOfRatios < 1 ? 1 / ratioOfRatios :
                                ratioOfRatios;
                        if (ratioOfRatios - 1 < keepZoomOnNewMovieRatio) {
                            self.viewer.viewport.fitBounds(refBounds, true);
                        }
                        isOpeningFrame = false;
                        self.raiseEvent("movie-changed", self);
                    };
                    self.viewer.addHandler("open", zoomBackAnfFireEvent);
                } else {
                    // In any case raise the event movie-changed
                    var fireEvent = function() {
                        self.viewer.removeHandler("open", fireEvent);
                        isOpeningFrame = false;
                        self.raiseEvent("movie-changed", self);
                    };
                    self.viewer.addHandler("open", fireEvent);
                }

                if (numberOfFrames < currentFrame) {
                    currentFrame = numberOfFrames;
                }
                var tileSource = getTileSourceOfFrame(currentFrame);
                currentTileSource = tileSource;
                self.viewer.open(tileSource);
            };
            setTimeout(doOpenMovie, 0);
        };

        this.displayFrame = function(frame) {
            if (frame === currentFrame || frame < 1 ||
                    frame > numberOfFrames) {
                return;
            }

            var self = this;
            function doDisplayFrame() {
                if (isOpeningFrame || !self.viewer.isOpen()) {
                    setTimeout(doDisplayFrame, 0);
                    return;
                }
                isOpeningFrame = true;

                self.raiseEvent("frame-change", self);
                currentFrame = frame;
                var tileSource = getTileSourceOfFrame(frame);
                if (tileSource === currentTileSource) {
                    onOpeningDone();
                    return;
                }
                currentTileSource = tileSource;
                
                var refBounds = self.viewer.viewport.getBounds();
                function zoomBackAnfFireEvent() {
                    self.viewer.removeHandler("open", zoomBackAnfFireEvent);
                    self.viewer.viewport.fitBounds(refBounds, true);
                    onOpeningDone();
                }
                self.viewer.addHandler("open", zoomBackAnfFireEvent);
                self.viewer.open(tileSource);

                function onOpeningDone() {
                    isOpeningFrame = false;
                    self.raiseEvent("frame-changed", self);
                }
            }

            setTimeout(doDisplayFrame, 0);
        };

        this.displayFirstFrame = function() {
            this.displayFrame(1);
        };

        this.displayPreviousFrame = function() {
            this.displayFrame(currentFrame - 1);
        };

        this.displayNextFrame = function() {
            this.displayFrame(currentFrame + 1);
        };

        this.displayLastFrame = function() {
            this.displayFrame(numberOfFrames);
        };

        this.startVideo = function() {
            if (interval !== null) {
                return;
            }
            // start video immediatly and then start the interval
            this.displayNextFrame();
            var self = this;
            interval = setInterval(function() {
                if (currentFrame === numberOfFrames) {
                    self.stopVideo();
                    return;
                }
                self.displayFrame(currentFrame + 1);
            }, videoInterval);
            this.raiseEvent("video-started", this);
        };

        this.stopVideo = function() {
            if (interval === null) {
                return;
            }
            clearInterval(interval);
            interval = null;
            this.raiseEvent("video-stopped", this);
        };

        this.getCurrentFrame = function() {
            return currentFrame;
        };

        this.isOpen = function() {
            return movieName !== null;
        };

        this.getNumberOfFrames = function() {
            return numberOfFrames;
        };

        this.getMovieName = function() {
            return movieName;
        };
    };

    $.extend($.Movie.prototype, $.EventSource.prototype);

}(OpenSeadragon));
