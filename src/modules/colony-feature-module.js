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

        // We want this module to have the click handler as much as possible.
        this.viewer.setClickHandler(_this);
        this.viewer.addHandler("click-handler-changed", function(event) {
            if (!event.module) {
                _this.viewer.setClickHandler(_this);
            }
        });
    };

    // Register itself
    $$.Module.MODULES[name] = $$.ColonyFeatureModule;

    $.extend($$.ColonyFeatureModule.prototype, $$.Module.prototype, {
        supportLayer: function(layer) {
            return !!layer.colonyFeatures;
        },
        clickHandler: function(event) {
            if (this.isEnabled) {
                showColonyFeatures(this, event.position);
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

    var featuresGroupHtml = ['{{#each featuresGroup}}',
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
        '{{/each}}'].join('');

    var dialogContentHtmlWithAnnotation = ['<div id="wdzt-annotation-container">',
        '    <div id="wdzt-annotation-label-container">',
        '        <label for="wdzt-annotation-textarea-{{hash}}" id="wdzt-annotation-label-{{hash}}">Annotation</label>',
        '        <div id="wdzt-annotation-saved-{{hash}}" class="wdzt-annotation-saved"> <strong> Saved </strong> ',
        '        </div>',
        '    </div>',
//            '    <div id="wdzt-annotation-textarea-container">',
//            '        <textarea rows="5" id="wdzt-annotation-textarea-{{hash}}" class="wdzt-annotation-textarea" placeholder="Enter some text here ..."></textarea>',
//            '    </div>',
        '    <div class="wdzt-tags-container">',
        '        <div class="wdzt-tags-head" id="wdzt-tags-head-{{hash}}">Tags :&nbsp;&nbsp;',
        '            <div class="wdzt-tags-list" id="wdzt-tags-list-{{hash}}"></div>',
        '        </div>',
        '        <div class="wdzt-tags-menu" id="wdzt-tags-menu-{{hash}}"></div>',
        '    </div>',
        '</div>'].join('') + featuresGroupHtml;



    var featuresGroupTemplate = Handlebars.compile(featuresGroupHtml);

    var dialogContentTemplateWithAnnotation = Handlebars.compile(dialogContentHtmlWithAnnotation);
    var dialogContentTemplate = Handlebars.compile(featuresGroupHtml);



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
        var layer = settings.layer;


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
            var boundBoxRect = viewport.imageToViewportRectangle(boundBox.x, boundBox.y, boundBox.width, boundBox.height);
            var $boundBoxOverlay = $("<div/>");
            $boundBoxOverlay.attr("id", "wdzt-features-overlay-boundbox-colony-" + hash);
            $boundBoxOverlay.css({
                border: "2px solid " + color
            });
            osd.addOverlay($boundBoxOverlay.get(0), boundBoxRect);

            var centroid = result.centroid;
            var centroidRect = viewport.imageToViewportRectangle(centroid.x, centroid.y, 1, 1);
            var $centroidOverlay = $("<div/>");
            $centroidOverlay.attr("id", "wdzt-features-overlay-centroid-colony-" + hash);
            $centroidOverlay.css({
                backgroundColor: color
            });
            osd.addOverlay($centroidOverlay.get(0), centroidRect);



            var $dialog = $("<div/>");
            $dialog.attr("id", "wdzt-features-dialog-colony-" + hash);
            $dialog.attr("title", "Colony " + colony);

            var content;

            if (!_this.disableAnnotations && settings.annotations) {
                content = dialogContentTemplateWithAnnotation({
                    featuresGroup: result.featuresGroup,
                    hash: hash
                });
            } else {
                content = dialogContentTemplate({
                    featuresGroup: result.featuresGroup,
                    hash: hash
                });
            }


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
                        "?dataset=" + settings.dataset +
                        "&colony=" + colony +
                        "\">lineage view</a>");
            }

            if (settings.dataset && settings.annotations &&
                    settings.annotations.viewUrl) {
                links.push("<a href=\"" + settings.annotations.viewUrl +
                        "?dataset=" + settings.dataset +
                        "&colony=" + colony +
                        "&frame=" + frame +
                        "\">annotation view</a>");
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
                height: 300,
                close: closeHandler
            });


            var ajaxTimer;


            var tags = "Heterogeneous,Homogeneous,Dark";
            var tagSetting = "";

            var $tagMenu = $("#wdzt-tags-menu-" + hash);

            var tagOutput;

            function toTree() {
                var tagArray = tags.split(',');
                var settingArray;

                if (tagSetting) {
                    settingArray = tagSetting.split(',');
                }

                var nodes = {};

                var $root = $("<ul/>");

                tagArray.forEach(function(tag) {

                    var checked = false;

                    if (settingArray) {
                        if ($.inArray(tag, settingArray) !== -1) {
                            checked = true;
                        }
                    }

                    var $ele;

                    var index = tag.lastIndexOf('/');

                    if (index === -1) {
                        $ele = $("<li> <div style=\"display:block\"><input type=\"radio\" name=\"gfp_label\" value=\"" + tag + "\" " + ((checked) ? "checked" : "") + " ><span>" + tag + "</span> </div> </li>");
                        nodes[tag] = $ele;
                        $root.append($ele);

                    } else {
                        var sub = tag.substring(0, index);
                        $ele = $("<li> <div style=\"display:block\"><input type=\"radio\" name=\"gfp_label\" value=\"" + tag + "\" " + ((checked) ? "checked" : "") + " ><span>" + tag.substring(index + 1) + "</span> </div> </li>");

                        nodes[tag] = $ele;

                        if (nodes[sub]) {
                            if (nodes[sub].find("ul").length === 0) {
                                nodes[sub].append($("<ul />"));
                            }
                            nodes[sub].find("ul").eq(0).append($ele);

                        }
                    }

                });

                return $root;
            }

            function showTags() {
                tagOutput = "";

                $("#wdzt-tags-list-" + hash).empty();
                $("#wdzt-tags-menu-" + hash + " :checked").each(function() {
                    if (this.checked) {
                        var $txt = $("<span>" + $(this).val() + "&nbsp;</span>");
                        $("#wdzt-tags-list-" + hash).append($txt);

                        if (tagOutput === "") {
                            tagOutput += $(this).val();
                        } else {
                            tagOutput += "," + $(this).val();
                        }
                    }
                });

                return tagOutput;

            }

            function pushToServer() {
                if (settings.annotations.serviceUrl) {
                    var annotation_service_url = settings.annotations.serviceUrl;
                    var txt = $('#wdzt-annotation-textarea-' + hash).val();

                    var annotation = {
                        "data": txt,
                        "tags": tagOutput,
                        "colonyFrame": {"id": result.id},
                        "layer": {"name": layer}
                    };

                    if (ajaxTimer) {
                        clearTimeout(ajaxTimer);
                    }

                    ajaxTimer = setTimeout(function() {
                        $.ajax({
                            url: annotation_service_url + "/",
                            type: "PUT",
                            contentType: "application/json",
                            data: JSON.stringify(annotation),
                            success: function() {
                                $("#wdzt-annotation-saved-" + hash).show();
                                $("#wdzt-annotation-saved-" + hash).fadeOut(3000);
                            }
                        });

                    }, 500);
                }
            }

            $("#wdzt-tags-head-" + hash).click(function() {

                if ($tagMenu.is(":visible")) {
                    $tagMenu.hide();
                } else {
                    $tagMenu.show();
                }

            });

            function initTags() {
                $tagMenu.empty();
                $tagMenu.append(toTree());
                $tagMenu.hide();
                showTags();

                $("#wdzt-tags-menu-" + hash + " input").click(function() {
                    showTags();
                    pushToServer();
                });

            }

            $('#wdzt-annotation-textarea-' + hash).on('change keyup paste', function() {
                pushToServer();
            });

            $('#wdzt-annotation-textarea-' + hash).ready(function() {

                if (!_this.disableAnnotations && settings.annotations.serviceUrl) {
                    var getAnnotationUrl = settings.annotations.serviceUrl +
                            "/colonyframe/" + result.id + "/layer/" + layer;

                    $.getJSON(getAnnotationUrl, function(annt) {

                        if (annt) {
                            $('#wdzt-annotation-textarea-' + hash).val(annt.data);
                            if (annt.tags) {
                                tagSetting = annt.tags;
                            }
                        } else {
                            tagSetting = "";
                        }

                        tagOutput = tagSetting;
                        initTags();

                    });

                }
            });


            // Keep dialogs when switching from/to fullscreen
            var dialogContainer = $(".wdzt-features-dialog-colony-" + hash);
            function preFullPageHandler() {
                dialogContainer.detach();
            }
            function fullPageHandler() {
                dialogContainer.appendTo(document.body);
            }
            function resizeHandler() {
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
            }
            viewer.addHandler("pre-full-page", preFullPageHandler);
            viewer.addHandler("full-page", fullPageHandler);
            osd.addHandler("resize", resizeHandler);

            $dialog.siblings(".ui-widget-header").css("background-color", color);
            function movieFrameChangedHandler() {
                $dialog.dialogHtmlTitle("close");
                $dialog.remove();
            }
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
