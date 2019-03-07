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

    $$.Viewer = function(options) {

        $.extend(true, this, {
            /**
             * The unique id of this viewer
             */
            id: null,
            /**
             * The parent element of this Viewer instance
             */
            container: null,
            /**
             * Set the images prefix
             */
            imagesPrefix: "images/",
            /**
             * Defines if the viewer should adjust it height depending on the
             * available space
             */
            autoAdjustHeight: false,
            /**
             * Defines the minimum height the viewer will have when
             * autoAdjustHeight is on.
             */
            autoAdjustMinHeight: 500
        }, options);

        if (!this.id) {
            throw new Error("An id must be specified to WDZT.");
        }

        OpenSeadragon.EventSource.call(this);
        OpenSeadragon.extend($$.Viewer.prototype, OpenSeadragon.EventSource.prototype);

        this.$container = $("#" + (this.$container || this.id));
        this.$container.addClass("wdzt-container");

        this.$toolbarContainer = $("<div/>")
                .attr("id", "wdzt-" + this.id + "-toolbar-container")
                .addClass("wdzt-toolbar-container")
                .appendTo(this.$container);
        this.toolbar = new $$.Toolbar({
            id: this.$toolbarContainer.attr("id"),
            viewer: this
        });

        this.$menuAndOsdContainer = $("<div/>")
                .attr("id", "wdzt-" + this.id + "-menu-and-osd-container")
                .addClass("wdzt-menu-and-osd-container")
                .appendTo(this.$container);

        /**
         * Container for the menu
         */
        this.$menuContainer = $("<div/>")
                .attr("id", "wdzt-" + this.id + "-menu-container")
                .addClass("wdzt-menu-container")
                .appendTo(this.$menuAndOsdContainer);
        // We need a sub container to enforce the height of the menu because the
        // menu container got a table style (allows to enforce the width but
        // giveup any height adjustement).
        this.$menuSubContainer = $("<div/>")
                .attr("id", "wdzt-" + this.id + "-menu-subcontainer")
                .addClass("wdzt-menu-subcontainer")
                .appendTo(this.$menuContainer);

        /**
         * Container for OpenSeadragon
         */
        this.$osdContainer = $("<div/>")
                .attr("id", "wdzt-" + this.id + "-osd-container")
                .addClass("wdzt-osd-container")
                .appendTo(this.$menuAndOsdContainer);

        autoAdjustHeight(this);

        /**
         * OpenSeadragon movie instance
         */
        // Changing default from OpenSeadragon but still overwritable via
        // viewer's options.
        var osdMovieOptions = {
            showNavigator: true
        };
        $.extend(true, osdMovieOptions, options["OpenSeadragon"], {
            // Not modifiable options
            id: this.$osdContainer.attr("id"),
            zoomInButton: this.toolbar.zoomInButtonId,
            zoomOutButton: this.toolbar.zoomOutButtonId,
            homeButton: this.toolbar.homeButtonId,
            showFullPageControl: false
        });
        this.osdMovie = new OpenSeadragon.Movie(osdMovieOptions);

        /**
         * OpenSeadragon instance
         */
        this.osd = this.osdMovie.viewer;

        this.manifest = null;
        this.selectedLayer = null;
        this.isMenuDisplayed = true;
        this.zslice = false;
        /*this.numberOfSlices = null;
        this.currentSliceIndex = null;*/
        var _this = this;

        this.clickHandlerModule = null;
        this.osd.addViewerInputHook({
            hooks: [{
                    tracker: "viewer",
                    handler: "clickHandler",
                    hookHandler: function(event) {
                        event.preventDefaultAction = true;
                        if (event.quick && _this.clickHandlerModule) {
                            _this.clickHandlerModule.clickHandler(event);
                        }
                    }
                }
            ]
        });

        $(window).resize(function() {
            autoAdjustHeight(_this);
        });

        this._modules = [];
        for (var moduleName in $$.Module.MODULES) {
            var $div = $("<div/>").appendTo(this.$menuSubContainer);
            var $title = $("<h3/>")
                    .addClass("wdzt-menu-title")
                    .appendTo($div);
            var $container = $("<div/>")
                    .addClass("wdzt-menu-content")
                    .appendTo($div);

            var moduleOptions = {
                viewer: this,
                $container: $container
            };
            $.extend(true, moduleOptions, options[moduleName]);

            var module = new $$.Module.MODULES[moduleName](moduleOptions);
            $title.text(module.getTitle());
            this._modules.push({
                name: moduleName,
                $div: $div,
                $title: $title,
                $container: $container,
                instance: module
            });
        }

        this._modules.sort(function(a, b) {
            return a.instance.getOrderIndex() - b.instance.getOrderIndex();
        });

        // Re-insert all modules in correct order, remove the ones without title,
        // and hide them by default.
        for (var i = 0; i < this._modules.length; i++) {
            var m = this._modules[i];
            if (m.instance.getTitle() !== null) {
                m.$div.appendTo(this.$menuSubContainer);
                m.$div.hide();
            } else {
                m.$div.remove();
            }
        }
    };

    $$.Viewer.prototype = {
        /**
         * Open a new manifest.
         * @param {Object|String} manifest The manifest to open. It can be an
         * url to a Json file or a plain object.
         * @param {Object} options An options object specifying opening options
         * @param {String} options.url The url of the manifest to open.
         * @param {String} options.layer The layer to open on initialization.
         * @param {Number} options.frame The frame to open on initialization.
         * @param {Object} options.ModuleName The initialization options for the
         * module specified by ModuleName.
         */
        open: function(manifest, options) {
            options = options || {};
            var _this = this;
            this.manifest = null;
            var manifestObj = new $$.Manifest({
                manifest: manifest,
                success: function() {
                    _this.manifest = manifestObj;
                    _this.raiseEvent("open");
                    var layer = manifestObj.getFirstLayer();
                    if (options.layer) {
                        layer = manifestObj.getLayer(options.layer);
                        if (!layer) {
                            window.console.error("Layer " + options.layer +
                                    " not found in the manifest. " +
                                    "Opening first layer.");
                        }
                    }
                    if (layer) {
                        _this.displayLayer(layer, options);
                    }
                },
                error: function(message) {
                    var txt = "Cannot open the specified manifest.<br>" + message;
                    _this.displayError(txt);
                }
            });
        },
        /**
         * Display the specified layer. The options allows to specify at what
         * frame to open
         */
        displayLayer: function(layer, options) {
            options = options || {};

            if (this.selectedLayer !== layer) {
                this.selectedLayer = layer;
                this.zslice = layer.zslice;
                /*this.numberOfSlices = layer.numberOfSlices || 1;
                this.currentSliceIndex = layer.openOnSlice - layer.slicesOffset;*/
                this.osdMovie.openMovie({
                    movieName: layer.name,
                    openOnFrame: options.frame || layer.openOnFrame ? layer.openOnFrame - layer.framesOffset : 1,
                    numberOfFrames: layer.numberOfFrames || 1,
                    zslice: layer.zslice,
                    numberOfSlices: layer.numberOfSlices || 1,
                    openOnSlice: layer.openOnSlice ? layer.openOnSlice - layer.slicesOffset : 1,
                    getTileSourceOfFrame: this.manifest.getFrameUrlFunc(layer)
                });
            }
            if (options.frame) {
                this.osdMovie.displayFrame(options.frame, 1);
            }

            for (var i = 0; i < this._modules.length; i++) {
                var module = this._modules[i];
                if (module.instance.supportLayer(layer)) {
                    if (module.instance.getTitle() !== null) {
                        /*jshint loopfunc: true */
                        var activateHandler = (function(module) {
                            return function() {
                                checkModuleActivation(module);
                            };
                        })(module);
                        // Somehow, the accordions need to be created here instead of
                        // inside of the constructor. Otherwise, icons won't appear.
                        module.$div.accordion({
                            header: "h3",
                            collapsible: true,
                            heightStyle: "content",
                            activate: activateHandler
                        });
                        module.$div.show();
                    }
                    module.instance.enable();
                    module.instance.loadState(options[module.name]);
                } else {
                    if (module.instance.getTitle() !== null) {
                        module.$div.hide();
                    }
                    module.instance.disable();
                }
            }

            this.raiseEvent("layer-changed", {
                layer: layer
            });
            return this;
        },
        toggleMenu: function() {
            if (this.isMenuDisplayed) {
                this.$menuContainer.hide();
                this.isMenuDisplayed = false;
            } else {
                this.$menuContainer.show();
                this.isMenuDisplayed = true;
            }
            checkAllModulesActivation(this);
        },
        displayNotification: function(message) {
            noty({
                text: message,
                layout: "bottomRight",
                timeout: 5000,
                type: "information"
            });
        },
        displayWarning: function(message) {
            noty({
                text: message,
                layout: "bottomRight",
                timeout: 5000,
                type: "warning"
            });
        },
        displayError: function(message) {
            noty({
                text: message,
                layout: "bottomRight",
                timeout: 5000,
                type: "alert"
            });
        },
        toggleFullScreen: function() {
            toggleFullScreen(this);
            return this;
        },
        setClickHandler: function(module) {
            this.clickHandlerModule = module;
            this.raiseEvent("click-handler-changed", {
                module: module
            });
        }
    };

    function checkAllModulesActivation(_this) {
        for (var i = 0; i < _this._modules.length; i++) {
            checkModuleActivation(_this._modules[i]);
        }
    }

    function checkModuleActivation(module) {
        if (module.instance.getTitle() === null) {
            return;
        }

        var enabled = module.$div.is(":visible") &&
                module.$div.children("h3").hasClass("ui-state-active");
        if (enabled) {
            module.instance.enable();
        } else {
            module.instance.disable();
        }
    }

    function toggleFullScreen(_this) {
        if (!OpenSeadragon.supportsFullScreen) {
            toggleFullPage(_this);
            return;
        }

        if (!OpenSeadragon.isFullScreen()) {

            toggleFullPage(_this);
            // If the full page mode is not actually entered, we need to prevent
            // the full screen mode.
            if (!_this.fullPage) {
                return;
            }
            var containerStyle = _this.$container.get(0).style;
            _this.fullPageStyleWidth = containerStyle.width;
            _this.fullPageStyleHeight = containerStyle.height;
            containerStyle.width = '100%';
            containerStyle.height = '100%';

            var onFullScreenChange = function() {
                var isFullScreen = OpenSeadragon.isFullScreen();
                if (!isFullScreen) {
                    OpenSeadragon.removeEvent(document,
                            OpenSeadragon.fullScreenEventName, onFullScreenChange);
                    OpenSeadragon.removeEvent(document,
                            OpenSeadragon.fullScreenErrorEventName, onFullScreenChange);

                    if (_this.fullPage) {
                        toggleFullPage(_this);
                        containerStyle.width = _this.fullPageStyleWidth;
                        containerStyle.height = _this.fullPageStyleHeight;
                    }
                }
                adjustMenuAndOsdHeight(_this);
            };
            OpenSeadragon.addEvent(document, OpenSeadragon.fullScreenEventName,
                    onFullScreenChange);
            OpenSeadragon.addEvent(document, OpenSeadragon.fullScreenErrorEventName,
                    onFullScreenChange);

            OpenSeadragon.requestFullScreen(document.body);

        } else {
            OpenSeadragon.exitFullScreen();
        }
    }

    function toggleFullPage(_this) {

        var body = document.body,
                bodyStyle = body.style,
                docStyle = document.documentElement.style,
                containerStyle = _this.$container.get(0).style,
                nodes,
                i;

        _this.raiseEvent("pre-full-page", {fullPage: !_this.fullPage});

        if (!_this.fullPage) {

            _this.containerSize = OpenSeadragon.getElementSize(_this.$container);
            _this.pageScroll = OpenSeadragon.getPageScroll();

            _this.containerMargin = containerStyle.margin;
            containerStyle.margin = "0";
            _this.containerPadding = containerStyle.padding;
            containerStyle.padding = "0";

            _this.bodyMargin = bodyStyle.margin;
            _this.docMargin = docStyle.margin;
            bodyStyle.margin = "0";
            docStyle.margin = "0";

            _this.bodyPadding = bodyStyle.padding;
            _this.docPadding = docStyle.padding;
            bodyStyle.padding = "0";
            docStyle.padding = "0";

            _this.bodyWidth = bodyStyle.width;
            _this.bodyHeight = bodyStyle.height;
            bodyStyle.width = "100%";
            bodyStyle.height = "100%";

            //when entering full screen on the ipad it wasnt sufficient to leave
            //the body intact as only only the top half of the screen would
            //respond to touch events on the canvas, while the bottom half treated
            //them as touch events on the document body.  Thus we remove and store
            //the bodies elements and replace them when we leave full screen.
            _this.previousBody = [];
            _this.prevContainerParent = _this.$container.parent().get(0);
            _this.prevNextSibling = _this.$container.next().get(0);
            _this.prevContainerWidth = containerStyle.width;
            _this.prevContainerHeight = containerStyle.height;
            nodes = body.childNodes.length;
            for (i = 0; i < nodes; i++) {
                _this.previousBody.push(body.childNodes[ 0 ]);
                body.removeChild(body.childNodes[ 0 ]);
            }

            _this.$container.addClass("fullpage");
            body.appendChild(_this.$container.get(0));

            _this.$container.width(OpenSeadragon.getWindowSize().x);
            _this.$container.height(OpenSeadragon.getWindowSize().y);

            _this.fullPage = true;

        } else {

            containerStyle.margin = _this.containerMargin;
            containerStyle.padding = _this.containerPadding;

            bodyStyle.margin = _this.bodyMargin;
            docStyle.margin = _this.docMargin;

            bodyStyle.padding = _this.bodyPadding;
            docStyle.padding = _this.docPadding;

            bodyStyle.width = _this.bodyWidth;
            bodyStyle.height = _this.bodyHeight;

            body.removeChild(_this.$container.get(0));
            nodes = _this.previousBody.length;
            for (i = 0; i < nodes; i++) {
                body.appendChild(_this.previousBody.shift());
            }

            _this.$container.removeClass("fullpage");
            _this.prevContainerParent.insertBefore(
                    _this.$container.get(0),
                    _this.prevNextSibling);

            containerStyle.width = _this.prevContainerWidth;
            containerStyle.height = _this.prevContainerHeight;

            // After exiting fullPage or fullScreen, it can take some time
            // before the browser can actually set the scroll.
            var restoreScrollCounter = 0;
            var restoreScroll = function() {
                OpenSeadragon.setPageScroll(_this.pageScroll);
                var pageScroll = OpenSeadragon.getPageScroll();
                restoreScrollCounter++;
                if (restoreScrollCounter < 10 &&
                        pageScroll.x !== _this.pageScroll.x ||
                        pageScroll.y !== _this.pageScroll.y) {
                    OpenSeadragon.requestAnimationFrame(restoreScroll);
                }
            };
            OpenSeadragon.requestAnimationFrame(restoreScroll);

            _this.fullPage = false;
        }

        adjustMenuAndOsdHeight(_this);

        _this.raiseEvent("full-page", {fullPage: _this.fullPage});
    }

    function adjustMenuAndOsdHeight(_this) {
        var height = _this.$container.height() -
                _this.$toolbarContainer.height();
        _this.$menuAndOsdContainer.height(height);
        _this.$menuContainer.height(height);
        _this.$menuSubContainer.height(height);
        _this.$osdContainer.height(height);
    }

    function autoAdjustHeight(_this) {
        if (_this.autoAdjustHeight) {
            var height = $(window).height() - _this.$container.position().top - 20;
            if (height < _this.autoAdjustMinHeight) {
                height = _this.autoAdjustMinHeight;
            }
            _this.$container.height(height);
        }
        adjustMenuAndOsdHeight(_this);
    }

}(WDZT));
