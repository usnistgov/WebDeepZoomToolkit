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
 * OpenSeadragon plugin to record displayed positions on the screen in a CSV file.
 * Requires JSZip http://stuk.github.io/jszip/
 * If OpenSeadragon uses canvas, it is also possible to save the images themselves
 * but it consumes a lot of memory (saveImages option).
 */
(function($) {

    if (!$.version || $.version.major < 1) {
        throw new Error('OpenSeadragonRecorder requires OpenSeadragon version 1.0.0+');
    }

    $.Recorder = function(options) {
        options = options || {};

        if (!options.viewer) {
            throw new Error("A viewer must be specified.");
        }
        var viewer = options.viewer;
        var recording = false;
        var recordedFrames = [];
        var estimatedMemoryUsed = 0;
        var metadata = {};
        var saveImages = options.saveImages || false;
        var saveScalebar = options.saveScalebar || false;
        var saveTimestamp = options.saveTimestamp || false;
        var timestampLocation = options.timestampLocation || "TOP_LEFT";

        // Privileged methods
        this.startRecording = function() {
            if (recording) {
                return;
            }
            recording = true;
            recordedFrames = [];
            estimatedMemoryUsed = 0;
        };

        this.stopRecording = function() {
            if (!recording) {
                return;
            }
            recording = false;
        };

        this.setMetadata = function(meta) {
            metadata = meta;
        };

        this.setSaveImages = function(save) {
            saveImages = save;
        };

        this.isSavingImages = function() {
            return saveImages;
        };

        this.setSaveScalebar = function(save) {
            saveScalebar = save;
        };

        this.setSaveTimestamp = function(save) {
            saveTimestamp = save;
        };

        this.setTimestampLocation = function(location) {
            timestampLocation = location;
        };

        this.getNumberOfSavedFrames = function() {
            return recordedFrames.length;
        };

        this.getEstimatedMemoryUsed = function() {
            return estimatedMemoryUsed;
        };

        this.saveFrame = function() {
            if (!recording) {
                return;
            }
            var data = {};
            for (var attribute in metadata) {
                data[attribute] = metadata[attribute];
            }

            var viewport = viewer.viewport;
            var zoom = viewport.viewportToImageZoom(viewport.getZoom(true));
            data["ZOOM"] = zoom;
            var bounds = viewport.viewportToImageRectangle(
                    viewer.viewport.getBounds(true));
            data["X"] = bounds.x;
            data["Y"] = bounds.y;
            data["WIDTH"] = bounds.width;
            data["HEIGHT"] = bounds.height;

            if (saveImages) {
                var canvas = getCanvas();
                data["image"] = canvas.toDataURL("image/png");
            }
            recordedFrames.push(data);
            estimatedMemoryUsed += estimateSizeOfData(data);
        };

        this.getRecordedImagesAsZip = function(options) {
            var zip = new JSZip();
            var length = recordedFrames.length;
            var padSize = (length + "").length;

            var folder;
            var columns = ["FRAME"];
            var csvContent = "";
            for (var i = 0; i < length; i++) {
                var frame = recordedFrames[i];
                var data = [i + 1];
                for (var dataName in frame) {
                    if (dataName === "image") {
                        if (!folder) {
                            folder = zip.folder("record");
                        }
                        var fileName = pad(i + 1 + "", padSize) + ".png";
                        var valueWithDataType = frame.image;
                        var value = valueWithDataType.split(",")[1];
                        folder.file(fileName, value, {
                            base64: true
                        });
                    } else {
                        var index = columns.indexOf(dataName);
                        if (index === -1) {
                            index = columns.push(dataName) - 1;
                        }
                        data[index] = frame[dataName];
                    }
                }
                csvContent += data.join(",") + "\n";
            }
            csvContent = columns.join(",") + "\n" + csvContent;
            zip.file("dataProvencance.csv", csvContent);
            return zip.generate(options);
        };

        // Private methods

        /**
         * Copy the OSD canvas in a new one with black background instead
         * of a transparent one. Also eventually adds scalebar and timestamp.
         */
        function getCanvas() {
            var canvas = document.createElement("canvas");
            var containerRect = viewer.element.getBoundingClientRect();
            canvas.width = containerRect.width;
            canvas.height = containerRect.height;
            var context = canvas.getContext("2d");
            context.fillStyle = "#000000";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(viewer.drawer.canvas,
                    0, 0, canvas.width, canvas.height);

            if (saveScalebar && viewer.scalebarInstance) {
                var scalebarInstance = viewer.scalebarInstance;
                var scalebarCanvas = scalebarInstance.getAsCanvas();
                var location = scalebarInstance.getScalebarLocation();
                context.drawImage(scalebarCanvas, location.x, location.y,
                        scalebarCanvas.width, scalebarCanvas.height);
            }

            if (saveTimestamp) {
                var date = new Date();
                var timestamp = date.toDateString() + " " + date.toTimeString();
                var style = window.getComputedStyle(viewer.element);
                context.font = style.font;
                var width = context.measureText(timestamp).width + 10;
                var height = parseFloat(style.fontSize) * 1.5;
                var location = getTimestampLocation(
                        canvas.width, canvas.height, width, height);
                context.fillStyle = "rgba(255,255,255,0.5)";
                context.fillRect(location.x, location.y, width, height);
                context.fillStyle = "#000000";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.fillText(timestamp,
                    location.x + width / 2, location.y + height / 2);
            }

            return canvas;
        }

        function getTimestampLocation(canvasWidth, canvasHeight,
            timestampWidth, timestampHeight) {
            var result = {x: 0, y: 0};
            if (timestampLocation === "TOP_RIGHT") {
                result.x = canvasWidth - timestampWidth;
            } else if (timestampLocation === "BOTTOM_LEFT") {
                result.y = canvasHeight - timestampHeight;
            } else if (timestampLocation === "BOTTOM_RIGHT") {
                result.x = canvasWidth - timestampWidth;
                result.y = canvasHeight - timestampHeight;
            }
            return result;
        }

        function pad(str, max) {
            return str.length < max ? pad("0" + str, max) : str;
        }

        /**
         * Estimate the size of the data object.
         * It supposes that it contains only boolean, string or number values.
         * (No nested objects)
         * @param {Object} data
         * @returns {Number}
         */
        function estimateSizeOfData(data) {
            var bytes = 0;
            for (var key in data) {
                var value = data[key];
                if (typeof value === "boolean") {
                    bytes += 4;
                } else if (typeof value === "string") {
                    bytes += value.length * 2;
                } else if (typeof value === "number") {
                    bytes += 8;
                }
            }
            return bytes;
        }
    };
}(OpenSeadragon));
