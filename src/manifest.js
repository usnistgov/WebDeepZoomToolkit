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

    $$.Manifest = function(options) {

        $.extend(true, this, {
            manifest: null,
            success: function() {
            },
            error: function() {
            }
        }, options);

        var _this = this;

        function validateManifest() {
            if (!_this.manifest) {
                _this.error("The manifest should not be empty.");
                return;
            }

            var layersGroups = _this.manifest.layersGroups;
            if (!(layersGroups instanceof Array)) {
                _this.error("The layers groups property of the manifest " +
                        "must be an array.");
                return;
            }

            _this.success(_this.manifest);
        }

        if (typeof this.manifest === "string") {
            $.ajax(this.manifest, {
                dataType: "json",
                success: function(data) {
                    _this.manifest = data;
                    validateManifest();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    /*jshint unused:true */
                    var message = textStatus;
                    if (errorThrown) {
                        message += ": " + errorThrown;
                    }
                    _this.error(message);
                }
            });
        } else {
            setTimeout(validateManifest);
        }
    };

    $$.Manifest.prototype = {
        /**
         * 
         * @returns {Object[]}
         */
        getLayersGroups: function() {
            return this.manifest.layersGroups;
        },
        /**
         * Get the layers defined in the manifest.
         * @param {Object|String} [layersGroup=null] If defined, filter only 
         * layers from the specified group. Otherwise return all layers.
         * @returns {Object[]} array of layers objects
         */
        getLayers: function(layersGroup) {
            var groups = this.manifest.layersGroups;
            if (layersGroup) {
                for (var i = 0; i < groups.length; i++) {
                    var g = groups[i];
                    if (g === layersGroup || g.id === layersGroup) {
                        return g.layers;
                    }
                }
            }

            var result = [];
            for (var j = 0; j < groups.length; j++) {
                var group = groups[j];
                if (group.layers) {
                    for (var k = 0; k < group.layers.length; k++) {
                        result.push(group.layers[k]);
                    }
                }
            }

            return result;
        },
        /**
         * Retrieve a layer by its id.
         * @param {String} id
         * @returns {Object}
         */
        getLayer: function(id) {
            var layers = this.getLayers();
            if (!layers) {
                return null;
            }
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                if (layer.id === id) {
                    return layer;
                }
            }
            return null;
        },
        /**
         * Retrieve the first layer
         * @returns {Object}
         */
        getFirstLayer: function() {
            var layers = this.getLayers();
            if (!layers || !layers.length) {
                return null;
            }
            return layers[0];
        },
        /**
         * Retrieve the group of a layer.
         * @param {Object|String} layer The layer or the id of the layer.
         * @returns {Object} the layer's group
         */
        getLayerGroup: function(layer) {
            var groups = this.manifest.layersGroups;
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                for (var j = 0; j < group.layers.length; j++) {
                    var l = group.layers[j];
                    if (l === layer || l.id === layer) {
                        return group;
                    }
                }
            }
            return null;
        },
        /**
         * Get the function allowing to map a frame to an url for the specified
         * layer.
         * @param {Object} layer
         * @returns {Function}
         */
        getFrameUrlFunc: function(layer) {
            if (layer.singleFrame) {
                return function() {
                    return layer.baseUrl;
                };
            }

            if (layer.framesList) {
                layer.framesList.sort(function(a, b) {
                    return a - b;
                });
                return function(frame) {
                    var current;
                    var previous = null;
                    // TODO: improve by using binary search
                    for (var i = 0; i < layer.framesList.length; i++) {
                        current = layer.framesList[i];
                        if (current >= frame) {
                            break;
                        }
                        previous = current;
                    }
                    var actualFrame;
                    if (previous === null) {
                        actualFrame = current;
                    } else {
                        var middle = (current + previous) / 2;
                        actualFrame = frame <= middle ? previous : current;
                    }
                    return layer.baseUrl + "/" + layer.framesPrefix +
                            $$.pad(actualFrame + "", layer.paddingSize) +
                            layer.framesSuffix;
                };
            }

            return function(frame) {
                var framesOffset = layer.framesOffset || 0;
                return layer.baseUrl + "/" + layer.framesPrefix +
                        $$.pad(frame + framesOffset + "", layer.paddingSize) +
                        layer.framesSuffix;
            };
        }
    };

}(WDZT));
