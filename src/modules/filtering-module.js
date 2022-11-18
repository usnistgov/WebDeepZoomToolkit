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

    var name = "FilteringModule";

    $$.FilteringModule = function(options) {

        this.name = name;
        this.title = "Filtering";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        this.enabledId = "wdzt-filtering-enabled-" + this.hash;
        this.modifyButtonId = "wdzt-filtering-modify-" + this.hash;
        this.filtersListId = "wdzt-filtering-filters-list-" + this.hash;
        this.dialogId = "wdzt-filtering-dialog-" + this.hash;
        this.availableFiltersId = "wdzt-filtering-available-filters-" + this.hash;
        this.selectedFiltersId = "wdzt-filtering-selected-filters-" + this.hash;

        $$.getHbsTemplate('src/modules/filtering-module-template.hbs',
                function(template) {
                    onTemplateReceived(_this, template);
                });
    };

    function onTemplateReceived(_this, template) {
        _this.$container.html(template({
            enabledId: _this.enabledId,
            modifyButtonId: _this.modifyButtonId,
            filtersListId: _this.filtersListId
        }));

        $$.getHbsTemplate('src/modules/filtering-module-dialog-template.hbs',
                function(template) {
                    setUpDialog(_this, template);
                });
    }

    function setUpDialog(_this, template) {
        var $modifyButton = $("#" + _this.modifyButtonId);

        var $dialog = $(template({
            dialogId: _this.dialogId,
            availableFiltersId: _this.availableFiltersId,
            selectedFiltersId: _this.selectedFiltersId
        }));

        var $availableFilters = $dialog.find("#" + _this.availableFiltersId);
        var $selectedFilters = $dialog.find("#" + _this.selectedFiltersId);
        _this.$selectedFilters = $selectedFilters;

        var $enabled = $("#" + _this.enabledId);
        var $filtersList = $("#" + _this.filtersListId);

        var idIncrement = 0;
        var hashTable = {};

        function updateFilters() {
            var filters = [];
            var sync = true;
            $filtersList.empty();
            $selectedFilters.find("li").each(function() {
                var id = this.id;
                var filter = hashTable[id];
                if ($enabled.prop("checked")) {
                    filters.push(filter.generatedFilter.getFilter());
                    sync &= filter.generatedFilter.sync;
                }
                $filtersList.append("<li>" + filter.name + ": " +
                        filter.generatedFilter.getParams() + "</li>");
            });
            var currentFilters = [];
            var filterOptions = _this.viewer.osd.getFilterOptions();
            if (filterOptions) {
                currentFilters = filterOptions.filters;
            }
            var updatedFilters = $$.FilteringHelper.updateFilters(
                _this.viewer.osd.world.getItemAt(0),
                {
                    items: [_this.viewer.osd.world.getItemAt(0)],
                    processors: filters
                },
                currentFilters);
            if (updatedFilters.length > 1) {
                sync = false;
            }
            _this.viewer.osd.setFilterOptions({
                filters: updatedFilters,
                loadMode: sync ? 'sync' : 'async'
            });
        }

        $enabled.change(updateFilters);

        availableFilters.forEach(function(filter) {
            var $li = $('<li></li>');
            var $plus = $('<img src="' + _this.viewer.imagesPrefix +
                    'plus.png" alt="+" class="wdzt-img-button">');
            $li.append($plus);
            $li.append(filter.name);
            $li.appendTo($availableFilters);
            $plus.click(function() {
                var id = "selected_" + _this.hash + "_" + idIncrement++;
                var generatedFilter = filter.generate(updateFilters);
                hashTable[id] = {
                    name: filter.name,
                    generatedFilter: generatedFilter
                };
                var $li = $('<li id="' + id + '"><div class="wdzt-table-layout wdzt-full-width"> ' +
                        '<div class="wdzt-row-layout"></div></div></li>');
                var $minus = $('<div class="wdzt-cell-layout"><img src="' +
                        _this.viewer.imagesPrefix +
                        'minus.png" alt="-" class="wdzt-img-button"></div>');
                var $row = $li.find('.wdzt-row-layout');
                $row.append($minus);
                $row.append('<div class="wdzt-cell-layout wdzt-filtering-label">' +
                        filter.name + '</div>');
                if (filter.help) {
                    var $help = $('<div class="wdzt-cell-layout"><img src="' +
                            _this.viewer.imagesPrefix +
                            'help-browser-2.png" alt="help" title="' +
                            filter.help + '"></div>');
                    $help.tooltip();
                    $row.append($help);
                }
                $row.append(
                        $('<div class="wdzt-cell-layout wdzt-full-width"></div>')
                        .append(generatedFilter.html));
                $minus.click(function() {
                    delete hashTable[id];
                    $li.remove();
                    updateFilters();
                });
                $li.appendTo($selectedFilters);
                updateFilters();
            });
        });

        $selectedFilters.sortable({
            containment: 'parent',
            axis: 'y',
            tolerance: 'pointer',
            update: updateFilters
        });

        $modifyButton.click(function() {
            // Open popup
            $dialog.dialog({
                width: 650,
                height: 300,
                dialogClass: "wdzt-filtering-dialog wdzt-filtering-dialog-" +
                        _this.hash
            });

            if ($dialog.height() > $(window).height()) {
                $dialog.height($(window).height() * 0.75);
            }

            // Keep dialogs when switching from/to fullscreen
            var dialogContainer = $(".wdzt-filtering-dialog-" + _this.hash);
            var preFullPageHandler = function() {
                dialogContainer.detach();
            };
            var fullPageHandler = function() {
                dialogContainer.appendTo(document.body);
            };
            var resizeHandler = function() {
                // Capture body dimensions before adding dialog
                var bodyWidth = $(document.body).width();
                var bodyHeight = $(document.body).height();

                // Ensure that the dialog does not fall outside of the body
                var offset = dialogContainer.offset();
                var width = dialogContainer.width();
                var height = dialogContainer.height();
                if (offset.left + width > bodyWidth && bodyWidth > width) {
                    offset.left = bodyWidth - width;
                }
                if (offset.top + height > bodyHeight && bodyHeight > height) {
                    offset.top = bodyHeight - height;
                }
                dialogContainer.offset(offset);
            };
            var viewer = _this.viewer;
            var osd = viewer.osd;
            viewer.addHandler("pre-full-page", preFullPageHandler);
            viewer.addHandler("full-page", fullPageHandler);
            osd.addHandler("resize", resizeHandler);
        });

        var movie = _this.viewer.osdMovie;
        movie.addHandler("movie-changed", updateFilters);
        movie.addHandler("frame-changed", updateFilters);
    }


    // Register itself
    $$.Module.MODULES[name] = $$.FilteringModule;

    $.extend($$.FilteringModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 60;
        },
        supportLayer: function() {
            return true;
        },
        destroy: function() {
        }
    });

    // Prevent Caman from caching the canvas state between filters.
    // Without this, non-caman filters in between 2 camans filters get ignored.
    var caman = function(canvas, callback) {
        var storeHasBackup = Caman.Store.has;
        Caman.Store.has = function() {
            return false;
        };
        /* jshint newcap: false */
        Caman(canvas, function() {
            callback.bind(this)();
            Caman.Store.has = storeHasBackup;
        });
    };

    // List of filters with their templates.
    /* jshint latedef: false */
    var availableFilters = [{
            name: "Invert",
            generate: function() {
                return {
                    html: '',
                    getParams: function() {
                        return '';
                    },
                    getFilter: function() {
                        return OpenSeadragon.Filters.INVERT();
                    },
                    sync: true
                };
            }
        }, {
            name: "Colorize",
            help: 'The adjustment range (strength) is from 0 to 100.' +
                    'The higher the value, the closer the colors in the ' +
                    'image shift towards the given adjustment color.' +
                    'Color values are between 0 to 255',
            generate: function(updateCallback) {
                var hash = $$.guid();
                var redSpinnerId = 'redSpinner-' + hash;
                var greenSpinnerId = 'greenSpinner-' + hash;
                var blueSpinnerId = 'blueSpinner-' + hash;
                var strengthSpinnerId = 'strengthSpinner-' + hash;
                var $html = $('<div class="table">' +
                        '<div class="row">' +
                        '    <div class="wdzt-cell-layout">' +
                        '        Red: <span id="' + redSpinnerId + '"></span>' +
                        '    </div>' +
                        '    <div class="wdzt-cell-layout">' +
                        '        Green: <span id="' + greenSpinnerId + '"></span>' +
                        '    </div>' +
                        '    <div class="wdzt-cell-layout">' +
                        '        Blue: <span id="' + blueSpinnerId + '"></span>' +
                        '    </div>' +
                        '    <div class="wdzt-cell-layout">' +
                        '        Strength: <span id="' + strengthSpinnerId + '"></span>' +
                        '    </div>' +
                        '</div>' +
                        '</div>');
                var redSpinner = new $$.Spinner({
                    $element: $html.find("#" + redSpinnerId),
                    init: 100,
                    min: 0,
                    max: 255,
                    step: 1,
                    updateCallback: updateCallback
                });
                var greenSpinner = new $$.Spinner({
                    $element: $html.find("#" + greenSpinnerId),
                    init: 20,
                    min: 0,
                    max: 255,
                    step: 1,
                    updateCallback: updateCallback
                });
                var blueSpinner = new $$.Spinner({
                    $element: $html.find("#" + blueSpinnerId),
                    init: 20,
                    min: 0,
                    max: 255,
                    step: 1,
                    updateCallback: updateCallback
                });
                var strengthSpinner = new $$.Spinner({
                    $element: $html.find("#" + strengthSpinnerId),
                    init: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        var red = redSpinner.getValue();
                        var green = greenSpinner.getValue();
                        var blue = blueSpinner.getValue();
                        var strength = strengthSpinner.getValue();
                        return 'R: ' + red + ' G: ' + green + ' B: ' + blue +
                                ' S: ' + strength;
                    },
                    getFilter: function() {
                        var red = redSpinner.getValue();
                        var green = greenSpinner.getValue();
                        var blue = blueSpinner.getValue();
                        var strength = strengthSpinner.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.colorize(red, green, blue, strength);
                                this.render(callback);
                            });
                        };
                    }
                };
            }
        }, {
            name: "Contrast",
            help: 'Range is -100 to 100. Values < 0 will decrease ' +
                    'contrast while values > 0 will increase contrast',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 10,
                    min: -100,
                    max: 100,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.contrast(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Exposure",
            help: 'Range is -100 to 100. Values < 0 will decrease ' +
                    'exposure while values > 0 will increase exposure',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 10,
                    min: -100,
                    max: 100,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.exposure(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Gamma",
            help: 'Range is from 0 to infinity, although sane values ' +
                    'are from 0 to 4 or 5. Values between 0 and 1 will ' +
                    'lessen the contrast while values greater than 1 will increase it.',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 0.5,
                    min: 0,
                    sliderMax: 5,
                    step: 0.1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.gamma(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Hue",
            help: 'hue value is between 0 to 100 representing the ' +
                    'percentage of Hue shift in the 0 to 360 range',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 20,
                    min: 0,
                    max: 100,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.hue(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Saturation",
            help: 'saturation value has to be between -100 and 100',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 50,
                    min: -100,
                    max: 100,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.saturation(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Vibrance",
            help: 'vibrance value has to be between -100 and 100',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 50,
                    min: -100,
                    max: 100,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.vibrance(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Sepia",
            help: 'sepia value has to be between 0 and 100',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.sepia(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Noise",
            help: 'Noise cannot be smaller than 0',
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 50,
                    min: 0,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        var value = spinnerSlider.getValue();
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.noise(value);
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Greyscale",
            generate: function() {
                return {
                    html: '',
                    getParams: function() {
                        return '';
                    },
                    getFilter: function() {
                        return function(context, callback) {
                            caman(context.canvas, function() {
                                this.greyscale();
                                this.render(callback); // don't forget to call the callback.
                            });
                        };
                    }
                };
            }
        }, {
            name: "Sobel Edge",
            generate: function() {
                return {
                    html: '',
                    getParams: function() {
                        return '';
                    },
                    getFilter: function() {
                        return function(context, callback) {
                            var imgData = context.getImageData(
                                    0, 0, context.canvas.width, context.canvas.height);
                            var pixels = imgData.data;
                            var originalPixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data;
                            var oneRowOffset = context.canvas.width * 4;
                            var onePixelOffset = 4;
                            var Gy, Gx;
                            var idx = 0;
                            for (var i = 1; i < context.canvas.height - 1; i += 1) {
                                idx = oneRowOffset * i + 4;
                                for (var j = 1; j < context.canvas.width - 1; j += 1) {
                                    Gy = originalPixels[idx - onePixelOffset + oneRowOffset] + 2 * originalPixels[idx + oneRowOffset] + originalPixels[idx + onePixelOffset + oneRowOffset];
                                    Gy = Gy - (originalPixels[idx - onePixelOffset - oneRowOffset] + 2 * originalPixels[idx - oneRowOffset] + originalPixels[idx + onePixelOffset - oneRowOffset]);
                                    Gx = originalPixels[idx + onePixelOffset - oneRowOffset] + 2 * originalPixels[idx + onePixelOffset] + originalPixels[idx + onePixelOffset + oneRowOffset];
                                    Gx = Gx - (originalPixels[idx - onePixelOffset - oneRowOffset] + 2 * originalPixels[idx - onePixelOffset] + originalPixels[idx - onePixelOffset + oneRowOffset]);
                                    pixels[idx] = Math.sqrt(Gx * Gx + Gy * Gy); // 0.5*Math.abs(Gx) + 0.5*Math.abs(Gy);//100*Math.atan(Gy,Gx);
                                    pixels[idx + 1] = 0;
                                    pixels[idx + 2] = 0;
                                    idx += 4;
                                }
                            }
                            context.putImageData(imgData, 0, 0);
                            callback();
                        };
                    }
                };
            }
        }, {
            name: "Brightness",
            help: "Brightness must be between -255 (darker) and 255 (brighter).",
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 50,
                    min: -255,
                    max: 255,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        return OpenSeadragon.Filters.BRIGHTNESS(
                                spinnerSlider.getValue());
                    },
                    sync: true
                };
            }
        }, {
            name: "Erosion",
            help: "The erosion kernel size must be an odd number.",
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinner = new $$.Spinner({
                    $element: $html,
                    init: 3,
                    min: 3,
                    step: 2,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinner.getValue();
                    },
                    getFilter: function() {
                        return OpenSeadragon.Filters.MORPHOLOGICAL_OPERATION(
                                spinner.getValue(), Math.min);
                    }
                };
            }
        }, {
            name: "Dilation",
            help: "The dilation kernel size must be an odd number.",
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinner = new $$.Spinner({
                    $element: $html,
                    init: 3,
                    min: 3,
                    step: 2,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinner.getValue();
                    },
                    getFilter: function() {
                        return OpenSeadragon.Filters.MORPHOLOGICAL_OPERATION(
                                spinner.getValue(), Math.max);
                    }
                };
            }
        }, {
            name: "Thresholding",
            help: "The threshold must be between 0 and 255.",
            generate: function(updateCallback) {
                var $html = $('<div></div>');
                var spinnerSlider = new $$.SpinnerSlider({
                    $element: $html,
                    init: 127,
                    min: 0,
                    max: 255,
                    step: 1,
                    updateCallback: updateCallback
                });
                return {
                    html: $html,
                    getParams: function() {
                        return spinnerSlider.getValue();
                    },
                    getFilter: function() {
                        return OpenSeadragon.Filters.THRESHOLDING(
                                spinnerSlider.getValue());
                    },
                    sync: true
                };
            }
        }, {
        name: 'Colormap',
        generate: function (updateCallback) {
            var cmaps = {
                aCm: [[0, 0, 0], [0, 4, 0], [0, 8, 0], [0, 12, 0], [0, 16, 0], [0, 20, 0], [0, 24, 0], [0, 28, 0], [0, 32, 0], [0, 36, 0], [0, 40, 0], [0, 44, 0], [0, 48, 0], [0, 52, 0], [0, 56, 0], [0, 60, 0], [0, 64, 0], [0, 68, 0], [0, 72, 0], [0, 76, 0], [0, 80, 0], [0, 85, 0], [0, 89, 0], [0, 93, 0], [0, 97, 0], [0, 101, 0], [0, 105, 0], [0, 109, 0], [0, 113, 0], [0, 117, 0], [0, 121, 0], [0, 125, 0], [0, 129, 2], [0, 133, 5], [0, 137, 7], [0, 141, 10], [0, 145, 13], [0, 149, 15], [0, 153, 18], [0, 157, 21], [0, 161, 23], [0, 165, 26], [0, 170, 29], [0, 174, 31], [0, 178, 34], [0, 182, 37], [0, 186, 39], [0, 190, 42], [0, 194, 45], [0, 198, 47], [0, 202, 50], [0, 206, 53], [0, 210, 55], [0, 214, 58], [0, 218, 61], [0, 222, 63], [0, 226, 66], [0, 230, 69], [0, 234, 71], [0, 238, 74], [0, 242, 77], [0, 246, 79], [0, 250, 82], [0, 255, 85], [3, 251, 87], [7, 247, 90], [11, 243, 92], [15, 239, 95], [19, 235, 98], [23, 231, 100], [27, 227, 103], [31, 223, 106], [35, 219, 108], [39, 215, 111], [43, 211, 114], [47, 207, 116], [51, 203, 119], [55, 199, 122], [59, 195, 124], [63, 191, 127], [67, 187, 130], [71, 183, 132], [75, 179, 135], [79, 175, 138], [83, 171, 140], [87, 167, 143], [91, 163, 146], [95, 159, 148], [99, 155, 151], [103, 151, 154], [107, 147, 156], [111, 143, 159], [115, 139, 162], [119, 135, 164], [123, 131, 167], [127, 127, 170], [131, 123, 172], [135, 119, 175], [139, 115, 177], [143, 111, 180], [147, 107, 183], [151, 103, 185], [155, 99, 188], [159, 95, 191], [163, 91, 193], [167, 87, 196], [171, 83, 199], [175, 79, 201], [179, 75, 204], [183, 71, 207], [187, 67, 209], [191, 63, 212], [195, 59, 215], [199, 55, 217], [203, 51, 220], [207, 47, 223], [211, 43, 225], [215, 39, 228], [219, 35, 231], [223, 31, 233], [227, 27, 236], [231, 23, 239], [235, 19, 241], [239, 15, 244], [243, 11, 247], [247, 7, 249], [251, 3, 252], [255, 0, 255], [255, 0, 251], [255, 0, 247], [255, 0, 244], [255, 0, 240], [255, 0, 237], [255, 0, 233], [255, 0, 230], [255, 0, 226], [255, 0, 223], [255, 0, 219], [255, 0, 216], [255, 0, 212], [255, 0, 208], [255, 0, 205], [255, 0, 201], [255, 0, 198], [255, 0, 194], [255, 0, 191], [255, 0, 187], [255, 0, 184], [255, 0, 180], [255, 0, 177], [255, 0, 173], [255, 0, 170], [255, 0, 166], [255, 0, 162], [255, 0, 159], [255, 0, 155], [255, 0, 152], [255, 0, 148], [255, 0, 145], [255, 0, 141], [255, 0, 138], [255, 0, 134], [255, 0, 131], [255, 0, 127], [255, 0, 123], [255, 0, 119], [255, 0, 115], [255, 0, 112], [255, 0, 108], [255, 0, 104], [255, 0, 100], [255, 0, 96], [255, 0, 92], [255, 0, 88], [255, 0, 85], [255, 0, 81], [255, 0, 77], [255, 0, 73], [255, 0, 69], [255, 0, 65], [255, 0, 61], [255, 0, 57], [255, 0, 54], [255, 0, 50], [255, 0, 46], [255, 0, 42], [255, 0, 38], [255, 0, 34], [255, 0, 30], [255, 0, 27], [255, 0, 23], [255, 0, 19], [255, 0, 15], [255, 0, 11], [255, 0, 7], [255, 0, 3], [255, 0, 0], [255, 4, 0], [255, 8, 0], [255, 12, 0], [255, 17, 0], [255, 21, 0], [255, 25, 0], [255, 30, 0], [255, 34, 0], [255, 38, 0], [255, 43, 0], [255, 47, 0], [255, 51, 0], [255, 56, 0], [255, 60, 0], [255, 64, 0], [255, 69, 0], [255, 73, 0], [255, 77, 0], [255, 82, 0], [255, 86, 0], [255, 90, 0], [255, 95, 0], [255, 99, 0], [255, 103, 0], [255, 108, 0], [255, 112, 0], [255, 116, 0], [255, 121, 0], [255, 125, 0], [255, 129, 0], [255, 133, 0], [255, 138, 0], [255, 142, 0], [255, 146, 0], [255, 151, 0], [255, 155, 0], [255, 159, 0], [255, 164, 0], [255, 168, 0], [255, 172, 0], [255, 177, 0], [255, 181, 0], [255, 185, 0], [255, 190, 0], [255, 194, 0], [255, 198, 0], [255, 203, 0], [255, 207, 0], [255, 211, 0], [255, 216, 0], [255, 220, 0], [255, 224, 0], [255, 229, 0], [255, 233, 0], [255, 237, 0], [255, 242, 0], [255, 246, 0], [255, 250, 0], [255, 255, 0]],
                bCm: [[0, 0, 0], [0, 0, 4], [0, 0, 8], [0, 0, 12], [0, 0, 16], [0, 0, 20], [0, 0, 24], [0, 0, 28], [0, 0, 32], [0, 0, 36], [0, 0, 40], [0, 0, 44], [0, 0, 48], [0, 0, 52], [0, 0, 56], [0, 0, 60], [0, 0, 64], [0, 0, 68], [0, 0, 72], [0, 0, 76], [0, 0, 80], [0, 0, 85], [0, 0, 89], [0, 0, 93], [0, 0, 97], [0, 0, 101], [0, 0, 105], [0, 0, 109], [0, 0, 113], [0, 0, 117], [0, 0, 121], [0, 0, 125], [0, 0, 129], [0, 0, 133], [0, 0, 137], [0, 0, 141], [0, 0, 145], [0, 0, 149], [0, 0, 153], [0, 0, 157], [0, 0, 161], [0, 0, 165], [0, 0, 170], [0, 0, 174], [0, 0, 178], [0, 0, 182], [0, 0, 186], [0, 0, 190], [0, 0, 194], [0, 0, 198], [0, 0, 202], [0, 0, 206], [0, 0, 210], [0, 0, 214], [0, 0, 218], [0, 0, 222], [0, 0, 226], [0, 0, 230], [0, 0, 234], [0, 0, 238], [0, 0, 242], [0, 0, 246], [0, 0, 250], [0, 0, 255], [3, 0, 251], [7, 0, 247], [11, 0, 243], [15, 0, 239], [19, 0, 235], [23, 0, 231], [27, 0, 227], [31, 0, 223], [35, 0, 219], [39, 0, 215], [43, 0, 211], [47, 0, 207], [51, 0, 203], [55, 0, 199], [59, 0, 195], [63, 0, 191], [67, 0, 187], [71, 0, 183], [75, 0, 179], [79, 0, 175], [83, 0, 171], [87, 0, 167], [91, 0, 163], [95, 0, 159], [99, 0, 155], [103, 0, 151], [107, 0, 147], [111, 0, 143], [115, 0, 139], [119, 0, 135], [123, 0, 131], [127, 0, 127], [131, 0, 123], [135, 0, 119], [139, 0, 115], [143, 0, 111], [147, 0, 107], [151, 0, 103], [155, 0, 99], [159, 0, 95], [163, 0, 91], [167, 0, 87], [171, 0, 83], [175, 0, 79], [179, 0, 75], [183, 0, 71], [187, 0, 67], [191, 0, 63], [195, 0, 59], [199, 0, 55], [203, 0, 51], [207, 0, 47], [211, 0, 43], [215, 0, 39], [219, 0, 35], [223, 0, 31], [227, 0, 27], [231, 0, 23], [235, 0, 19], [239, 0, 15], [243, 0, 11], [247, 0, 7], [251, 0, 3], [255, 0, 0], [255, 3, 0], [255, 7, 0], [255, 11, 0], [255, 15, 0], [255, 19, 0], [255, 23, 0], [255, 27, 0], [255, 31, 0], [255, 35, 0], [255, 39, 0], [255, 43, 0], [255, 47, 0], [255, 51, 0], [255, 55, 0], [255, 59, 0], [255, 63, 0], [255, 67, 0], [255, 71, 0], [255, 75, 0], [255, 79, 0], [255, 83, 0], [255, 87, 0], [255, 91, 0], [255, 95, 0], [255, 99, 0], [255, 103, 0], [255, 107, 0], [255, 111, 0], [255, 115, 0], [255, 119, 0], [255, 123, 0], [255, 127, 0], [255, 131, 0], [255, 135, 0], [255, 139, 0], [255, 143, 0], [255, 147, 0], [255, 151, 0], [255, 155, 0], [255, 159, 0], [255, 163, 0], [255, 167, 0], [255, 171, 0], [255, 175, 0], [255, 179, 0], [255, 183, 0], [255, 187, 0], [255, 191, 0], [255, 195, 0], [255, 199, 0], [255, 203, 0], [255, 207, 0], [255, 211, 0], [255, 215, 0], [255, 219, 0], [255, 223, 0], [255, 227, 0], [255, 231, 0], [255, 235, 0], [255, 239, 0], [255, 243, 0], [255, 247, 0], [255, 251, 0], [255, 255, 0], [255, 255, 3], [255, 255, 7], [255, 255, 11], [255, 255, 15], [255, 255, 19], [255, 255, 23], [255, 255, 27], [255, 255, 31], [255, 255, 35], [255, 255, 39], [255, 255, 43], [255, 255, 47], [255, 255, 51], [255, 255, 55], [255, 255, 59], [255, 255, 63], [255, 255, 67], [255, 255, 71], [255, 255, 75], [255, 255, 79], [255, 255, 83], [255, 255, 87], [255, 255, 91], [255, 255, 95], [255, 255, 99], [255, 255, 103], [255, 255, 107], [255, 255, 111], [255, 255, 115], [255, 255, 119], [255, 255, 123], [255, 255, 127], [255, 255, 131], [255, 255, 135], [255, 255, 139], [255, 255, 143], [255, 255, 147], [255, 255, 151], [255, 255, 155], [255, 255, 159], [255, 255, 163], [255, 255, 167], [255, 255, 171], [255, 255, 175], [255, 255, 179], [255, 255, 183], [255, 255, 187], [255, 255, 191], [255, 255, 195], [255, 255, 199], [255, 255, 203], [255, 255, 207], [255, 255, 211], [255, 255, 215], [255, 255, 219], [255, 255, 223], [255, 255, 227], [255, 255, 231], [255, 255, 235], [255, 255, 239], [255, 255, 243], [255, 255, 247], [255, 255, 251], [255, 255, 255]],
                bbCm: [[0, 0, 0], [2, 0, 0], [4, 0, 0], [6, 0, 0], [8, 0, 0], [10, 0, 0], [12, 0, 0], [14, 0, 0], [16, 0, 0], [18, 0, 0], [20, 0, 0], [22, 0, 0], [24, 0, 0], [26, 0, 0], [28, 0, 0], [30, 0, 0], [32, 0, 0], [34, 0, 0], [36, 0, 0], [38, 0, 0], [40, 0, 0], [42, 0, 0], [44, 0, 0], [46, 0, 0], [48, 0, 0], [50, 0, 0], [52, 0, 0], [54, 0, 0], [56, 0, 0], [58, 0, 0], [60, 0, 0], [62, 0, 0], [64, 0, 0], [66, 0, 0], [68, 0, 0], [70, 0, 0], [72, 0, 0], [74, 0, 0], [76, 0, 0], [78, 0, 0], [80, 0, 0], [82, 0, 0], [84, 0, 0], [86, 0, 0], [88, 0, 0], [90, 0, 0], [92, 0, 0], [94, 0, 0], [96, 0, 0], [98, 0, 0], [100, 0, 0], [102, 0, 0], [104, 0, 0], [106, 0, 0], [108, 0, 0], [110, 0, 0], [112, 0, 0], [114, 0, 0], [116, 0, 0], [118, 0, 0], [120, 0, 0], [122, 0, 0], [124, 0, 0], [126, 0, 0], [128, 1, 0], [130, 3, 0], [132, 5, 0], [134, 7, 0], [136, 9, 0], [138, 11, 0], [140, 13, 0], [142, 15, 0], [144, 17, 0], [146, 19, 0], [148, 21, 0], [150, 23, 0], [152, 25, 0], [154, 27, 0], [156, 29, 0], [158, 31, 0], [160, 33, 0], [162, 35, 0], [164, 37, 0], [166, 39, 0], [168, 41, 0], [170, 43, 0], [172, 45, 0], [174, 47, 0], [176, 49, 0], [178, 51, 0], [180, 53, 0], [182, 55, 0], [184, 57, 0], [186, 59, 0], [188, 61, 0], [190, 63, 0], [192, 65, 0], [194, 67, 0], [196, 69, 0], [198, 71, 0], [200, 73, 0], [202, 75, 0], [204, 77, 0], [206, 79, 0], [208, 81, 0], [210, 83, 0], [212, 85, 0], [214, 87, 0], [216, 89, 0], [218, 91, 0], [220, 93, 0], [222, 95, 0], [224, 97, 0], [226, 99, 0], [228, 101, 0], [230, 103, 0], [232, 105, 0], [234, 107, 0], [236, 109, 0], [238, 111, 0], [240, 113, 0], [242, 115, 0], [244, 117, 0], [246, 119, 0], [248, 121, 0], [250, 123, 0], [252, 125, 0], [255, 127, 0], [255, 129, 1], [255, 131, 3], [255, 133, 5], [255, 135, 7], [255, 137, 9], [255, 139, 11], [255, 141, 13], [255, 143, 15], [255, 145, 17], [255, 147, 19], [255, 149, 21], [255, 151, 23], [255, 153, 25], [255, 155, 27], [255, 157, 29], [255, 159, 31], [255, 161, 33], [255, 163, 35], [255, 165, 37], [255, 167, 39], [255, 169, 41], [255, 171, 43], [255, 173, 45], [255, 175, 47], [255, 177, 49], [255, 179, 51], [255, 181, 53], [255, 183, 55], [255, 185, 57], [255, 187, 59], [255, 189, 61], [255, 191, 63], [255, 193, 65], [255, 195, 67], [255, 197, 69], [255, 199, 71], [255, 201, 73], [255, 203, 75], [255, 205, 77], [255, 207, 79], [255, 209, 81], [255, 211, 83], [255, 213, 85], [255, 215, 87], [255, 217, 89], [255, 219, 91], [255, 221, 93], [255, 223, 95], [255, 225, 97], [255, 227, 99], [255, 229, 101], [255, 231, 103], [255, 233, 105], [255, 235, 107], [255, 237, 109], [255, 239, 111], [255, 241, 113], [255, 243, 115], [255, 245, 117], [255, 247, 119], [255, 249, 121], [255, 251, 123], [255, 253, 125], [255, 255, 127], [255, 255, 129], [255, 255, 131], [255, 255, 133], [255, 255, 135], [255, 255, 137], [255, 255, 139], [255, 255, 141], [255, 255, 143], [255, 255, 145], [255, 255, 147], [255, 255, 149], [255, 255, 151], [255, 255, 153], [255, 255, 155], [255, 255, 157], [255, 255, 159], [255, 255, 161], [255, 255, 163], [255, 255, 165], [255, 255, 167], [255, 255, 169], [255, 255, 171], [255, 255, 173], [255, 255, 175], [255, 255, 177], [255, 255, 179], [255, 255, 181], [255, 255, 183], [255, 255, 185], [255, 255, 187], [255, 255, 189], [255, 255, 191], [255, 255, 193], [255, 255, 195], [255, 255, 197], [255, 255, 199], [255, 255, 201], [255, 255, 203], [255, 255, 205], [255, 255, 207], [255, 255, 209], [255, 255, 211], [255, 255, 213], [255, 255, 215], [255, 255, 217], [255, 255, 219], [255, 255, 221], [255, 255, 223], [255, 255, 225], [255, 255, 227], [255, 255, 229], [255, 255, 231], [255, 255, 233], [255, 255, 235], [255, 255, 237], [255, 255, 239], [255, 255, 241], [255, 255, 243], [255, 255, 245], [255, 255, 247], [255, 255, 249], [255, 255, 251], [255, 255, 253], [255, 255, 255]],
                blueCm: [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 0, 3], [0, 0, 4], [0, 0, 5], [0, 0, 6], [0, 0, 7], [0, 0, 8], [0, 0, 9], [0, 0, 10], [0, 0, 11], [0, 0, 12], [0, 0, 13], [0, 0, 14], [0, 0, 15], [0, 0, 16], [0, 0, 17], [0, 0, 18], [0, 0, 19], [0, 0, 20], [0, 0, 21], [0, 0, 22], [0, 0, 23], [0, 0, 24], [0, 0, 25], [0, 0, 26], [0, 0, 27], [0, 0, 28], [0, 0, 29], [0, 0, 30], [0, 0, 31], [0, 0, 32], [0, 0, 33], [0, 0, 34], [0, 0, 35], [0, 0, 36], [0, 0, 37], [0, 0, 38], [0, 0, 39], [0, 0, 40], [0, 0, 41], [0, 0, 42], [0, 0, 43], [0, 0, 44], [0, 0, 45], [0, 0, 46], [0, 0, 47], [0, 0, 48], [0, 0, 49], [0, 0, 50], [0, 0, 51], [0, 0, 52], [0, 0, 53], [0, 0, 54], [0, 0, 55], [0, 0, 56], [0, 0, 57], [0, 0, 58], [0, 0, 59], [0, 0, 60], [0, 0, 61], [0, 0, 62], [0, 0, 63], [0, 0, 64], [0, 0, 65], [0, 0, 66], [0, 0, 67], [0, 0, 68], [0, 0, 69], [0, 0, 70], [0, 0, 71], [0, 0, 72], [0, 0, 73], [0, 0, 74], [0, 0, 75], [0, 0, 76], [0, 0, 77], [0, 0, 78], [0, 0, 79], [0, 0, 80], [0, 0, 81], [0, 0, 82], [0, 0, 83], [0, 0, 84], [0, 0, 85], [0, 0, 86], [0, 0, 87], [0, 0, 88], [0, 0, 89], [0, 0, 90], [0, 0, 91], [0, 0, 92], [0, 0, 93], [0, 0, 94], [0, 0, 95], [0, 0, 96], [0, 0, 97], [0, 0, 98], [0, 0, 99], [0, 0, 100], [0, 0, 101], [0, 0, 102], [0, 0, 103], [0, 0, 104], [0, 0, 105], [0, 0, 106], [0, 0, 107], [0, 0, 108], [0, 0, 109], [0, 0, 110], [0, 0, 111], [0, 0, 112], [0, 0, 113], [0, 0, 114], [0, 0, 115], [0, 0, 116], [0, 0, 117], [0, 0, 118], [0, 0, 119], [0, 0, 120], [0, 0, 121], [0, 0, 122], [0, 0, 123], [0, 0, 124], [0, 0, 125], [0, 0, 126], [0, 0, 127], [0, 0, 128], [0, 0, 129], [0, 0, 130], [0, 0, 131], [0, 0, 132], [0, 0, 133], [0, 0, 134], [0, 0, 135], [0, 0, 136], [0, 0, 137], [0, 0, 138], [0, 0, 139], [0, 0, 140], [0, 0, 141], [0, 0, 142], [0, 0, 143], [0, 0, 144], [0, 0, 145], [0, 0, 146], [0, 0, 147], [0, 0, 148], [0, 0, 149], [0, 0, 150], [0, 0, 151], [0, 0, 152], [0, 0, 153], [0, 0, 154], [0, 0, 155], [0, 0, 156], [0, 0, 157], [0, 0, 158], [0, 0, 159], [0, 0, 160], [0, 0, 161], [0, 0, 162], [0, 0, 163], [0, 0, 164], [0, 0, 165], [0, 0, 166], [0, 0, 167], [0, 0, 168], [0, 0, 169], [0, 0, 170], [0, 0, 171], [0, 0, 172], [0, 0, 173], [0, 0, 174], [0, 0, 175], [0, 0, 176], [0, 0, 177], [0, 0, 178], [0, 0, 179], [0, 0, 180], [0, 0, 181], [0, 0, 182], [0, 0, 183], [0, 0, 184], [0, 0, 185], [0, 0, 186], [0, 0, 187], [0, 0, 188], [0, 0, 189], [0, 0, 190], [0, 0, 191], [0, 0, 192], [0, 0, 193], [0, 0, 194], [0, 0, 195], [0, 0, 196], [0, 0, 197], [0, 0, 198], [0, 0, 199], [0, 0, 200], [0, 0, 201], [0, 0, 202], [0, 0, 203], [0, 0, 204], [0, 0, 205], [0, 0, 206], [0, 0, 207], [0, 0, 208], [0, 0, 209], [0, 0, 210], [0, 0, 211], [0, 0, 212], [0, 0, 213], [0, 0, 214], [0, 0, 215], [0, 0, 216], [0, 0, 217], [0, 0, 218], [0, 0, 219], [0, 0, 220], [0, 0, 221], [0, 0, 222], [0, 0, 223], [0, 0, 224], [0, 0, 225], [0, 0, 226], [0, 0, 227], [0, 0, 228], [0, 0, 229], [0, 0, 230], [0, 0, 231], [0, 0, 232], [0, 0, 233], [0, 0, 234], [0, 0, 235], [0, 0, 236], [0, 0, 237], [0, 0, 238], [0, 0, 239], [0, 0, 240], [0, 0, 241], [0, 0, 242], [0, 0, 243], [0, 0, 244], [0, 0, 245], [0, 0, 246], [0, 0, 247], [0, 0, 248], [0, 0, 249], [0, 0, 250], [0, 0, 251], [0, 0, 252], [0, 0, 253], [0, 0, 254], [0, 0, 255]],
                coolCm: [[0, 0, 0], [0, 0, 1], [0, 0, 3], [0, 0, 5], [0, 0, 7], [0, 0, 9], [0, 0, 11], [0, 0, 13], [0, 0, 15], [0, 0, 17], [0, 0, 18], [0, 0, 20], [0, 0, 22], [0, 0, 24], [0, 0, 26], [0, 0, 28], [0, 0, 30], [0, 0, 32], [0, 0, 34], [0, 0, 35], [0, 0, 37], [0, 0, 39], [0, 0, 41], [0, 0, 43], [0, 0, 45], [0, 0, 47], [0, 0, 49], [0, 0, 51], [0, 0, 52], [0, 0, 54], [0, 0, 56], [0, 0, 58], [0, 0, 60], [0, 0, 62], [0, 0, 64], [0, 0, 66], [0, 0, 68], [0, 0, 69], [0, 0, 71], [0, 0, 73], [0, 0, 75], [0, 0, 77], [0, 0, 79], [0, 0, 81], [0, 0, 83], [0, 0, 85], [0, 0, 86], [0, 0, 88], [0, 0, 90], [0, 0, 92], [0, 0, 94], [0, 0, 96], [0, 0, 98], [0, 0, 100], [0, 0, 102], [0, 0, 103], [0, 0, 105], [0, 1, 107], [0, 2, 109], [0, 4, 111], [0, 5, 113], [0, 6, 115], [0, 8, 117], [0, 9, 119], [0, 10, 120], [0, 12, 122], [0, 13, 124], [0, 14, 126], [0, 16, 128], [0, 17, 130], [0, 18, 132], [0, 20, 134], [0, 21, 136], [0, 23, 137], [0, 24, 139], [0, 25, 141], [0, 27, 143], [0, 28, 145], [1, 29, 147], [1, 31, 149], [1, 32, 151], [1, 33, 153], [1, 35, 154], [2, 36, 156], [2, 37, 158], [2, 39, 160], [2, 40, 162], [2, 42, 164], [3, 43, 166], [3, 44, 168], [3, 46, 170], [3, 47, 171], [4, 48, 173], [4, 50, 175], [4, 51, 177], [4, 52, 179], [4, 54, 181], [5, 55, 183], [5, 56, 185], [5, 58, 187], [5, 59, 188], [5, 61, 190], [6, 62, 192], [6, 63, 194], [6, 65, 196], [6, 66, 198], [7, 67, 200], [7, 69, 202], [7, 70, 204], [7, 71, 205], [7, 73, 207], [8, 74, 209], [8, 75, 211], [8, 77, 213], [8, 78, 215], [8, 80, 217], [9, 81, 219], [9, 82, 221], [9, 84, 222], [9, 85, 224], [9, 86, 226], [10, 88, 228], [10, 89, 230], [10, 90, 232], [10, 92, 234], [11, 93, 236], [11, 94, 238], [11, 96, 239], [11, 97, 241], [11, 99, 243], [12, 100, 245], [12, 101, 247], [12, 103, 249], [12, 104, 251], [12, 105, 253], [13, 107, 255], [13, 108, 255], [13, 109, 255], [13, 111, 255], [14, 112, 255], [14, 113, 255], [14, 115, 255], [14, 116, 255], [14, 118, 255], [15, 119, 255], [15, 120, 255], [15, 122, 255], [15, 123, 255], [15, 124, 255], [16, 126, 255], [16, 127, 255], [16, 128, 255], [16, 130, 255], [17, 131, 255], [17, 132, 255], [17, 134, 255], [17, 135, 255], [17, 136, 255], [18, 138, 255], [18, 139, 255], [18, 141, 255], [18, 142, 255], [18, 143, 255], [19, 145, 255], [19, 146, 255], [19, 147, 255], [19, 149, 255], [19, 150, 255], [20, 151, 255], [20, 153, 255], [20, 154, 255], [20, 155, 255], [21, 157, 255], [21, 158, 255], [21, 160, 255], [21, 161, 255], [21, 162, 255], [22, 164, 255], [22, 165, 255], [22, 166, 255], [22, 168, 255], [22, 169, 255], [23, 170, 255], [23, 172, 255], [23, 173, 255], [23, 174, 255], [24, 176, 255], [24, 177, 255], [24, 179, 255], [24, 180, 255], [24, 181, 255], [25, 183, 255], [25, 184, 255], [25, 185, 255], [29, 187, 255], [32, 188, 255], [36, 189, 255], [40, 191, 255], [44, 192, 255], [47, 193, 255], [51, 195, 255], [55, 196, 255], [58, 198, 255], [62, 199, 255], [66, 200, 255], [69, 202, 255], [73, 203, 255], [77, 204, 255], [81, 206, 255], [84, 207, 255], [88, 208, 255], [92, 210, 255], [95, 211, 255], [99, 212, 255], [103, 214, 255], [106, 215, 255], [110, 217, 255], [114, 218, 255], [118, 219, 255], [121, 221, 255], [125, 222, 255], [129, 223, 255], [132, 225, 255], [136, 226, 255], [140, 227, 255], [143, 229, 255], [147, 230, 255], [151, 231, 255], [155, 233, 255], [158, 234, 255], [162, 236, 255], [166, 237, 255], [169, 238, 255], [173, 240, 255], [177, 241, 255], [180, 242, 255], [184, 244, 255], [188, 245, 255], [192, 246, 255], [195, 248, 255], [199, 249, 255], [203, 250, 255], [206, 252, 255], [210, 253, 255], [214, 255, 255], [217, 255, 255], [221, 255, 255], [225, 255, 255], [229, 255, 255], [232, 255, 255], [236, 255, 255], [240, 255, 255], [243, 255, 255], [247, 255, 255], [251, 255, 255], [255, 255, 255]],
                cubehelix0Cm: [[0, 0, 0], [2, 1, 2], [5, 2, 5], [5, 2, 5], [6, 2, 6], [7, 2, 7], [10, 3, 10], [12, 5, 12], [13, 5, 14], [14, 5, 16], [15, 5, 17], [16, 6, 20], [17, 7, 22], [18, 8, 24], [19, 9, 26], [20, 10, 28], [21, 11, 30], [22, 12, 33], [22, 13, 34], [22, 14, 36], [22, 15, 38], [24, 16, 40], [25, 17, 43], [25, 18, 45], [25, 19, 46], [25, 20, 48], [25, 22, 50], [25, 23, 51], [25, 25, 53], [25, 26, 54], [25, 28, 56], [25, 28, 57], [25, 29, 59], [25, 30, 61], [25, 33, 62], [25, 35, 63], [25, 36, 65], [25, 37, 67], [25, 38, 68], [25, 40, 70], [25, 43, 71], [24, 45, 72], [23, 46, 73], [22, 48, 73], [22, 49, 75], [22, 51, 76], [22, 52, 76], [22, 54, 76], [22, 56, 76], [22, 57, 77], [22, 59, 78], [22, 61, 79], [21, 63, 79], [20, 66, 79], [20, 67, 79], [20, 68, 79], [20, 68, 79], [20, 71, 79], [20, 73, 79], [20, 75, 78], [20, 77, 77], [20, 79, 76], [20, 80, 76], [20, 81, 76], [21, 83, 75], [22, 85, 74], [22, 86, 73], [22, 89, 72], [22, 91, 71], [23, 92, 71], [24, 93, 71], [25, 94, 71], [26, 96, 70], [28, 99, 68], [28, 100, 68], [29, 101, 67], [30, 102, 66], [31, 102, 65], [32, 103, 64], [33, 104, 63], [35, 105, 62], [38, 107, 61], [39, 107, 60], [39, 108, 59], [40, 109, 58], [43, 110, 57], [45, 112, 56], [47, 113, 55], [49, 113, 54], [51, 114, 53], [54, 116, 52], [58, 117, 51], [60, 117, 50], [62, 117, 49], [63, 117, 48], [66, 118, 48], [68, 119, 48], [71, 119, 48], [73, 119, 48], [76, 119, 48], [79, 120, 47], [81, 121, 46], [84, 122, 45], [87, 122, 45], [91, 122, 45], [94, 122, 46], [96, 122, 47], [99, 122, 48], [103, 122, 48], [107, 122, 48], [109, 122, 49], [112, 122, 50], [114, 122, 51], [118, 122, 52], [122, 122, 53], [124, 122, 54], [127, 122, 55], [130, 122, 56], [133, 122, 57], [137, 122, 58], [140, 122, 60], [142, 122, 62], [145, 122, 63], [149, 122, 66], [153, 122, 68], [155, 121, 70], [158, 120, 72], [160, 119, 73], [162, 119, 75], [164, 119, 77], [165, 119, 79], [169, 119, 81], [173, 119, 84], [175, 119, 86], [176, 119, 89], [178, 119, 91], [181, 119, 95], [183, 119, 99], [186, 120, 102], [188, 121, 104], [191, 122, 107], [192, 122, 110], [193, 122, 114], [195, 122, 117], [197, 122, 119], [198, 122, 122], [200, 122, 126], [201, 122, 130], [202, 123, 132], [203, 124, 135], [204, 124, 137], [204, 125, 141], [205, 126, 144], [206, 127, 147], [207, 127, 151], [209, 127, 155], [209, 128, 158], [210, 129, 160], [211, 130, 163], [211, 131, 167], [211, 132, 170], [211, 133, 173], [211, 134, 175], [211, 135, 178], [211, 136, 182], [211, 137, 186], [211, 138, 188], [211, 139, 191], [211, 140, 193], [211, 142, 196], [211, 145, 198], [210, 146, 201], [209, 147, 204], [209, 147, 206], [209, 150, 209], [209, 153, 211], [208, 153, 213], [207, 154, 215], [206, 155, 216], [206, 157, 218], [206, 158, 220], [206, 160, 221], [205, 163, 224], [204, 165, 226], [203, 167, 228], [202, 169, 230], [201, 170, 232], [201, 172, 233], [201, 173, 234], [200, 175, 235], [199, 176, 236], [198, 178, 237], [197, 181, 238], [196, 183, 239], [196, 185, 239], [196, 187, 239], [196, 188, 239], [195, 191, 240], [193, 193, 242], [193, 194, 242], [193, 195, 242], [193, 196, 242], [193, 198, 242], [193, 199, 242], [193, 201, 242], [193, 204, 242], [193, 206, 242], [193, 208, 242], [193, 209, 242], [193, 211, 242], [193, 212, 242], [193, 214, 242], [194, 215, 242], [195, 217, 242], [196, 219, 242], [196, 220, 242], [196, 221, 242], [197, 223, 241], [198, 225, 240], [198, 226, 239], [200, 228, 239], [201, 229, 239], [202, 230, 239], [203, 231, 239], [204, 232, 239], [205, 233, 239], [206, 234, 239], [207, 235, 239], [208, 236, 239], [209, 237, 239], [210, 238, 239], [212, 238, 239], [214, 239, 239], [215, 240, 239], [216, 242, 239], [218, 243, 239], [220, 243, 239], [221, 244, 239], [224, 246, 239], [226, 247, 239], [228, 247, 240], [230, 247, 241], [232, 247, 242], [234, 248, 242], [237, 249, 242], [238, 249, 243], [240, 249, 243], [242, 249, 244], [243, 251, 246], [244, 252, 247], [246, 252, 249], [248, 252, 250], [249, 252, 252], [251, 253, 253], [253, 254, 254], [255, 255, 255]],
                cubehelix1Cm: [[0, 0, 0], [2, 0, 2], [5, 0, 5], [6, 0, 7], [8, 0, 10], [10, 0, 12], [12, 1, 15], [15, 2, 17], [17, 2, 20], [18, 2, 22], [20, 2, 25], [21, 2, 29], [22, 2, 33], [23, 3, 35], [24, 4, 38], [25, 5, 40], [25, 6, 44], [25, 7, 48], [26, 8, 51], [27, 9, 53], [28, 10, 56], [28, 11, 59], [28, 12, 63], [27, 14, 66], [26, 16, 68], [25, 17, 71], [25, 18, 73], [25, 19, 74], [25, 20, 76], [24, 22, 80], [22, 25, 84], [22, 27, 85], [21, 28, 87], [20, 30, 89], [19, 33, 91], [17, 35, 94], [16, 37, 95], [14, 39, 96], [12, 40, 96], [11, 43, 99], [10, 45, 102], [8, 47, 102], [6, 49, 103], [5, 51, 104], [2, 54, 104], [0, 58, 104], [0, 60, 104], [0, 62, 104], [0, 63, 104], [0, 66, 104], [0, 68, 104], [0, 71, 104], [0, 73, 104], [0, 76, 104], [0, 79, 103], [0, 81, 102], [0, 84, 102], [0, 86, 99], [0, 89, 96], [0, 91, 96], [0, 94, 95], [0, 96, 94], [0, 99, 91], [0, 102, 89], [0, 103, 86], [0, 105, 84], [0, 107, 81], [0, 109, 79], [0, 112, 76], [0, 113, 73], [0, 115, 71], [0, 117, 68], [0, 119, 65], [0, 122, 61], [0, 124, 58], [0, 125, 56], [0, 127, 53], [0, 128, 51], [0, 129, 48], [0, 130, 45], [0, 132, 42], [0, 135, 38], [0, 136, 35], [0, 136, 33], [0, 137, 30], [3, 138, 26], [7, 140, 22], [10, 140, 21], [12, 140, 19], [15, 140, 17], [19, 141, 14], [22, 142, 10], [26, 142, 8], [29, 142, 6], [33, 142, 5], [38, 142, 2], [43, 142, 0], [46, 142, 0], [50, 142, 0], [53, 142, 0], [57, 141, 0], [62, 141, 0], [66, 140, 0], [72, 140, 0], [79, 140, 0], [83, 139, 0], [87, 138, 0], [91, 137, 0], [98, 136, 0], [104, 135, 0], [108, 134, 0], [113, 133, 0], [117, 132, 0], [123, 131, 0], [130, 130, 0], [134, 129, 0], [138, 128, 0], [142, 127, 0], [149, 126, 0], [155, 124, 0], [159, 123, 0], [164, 121, 1], [168, 119, 2], [174, 118, 6], [181, 117, 10], [185, 116, 12], [189, 115, 15], [193, 114, 17], [197, 113, 21], [200, 113, 24], [204, 112, 28], [209, 110, 33], [214, 109, 38], [217, 108, 41], [221, 107, 45], [224, 107, 48], [228, 105, 54], [232, 104, 61], [234, 103, 64], [237, 102, 68], [239, 102, 71], [243, 102, 77], [247, 102, 84], [249, 101, 89], [250, 100, 94], [252, 99, 99], [253, 99, 105], [255, 99, 112], [255, 99, 117], [255, 99, 122], [255, 99, 127], [255, 99, 131], [255, 99, 136], [255, 99, 140], [255, 100, 147], [255, 102, 155], [255, 102, 159], [255, 102, 164], [255, 102, 168], [255, 103, 174], [255, 104, 181], [255, 105, 185], [255, 106, 189], [255, 107, 193], [255, 108, 200], [255, 109, 206], [255, 111, 210], [255, 113, 215], [255, 114, 219], [253, 117, 224], [252, 119, 229], [250, 120, 232], [249, 121, 236], [247, 122, 239], [244, 124, 244], [242, 127, 249], [240, 130, 251], [238, 132, 253], [237, 135, 255], [234, 136, 255], [232, 138, 255], [229, 140, 255], [226, 142, 255], [224, 145, 255], [222, 147, 255], [221, 150, 255], [219, 153, 255], [215, 156, 255], [211, 160, 255], [209, 162, 255], [208, 164, 255], [206, 165, 255], [204, 169, 255], [201, 173, 255], [199, 175, 255], [198, 178, 255], [196, 181, 255], [193, 183, 255], [191, 186, 255], [189, 188, 255], [187, 191, 255], [186, 193, 255], [185, 195, 255], [184, 197, 255], [183, 198, 255], [182, 202, 255], [181, 206, 255], [180, 208, 255], [179, 209, 255], [178, 211, 255], [177, 214, 255], [175, 216, 255], [175, 218, 255], [175, 220, 255], [175, 221, 255], [175, 224, 255], [175, 226, 255], [176, 228, 255], [177, 230, 255], [178, 232, 255], [179, 234, 255], [181, 237, 255], [181, 238, 255], [182, 238, 255], [183, 239, 255], [184, 240, 252], [186, 242, 249], [187, 243, 249], [189, 243, 248], [191, 244, 247], [192, 245, 246], [194, 246, 245], [196, 247, 244], [198, 248, 243], [201, 249, 242], [203, 250, 242], [204, 251, 242], [206, 252, 242], [210, 252, 240], [214, 252, 239], [216, 252, 240], [219, 252, 241], [221, 252, 242], [224, 253, 242], [226, 255, 242], [229, 255, 243], [232, 255, 243], [234, 255, 244], [238, 255, 246], [242, 255, 247], [243, 255, 248], [245, 255, 249], [247, 255, 249], [249, 255, 251], [252, 255, 253], [255, 255, 255]],
                greenCm: [[0, 0, 0], [0, 1, 0], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0], [0, 6, 0], [0, 7, 0], [0, 8, 0], [0, 9, 0], [0, 10, 0], [0, 11, 0], [0, 12, 0], [0, 13, 0], [0, 14, 0], [0, 15, 0], [0, 16, 0], [0, 17, 0], [0, 18, 0], [0, 19, 0], [0, 20, 0], [0, 21, 0], [0, 22, 0], [0, 23, 0], [0, 24, 0], [0, 25, 0], [0, 26, 0], [0, 27, 0], [0, 28, 0], [0, 29, 0], [0, 30, 0], [0, 31, 0], [0, 32, 0], [0, 33, 0], [0, 34, 0], [0, 35, 0], [0, 36, 0], [0, 37, 0], [0, 38, 0], [0, 39, 0], [0, 40, 0], [0, 41, 0], [0, 42, 0], [0, 43, 0], [0, 44, 0], [0, 45, 0], [0, 46, 0], [0, 47, 0], [0, 48, 0], [0, 49, 0], [0, 50, 0], [0, 51, 0], [0, 52, 0], [0, 53, 0], [0, 54, 0], [0, 55, 0], [0, 56, 0], [0, 57, 0], [0, 58, 0], [0, 59, 0], [0, 60, 0], [0, 61, 0], [0, 62, 0], [0, 63, 0], [0, 64, 0], [0, 65, 0], [0, 66, 0], [0, 67, 0], [0, 68, 0], [0, 69, 0], [0, 70, 0], [0, 71, 0], [0, 72, 0], [0, 73, 0], [0, 74, 0], [0, 75, 0], [0, 76, 0], [0, 77, 0], [0, 78, 0], [0, 79, 0], [0, 80, 0], [0, 81, 0], [0, 82, 0], [0, 83, 0], [0, 84, 0], [0, 85, 0], [0, 86, 0], [0, 87, 0], [0, 88, 0], [0, 89, 0], [0, 90, 0], [0, 91, 0], [0, 92, 0], [0, 93, 0], [0, 94, 0], [0, 95, 0], [0, 96, 0], [0, 97, 0], [0, 98, 0], [0, 99, 0], [0, 100, 0], [0, 101, 0], [0, 102, 0], [0, 103, 0], [0, 104, 0], [0, 105, 0], [0, 106, 0], [0, 107, 0], [0, 108, 0], [0, 109, 0], [0, 110, 0], [0, 111, 0], [0, 112, 0], [0, 113, 0], [0, 114, 0], [0, 115, 0], [0, 116, 0], [0, 117, 0], [0, 118, 0], [0, 119, 0], [0, 120, 0], [0, 121, 0], [0, 122, 0], [0, 123, 0], [0, 124, 0], [0, 125, 0], [0, 126, 0], [0, 127, 0], [0, 128, 0], [0, 129, 0], [0, 130, 0], [0, 131, 0], [0, 132, 0], [0, 133, 0], [0, 134, 0], [0, 135, 0], [0, 136, 0], [0, 137, 0], [0, 138, 0], [0, 139, 0], [0, 140, 0], [0, 141, 0], [0, 142, 0], [0, 143, 0], [0, 144, 0], [0, 145, 0], [0, 146, 0], [0, 147, 0], [0, 148, 0], [0, 149, 0], [0, 150, 0], [0, 151, 0], [0, 152, 0], [0, 153, 0], [0, 154, 0], [0, 155, 0], [0, 156, 0], [0, 157, 0], [0, 158, 0], [0, 159, 0], [0, 160, 0], [0, 161, 0], [0, 162, 0], [0, 163, 0], [0, 164, 0], [0, 165, 0], [0, 166, 0], [0, 167, 0], [0, 168, 0], [0, 169, 0], [0, 170, 0], [0, 171, 0], [0, 172, 0], [0, 173, 0], [0, 174, 0], [0, 175, 0], [0, 176, 0], [0, 177, 0], [0, 178, 0], [0, 179, 0], [0, 180, 0], [0, 181, 0], [0, 182, 0], [0, 183, 0], [0, 184, 0], [0, 185, 0], [0, 186, 0], [0, 187, 0], [0, 188, 0], [0, 189, 0], [0, 190, 0], [0, 191, 0], [0, 192, 0], [0, 193, 0], [0, 194, 0], [0, 195, 0], [0, 196, 0], [0, 197, 0], [0, 198, 0], [0, 199, 0], [0, 200, 0], [0, 201, 0], [0, 202, 0], [0, 203, 0], [0, 204, 0], [0, 205, 0], [0, 206, 0], [0, 207, 0], [0, 208, 0], [0, 209, 0], [0, 210, 0], [0, 211, 0], [0, 212, 0], [0, 213, 0], [0, 214, 0], [0, 215, 0], [0, 216, 0], [0, 217, 0], [0, 218, 0], [0, 219, 0], [0, 220, 0], [0, 221, 0], [0, 222, 0], [0, 223, 0], [0, 224, 0], [0, 225, 0], [0, 226, 0], [0, 227, 0], [0, 228, 0], [0, 229, 0], [0, 230, 0], [0, 231, 0], [0, 232, 0], [0, 233, 0], [0, 234, 0], [0, 235, 0], [0, 236, 0], [0, 237, 0], [0, 238, 0], [0, 239, 0], [0, 240, 0], [0, 241, 0], [0, 242, 0], [0, 243, 0], [0, 244, 0], [0, 245, 0], [0, 246, 0], [0, 247, 0], [0, 248, 0], [0, 249, 0], [0, 250, 0], [0, 251, 0], [0, 252, 0], [0, 253, 0], [0, 254, 0], [0, 255, 0]],
                greyCm: [[0, 0, 0], [1, 1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4], [5, 5, 5], [6, 6, 6], [7, 7, 7], [8, 8, 8], [9, 9, 9], [10, 10, 10], [11, 11, 11], [12, 12, 12], [13, 13, 13], [14, 14, 14], [15, 15, 15], [16, 16, 16], [17, 17, 17], [18, 18, 18], [19, 19, 19], [20, 20, 20], [21, 21, 21], [22, 22, 22], [23, 23, 23], [24, 24, 24], [25, 25, 25], [26, 26, 26], [27, 27, 27], [28, 28, 28], [29, 29, 29], [30, 30, 30], [31, 31, 31], [32, 32, 32], [33, 33, 33], [34, 34, 34], [35, 35, 35], [36, 36, 36], [37, 37, 37], [38, 38, 38], [39, 39, 39], [40, 40, 40], [41, 41, 41], [42, 42, 42], [43, 43, 43], [44, 44, 44], [45, 45, 45], [46, 46, 46], [47, 47, 47], [48, 48, 48], [49, 49, 49], [50, 50, 50], [51, 51, 51], [52, 52, 52], [53, 53, 53], [54, 54, 54], [55, 55, 55], [56, 56, 56], [57, 57, 57], [58, 58, 58], [59, 59, 59], [60, 60, 60], [61, 61, 61], [62, 62, 62], [63, 63, 63], [64, 64, 64], [65, 65, 65], [66, 66, 66], [67, 67, 67], [68, 68, 68], [69, 69, 69], [70, 70, 70], [71, 71, 71], [72, 72, 72], [73, 73, 73], [74, 74, 74], [75, 75, 75], [76, 76, 76], [77, 77, 77], [78, 78, 78], [79, 79, 79], [80, 80, 80], [81, 81, 81], [82, 82, 82], [83, 83, 83], [84, 84, 84], [85, 85, 85], [86, 86, 86], [87, 87, 87], [88, 88, 88], [89, 89, 89], [90, 90, 90], [91, 91, 91], [92, 92, 92], [93, 93, 93], [94, 94, 94], [95, 95, 95], [96, 96, 96], [97, 97, 97], [98, 98, 98], [99, 99, 99], [100, 100, 100], [101, 101, 101], [102, 102, 102], [103, 103, 103], [104, 104, 104], [105, 105, 105], [106, 106, 106], [107, 107, 107], [108, 108, 108], [109, 109, 109], [110, 110, 110], [111, 111, 111], [112, 112, 112], [113, 113, 113], [114, 114, 114], [115, 115, 115], [116, 116, 116], [117, 117, 117], [118, 118, 118], [119, 119, 119], [120, 120, 120], [121, 121, 121], [122, 122, 122], [123, 123, 123], [124, 124, 124], [125, 125, 125], [126, 126, 126], [127, 127, 127], [128, 128, 128], [129, 129, 129], [130, 130, 130], [131, 131, 131], [132, 132, 132], [133, 133, 133], [134, 134, 134], [135, 135, 135], [136, 136, 136], [137, 137, 137], [138, 138, 138], [139, 139, 139], [140, 140, 140], [141, 141, 141], [142, 142, 142], [143, 143, 143], [144, 144, 144], [145, 145, 145], [146, 146, 146], [147, 147, 147], [148, 148, 148], [149, 149, 149], [150, 150, 150], [151, 151, 151], [152, 152, 152], [153, 153, 153], [154, 154, 154], [155, 155, 155], [156, 156, 156], [157, 157, 157], [158, 158, 158], [159, 159, 159], [160, 160, 160], [161, 161, 161], [162, 162, 162], [163, 163, 163], [164, 164, 164], [165, 165, 165], [166, 166, 166], [167, 167, 167], [168, 168, 168], [169, 169, 169], [170, 170, 170], [171, 171, 171], [172, 172, 172], [173, 173, 173], [174, 174, 174], [175, 175, 175], [176, 176, 176], [177, 177, 177], [178, 178, 178], [179, 179, 179], [180, 180, 180], [181, 181, 181], [182, 182, 182], [183, 183, 183], [184, 184, 184], [185, 185, 185], [186, 186, 186], [187, 187, 187], [188, 188, 188], [189, 189, 189], [190, 190, 190], [191, 191, 191], [192, 192, 192], [193, 193, 193], [194, 194, 194], [195, 195, 195], [196, 196, 196], [197, 197, 197], [198, 198, 198], [199, 199, 199], [200, 200, 200], [201, 201, 201], [202, 202, 202], [203, 203, 203], [204, 204, 204], [205, 205, 205], [206, 206, 206], [207, 207, 207], [208, 208, 208], [209, 209, 209], [210, 210, 210], [211, 211, 211], [212, 212, 212], [213, 213, 213], [214, 214, 214], [215, 215, 215], [216, 216, 216], [217, 217, 217], [218, 218, 218], [219, 219, 219], [220, 220, 220], [221, 221, 221], [222, 222, 222], [223, 223, 223], [224, 224, 224], [225, 225, 225], [226, 226, 226], [227, 227, 227], [228, 228, 228], [229, 229, 229], [230, 230, 230], [231, 231, 231], [232, 232, 232], [233, 233, 233], [234, 234, 234], [235, 235, 235], [236, 236, 236], [237, 237, 237], [238, 238, 238], [239, 239, 239], [240, 240, 240], [241, 241, 241], [242, 242, 242], [243, 243, 243], [244, 244, 244], [245, 245, 245], [246, 246, 246], [247, 247, 247], [248, 248, 248], [249, 249, 249], [250, 250, 250], [251, 251, 251], [252, 252, 252], [253, 253, 253], [254, 254, 254], [255, 255, 255]],
                heCm: [[0, 0, 0], [42, 0, 10], [85, 0, 21], [127, 0, 31], [127, 0, 47], [127, 0, 63], [127, 0, 79], [127, 0, 95], [127, 0, 102], [127, 0, 109], [127, 0, 116], [127, 0, 123], [127, 0, 131], [127, 0, 138], [127, 0, 145], [127, 0, 152], [127, 0, 159], [127, 8, 157], [127, 17, 155], [127, 25, 153], [127, 34, 151], [127, 42, 149], [127, 51, 147], [127, 59, 145], [127, 68, 143], [127, 76, 141], [127, 85, 139], [127, 93, 136], [127, 102, 134], [127, 110, 132], [127, 119, 130], [127, 127, 128], [127, 129, 126], [127, 131, 124], [127, 133, 122], [127, 135, 120], [127, 137, 118], [127, 139, 116], [127, 141, 114], [127, 143, 112], [127, 145, 110], [127, 147, 108], [127, 149, 106], [127, 151, 104], [127, 153, 102], [127, 155, 100], [127, 157, 98], [127, 159, 96], [127, 161, 94], [127, 163, 92], [127, 165, 90], [127, 167, 88], [127, 169, 86], [127, 171, 84], [127, 173, 82], [127, 175, 80], [127, 177, 77], [127, 179, 75], [127, 181, 73], [127, 183, 71], [127, 185, 69], [127, 187, 67], [127, 189, 65], [127, 191, 63], [128, 191, 64], [129, 191, 65], [130, 191, 66], [131, 192, 67], [132, 192, 68], [133, 192, 69], [134, 192, 70], [135, 193, 71], [136, 193, 72], [137, 193, 73], [138, 193, 74], [139, 194, 75], [140, 194, 76], [141, 194, 77], [142, 194, 78], [143, 195, 79], [144, 195, 80], [145, 195, 81], [146, 195, 82], [147, 196, 83], [148, 196, 84], [149, 196, 85], [150, 196, 86], [151, 196, 87], [152, 197, 88], [153, 197, 89], [154, 197, 90], [155, 197, 91], [156, 198, 92], [157, 198, 93], [158, 198, 94], [159, 198, 95], [160, 199, 96], [161, 199, 97], [162, 199, 98], [163, 199, 99], [164, 200, 100], [165, 200, 101], [166, 200, 102], [167, 200, 103], [168, 201, 104], [169, 201, 105], [170, 201, 106], [171, 201, 107], [172, 202, 108], [173, 202, 109], [174, 202, 110], [175, 202, 111], [176, 202, 112], [177, 203, 113], [178, 203, 114], [179, 203, 115], [180, 203, 116], [181, 204, 117], [182, 204, 118], [183, 204, 119], [184, 204, 120], [185, 205, 121], [186, 205, 122], [187, 205, 123], [188, 205, 124], [189, 206, 125], [190, 206, 126], [191, 206, 127], [191, 206, 128], [192, 207, 129], [192, 207, 130], [193, 208, 131], [193, 208, 132], [194, 208, 133], [194, 209, 134], [195, 209, 135], [195, 209, 136], [196, 210, 137], [196, 210, 138], [197, 211, 139], [197, 211, 140], [198, 211, 141], [198, 212, 142], [199, 212, 143], [199, 212, 144], [200, 213, 145], [200, 213, 146], [201, 214, 147], [201, 214, 148], [202, 214, 149], [202, 215, 150], [203, 215, 151], [203, 216, 152], [204, 216, 153], [204, 216, 154], [205, 217, 155], [205, 217, 156], [206, 217, 157], [206, 218, 158], [207, 218, 159], [207, 219, 160], [208, 219, 161], [208, 219, 162], [209, 220, 163], [209, 220, 164], [210, 220, 165], [210, 221, 166], [211, 221, 167], [211, 222, 168], [212, 222, 169], [212, 222, 170], [213, 223, 171], [213, 223, 172], [214, 223, 173], [214, 224, 174], [215, 224, 175], [215, 225, 176], [216, 225, 177], [216, 225, 178], [217, 226, 179], [217, 226, 180], [218, 226, 181], [218, 227, 182], [219, 227, 183], [219, 228, 184], [220, 228, 185], [220, 228, 186], [221, 229, 187], [221, 229, 188], [222, 230, 189], [222, 230, 190], [223, 230, 191], [223, 231, 192], [224, 231, 193], [224, 231, 194], [225, 232, 195], [225, 232, 196], [226, 233, 197], [226, 233, 198], [227, 233, 199], [227, 234, 200], [228, 234, 201], [228, 234, 202], [229, 235, 203], [229, 235, 204], [230, 236, 205], [230, 236, 206], [231, 236, 207], [231, 237, 208], [232, 237, 209], [232, 237, 210], [233, 238, 211], [233, 238, 212], [234, 239, 213], [234, 239, 214], [235, 239, 215], [235, 240, 216], [236, 240, 217], [236, 240, 218], [237, 241, 219], [237, 241, 220], [238, 242, 221], [238, 242, 222], [239, 242, 223], [239, 243, 224], [240, 243, 225], [240, 244, 226], [241, 244, 227], [241, 244, 228], [242, 245, 229], [242, 245, 230], [243, 245, 231], [243, 246, 232], [244, 246, 233], [244, 247, 234], [245, 247, 235], [245, 247, 236], [246, 248, 237], [246, 248, 238], [247, 248, 239], [247, 249, 240], [248, 249, 241], [248, 250, 242], [249, 250, 243], [249, 250, 244], [250, 251, 245], [250, 251, 246], [251, 251, 247], [251, 252, 248], [252, 252, 249], [252, 253, 250], [253, 253, 251], [253, 253, 252], [254, 254, 253], [254, 254, 254], [255, 255, 255]],
                heatCm: [[0, 0, 0], [2, 1, 0], [5, 2, 0], [8, 3, 0], [11, 4, 0], [14, 5, 0], [17, 6, 0], [20, 7, 0], [23, 8, 0], [26, 9, 0], [29, 10, 0], [32, 11, 0], [35, 12, 0], [38, 13, 0], [41, 14, 0], [44, 15, 0], [47, 16, 0], [50, 17, 0], [53, 18, 0], [56, 19, 0], [59, 20, 0], [62, 21, 0], [65, 22, 0], [68, 23, 0], [71, 24, 0], [74, 25, 0], [77, 26, 0], [80, 27, 0], [83, 28, 0], [85, 29, 0], [88, 30, 0], [91, 31, 0], [94, 32, 0], [97, 33, 0], [100, 34, 0], [103, 35, 0], [106, 36, 0], [109, 37, 0], [112, 38, 0], [115, 39, 0], [118, 40, 0], [121, 41, 0], [124, 42, 0], [127, 43, 0], [130, 44, 0], [133, 45, 0], [136, 46, 0], [139, 47, 0], [142, 48, 0], [145, 49, 0], [148, 50, 0], [151, 51, 0], [154, 52, 0], [157, 53, 0], [160, 54, 0], [163, 55, 0], [166, 56, 0], [169, 57, 0], [171, 58, 0], [174, 59, 0], [177, 60, 0], [180, 61, 0], [183, 62, 0], [186, 63, 0], [189, 64, 0], [192, 65, 0], [195, 66, 0], [198, 67, 0], [201, 68, 0], [204, 69, 0], [207, 70, 0], [210, 71, 0], [213, 72, 0], [216, 73, 0], [219, 74, 0], [222, 75, 0], [225, 76, 0], [228, 77, 0], [231, 78, 0], [234, 79, 0], [237, 80, 0], [240, 81, 0], [243, 82, 0], [246, 83, 0], [249, 84, 0], [252, 85, 0], [255, 86, 0], [255, 87, 0], [255, 88, 0], [255, 89, 0], [255, 90, 0], [255, 91, 0], [255, 92, 0], [255, 93, 0], [255, 94, 0], [255, 95, 0], [255, 96, 0], [255, 97, 0], [255, 98, 0], [255, 99, 0], [255, 100, 0], [255, 101, 0], [255, 102, 0], [255, 103, 0], [255, 104, 0], [255, 105, 0], [255, 106, 0], [255, 107, 0], [255, 108, 0], [255, 109, 0], [255, 110, 0], [255, 111, 0], [255, 112, 0], [255, 113, 0], [255, 114, 0], [255, 115, 0], [255, 116, 0], [255, 117, 0], [255, 118, 0], [255, 119, 0], [255, 120, 0], [255, 121, 0], [255, 122, 0], [255, 123, 0], [255, 124, 0], [255, 125, 0], [255, 126, 0], [255, 127, 0], [255, 128, 0], [255, 129, 0], [255, 130, 0], [255, 131, 0], [255, 132, 0], [255, 133, 0], [255, 134, 0], [255, 135, 0], [255, 136, 0], [255, 137, 0], [255, 138, 0], [255, 139, 0], [255, 140, 0], [255, 141, 0], [255, 142, 0], [255, 143, 0], [255, 144, 0], [255, 145, 0], [255, 146, 0], [255, 147, 0], [255, 148, 0], [255, 149, 0], [255, 150, 0], [255, 151, 0], [255, 152, 0], [255, 153, 0], [255, 154, 0], [255, 155, 0], [255, 156, 0], [255, 157, 0], [255, 158, 0], [255, 159, 0], [255, 160, 0], [255, 161, 0], [255, 162, 0], [255, 163, 0], [255, 164, 0], [255, 165, 0], [255, 166, 3], [255, 167, 6], [255, 168, 9], [255, 169, 12], [255, 170, 15], [255, 171, 18], [255, 172, 21], [255, 173, 24], [255, 174, 27], [255, 175, 30], [255, 176, 33], [255, 177, 36], [255, 178, 39], [255, 179, 42], [255, 180, 45], [255, 181, 48], [255, 182, 51], [255, 183, 54], [255, 184, 57], [255, 185, 60], [255, 186, 63], [255, 187, 66], [255, 188, 69], [255, 189, 72], [255, 190, 75], [255, 191, 78], [255, 192, 81], [255, 193, 85], [255, 194, 88], [255, 195, 91], [255, 196, 94], [255, 197, 97], [255, 198, 100], [255, 199, 103], [255, 200, 106], [255, 201, 109], [255, 202, 112], [255, 203, 115], [255, 204, 118], [255, 205, 121], [255, 206, 124], [255, 207, 127], [255, 208, 130], [255, 209, 133], [255, 210, 136], [255, 211, 139], [255, 212, 142], [255, 213, 145], [255, 214, 148], [255, 215, 151], [255, 216, 154], [255, 217, 157], [255, 218, 160], [255, 219, 163], [255, 220, 166], [255, 221, 170], [255, 222, 173], [255, 223, 176], [255, 224, 179], [255, 225, 182], [255, 226, 185], [255, 227, 188], [255, 228, 191], [255, 229, 194], [255, 230, 197], [255, 231, 200], [255, 232, 203], [255, 233, 206], [255, 234, 209], [255, 235, 212], [255, 236, 215], [255, 237, 218], [255, 238, 221], [255, 239, 224], [255, 240, 227], [255, 241, 230], [255, 242, 233], [255, 243, 236], [255, 244, 239], [255, 245, 242], [255, 246, 245], [255, 247, 248], [255, 248, 251], [255, 249, 255], [255, 250, 255], [255, 251, 255], [255, 252, 255], [255, 253, 255], [255, 254, 255], [255, 255, 255]],
                rainbowCm: [[255, 0, 255], [250, 0, 255], [245, 0, 255], [240, 0, 255], [235, 0, 255], [230, 0, 255], [225, 0, 255], [220, 0, 255], [215, 0, 255], [210, 0, 255], [205, 0, 255], [200, 0, 255], [195, 0, 255], [190, 0, 255], [185, 0, 255], [180, 0, 255], [175, 0, 255], [170, 0, 255], [165, 0, 255], [160, 0, 255], [155, 0, 255], [150, 0, 255], [145, 0, 255], [140, 0, 255], [135, 0, 255], [130, 0, 255], [125, 0, 255], [120, 0, 255], [115, 0, 255], [110, 0, 255], [105, 0, 255], [100, 0, 255], [95, 0, 255], [90, 0, 255], [85, 0, 255], [80, 0, 255], [75, 0, 255], [70, 0, 255], [65, 0, 255], [60, 0, 255], [55, 0, 255], [50, 0, 255], [45, 0, 255], [40, 0, 255], [35, 0, 255], [30, 0, 255], [25, 0, 255], [20, 0, 255], [15, 0, 255], [10, 0, 255], [5, 0, 255], [0, 0, 255], [0, 5, 255], [0, 10, 255], [0, 15, 255], [0, 20, 255], [0, 25, 255], [0, 30, 255], [0, 35, 255], [0, 40, 255], [0, 45, 255], [0, 50, 255], [0, 55, 255], [0, 60, 255], [0, 65, 255], [0, 70, 255], [0, 75, 255], [0, 80, 255], [0, 85, 255], [0, 90, 255], [0, 95, 255], [0, 100, 255], [0, 105, 255], [0, 110, 255], [0, 115, 255], [0, 120, 255], [0, 125, 255], [0, 130, 255], [0, 135, 255], [0, 140, 255], [0, 145, 255], [0, 150, 255], [0, 155, 255], [0, 160, 255], [0, 165, 255], [0, 170, 255], [0, 175, 255], [0, 180, 255], [0, 185, 255], [0, 190, 255], [0, 195, 255], [0, 200, 255], [0, 205, 255], [0, 210, 255], [0, 215, 255], [0, 220, 255], [0, 225, 255], [0, 230, 255], [0, 235, 255], [0, 240, 255], [0, 245, 255], [0, 250, 255], [0, 255, 255], [0, 255, 250], [0, 255, 245], [0, 255, 240], [0, 255, 235], [0, 255, 230], [0, 255, 225], [0, 255, 220], [0, 255, 215], [0, 255, 210], [0, 255, 205], [0, 255, 200], [0, 255, 195], [0, 255, 190], [0, 255, 185], [0, 255, 180], [0, 255, 175], [0, 255, 170], [0, 255, 165], [0, 255, 160], [0, 255, 155], [0, 255, 150], [0, 255, 145], [0, 255, 140], [0, 255, 135], [0, 255, 130], [0, 255, 125], [0, 255, 120], [0, 255, 115], [0, 255, 110], [0, 255, 105], [0, 255, 100], [0, 255, 95], [0, 255, 90], [0, 255, 85], [0, 255, 80], [0, 255, 75], [0, 255, 70], [0, 255, 65], [0, 255, 60], [0, 255, 55], [0, 255, 50], [0, 255, 45], [0, 255, 40], [0, 255, 35], [0, 255, 30], [0, 255, 25], [0, 255, 20], [0, 255, 15], [0, 255, 10], [0, 255, 5], [0, 255, 0], [5, 255, 0], [10, 255, 0], [15, 255, 0], [20, 255, 0], [25, 255, 0], [30, 255, 0], [35, 255, 0], [40, 255, 0], [45, 255, 0], [50, 255, 0], [55, 255, 0], [60, 255, 0], [65, 255, 0], [70, 255, 0], [75, 255, 0], [80, 255, 0], [85, 255, 0], [90, 255, 0], [95, 255, 0], [100, 255, 0], [105, 255, 0], [110, 255, 0], [115, 255, 0], [120, 255, 0], [125, 255, 0], [130, 255, 0], [135, 255, 0], [140, 255, 0], [145, 255, 0], [150, 255, 0], [155, 255, 0], [160, 255, 0], [165, 255, 0], [170, 255, 0], [175, 255, 0], [180, 255, 0], [185, 255, 0], [190, 255, 0], [195, 255, 0], [200, 255, 0], [205, 255, 0], [210, 255, 0], [215, 255, 0], [220, 255, 0], [225, 255, 0], [230, 255, 0], [235, 255, 0], [240, 255, 0], [245, 255, 0], [250, 255, 0], [255, 255, 0], [255, 250, 0], [255, 245, 0], [255, 240, 0], [255, 235, 0], [255, 230, 0], [255, 225, 0], [255, 220, 0], [255, 215, 0], [255, 210, 0], [255, 205, 0], [255, 200, 0], [255, 195, 0], [255, 190, 0], [255, 185, 0], [255, 180, 0], [255, 175, 0], [255, 170, 0], [255, 165, 0], [255, 160, 0], [255, 155, 0], [255, 150, 0], [255, 145, 0], [255, 140, 0], [255, 135, 0], [255, 130, 0], [255, 125, 0], [255, 120, 0], [255, 115, 0], [255, 110, 0], [255, 105, 0], [255, 100, 0], [255, 95, 0], [255, 90, 0], [255, 85, 0], [255, 80, 0], [255, 75, 0], [255, 70, 0], [255, 65, 0], [255, 60, 0], [255, 55, 0], [255, 50, 0], [255, 45, 0], [255, 40, 0], [255, 35, 0], [255, 30, 0], [255, 25, 0], [255, 20, 0], [255, 15, 0], [255, 10, 0], [255, 5, 0], [255, 0, 0]],
                redCm: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0], [4, 0, 0], [5, 0, 0], [6, 0, 0], [7, 0, 0], [8, 0, 0], [9, 0, 0], [10, 0, 0], [11, 0, 0], [12, 0, 0], [13, 0, 0], [14, 0, 0], [15, 0, 0], [16, 0, 0], [17, 0, 0], [18, 0, 0], [19, 0, 0], [20, 0, 0], [21, 0, 0], [22, 0, 0], [23, 0, 0], [24, 0, 0], [25, 0, 0], [26, 0, 0], [27, 0, 0], [28, 0, 0], [29, 0, 0], [30, 0, 0], [31, 0, 0], [32, 0, 0], [33, 0, 0], [34, 0, 0], [35, 0, 0], [36, 0, 0], [37, 0, 0], [38, 0, 0], [39, 0, 0], [40, 0, 0], [41, 0, 0], [42, 0, 0], [43, 0, 0], [44, 0, 0], [45, 0, 0], [46, 0, 0], [47, 0, 0], [48, 0, 0], [49, 0, 0], [50, 0, 0], [51, 0, 0], [52, 0, 0], [53, 0, 0], [54, 0, 0], [55, 0, 0], [56, 0, 0], [57, 0, 0], [58, 0, 0], [59, 0, 0], [60, 0, 0], [61, 0, 0], [62, 0, 0], [63, 0, 0], [64, 0, 0], [65, 0, 0], [66, 0, 0], [67, 0, 0], [68, 0, 0], [69, 0, 0], [70, 0, 0], [71, 0, 0], [72, 0, 0], [73, 0, 0], [74, 0, 0], [75, 0, 0], [76, 0, 0], [77, 0, 0], [78, 0, 0], [79, 0, 0], [80, 0, 0], [81, 0, 0], [82, 0, 0], [83, 0, 0], [84, 0, 0], [85, 0, 0], [86, 0, 0], [87, 0, 0], [88, 0, 0], [89, 0, 0], [90, 0, 0], [91, 0, 0], [92, 0, 0], [93, 0, 0], [94, 0, 0], [95, 0, 0], [96, 0, 0], [97, 0, 0], [98, 0, 0], [99, 0, 0], [100, 0, 0], [101, 0, 0], [102, 0, 0], [103, 0, 0], [104, 0, 0], [105, 0, 0], [106, 0, 0], [107, 0, 0], [108, 0, 0], [109, 0, 0], [110, 0, 0], [111, 0, 0], [112, 0, 0], [113, 0, 0], [114, 0, 0], [115, 0, 0], [116, 0, 0], [117, 0, 0], [118, 0, 0], [119, 0, 0], [120, 0, 0], [121, 0, 0], [122, 0, 0], [123, 0, 0], [124, 0, 0], [125, 0, 0], [126, 0, 0], [127, 0, 0], [128, 0, 0], [129, 0, 0], [130, 0, 0], [131, 0, 0], [132, 0, 0], [133, 0, 0], [134, 0, 0], [135, 0, 0], [136, 0, 0], [137, 0, 0], [138, 0, 0], [139, 0, 0], [140, 0, 0], [141, 0, 0], [142, 0, 0], [143, 0, 0], [144, 0, 0], [145, 0, 0], [146, 0, 0], [147, 0, 0], [148, 0, 0], [149, 0, 0], [150, 0, 0], [151, 0, 0], [152, 0, 0], [153, 0, 0], [154, 0, 0], [155, 0, 0], [156, 0, 0], [157, 0, 0], [158, 0, 0], [159, 0, 0], [160, 0, 0], [161, 0, 0], [162, 0, 0], [163, 0, 0], [164, 0, 0], [165, 0, 0], [166, 0, 0], [167, 0, 0], [168, 0, 0], [169, 0, 0], [170, 0, 0], [171, 0, 0], [172, 0, 0], [173, 0, 0], [174, 0, 0], [175, 0, 0], [176, 0, 0], [177, 0, 0], [178, 0, 0], [179, 0, 0], [180, 0, 0], [181, 0, 0], [182, 0, 0], [183, 0, 0], [184, 0, 0], [185, 0, 0], [186, 0, 0], [187, 0, 0], [188, 0, 0], [189, 0, 0], [190, 0, 0], [191, 0, 0], [192, 0, 0], [193, 0, 0], [194, 0, 0], [195, 0, 0], [196, 0, 0], [197, 0, 0], [198, 0, 0], [199, 0, 0], [200, 0, 0], [201, 0, 0], [202, 0, 0], [203, 0, 0], [204, 0, 0], [205, 0, 0], [206, 0, 0], [207, 0, 0], [208, 0, 0], [209, 0, 0], [210, 0, 0], [211, 0, 0], [212, 0, 0], [213, 0, 0], [214, 0, 0], [215, 0, 0], [216, 0, 0], [217, 0, 0], [218, 0, 0], [219, 0, 0], [220, 0, 0], [221, 0, 0], [222, 0, 0], [223, 0, 0], [224, 0, 0], [225, 0, 0], [226, 0, 0], [227, 0, 0], [228, 0, 0], [229, 0, 0], [230, 0, 0], [231, 0, 0], [232, 0, 0], [233, 0, 0], [234, 0, 0], [235, 0, 0], [236, 0, 0], [237, 0, 0], [238, 0, 0], [239, 0, 0], [240, 0, 0], [241, 0, 0], [242, 0, 0], [243, 0, 0], [244, 0, 0], [245, 0, 0], [246, 0, 0], [247, 0, 0], [248, 0, 0], [249, 0, 0], [250, 0, 0], [251, 0, 0], [252, 0, 0], [253, 0, 0], [254, 0, 0], [255, 0, 0]],
                standardCm: [[0, 0, 0], [0, 0, 3], [1, 1, 6], [2, 2, 9], [3, 3, 12], [4, 4, 15], [5, 5, 18], [6, 6, 21], [7, 7, 24], [8, 8, 27], [9, 9, 30], [10, 10, 33], [10, 10, 36], [11, 11, 39], [12, 12, 42], [13, 13, 45], [14, 14, 48], [15, 15, 51], [16, 16, 54], [17, 17, 57], [18, 18, 60], [19, 19, 63], [20, 20, 66], [20, 20, 69], [21, 21, 72], [22, 22, 75], [23, 23, 78], [24, 24, 81], [25, 25, 85], [26, 26, 88], [27, 27, 91], [28, 28, 94], [29, 29, 97], [30, 30, 100], [30, 30, 103], [31, 31, 106], [32, 32, 109], [33, 33, 112], [34, 34, 115], [35, 35, 118], [36, 36, 121], [37, 37, 124], [38, 38, 127], [39, 39, 130], [40, 40, 133], [40, 40, 136], [41, 41, 139], [42, 42, 142], [43, 43, 145], [44, 44, 148], [45, 45, 151], [46, 46, 154], [47, 47, 157], [48, 48, 160], [49, 49, 163], [50, 50, 166], [51, 51, 170], [51, 51, 173], [52, 52, 176], [53, 53, 179], [54, 54, 182], [55, 55, 185], [56, 56, 188], [57, 57, 191], [58, 58, 194], [59, 59, 197], [60, 60, 200], [61, 61, 203], [61, 61, 206], [62, 62, 209], [63, 63, 212], [64, 64, 215], [65, 65, 218], [66, 66, 221], [67, 67, 224], [68, 68, 227], [69, 69, 230], [70, 70, 233], [71, 71, 236], [71, 71, 239], [72, 72, 242], [73, 73, 245], [74, 74, 248], [75, 75, 251], [76, 76, 255], [0, 78, 0], [1, 80, 1], [2, 82, 2], [3, 84, 3], [4, 87, 4], [5, 89, 5], [6, 91, 6], [7, 93, 7], [8, 95, 8], [9, 97, 9], [9, 99, 9], [10, 101, 10], [11, 103, 11], [12, 105, 12], [13, 108, 13], [14, 110, 14], [15, 112, 15], [16, 114, 16], [17, 116, 17], [18, 118, 18], [18, 120, 18], [19, 122, 19], [20, 124, 20], [21, 126, 21], [22, 129, 22], [23, 131, 23], [24, 133, 24], [25, 135, 25], [26, 137, 26], [27, 139, 27], [27, 141, 27], [28, 143, 28], [29, 145, 29], [30, 147, 30], [31, 150, 31], [32, 152, 32], [33, 154, 33], [34, 156, 34], [35, 158, 35], [36, 160, 36], [36, 162, 36], [37, 164, 37], [38, 166, 38], [39, 168, 39], [40, 171, 40], [41, 173, 41], [42, 175, 42], [43, 177, 43], [44, 179, 44], [45, 181, 45], [45, 183, 45], [46, 185, 46], [47, 187, 47], [48, 189, 48], [49, 192, 49], [50, 194, 50], [51, 196, 51], [52, 198, 52], [53, 200, 53], [54, 202, 54], [54, 204, 54], [55, 206, 55], [56, 208, 56], [57, 210, 57], [58, 213, 58], [59, 215, 59], [60, 217, 60], [61, 219, 61], [62, 221, 62], [63, 223, 63], [63, 225, 63], [64, 227, 64], [65, 229, 65], [66, 231, 66], [67, 234, 67], [68, 236, 68], [69, 238, 69], [70, 240, 70], [71, 242, 71], [72, 244, 72], [72, 246, 72], [73, 248, 73], [74, 250, 74], [75, 252, 75], [76, 255, 76], [78, 0, 0], [80, 1, 1], [82, 2, 2], [84, 3, 3], [86, 4, 4], [88, 5, 5], [91, 6, 6], [93, 7, 7], [95, 8, 8], [97, 8, 8], [99, 9, 9], [101, 10, 10], [103, 11, 11], [105, 12, 12], [107, 13, 13], [109, 14, 14], [111, 15, 15], [113, 16, 16], [115, 16, 16], [118, 17, 17], [120, 18, 18], [122, 19, 19], [124, 20, 20], [126, 21, 21], [128, 22, 22], [130, 23, 23], [132, 24, 24], [134, 24, 24], [136, 25, 25], [138, 26, 26], [140, 27, 27], [142, 28, 28], [144, 29, 29], [147, 30, 30], [149, 31, 31], [151, 32, 32], [153, 32, 32], [155, 33, 33], [157, 34, 34], [159, 35, 35], [161, 36, 36], [163, 37, 37], [165, 38, 38], [167, 39, 39], [169, 40, 40], [171, 40, 40], [174, 41, 41], [176, 42, 42], [178, 43, 43], [180, 44, 44], [182, 45, 45], [184, 46, 46], [186, 47, 47], [188, 48, 48], [190, 48, 48], [192, 49, 49], [194, 50, 50], [196, 51, 51], [198, 52, 52], [201, 53, 53], [203, 54, 54], [205, 55, 55], [207, 56, 56], [209, 56, 56], [211, 57, 57], [213, 58, 58], [215, 59, 59], [217, 60, 60], [219, 61, 61], [221, 62, 62], [223, 63, 63], [225, 64, 64], [228, 64, 64], [230, 65, 65], [232, 66, 66], [234, 67, 67], [236, 68, 68], [238, 69, 69], [240, 70, 70], [242, 71, 71], [244, 72, 72], [246, 72, 72], [248, 73, 73], [250, 74, 74], [252, 75, 75], [255, 76, 76]]
            };
            var cmapOptions = '';
            Object.keys(cmaps).forEach(function (c) {
                cmapOptions += '<option value="' + c + '">' + c + '</option>';
            });
            var $html = $('<div>' +
                '        Colormap: <select id="cmapSelect">' + cmapOptions +
                '        </select><br>' +
                '        Center: <span id="cmapCenter"></span>' +
                '</div>');
            var cmapUpdate = function () {
                var val = $('#cmapSelect').val();
                $('#cmapSelect').change(function () {
                    updateCallback(val);
                });
                return cmaps[val];
            };
            var spinnerSlider = new $$.SpinnerSlider({
                $element: $html.find('#cmapCenter'),
                init: 128,
                min: 1,
                sliderMax: 254,
                step: 1,
                updateCallback: updateCallback
            });
            return {
                html: $html,
                getParams: function () {
                    return spinnerSlider.getValue();
                },
                getFilter: function () {
                    /*eslint new-cap: 0*/
                    return OpenSeadragon.Filters.COLORMAP(cmapUpdate(), spinnerSlider.getValue());
                },
                sync: true
            };
        }
    }];
    availableFilters.sort(function(f1, f2) {
        return f1.name.localeCompare(f2.name);
    });

}(WDZT));

