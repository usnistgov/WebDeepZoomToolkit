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

    $$.ColonyHelper = $$.ColonyHelper || {};

    $$.ColonyHelper.getFeatures = function(options) {

        if (!options.serviceUrl) {
            throw new Error("No service url set.");
        }

        if (options.dataset === undefined) {
            throw new Error("No dataset set.");
        }

        if (options.layer === undefined) {
            throw new Error("No layer set.");
        }

        if (options.frame === undefined) {
            throw new Error("No frame number set.");
        }

        if (options.x === undefined || options.y === undefined) {
            throw new Error("No position set.");
        }

        if (!options.onSuccess) {
            throw new Error("No success callback specified.");
        }

        var url = options.serviceUrl +
                "?dataset=" + options.dataset +
                "&layer=" + options.layer +
                "&frame=" + options.frame +
                "&x=" + options.x +
                "&y=" + options.y;

        OpenSeadragon.makeAjaxRequest(url,
                function(result) {
                    var results = JSON.parse(result.response);
                    if (!results.length) {
                        options.onError("No colony found.");
                        return;
                    }
                    var response = results[0];
                    var id = response.id;
                    var colony = response.colonyId;
                    var dataset = response.dataset;
                    var boundingBox = response.shape.boxBound;
                    var centroid = response.shape.centroid;

                    var featuresGroup = [];
                    var shapeFeaturesGroup = {
                        groupName: "Shape",
                        features: []
                    };
                    for (var featureId in response.shape) {
                        if (featureId !== "id" &&
                                featureId !== "boxBound" &&
                                featureId !== "centroid") {
                            shapeFeaturesGroup.features.push({
                                name: featureId,
                                value: response.shape[featureId]
                            });
                        }
                    }
                    featuresGroup.push(shapeFeaturesGroup);

                    if (response.intensityList) {
                        var intensityFeaturesGroup = {
                            groupName: "Intensity",
                            features: []
                        };
                        for (var i = 0; i < response.intensityList.length; i++) {
                            var intensities = response.intensityList[i];
                            for (var intensityId in intensities) {
                                if (intensityId !== "id" &&
                                        intensityId !== "layer") {
                                    intensityFeaturesGroup.features.push({
                                        name: intensityId,
                                        value: intensities[intensityId]
                                    });
                                }
                            }
                        }
                        featuresGroup.push(intensityFeaturesGroup);
                    }

                    if (response.textureList) {
                        var texturesFeatureGroup = {
                            groupName: "Texture",
                            featuresGroup: []
                        };
                        for (var j = 0; j < response.textureList.length; j++) {
                            var textures = response.textureList[j];
                            var category = textures.textureCategory.name;
                            var subGroup = {
                                groupName: category,
                                features: []
                            };
                            for (var textureId in textures) {
                                if (textureId !== "id" &&
                                        textureId !== "textureCategory" &&
                                        textureId !== "layer") {
                                    subGroup.features.push({
                                        name: textureId,
                                        value: textures[textureId]
                                    });
                                }
                            }
                            texturesFeatureGroup.featuresGroup.push(subGroup);
                        }
                        featuresGroup.push(texturesFeatureGroup);
                    }

                    options.onSuccess({
                        id: id,
                        colony: colony,
                        dataset: dataset,
                        boundingBox: boundingBox,
                        centroid: centroid,
                        featuresGroup: featuresGroup
                    });
                },
                options.onError);
    };

    $$.ColonyHelper.getBoundingBox = function(options) {
        options = options || {};

        if (!options.serviceUrl) {
            throw new Error("No service url specified.");
        }

        if (!options.dataset) {
            throw new Error("No dataset specified.");
        }

        if (options.frame === undefined) {
            throw new Error("No frame specified.");
        }

        if (options.colony === undefined) {
            throw new Error("No colony specified.");
        }

        if (!options.onSuccess) {
            throw new Error("No success callback specified.");
        }

        var url = options.serviceUrl +
                "?dataset=" + options.dataset +
                "&frame=" + options.frame +
                "&colony=" + options.colony;

        OpenSeadragon.makeAjaxRequest(url,
                function(result) {
                    if (!result.response) {
                        var message = "No colony with id " + options.colony +
                                " found on frame " + options.frame + ".";
                        options.onError(message);
                        return;
                    }
                    var boundingBox;
                    try {
                        boundingBox = JSON.parse(result.response);
                    } catch (e) {
                        options.onError("Cannot parse web service result.");
                        return;
                    }
                    options.onSuccess(boundingBox);
                },
                options.onError);
    };

    $$.ColonyHelper.getColonyColor = function(colony) {
        var hue = (colony * 20) % 359;
        return $.Color({
            hue: hue,
            saturation: 0.9,
            lightness: 0.6,
            alpha: 1
        }).toHexString();
    };

}(WDZT));
