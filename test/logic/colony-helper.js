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

(function() {

    module("colony-helper");

    asyncTest("getFeatures", function() {

        throws(WDZT.ColonyHelper.getFeatures,
                "An error should be thrown if no options is specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({});
        }, /No service url set./,
                "An error should be thrown if no serviceUrl is specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl"
            });
        }, /No dataset set./,
                "An error should be thrown if no dataset is specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl",
                dataset: "dataset"
            });
        }, /No layer set./,
                "An error should be thrown if no layer is specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                layer: "layer"
            });
        }, /No frame number set./,
                "An error should be thrown if no frame is specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                layer: "layer",
                frame: "frame"
            });
        }, /No position set./,
                "An error should be thrown if no position is specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                layer: "layer",
                frame: "frame",
                x: "x"
            });
        }, /No position set./,
                "An error should be thrown if y is not specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                layer: "layer",
                frame: "frame",
                y: "y"
            });
        }, /No position set./,
                "An error should be thrown if x is not specified.");

        throws(function() {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                layer: "layer",
                frame: "frame",
                x: "x",
                y: "y"
            });
        }, /No success callback specified./,
                "An error should be thrown if no success callback is specified.");

        var ajaxRequestBackup = OpenSeadragon.makeAjaxRequest;
        OpenSeadragon.makeAjaxRequest = function(url, onSuccess, onError) {
            equal(url, "serviceUrl?dataset=dataset&layer=layer&frame=1&x=10&y=10");

            ajaxRequestBackup("test/data/colonyfeature.json", onSuccess, onError);
        };
        try {
            WDZT.ColonyHelper.getFeatures({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                layer: "layer",
                frame: 1,
                x: 10,
                y: 10,
                onSuccess: function(result) {
                    equal(result.colony, 103, "Colony should be 103.");

                    propEqual(result.boundingBox, {
                        width: 283,
                        height: 388,
                        x: 8725,
                        y: 7959
                    }, "Bounding box different than expected.");

                    propEqual(result.centroid, {
                        x: 8868.444352554065,
                        y: 8176.766940578205
                    }, "Centroid different than expected.");

                    var featuresGroups = result.featuresGroup;
                    deepEqual(featuresGroups, expectedFeatures,
                            "Unexpected features.");

                    start();
                }
            });
        } finally {
            OpenSeadragon.makeAjaxRequest = ajaxRequestBackup;
        }
    });

    asyncTest("getBoundingBox", function() {

        throws(WDZT.ColonyHelper.getBoundingBox,
                "An error should be thrown if no options is specified.");

        throws(function() {
            WDZT.ColonyHelper.getBoundingBox({});
        }, /No service url specified./,
                "An error should be thrown if no serviceUrl is specified.");

        throws(function() {
            WDZT.ColonyHelper.getBoundingBox({
                serviceUrl: "serviceUrl"
            });
        }, /No dataset specified./,
                "An error should be thrown if no dataset is specified.");

        throws(function() {
            WDZT.ColonyHelper.getBoundingBox({
                serviceUrl: "serviceUrl",
                dataset: "dataset"
            });
        }, /No frame specified./,
                "An error should be thrown if no frame is specified.");

        throws(function() {
            WDZT.ColonyHelper.getBoundingBox({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                frame: "frame"
            });
        }, /No colony specified./,
                "An error should be thrown if no colony is specified.");

        throws(function() {
            WDZT.ColonyHelper.getBoundingBox({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                frame: "frame",
                colony: "colony"
            });
        }, /No success callback specified./,
                "An error should be thrown if no success callback is specified.");

        var ajaxRequestBackup = OpenSeadragon.makeAjaxRequest;
        OpenSeadragon.makeAjaxRequest = function(url, onSuccess, onError) {
            equal(url, "serviceUrl?dataset=dataset&frame=1&colony=1");

            ajaxRequestBackup("test/data/boundingbox.json", onSuccess, onError);
        };
        try {
            WDZT.ColonyHelper.getBoundingBox({
                serviceUrl: "serviceUrl",
                dataset: "dataset",
                frame: 1,
                colony: 1,
                onSuccess: function(result) {
                    deepEqual(result, {
                        "width": 127,
                        "height": 116,
                        "x": 284,
                        "y": 10969
                    }, "Unexpected bounding box.");
                    start();
                }
            });
        } finally {
            OpenSeadragon.makeAjaxRequest = ajaxRequestBackup;
        }
    });

    test("getColonyColor", function() {
        equal(WDZT.ColonyHelper.getColonyColor(1), "#f57a3d",
                "Unexpected color for colony 1.");
    });

    var expectedFeatures = [{
            "groupName": "Shape",
            "features": [
                {"name": "areapxl", "value": 56831},
                {"name": "perimeterpxl", "value": 1361.3439999999941},
                {"name": "circularity", "value": 0.38535358073560944},
                {"name": "aspectRatioBB", "value": 0.729381443298969},
                {"name": "extendBB", "value": 0.5175676660230957},
                {"name": "orientation", "value": 0.2672552806194183},
                {"name": "eccentricity", "value": 0.8034579189968094}
            ]}, {
            "groupName": "Intensity",
            "features": [
                {"name": "median", "value": 12.063986778259277},
                {"name": "mode", "value": 13.123802974820137},
                {"name": "mean", "value": 12.085843569732049},
                {"name": "standardDeviation", "value": 12.909109026411883},
                {"name": "skewness", "value": 0.057043513668955756},
                {"name": "kurtosis", "value": 2.910732418729685},
                {"name": "momentNumber5", "value": 0.6091956455622889},
                {"name": "momentNumber6", "value": 13.895316837401607},
                {"name": "entropy", "value": 5.947495010696016}
            ]}, {
            "groupName": "Texture",
            "featuresGroup": [{
                    "groupName": "Average Amplitude",
                    "features": [
                        {"name": "energy", "value": 0.039742996851647526},
                        {"name": "contrast", "value": 3.078444856129534},
                        {"name": "correlation", "value": 0.21912417823658578},
                        {"name": "homogeneity", "value": 0.5338964692595565},
                        {"name": "variance", "value": 1.971145413494689},
                        {"name": "entropy", "value": 4.922532066691324},
                        {"name": "invDiffMoment", "value": 0.4797441058984526},
                        {"name": "sumAvg", "value": 4.31860181462273},
                        {"name": "sumVar", "value": 4.806136797849221},
                        {"name": "sumEntropy", "value": -3.1543887930701344},
                        {"name": "diffAvg", "value": 1.3646424192769808},
                        {"name": "diffVar", "value": 4.806136797849221},
                        {"name": "diffEntropy", "value": -2.085785315207367}
                    ]}, {
                    "groupName": "Orthogonal Amplitude",
                    "features": [
                        {"name": "energy", "value": 0.03983626864907182},
                        {"name": "contrast", "value": 3.0659214893373505},
                        {"name": "correlation", "value": 0.2112464974943742},
                        {"name": "homogeneity", "value": 0.5348746336108793},
                        {"name": "variance", "value": 1.9718398060765328},
                        {"name": "entropy", "value": 4.9205670731404485},
                        {"name": "invDiffMoment", "value": 0.48108217961667205},
                        {"name": "sumAvg", "value": 4.315417444651909},
                        {"name": "sumVar", "value": 4.776962343897736},
                        {"name": "sumEntropy", "value": -3.1562604932164593},
                        {"name": "diffAvg", "value": 1.3603936977835425},
                        {"name": "diffVar", "value": 4.776962343897736},
                        {"name": "diffEntropy", "value": -2.092537449914942}
                    ]}, {
                    "groupName": "Main Amplitude Angle",
                    "features": [
                        {"name": "energy", "value": 135},
                        {"name": "contrast", "value": 15},
                        {"name": "correlation", "value": 90},
                        {"name": "homogeneity", "value": 135},
                        {"name": "variance", "value": 15},
                        {"name": "entropy", "value": 15},
                        {"name": "invDiffMoment", "value": 135},
                        {"name": "sumAvg", "value": 165},
                        {"name": "sumVar", "value": 90},
                        {"name": "sumEntropy", "value": 15},
                        {"name": "diffAvg", "value": 15},
                        {"name": "diffVar", "value": 90},
                        {"name": "diffEntropy", "value": 90}
                    ]}, {
                    "groupName": "Main Amplitude",
                    "features": [
                        {"name": "energy", "value": 0.039841821261378654},
                        {"name": "contrast", "value": 3.1188642925890284},
                        {"name": "correlation", "value": 0.2270645196784687},
                        {"name": "homogeneity", "value": 0.5362759156074851},
                        {"name": "variance", "value": 1.9726618619739718},
                        {"name": "entropy", "value": 4.9276945722110215},
                        {"name": "invDiffMoment", "value": 0.4821950471986764},
                        {"name": "sumAvg", "value": 4.334615384615386},
                        {"name": "sumVar", "value": 4.83720552096775},
                        {"name": "sumEntropy", "value": -3.1503788480258574},
                        {"name": "diffAvg", "value": 1.3732242540904716},
                        {"name": "diffVar", "value": 4.83720552096775},
                        {"name": "diffEntropy", "value": -2.076640281332668}
                    ]}
            ]}
    ];

})();
