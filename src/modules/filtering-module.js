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
            _this.viewer.osd.setFilterOptions({
                filters: {
                    items: [_this.viewer.osd.world.getItemAt(0)],
                    processors: filters
                },
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
        }];
    availableFilters.sort(function(f1, f2) {
        return f1.name.localeCompare(f2.name);
    });

}(WDZT));

