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

    $$.TransitionsTreeSelector = function(options) {

        $.extend(true, this, {
            hash: $$.guid(),
            selectionChangedCallBack: function() {
            },
            onReady: function() {
            }
        }, options);

        var selectedTransitions = {};
        var xray = $$.XRay.getInstance(this.xrayUrl, this.onReady);
        var _this = this;

        var elementInputEltId = "wdzt-transitions-tree-selector-input-" + this.hash;
        var transitionsTreeSelectorTreeId = "wdzt-transitions-tree-selector-tree-" +
                this.hash;

        this.$element.html(
                "<label for=\"" + elementInputEltId + "\">Element</label>" +
                "<input id=\"" + elementInputEltId + "\" type=\"text\"/>" +
                "<div id=\"" + transitionsTreeSelectorTreeId + "\"></div>");

        var $elementInputElt = $("#" + elementInputEltId);
        var $treeElt = $("#" + transitionsTreeSelectorTreeId);
        $treeElt.css("overflow", "auto");

        $elementInputElt.keyup(function() {
            $treeElt.empty();
            var element = $elementInputElt.val();

            var families = xray.getFamiliesOfElement(element);
            if (!families) {
                return;
            }
            selectedTransitions[element] = selectedTransitions[element] || [];
            var eltSelectedTransitions = selectedTransitions[element];

            var $topDiv = $("<div/>");

            var $elementUl = $("<ul/>");
            var $elementLi = $("<li/>");
            var $elementTitle = $("<input type=\"checkbox\"><span>" + element +
                    "</span>");
            $elementLi.append($elementTitle);

            var $familiesUl = $("<ul/>");
            var $transitionUl;

            // Keep outside of loop for performance
            function generateTransitionLine(transition) {
                var $transitionLi = $("<li><input type=\"checkbox\"" +
                        " class=\"wdzt-transition-name\"><span>" +
                        transition.name + "</span></li>");
                $transitionUl.append($transitionLi);
            }

            for (var familyName in families) {
                var $familyLi = $("<li/>");
                var $familyTitle = $("<input type=\"checkbox\"><span>" +
                        familyName + "</span>");
                $familyLi.append($familyTitle);

                $transitionUl = $("<ul/>");
                families[familyName].forEach(generateTransitionLine);
                $familyLi.append($transitionUl);
                $familiesUl.append($familyLi);
            }
            $elementLi.append($familiesUl);
            $elementUl.append($elementLi);
            $topDiv.append($elementUl);
            $treeElt.append($topDiv);
            var $tree = $treeElt.children("div");
            $tree.tree({
                onCheck: {
                    ancestors: "checkIfFull",
                    descendants: "check"
                },
                onUncheck: {
                    ancestors: "uncheck"
                }
            });

            $(".wdzt-transition-name").each(function() {
                var transitionName = $(this).next().text();
                var transition = xray.getTransitionByName(transitionName);
                var selected = $.inArray(transition, eltSelectedTransitions) !== -1;
                if (selected) {
                    $tree.tree("check", this);
                }
            });

            $(".wdzt-transition-name").change(function() {
                var transitionName = $(this).next().text();
                var transition = xray.getTransitionByName(transitionName);
                if ($(this).prop("checked")) {
                    eltSelectedTransitions.push(transition);
                    _this.selectionChangedCallBack(transition, true);
                } else {
                    eltSelectedTransitions.splice(
                            eltSelectedTransitions.indexOf(transition), 1);
                    _this.selectionChangedCallBack(transition, false);
                }
            });
        });

        this.getSelectedTransitions = function() {
            var result = [];
            for (var element in selectedTransitions) {
                var transitionsOfElt = selectedTransitions[element];
                result.push.apply(result, transitionsOfElt);
            }
            return result;
        };
    };

}(WDZT));
