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

    var name = "ConnectivityAnalysisModule";

    $$.ConnectivityAnalysisModule = function(options) {

        this.name = name;
        this.title = "Connectivity analysis";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        this.runButtonId = "wdzt-connectivity-analysis-run-button-" + this.hash;

        $$.getHbsTemplates([
            'src/modules/connectivity-analysis-module-template.hbs',
            'src/modules/connectivity-analysis-module-dialog-template.hbs',
            'src/modules/connectivity-analysis-module-features-template.hbs'],
                function(templates) {
                    onTemplatesReceived(_this,
                            templates[0], templates[1], templates[2]);
                });
    };

    function onTemplatesReceived(_this, moduleTemplate, dialogTemplate,
            featuresTemplate) {
        _this.$container.html(moduleTemplate({
            runButtonId: _this.runButtonId
        }));

        var $runButton = $("#" + _this.runButtonId);
        $runButton.click(function() {
            var context = _this.viewer.osd.drawer.context;
            var result = connectivityAnalysis(context);
            var components = [];
            var colorIndex = 4;
            for (var i = 1; i <= result.numSegments; i++) {
                components.push({
                    label: i,
                    color: {
                        r: result.theSegmentColors[colorIndex],
                        g: result.theSegmentColors[colorIndex + 1],
                        b: result.theSegmentColors[colorIndex + 2],
                        a: result.theSegmentColors[colorIndex + 3]
                    },
                    colorString: "rgb(" + result.theSegmentColors[colorIndex] + ", " +
                            result.theSegmentColors[colorIndex + 1] + ", " +
                            result.theSegmentColors[colorIndex + 2] + ")",
                    area: result.theArea[i]
                });
                colorIndex += 4;
            }

            var $dialog = $(dialogTemplate({
                imgDataUrl: result.theCanvas.toDataURL(),
                components: components,
                height: result.theCanvas.height
            }));
            $dialog.dialog({
                dialogClass: "wdzt-connectivity-analysis-dialog",
                width: $(window).width() - 20,
                close: function() {
                    $(this).dialog('destroy').remove();
                }
            });
            // Allow the user to drag the dialog outside the browser's viewport.
            $dialog.dialog("widget").draggable("option", "containment", "none");

            var imageData = result.theCanvas.getContext("2d").getImageData(
                    0, 0, result.theCanvas.width, result.theCanvas.height);
            $dialog.find("button").click(function() {
                var label = $(this).attr("data-label");
                var component = components[label - 1];
                var featuresExtractor = new IFJS.FeaturesExtractor({
                    image: imageData,
                    maskColor: component.color
                });
                var centroid = featuresExtractor.getCentroid();
                var boundingBox = featuresExtractor.getBoundingBox();
                var features = {
                    "Area": featuresExtractor.getArea(),
                    "Centroid": "x: " + centroid.x.toFixed(2) + "<br>" + 
                            "y: " + centroid.y.toFixed(2),
                    "Perimeter": featuresExtractor.getPerimeter().toFixed(2),
                    "Circularity": featuresExtractor.getCircularity().toFixed(2),
                    "Bounding box": "x: " + boundingBox.x + "<br>" +
                            "y: " + boundingBox.y + "<br>" +
                            "width: " + boundingBox.width + "<br>" +
                            "height: " + boundingBox.height + "<br>" +
                            "aspect ratio: " + 
                            featuresExtractor.getBoundingBoxAspectRatio()
                            .toFixed(2) + 
                            "<br>" +
                            "extend: " + featuresExtractor.getBoundingBoxExtend()
                            .toFixed(2),
                    "Orientation": featuresExtractor.getOrientation().toFixed(2),
                    "Eccentricity": featuresExtractor.getEccentricity().toFixed(2)
                };
                var $featuresDialog = $(featuresTemplate({
                    label: label,
                    features: features
                }));
                $featuresDialog.dialog({
                    dialogClass: "wdzt-features-dialog wdzt-connectivity-analysis-feature-dialog",
                    close: function() {
                        $(this).dialog('destroy').remove();
                    }
                });
                $featuresDialog.siblings(".ui-widget-header").css(
                        "background-color", component.colorString);
            });
        });
    }

    // Register itself
    $$.Module.MODULES[name] = $$.ConnectivityAnalysisModule;

    $.extend($$.ConnectivityAnalysisModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 61;
        },
        supportLayer: function() {
            return true;
        },
        destroy: function() {
        }
    });

    /**
     * Connectivity analysis of a 2D context.
     * @param {Context2D} context The context to analyse.
     * @author Peter Bajcsy
     */
    function connectivityAnalysis(context) {
        // this threshold is introduced to compensate for 
        // the blur introduce by multi-scale pyramid averaging
        // we assume that binary images with 0 and 255 values are inputs to
        // the connectivity analysis
        var thresh = 128;

        // initialize variables
        var originalPixels = context.getImageData(0, 0,
                context.canvas.width, context.canvas.height).data;
        var oneRowOffset = context.canvas.width * 4;
        var onePixelOffset = 4;

        var i, j;
        var index, index1, index2;
        var peto, pom, pom1;
        var maxpetox, count;

        var numrows, numcols;
        numrows = context.canvas.height;
        numcols = context.canvas.width;

        //allocate memory for outputs
        // JavaScript Numbers are Always 64-bit Floating Point
        // http://www.w3schools.com/js/js_numbers.asp
        var size = numrows * numcols;
        var _pImLabels = new Uint32Array(size); // image with segments
        var _pAreaS = new Uint32Array(size + 2); // pixel size of segments

        for (peto = 0; peto < size + 2; peto++) {
            _pAreaS[peto] = 0;
        }

        // region labeling
        index = 0;
        index1 = onePixelOffset;
        index2 = 0;
        peto = 1;

        for (i = 0; i < numrows; i++) {
            for (j = 0; j < numcols - 1; j++) {
                _pImLabels[index2] = peto;
                _pAreaS[peto] += 1;
                //if (originalPixels[index] == originalPixels[index+1]) {
                // assign the same label to two adjacent pixels (i,j) and (i,j+1)
                if (!(originalPixels[index] <= thresh &&
                        originalPixels[index1] <= thresh) &&
                        !(originalPixels[index] > thresh &&
                                originalPixels[index1] > thresh)) {
                    peto = peto + 1;
                }
                index = index + onePixelOffset;
                index1 = index1 + onePixelOffset;
                index2 = index2 + 1;
            }

            _pImLabels[index2] = peto;
            _pAreaS[peto] = _pAreaS[peto] + 1;
            peto = peto + 1;
            index = index + onePixelOffset;
            index1 = index1 + onePixelOffset;
            index2 = index2 + 1;
        }
        maxpetox = peto;

        var temp1 = new Uint32Array(maxpetox);
        var labeling = new Uint32Array(maxpetox);

        for (pom = 1; pom < maxpetox; pom++) {
            temp1[pom] = pom;
        }

        // expanding regions along columns
        index = 0;
        index1 = oneRowOffset;//numcols;
        index2 = 0;

        for (i = 0; i < numrows - 1; i++) {
            for (j = 0; j < numcols; j++) {
                if ((originalPixels[index] <= thresh &&
                        originalPixels[index1] <= thresh) ||
                        (originalPixels[index] > thresh &&
                                originalPixels[index1] > thresh)) {
                    //if (originalPixels[index] == originalPixels[index1]) {
                    // merge two adjacent pixels (i,j) and (i+1,j)
                    pom = temp1[_pImLabels[index2 + numcols]];

                    while (temp1[pom] !== pom) {
                        pom = temp1[pom];
                    }

                    pom1 = temp1[_pImLabels[index2]];

                    while (temp1[pom1] !== pom1) {
                        pom1 = temp1[pom1];
                    }

                    if (pom1 > pom) {
                        temp1[pom1] = pom;
                    } else {
                        if (pom1 < pom) {
                            temp1[pom] = pom1;
                        }
                    }
                }
                index = index + onePixelOffset;
                index1 = index1 + onePixelOffset;
                index2 = index2 + 1;
            }
        }

        // minimum label for the segments plus compute the size
        for (peto = 1; peto < maxpetox; peto++) {
            if (temp1[peto] !== peto) {
                pom = temp1[peto];

                while (temp1[pom] !== pom) {
                    pom = temp1[pom];
                }

                _pAreaS[pom] = _pAreaS[pom] + _pAreaS[peto];
                _pAreaS[peto] = 0;
                temp1[peto] = pom;
            }
        }

        // relabel segments from 1 to max and update the size
        count = 0;
        for (peto = 1; peto < maxpetox; peto++) {
            if (_pAreaS[peto] > 0) {
                count = count + 1;
                labeling[peto] = count;
                _pAreaS[count] = _pAreaS[peto];
            }
        }

        ////////////////////////////
        // inserted to sort labels by Area size
        var labelingArea = new Uint32Array(count + 1);
        for (peto = 1; peto < labelingArea.length; peto++) {
            labelingArea[peto] = peto;
        }
        var uint32Temp = new Uint32Array(1);
        var swapTrue = true;
        while (swapTrue) {
            swapTrue = false;
            for (peto = 1; peto < labelingArea.length; peto++) {
                if (_pAreaS[peto] < _pAreaS[peto + 1]) {
                    // swap order
                    uint32Temp[0] = _pAreaS[peto];
                    _pAreaS[peto] = _pAreaS[peto + 1];
                    _pAreaS[peto + 1] = uint32Temp[0];

                    uint32Temp[0] = labelingArea[peto];
                    labelingArea[peto] = labelingArea[peto + 1];
                    labelingArea[peto + 1] = uint32Temp[0];
                    swapTrue = true;
                }
            }
        }
        // assign new label to each pixel
        var foundMatch = false;
        for (index = 0; index < size; index++) {
            peto = _pImLabels[index];
            peto = labeling[temp1[peto]];

            foundMatch = false;
            for (index1 = 1; index1 < labelingArea.length && !foundMatch; index1++) {
                if (peto === labelingArea[index1]) {
                    _pImLabels[index] = index1;
                    foundMatch = true;
                }
            }
        }


        /*		
         // assign new label to each pixel
         for (index = 0; index < size; index++) {
         peto = _pImLabels[index];
         peto = labeling[temp1[peto]];
         _pImLabels[index]= peto;
         }		
         */
        maxpetox = count + 1;
        var _NFoundS = count;

        labeling = null;
        labelingArea = null;

        //truncate the file size by copying and reallocating an array
        for (index = 0; index < _NFoundS + 1; index++) {
            temp1[index] = _pAreaS[index];
        }

        _pAreaS = null;
        _pAreaS = new Uint32Array(_NFoundS + 1); // pixel size of segments

        for (index = 0; index < _NFoundS + 1; index++) {
            _pAreaS[index] = temp1[index];
        }

        temp1 = null;

        // new canvas creation
        var canvas = document.createElement("canvas");
        var newContext = canvas.getContext("2d");
        newContext.canvas.width = numcols;
        newContext.canvas.height = numrows;
        var labelData = newContext.getImageData(0, 0,
                newContext.canvas.width, newContext.canvas.height);

        //store the color assign to each label
        var colorAssign = new Array((_NFoundS + 1) * 4);
        var colorIndex = 0;
        for (colorIndex = 0; colorIndex < _NFoundS + 1; colorIndex += 4) {
            colorAssign[colorIndex] = 0; //red
            colorAssign[colorIndex + 1] = 0; //green
            colorAssign[colorIndex + 2] = 0; //blue
            colorAssign[colorIndex + 3] = 0;//alpha
        }
        index = 0;
        index2 = 0;
        for (i = 0; i < numrows; i++) {
            for (j = 0; j < numcols; j++) {
                if (_pImLabels[index2] === 0) {
                    throw new Error("zero label at (row,col)=" + i + "," + j);
                }
                // TODO: figure mapping from http://www.w3schools.com/tags/ref_colorpicker.asp
                labelData.data[index + 3] = 255; // alpha			
                if (_pImLabels[index2] === 1) {
                    labelData.data[index] = 0; // red 
                    labelData.data[index + 1] = 0; //  green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 2) {
                    labelData.data[index] = 255; // red 
                    labelData.data[index + 1] = 0; // green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 3) {
                    labelData.data[index] = 0; //  red 
                    labelData.data[index + 1] = 255; //  green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 4) {
                    labelData.data[index] = 0; // red 
                    labelData.data[index + 1] = 0; //  green
                    labelData.data[index + 2] = 255; // blue
                } else if (_pImLabels[index2] === 5) {
                    labelData.data[index] = 255; // red 
                    labelData.data[index + 1] = 255; // green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 6) {
                    labelData.data[index] = 255; //  red 
                    labelData.data[index + 1] = 0; //  green
                    labelData.data[index + 2] = 255; // blue
                } else if (_pImLabels[index2] === 7) {
                    labelData.data[index] = 0; // red 
                    labelData.data[index + 1] = 255; // green
                    labelData.data[index + 2] = 255; // blue
                } else if (_pImLabels[index2] === 8) {
                    labelData.data[index] = 255; //  red 
                    labelData.data[index + 1] = 255; //  green
                    labelData.data[index + 2] = 255; // blue
                } else if (_pImLabels[index2] === 9) {
                    labelData.data[index] = 128; // red 
                    labelData.data[index + 1] = 0; //  green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 10) {
                    labelData.data[index] = 0; // red 
                    labelData.data[index + 1] = 128; // green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 11) {
                    labelData.data[index] = 0; //  red 
                    labelData.data[index + 1] = 0; //  green
                    labelData.data[index + 2] = 128; // blue
                } else if (_pImLabels[index2] === 12) {
                    labelData.data[index] = 128; // red 
                    labelData.data[index + 1] = 128; //  green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 13) {
                    labelData.data[index] = 128; // red 
                    labelData.data[index + 1] = 0; // green
                    labelData.data[index + 2] = 128; // blue
                } else if (_pImLabels[index2] === 14) {
                    labelData.data[index] = 0; //  red 
                    labelData.data[index + 1] = 128; //  green
                    labelData.data[index + 2] = 128; // blue
                } else if (_pImLabels[index2] === 15) {
                    labelData.data[index] = 128; // red 
                    labelData.data[index + 1] = 128; // green
                    labelData.data[index + 2] = 128; // blue
                } else if (_pImLabels[index2] === 16) {
                    labelData.data[index] = 64; //  red 
                    labelData.data[index + 1] = 64; //  green
                    labelData.data[index + 2] = 64; // blue
                } else if (_pImLabels[index2] === 17) {
                    labelData.data[index] = 64; // red 
                    labelData.data[index + 1] = 0; //  green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 18) {
                    labelData.data[index] = 0; // red 
                    labelData.data[index + 1] = 64; // green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 19) {
                    labelData.data[index] = 0; //  red 
                    labelData.data[index + 1] = 0; //  green
                    labelData.data[index + 2] = 64; // blue
                } else if (_pImLabels[index2] === 20) {
                    labelData.data[index] = 64; // red 
                    labelData.data[index + 1] = 64; //  green
                    labelData.data[index + 2] = 0; // blue
                } else if (_pImLabels[index2] === 21) {
                    labelData.data[index] = 64; // red 
                    labelData.data[index + 1] = 0; // green
                    labelData.data[index + 2] = 64; // blue
                } else if (_pImLabels[index2] === 22) {
                    labelData.data[index] = 0; //  red 
                    labelData.data[index + 1] = 64; //  green
                    labelData.data[index + 2] = 64; // blue
                } else if (_pImLabels[index2] === 23) {
                    labelData.data[index] = 64; // red 
                    labelData.data[index + 1] = 64; // green
                    labelData.data[index + 2] = 64; // blue
                } else if (_pImLabels[index2] === 24) {
                    labelData.data[index] = 192; //  red 
                    labelData.data[index + 1] = 192; //  green
                    labelData.data[index + 2] = 192; // blue
                } else {
                    // higher 8 bits - red 
                    labelData.data[index] = _pImLabels[index2] >>> 8;
                    // lower 8 bits - green
                    labelData.data[index + 1] = _pImLabels[index2] & 0xFF;
                    labelData.data[index + 2] = 0; // blue
                    labelData.data[index + 3] = 255; // alpha		
                }

                // store colors						
                if (_pImLabels[index2] < _NFoundS + 1) {

                    colorIndex = _pImLabels[index2] << 2;

                    //if(colorAssign[ colorIndex ] == -1){
                    //update color only if needed
                    colorAssign[ colorIndex ] = labelData.data[index];
                    colorAssign[ colorIndex + 1 ] = labelData.data[index + 1];
                    colorAssign[ colorIndex + 2 ] = labelData.data[index + 2];
                    colorAssign[ colorIndex + 3 ] = labelData.data[index + 3];
                    //}
                } else {
                    throw new Error("_ImLabels[index2] =" + _pImLabels[index2] +
                            " > _NFoundS=" + _NFoundS);
                }

                index += onePixelOffset;
                index2++;
            }
        }
        newContext.putImageData(labelData, 0, 0);

        return {
            theCanvas: newContext.canvas,
            numSegments: _NFoundS,
            theArea: _pAreaS,
            theSegmentColors: colorAssign,
            theSegments: _pImLabels
        };
    }

}(WDZT));
