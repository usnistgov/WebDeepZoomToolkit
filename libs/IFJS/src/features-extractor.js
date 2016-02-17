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

var IFJS = {};

(function(IFJS) {

    IFJS.FeaturesExtractor = function(options) {
        this._image = options.image;
        this._imageData = this._image.data;
        this._mask = options.mask || options.image;
        this._maskData = this._mask.data;
        this._maskColor = options.maskColor || {
            r: 255,
            g: 255,
            b: 255,
            a: 255
        };

        this._width = this._mask.width;
        this._height = this._mask.height;

        // Shape features
        this._area = null;
        this._centroid = null;
        this._mups = null;
        this._orientation = null;
        this._eccentricity = null;
        this._perimeter = null;
        this._circularity = null;
        this._boundingBox = null;
        this._boundingBoxAspectRatio = null;
        this._boundingBoxExtend = null;

        // Intensity features
        this._mean = null;
        this._min = null;
        this._max = null;
        this._range = null;
    };

    var proto = IFJS.FeaturesExtractor.prototype;

    proto.getArea = function() {
        if (this._area === null) {
            this._computeBasicFeatures();
        }
        return this._area;
    };

    proto.getCentroid = function() {
        if (this._centroid === null) {
            this._computeBasicFeatures();
        }
        return this._centroid;
    };

    proto.getMups = function() {
        if (this._mups === null) {
            this._computeMups();
        }
        return this._mups;
    };

    proto.getOrientation = function() {
        if (this._orientation === null) {
            this._computeOrientation();
        }
        return this._orientation;
    };

    proto.getEccentricity = function() {
        if (this._eccentricity === null) {
            this._computeEccentricity();
        }
        return this._eccentricity;
    };

    proto.getPerimeter = function() {
        if (this._perimeter === null) {
            this._computeBasicFeatures();
        }
        return this._perimeter;
    };

    proto.getCircularity = function() {
        if (this._circularity === null) {
            var area = this.getArea();
            var perimeter = this.getPerimeter();
            this._circularity = 4 * Math.PI * area / (perimeter * perimeter);
        }
        return this._circularity;
    };

    proto.getBoundingBox = function() {
        if (this._boundingBox === null) {
            this._computeBasicFeatures();
        }
        return this._boundingBox;
    };

    proto.getBoundingBoxAspectRatio = function() {
        if (this._boundingBoxAspectRatio === null) {
            var boundingBox = this.getBoundingBox();
            this._boundingBoxAspectRatio = boundingBox.width / boundingBox.height;
        }
        return this._boundingBoxAspectRatio;
    };

    proto.getBoundingBoxExtend = function() {
        if (this._boundingBoxExtend === null) {
            var boundingBox = this.getBoundingBox();
            var boundingBoxArea = boundingBox.width * boundingBox.height;
            var area = this.getArea();
            this._boundingBoxExtend = area / boundingBoxArea;
        }
        return this._boundingBoxExtend;
    };

    proto.getMean = function() {
        if (this._mean === null) {
            this._computeBasicFeatures();
        }
        return this._mean;
    };

    proto.getMin = function() {
        if (this._min === null) {
            this._computeBasicFeatures();
        }
        return this._min;
    };

    proto.getMax = function() {
        if (this._max === null) {
            this._computeBasicFeatures();
        }
        return this._max;
    };

    proto.getRange = function() {
        if (this._range === null) {
            this._range = this.getMax() - this.getMin() + 1;
        }
        return this._range;
    };

    proto._getAreaComputer = function() {
        var area = 0;
        return {
            processPixel: function() {
                area++;
            },
            getResult: function() {
                return area;
            }
        };
    };

    proto._getCentroidComputer = function() {
        var sumX = 0;
        var sumY = 0;
        return {
            processPixel: function(x, y) {
                sumX += x;
                sumY += y;
            },
            getResult: function(area) {
                return {
                    x: sumX / area,
                    y: sumY / area
                };
            }
        };
    };

    proto._getPerimeterComputer = function() {
        var width = this._width;
        var height = this._height;
        var isInRoi = this.isInRoi.bind(this);
        var perimeter = 0;
        return {
            processPixel: function(x, y) {
                // If on the edge of the mask, it is part of the perimeter.
                if (x === 0 || y === 0 ||
                        x === width - 1 || y === height - 1) {
                    perimeter++;
                } else if (
                        !isInRoi(x - 1, y) ||
                        !isInRoi(x + 1, y) ||
                        !isInRoi(x, y - 1) ||
                        !isInRoi(x, y + 1)) {
                    perimeter++;
                } else if (
                        !isInRoi(x - 1, y - 1) ||
                        !isInRoi(x + 1, y + 1) ||
                        !isInRoi(x - 1, y + 1) ||
                        !isInRoi(x + 1, y - 1)) {
                    // Diagonals are adjusted
                    perimeter += 0.414;
                }
            },
            getResult: function() {
                return perimeter;
            }
        };
    };

    proto._getBoundingBoxComputer = function() {
        var minX = Number.MAX_VALUE;
        var maxX = 0;
        var minY = Number.MAX_VALUE;
        var maxY = 0;
        return {
            processPixel: function(x, y) {
                if (x < minX) {
                    minX = x;
                }
                if (x > maxX) {
                    maxX = x;
                }
                if (y < minY) {
                    minY = y;
                }
                if (y > maxY) {
                    maxY = y;
                }
            },
            getResult: function() {
                return {
                    x: minX,
                    y: minY,
                    width: maxX - minX + 1,
                    height: maxY - minY + 1
                };
            }
        };
    };

    proto.getMupsComputer = function() {
        var centroid = this.getCentroid();
        var mup11 = 0;
        var mup20 = 0;
        var mup02 = 0;
        return {
            processPixel: function(x, y, i) {
                var dx = x - centroid.x;
                var dy = y - centroid.y;
                mup11 += dx * dy;
                mup20 += dx * dx;
                mup02 += dy * dy;
            },
            getResult: function() {
                var area = this.getArea();
                return {
                    mup11: mup11 / area,
                    mup20: mup20 / area,
                    mup02: mup02 / area
                };
            }
        };
    };

    proto._computeBasicFeatures = function() {
        var areaComputer = this._getAreaComputer();
        var centroidComputer = this._getCentroidComputer();
        var perimeterComputer = this._getPerimeterComputer();
        var boundingBoxComputer = this._getBoundingBoxComputer();
        var meanComputer = this._getMeanComputer();
        var minComputer = this._getMinComputer();
        var maxComputer = this._getMaxComputer();

        this.traverseRoi(function(x, y) {
            areaComputer.processPixel(x, y);
            centroidComputer.processPixel(x, y);
            perimeterComputer.processPixel(x, y);
            boundingBoxComputer.processPixel(x, y);
            meanComputer.processPixel(x, y);
            minComputer.processPixel(x, y);
            maxComputer.processPixel(x, y);
        });

        this._area = areaComputer.getResult();
        this._centroid = centroidComputer.getResult(this._area);
        this._perimeter = perimeterComputer.getResult();
        this._boundingBox = boundingBoxComputer.getResult();
        this._mean = meanComputer.getResult(this._area);
        this._min = minComputer.getResult();
        this._max = maxComputer.getResult();
    };

    proto._computeMups = function() {
        var centroid = this.getCentroid();
        var mup11 = 0;
        var mup20 = 0;
        var mup02 = 0;

        this.traverseRoi(function(x, y) {
            var dx = x - centroid.x;
            var dy = y - centroid.y;
            mup11 += dx * dy;
            mup20 += dx * dx;
            mup02 += dy * dy;
        });

        var area = this.getArea();
        this._mups = {
            mup11: mup11 / area,
            mup20: mup20 / area,
            mup02: mup02 / area
        };
    };

    proto._computeEccentricity = function() {
        var mups = this.getMups();
        var mup11 = mups.mup11;
        var mup20 = mups.mup20;
        var mup02 = mups.mup02;
        var left = mup20 + mup02;
        var right = Math.sqrt(
                4 * mup11 * mup11 + (mup20 - mup02) * (mup20 - mup02));
        var L1 = (left + right) / 2;
        var L2 = (left - right) / 2;
        if (L2 / L1 <= 1) {
            this._eccentricity = Math.sqrt(1 - L2 / L1);
        } else {
            this._eccentricity = Math.sqrt(1 - L1 / L2);
        }
    };

    proto._computeOrientation = function() {
        var mups = this.getMups();
        var mup11 = mups.mup11;
        var mup20 = mups.mup20;
        var mup02 = mups.mup02;
        if (mup20 !== mup02) {
            this._orientation = 0.5 * Math.atan(2 * mup11 / (mup20 - mup02));
        } else {
            this._orientation = Number.NaN;
        }
    };

    proto._getMeanComputer = function() {
        var sum = 0;
        var getValue = this.getValue.bind(this);
        return {
            processPixel: function(x, y) {
                sum += getValue(x, y);
            },
            getResult: function(area) {
                return sum / area;
            }
        };
    };

    proto._getMinComputer = function() {
        var min = 255;
        var getValue = this.getValue.bind(this);
        return {
            processPixel: function(x, y) {
                var value = getValue(x, y);
                if (value < min) {
                    min = value;
                }
            },
            getResult: function() {
                return min;
            }
        };
    };

    proto._getMaxComputer = function() {
        var max = 0;
        var getValue = this.getValue.bind(this);
        return {
            processPixel: function(x, y) {
                var value = getValue(x, y);
                if (value > max) {
                    max = value;
                }
            },
            getResult: function() {
                return max;
            }
        };
    };

    proto.isInRoi = function(x, y) {
        var index = (this._width * y + x) * 4;
        var data = this._maskData;
        var maskColor = this._maskColor;
        return data[index] === maskColor.r &&
                data[index + 1] === maskColor.g &&
                data[index + 2] === maskColor.b &&
                data[index + 3] === maskColor.a;
    };

    proto.traverseRoi = function(callback) {
        var startX = 0;
        var startY = 0;
        var width = this._width;
        var height = this._height;
        if (this._boundingBox !== null) {
            startX = this._boundingBox.x;
            startY = this._boundingBox.y;
            width = this._boundingBox.width;
            height = this._boundingBox.height;
        }
        for (var y = startY; y < height; y++) {
            for (var x = startX; x < width; x++) {
                if (this.isInRoi(x, y)) {
                    callback(x, y);
                }
            }
        }
    };

    proto.getValue = function(x, y) {
        var index = (this._width * y + x) * 4;
        var data = this._imageData;
        return (data[index] + data[index + 1] + data[index + 2]) / 3;
    };

})(IFJS);
