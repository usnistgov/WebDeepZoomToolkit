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

    var name = "DistanceMeasurementModule";

    $$.DistanceMeasurementModule = function(options) {

        this.name = name;
        this.title = "Distance measurement";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        this.color = null;
        this.measurement_array = [];
        this.orig_point = null;

        this.tableId = "wdzt-distance-measurement-table-" + this.hash;
        this.activeCheckboxId = "wdzt-distance-measurement-active-" + this.hash;
        this.clearBoutonId = "wdzt-distance-measurement-clear-btn-" + this.hash;
        this.exportBoutonId = "wdzt-distance-measurement-export-link-" + this.hash;

        $$.getHbsTemplate('src/modules/distance-measurement-module.hbs',
                function(template) {
                    onTemplateReceived(_this, template);
                });

        function reset() {
            clearAll(_this);
        }
        var movie = this.viewer.osdMovie;
        movie.addHandler("movie-changed", reset);
        movie.addHandler("frame-changed", reset);
    };

    function onTemplateReceived(_this, template) {
        _this.$container.html(template({
            tableId: _this.tableId,
            activeCheckboxId: _this.activeCheckboxId,
            clearBoutonId: _this.clearBoutonId,
            exportBoutonId: _this.exportBoutonId
        }));

        $("#" + _this.activeCheckboxId).click(function() {
            if ($(this).is(':checked')) {
                _this.viewer.setClickHandler(_this);
            } else {
                _this.viewer.setClickHandler(null);
            }
        });

        $("#" + _this.clearBoutonId).click(function() {
            clearAll(_this);
        });

        $("#" + _this.exportBoutonId).click(function() {
            var mmList = _this.measurement_array;
            var csvData = "coordinate1_x,coordinate1_y," +
                    "coordinate2_x,coordinate2_y,distance\n";

            mmList.forEach(function(msm) {
                csvData += msm.orig.x + "," + msm.orig.y + "," + msm.dest.x +
                        "," + msm.dest.y + "," + msm.distance + "\n";
            });

            var blob = new Blob([csvData], {type: 'data:text/csv;charset=UTF-8'});
            saveAs(blob, 'export.csv');
        });
    }

    function clearAll(_this) {
        _this.measurement_array.forEach(function(obj) {
            removePoint(_this, obj.orig);
            removePoint(_this, obj.dest);
        });

        _this.measurement_array = [];
        _this.orig_point = null;
        $("#" + _this.tableId).empty();
    }

    // Register itself
    $$.Module.MODULES[name] = $$.DistanceMeasurementModule;

    $.extend($$.DistanceMeasurementModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 80;
        },
        supportLayer: function(layer) {
            return !!layer.scalebar;
        },
        clickHandler: function(event) {
            if (this.isEnabled) {
                clickHandler(this, event.position);
            }
        },
        enable: function() {
            this.isEnabled = true;
        },
        disable: function() {
            this.isEnabled = false;
        },
        destroy: function() {
            this.disable();
        }
    });

    function getDistance(_this, measurement) {
        var pixel = Math.sqrt(
                Math.pow((measurement.orig.x - measurement.dest.x), 2) +
                Math.pow((measurement.orig.y - measurement.dest.y), 2));
        var pixelsPerMeter = _this.viewer.selectedLayer.scalebar.pixelsPerMeter;
        var value = pixel / pixelsPerMeter;

        if (value > 1.0) {
            measurement.distance = Math.round(value) + " m";
            return measurement.distance;
        }

        value *= 1000;
        if (value > 1.0) {
            measurement.distance = Math.round(value) + " mm";
            return measurement.distance;
        }

        value *= 1000;
        if (value > 1.0) {
            measurement.distance = Math.round(value) + " μm";
            return measurement.distance;
        }

        value *= 1000;
        measurement.distance = Math.round(value) + " nm";
        return measurement.distance;
    }

    function addMeasurement(_this, coordinate) {
        if (_this.orig_point === null) {
            _this.orig_point = coordinate;
            var hue = Math.floor((Math.random() * 360));
            _this.color = $.Color({
                hue: hue,
                saturation: 0.9,
                lightness: 0.6,
                alpha: 1
            }).toHexString();
            return;
        }

        var measurement = {
            id: 0,
            orig: {
                x: _this.orig_point.x,
                y: _this.orig_point.y
            },
            dest: {
                x: coordinate.x,
                y: coordinate.y
            },
            color: _this.color
        };

        _this.orig_point = null;

        var measurement_array = _this.measurement_array;
        if (measurement_array.length > 0) {
            var lastMsm = measurement_array[measurement_array.length - 1];
            measurement.id = lastMsm.id + 1;
        }
        measurement.distance = getDistance(_this, measurement);
        measurement_array.push(measurement);

        $("#" + _this.tableId).empty();
        measurement_array.forEach(function(msm) {
            var $row = $("<tr/>");
            var $close = $('<td><img width="16" src="' + _this.viewer.imagesPrefix +
                    'close.svg" alt="remove" title="remove" class="wdzt-img-button"></td>');
            $close.click(function() {
                removeMeasurement(_this, msm, $row);
            });
            $row.append($close);
            $row.append($('<td style="background-color:' +
                    msm.color + '">' + msm.distance + '</td>'));
            $("#" + _this.tableId).append($row);
        });
    }

    function removeMeasurement(_this, msm, $row) {
        removePoint(_this, msm.orig);
        removePoint(_this, msm.dest);
        var idx = _this.measurement_array.indexOf(msm);
        if (idx >= 0) {
            _this.measurement_array.splice(idx, 1);
        }
        $row.remove();
    }

    function drawPoint(_this, osd, coordinate) {
        var $point = $('<div id="' + getPointId(_this, coordinate) + '"/>');
        $point.css({
            backgroundColor: _this.color,
            width: "5px",
            height: "5px"
        });

        var point = osd.viewport.imageToViewportCoordinates(
                coordinate.x, coordinate.y);

        osd.addOverlay({
            element: $point.get(0),
            location: point
        });
    }

    function removePoint(_this, coordinate) {
        var viewer = _this.viewer;
        var movie = viewer.osdMovie;
        var osd = movie.viewer;

        var $point = $("#" + getPointId(_this, coordinate));
        osd.removeOverlay($point.get(0));
        $point.remove();
    }

    function getPointId(_this, coordinates) {
        return "wdzt-distance-measurement-point-" +
                Math.round(coordinates.x) + "-" + Math.round(coordinates.y) +
                "-" + _this.hash;
    }

    function clickHandler(_this, position) {
        var osd = _this.viewer.osd;

        var imagePosition = osd.viewport.viewerElementToImageCoordinates(position);
        var coordinates = {
            x: imagePosition.x,
            y: imagePosition.y
        };
        addMeasurement(_this, coordinates);
        drawPoint(_this, osd, coordinates);
    }

}(WDZT));
