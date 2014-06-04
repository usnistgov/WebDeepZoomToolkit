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

    var name = "RecordingModule";

    // 20MB
    var MEMORY_WARNING_THRESHOLD = 20 * 1024 * 1024;

    $$.RecordingModule = function(options) {

        this.name = name;
        this.title = "Screen recording";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        this.handlers = ["movie-change", "frame-change"];

        this.snapshotDivId = "wdzt-recording-snapshot-div-" + this.hash;
        this.snapshotButtonId = "wdzt-recording-snapshot-button-" + this.hash;
        this.startRecordingDivId = "wdzt-recording-start-div-" + this.hash;
        this.startButtonId = "wdzt-recording-start-button-" + this.hash;
        this.stopRecordingDivId = "wdzt-recording-stop-div-" + this.hash;
        this.stopButtonId = "wdzt-recording-stop-button-" + this.hash;
        this.downloadDivId = "wdzt-recording-download-div-" + this.hash;
        this.zipLinkId = "wdzt-recording-zip-link-" + this.hash;
        this.zipButtonId = "wdzt-recording-zip-" + this.hash;
        this.formSaveScalebarId = "wdzt-recording-form-save-scalebar-" + this.hash;
        this.formSaveTimestampId = "wdzt-recording-form-save-timestamp-" + this.hash;
        this.formTimestampLocationId = "wdzt-recording-form-timestamp-location-" + this.hash;

        this.$container.html(
                Handlebars.compile([
                    '<div id="{{snapshotDivId}}">',
                    '    <img id="{{snapshotButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}camera-photo-5.png"',
                    '         title="Take snapshot"',
                    '         alt="Take snapshot"/>',
                    '    Take a snapshot of the screen',
                    '</div>',
                    '<div id="{{startRecordingDivId}}">',
                    '    <img id="{{startButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}media-record-4.png"',
                    '         title="Record"',
                    '         alt="Record"/>',
                    '    Start recording',
                    '</div>',
                    '<div id="{{stopRecordingDivId}}">',
                    '    <img id="{{stopButtonId}}"',
                    '         class="wdzt-img-button"',
                    '         src="{{imagesPrefix}}media-stop-record-4.png"',
                    '         title="Stop recording"',
                    '         alt="Stop recording"/>',
                    '    Stop recording',
                    '</div>',
                    '<div id="{{downloadDivId}}">',
                    '    <a href="#" id="{{zipLinkId}}">',
                    '        <img id="{{zipButtonId}}"',
                    '             class="wdzt-img-button"',
                    '             src="{{imagesPrefix}}package-x-generic.png"',
                    '             title="Download record zip"',
                    '             alt="Download record zip"/></a>',
                    '    Download recorded frames',
                    '</div>',
                    '<fieldset class="wdzt-recording-options">',
                    '    <legend>Options</legend>',
                    '    <div class="wdzt-table-layout">',
                    '        <div class="wdzt-row-layout">',
                    '            <label for="{{formSaveScalebarId}}"',
                    '                   class="wdzt-cell-layout wdzt-no-wrap">',
                    '                Include scalebar:',
                    '            </label>',
                    '            <input type="checkbox"',
                    '                   id="{{formSaveScalebarId}}"',
                    '                   class="wdzt-cell-layout"/>',
                    '        </div>',
                    '        <div class="wdzt-row-layout">',
                    '            <label for="{{formSaveTimestampId}}"',
                    '                   class="wdzt-cell-layout wdzt-no-wrap">',
                    '                Include timestamp:',
                    '            </label>',
                    '            <input type="checkbox"',
                    '                   id="{{formSaveTimestampId}}"',
                    '                   class="wdzt-cell-layout"/>',
                    '        </div>',
                    '        <div class="wdzt-row-layout">',
                    '            <label for="{{formTimestampLocationId}}"',
                    '                   class="wdzt-cell-layout wdzt-no-wrap">',
                    '                Timestamp location:',
                    '            </label>',
                    '            <select id="{{formTimestampLocationId}}"',
                    '                    class="wdzt-cell-layout">',
                    '                <option value="TOP_LEFT">Top left</option>',
                    '                <option value="TOP_RIGHT">Top right</option>',
                    '                <option value="BOTTOM_LEFT">Bottom left</option>',
                    '                <option value="BOTTOM_RIGHT">Bottom right</option>',
                    '            </select>',
                    '        </div>',
                    '    </div>',
                    '</fieldset>'
                ].join(''))({
            snapshotDivId: this.snapshotDivId,
            snapshotButtonId: this.snapshotButtonId,
            startRecordingDivId: this.startRecordingDivId,
            startButtonId: this.startButtonId,
            stopRecordingDivId: this.stopRecordingDivId,
            stopButtonId: this.stopButtonId,
            downloadDivId: this.downloadDivId,
            zipLinkId: this.zipLinkId,
            zipButtonId: this.zipButtonId,
            imagesPrefix: this.viewer.imagesPrefix,
            formSaveScalebarId: this.formSaveScalebarId,
            formSaveTimestampId: this.formSaveTimestampId,
            formTimestampLocationId: this.formTimestampLocationId
        }));

        initRecordingControls(this);
        initSnapshotControls(this);
    };

    // Register itself
    $$.Module.MODULES[name] = $$.RecordingModule;

    $.extend($$.RecordingModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 50;
        },
        supportLayer: function() {
            return true;
        },
        destroy: function() {
            unregisterHandlers(this);
        }
    });

    function registerHandlers(_this) {
        _this.handlers.forEach(function(event) {
            _this.viewer.osdMovie.addHandler(event, _this.record);
        });
    }

    function unregisterHandlers(_this) {
        _this.handlers.forEach(function(event) {
            _this.viewer.osdMovie.removeHandler(event, _this.record);
        });
    }

    function initSnapshotControls(_this) {
        var viewer = _this.viewer;
        var recorder = new OpenSeadragon.Recorder({
            viewer: viewer.osd,
            saveImages: true
        });
        $("#" + _this.snapshotDivId).click(function() {
            setRecorderOptions(_this, recorder);
            recorder.startRecording();
            recorder.setMetadata({
                "LAYER": viewer.osdMovie.getMovieName(),
                "FRAME INDEX": viewer.osdMovie.getCurrentFrame()
            });
            recorder.saveFrame();
            recorder.stopRecording();
            var blob = recorder.getRecordedImagesAsZip({type: "blob"});
            saveAs(blob, "snapshot.zip");
        });
    }

    function setRecorderOptions(_this, recorder) {
        recorder.setSaveScalebar($("#" + _this.formSaveScalebarId).prop("checked"));
        recorder.setSaveTimestamp($("#" + _this.formSaveTimestampId).prop("checked"));
        recorder.setTimestampLocation($("#" + _this.formTimestampLocationId).val());
    }

    function initRecordingControls(_this) {
        var viewer = _this.viewer;
        var recorder = new OpenSeadragon.Recorder({
            viewer: viewer.osd,
            saveImages: true
        });
        var record = function() {
            setRecorderOptions(_this, recorder);
            recorder.setMetadata({
                "LAYER": viewer.osdMovie.getMovieName(),
                "FRAME INDEX": viewer.osdMovie.getCurrentFrame()
            });
            recorder.saveFrame();
            if (recorder.getEstimatedMemoryUsed() > MEMORY_WARNING_THRESHOLD) {
                viewer.displayWarning(
                        "You are using a high amount of memory.<br>" +
                        "Consider using the data fetching module.");
            }
        };
        _this.record = record;

        $("#" + _this.startButtonId).click(function() {
            $("#" + _this.startRecordingDivId).hide();
            $("#" + _this.downloadDivId).hide();
            $("#" + _this.stopRecordingDivId).show();
            recorder.startRecording();
            registerHandlers(_this);
        });
        if ($$.isObjectURLSupported) {
            $("#" + _this.stopButtonId).click(function() {
                $("body").addClass("wdzt-wait");
                $("#" + _this.stopRecordingDivId).hide();
                record();
                recorder.stopRecording();
                unregisterHandlers(_this);
                var generateBlobAsync = function() {
                    try {
                        var blob = recorder.getRecordedImagesAsZip({type: "blob"});
                        $("#" + _this.zipLinkId).attr("href", window.URL.createObjectURL(blob));
                        $("#" + _this.zipLinkId).attr("download", "record.zip");
                        $("#" + _this.downloadDivId).show();
                    } catch (ex) {
                        _this.viewer.displayError("Cannot generate zip file: " + ex);
                    } finally {
                        $("#" + _this.startRecordingDivId).show();
                        $("body").removeClass("wdzt-wait");
                    }
                };
                setTimeout(generateBlobAsync, 100);
            });
        } else {
            $("#" + _this.stopButtonId).click(function() {
                $("#" + _this.stopRecordingDivId).hide();
                $("#" + _this.downloadDivId).show();
                $("#" + _this.startRecordingDivId).show();
                record();
                recorder.stopRecording();
                unregisterHandlers(_this);
            });
            $("#" + _this.zipLinkId).click(function() {
                $("body").addClass("wdzt-wait");
                var generateZipAsync = function() {
                    try {
                        var content = recorder.getRecordedImagesAsZip();
                        location.href = "data:application/zip;base64," + content;
                    } catch (ex) {
                        _this.viewer.displayError("Cannot generate zip file: " + ex);
                    } finally {
                        $("body").removeClass("wdzt-wait");
                    }
                };
                setTimeout(generateZipAsync, 100);
            });
        }
        $("#" + _this.downloadDivId).hide();
        $("#" + _this.stopRecordingDivId).hide();
        $("#" + _this.startRecordingDivId).show();
    }

}(WDZT));
