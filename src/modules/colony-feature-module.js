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

    var name = "ColonyFeatureModule";

    $$.ColonyFeatureModule = function(options) {

        this.name = name;
        // Module with no UI
        this.title = null;

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;

        this.isEnabled = false;

        this.viewer.osd.addViewerInputHook({
            hooks: [{
                    tracker: "viewer",
                    handler: "clickHandler",
                    hookHandler: function(event) {
                        event.preventDefaultAction = true;
                        if (event.quick && _this.isEnabled) {
                            showColonyFeatures(_this, event.position);
                        }
                    }
                }
            ]
        });
    };

    // Register itself
    $$.Module.MODULES[name] = $$.ColonyFeatureModule;

    $.extend($$.ColonyFeatureModule.prototype, $$.Module.prototype, {
        supportLayer: function(layer) {
            return !!layer.colonyFeatures;
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

    var featuresGroupTemplate = Handlebars.compile([
        '{{#each featuresGroup}}',
        '<dl>',
        '    <dt>',
        '        <span class="ui-icon ui-icon-triangle-1-s"></span>',
        '        {{groupName}}',
        '    </dt>',
        '    <dd>',
        '        {{#if features}}',
        '        <table>',
        '            <tr>',
        '                <th>Feature</th>',
        '                <th>Value</th>',
        '            </tr>',
        '            {{#each features}}',
        '            <tr>',
        '                <td>{{name}}</td>',
        '                <td>{{featureValueFormatter value}}</td>',
        '            </tr>',
        '            {{/each}}',
        '        </table>',
        '        {{/if}}',
        '        {{#if featuresGroup}}',
        '        {{{featuresGroupHelper this}}}',
        '        {{/if}}',
        '    </dd>',
        '</dl>',
        '{{/each}}'
    ].join(''));

    Handlebars.registerHelper('featuresGroupHelper', function(featuresGroup) {
        return featuresGroupTemplate(featuresGroup);
    });
    Handlebars.registerHelper('featureValueFormatter', function(value) {
        var f = parseFloat(value);
        var i = parseInt(value);
        if (f === i) {
            return i.toString();
        }
        return f.toFixed(2);
    });

    function showColonyFeatures(_this, position) {
        var viewer = _this.viewer;
        var movie = viewer.osdMovie;
        var frame = movie.getCurrentFrame();
        var imagePosition = movie.viewer.viewport.viewerElementToImageCoordinates(
                position);
        var x = Math.round(imagePosition.x);
        var y = Math.round(imagePosition.y);

        var settings = viewer.selectedLayer.colonyFeatures;

        function onSuccess(result) {
            var colony = result.colony;
            var hash = colony + "-" + _this.hash;
            if ($("#wdzt-features-overlay-boundbox-colony-" + hash).length) {
                return;
            }
            var osd = movie.viewer;
            var viewport = osd.viewport;
            var color = $$.ColonyHelper.getColonyColor(colony);

            var boundBox = result.boundingBox;
            var boundBoxRect = viewport.imageToViewportRectangle(
                    boundBox.x, boundBox.y, boundBox.width, boundBox.height);
            var $boundBoxOverlay = $("<div/>");
            $boundBoxOverlay.attr("id",
                    "wdzt-features-overlay-boundbox-colony-" + hash);
            $boundBoxOverlay.css({
                border: "2px solid " + color
            });
            osd.addOverlay($boundBoxOverlay.get(0), boundBoxRect);

            var centroid = result.centroid;
            var centroidRect = viewport.imageToViewportRectangle(
                    centroid.x, centroid.y, 1, 1);
            var $centroidOverlay = $("<div/>");
            $centroidOverlay.attr("id",
                    "wdzt-features-overlay-centroid-colony-" + hash);
            $centroidOverlay.css({
                backgroundColor: color
            });
            osd.addOverlay($centroidOverlay.get(0), centroidRect);

            var $dialog = $("<div/>");
            $dialog.attr("id", "wdzt-features-dialog-colony-" + hash);
            $dialog.attr("title", "Colony " + colony);
            var content = featuresGroupTemplate({
                featuresGroup: result.featuresGroup
            });
            $dialog.html(content);
            $dialog.find("dt").click(function() {
                var $dd = $(this).next("dd");
                if ($dd.is(":hidden")) {
                    $dd.show();
                    $(this).find("span").attr("class", "ui-icon ui-icon-triangle-1-s");
                } else {
                    $dd.hide();
                    $(this).find("span").attr("class", "ui-icon ui-icon-triangle-1-e");
                }
            });

            // Build the title with eventual links to other views.
            var dialogTitle = "Colony " + colony;
            var links = [];
            if (settings.featuresUrl && settings.dataset && settings.layer) {
                links.push("<a href=\"" + settings.featuresUrl +
                        "?dataset=" + settings.dataset +
                        "&layer=" + settings.layer +
                        "&colony=" + colony +
                        "&frame=" + frame +
                        "\">data view</a>");
            }
            if (settings.lineageUrl && settings.dataset) {
                links.push("<a href=\"" + settings.lineageUrl +
                        "?data=" + settings.dataset +
                        "&colony=" + colony +
                        "\">lineage view</a>");
            }
            if (links.length !== 0) {
                dialogTitle += " (" + links.join(", ") + ")";
            }

            function closeHandler() {
                osd.removeOverlay($boundBoxOverlay.get(0));
                $boundBoxOverlay.remove();
                osd.removeOverlay($centroidOverlay.get(0));
                $centroidOverlay.remove();
                $dialog.remove();
                viewer.removeHandler("pre-full-page", preFullPageHandler);
                viewer.removeHandler("full-page", fullPageHandler);
                viewer.removeHandler("resize", resizeHandler);
                movie.removeHandler("movie-change", movieFrameChangedHandler);
                movie.removeHandler("frame-change", movieFrameChangedHandler);
            }

            $dialog.dialogHtmlTitle({
                title: dialogTitle,
                dialogClass: "wdzt-features-dialog wdzt-features-dialog-colony-" + hash,
                minWidth: 310,
                minHeight: 75,
                height: $(viewer.osdContainer).height() / 4,
                close: closeHandler
            });

            // Keep dialogs when switching from/to fullscreen
            var dialogContainer = $(".wdzt-features-dialog-colony-" + hash);
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
            viewer.addHandler("pre-full-page", preFullPageHandler);
            viewer.addHandler("full-page", fullPageHandler);
            osd.addHandler("resize", resizeHandler);

            $dialog.siblings(".ui-widget-header").css("background-color", color);
            var movieFrameChangedHandler = function() {
                $dialog.dialogHtmlTitle("close");
                $dialog.remove();
            };
            movie.addHandler("movie-change", movieFrameChangedHandler);
            movie.addHandler("frame-change", movieFrameChangedHandler);
        }

        $$.ColonyHelper.getFeatures({
            serviceUrl: settings.serviceUrl,
            dataset: settings.dataset,
            layer: settings.layer,
            frame: frame,
            x: x,
            y: y,
            onSuccess: onSuccess,
            onError: function(request) {
                var message = "Cannot get colony features for frame " + frame +
                        ", position " + x + "," + y + ".";
                if (request.response) {
                    message += "<br>" + request.response;
                }
                viewer.displayWarning(message);
            }
        });
    }

}(WDZT));
