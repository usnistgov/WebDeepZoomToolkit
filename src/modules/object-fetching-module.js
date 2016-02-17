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

    var name = "ObjectFetchingModule";

    $$.ObjectFetchingModule = function(options) {

        this.name = name;
        this.title = "Object Fetching";

        $.extend(true, this, {
            hash: $$.guid()
        }, options);

        $$.Module.apply(this, [options]);

        var _this = this;
        this.timer = null;
        this.obj_array = [];
        this.layer_selection = [];

        this.containerId ="wdzt-object-fetching-container-" + this.hash;
        this.activeCheckboxId = "wdzt-object-fetching-active-" + this.hash;
        this.downloadBtnId = "wdzt-object-fetching-btn-" + this.hash;
        this.tableId = "wdzt-object-fetching-table-" + this.hash;

        this.$container.html(
            Handlebars.compile([
            '<div id="{{containerId}}">',
            '    <div>',
            '        <input type="checkbox" id="{{activeCheckboxId}}" />',
            '        <label for="{{activeCheckboxId}}">Active Object Fetching</label>',
            '    </div>',
            '    <div id="wdzt-object-fetching-table-container-{{hash}}" >',
            '        <fieldset>',
            '            <legend>CID(Colony ID), FID(Frame IDs)</legend>',
            '            <table id="{{tableId}}" class="wdzt-object-fetching-table"></table>',
            '        </fieldset>',
            '    </div>',
            '    <div id="wdzt-object-fetching-layer-container-{{hash}}" class="wdzt-object-fetching-layer-container">',
            '        <fieldset>',
            '            <legend>Layers to fetch</legend>',
            '            <div class="wdzt-table-layout wdzt-object-fetching-layers">',
            '                <div class="wdzt-row-layout">',
            '                   <label for="" class="wdzt-cell-layout">Phase Contrast</label><input type="checkbox" id="" class="wdzt-cell-layout" value="phase_contrast" />',
            '                </div>',
            '                <div class="wdzt-row-layout">',
            '                   <label for="" class="wdzt-cell-layout">Corrected GFP</label><input type="checkbox" id="" class="wdzt-cell-layout" value="corrected_gfp" />',
            '                </div>',
            '                <div class="wdzt-row-layout">',
            '                   <label for="" class="wdzt-cell-layout">Masks</label><input type="checkbox" id="" class="wdzt-cell-layout" value="masks" />',
            '                </div>',
            '            </div>',
            '        </fieldset>',
            '    </div>',
            '    <div>',
            '        <button type="button" id="{{downloadBtnId}}">Fetch</button>',
            '    </div>',
            '</div>'
        ].join(''))({
            hash: this.hash,
            containerId: this.containerId,
            activeCheckboxId: this.activeCheckboxId,
            downloadBtnId: this.downloadBtnId,
            tableId: this.tableId
        }));

        $(".wdzt-object-fetching-layers :checkbox").click(function() {
            _this.layer_selection = [];
            $(".wdzt-object-fetching-layers :checkbox").each(function() {
                var checkbox = $(this);
                if(checkbox.is(':checked')){
                    _this.layer_selection.push(checkbox.attr("value"));
                }
            });
        });

        $("#"+this.activeCheckboxId).click( function(){
            if( $(this).is(':checked') ){
                _this.viewer.setClickHandler(_this);
            }else {
                removeAllBoundingBoxes(_this);
                $(".wdzt-object-fetching-table").empty();
                $(".wdzt-object-fetching-layers :checkbox").attr("checked", false);
                _this.viewer.setClickHandler(null);
            }
        });

        $("#"+this.downloadBtnId).click( function(){
            if(_this.obj_array === [] || _this.layer_selection ===[]){
                return;
            }

            var ids = "";

            var data = [];
            var requests = [];

            _this.obj_array.forEach(function(obj){
                var url = "/deepzoomweb/api/data/colonyfeature/colonyframe/find?dataset="+ obj.dataset +"&colony="+obj.cid+"&frame="+obj.selectedFrame;

                var req = $.getJSON(url, function( objs ) {
                    objs.forEach(function(obj){
                        data.push(obj);
                    });

                });

                requests.push(req);

            });

            $.when.apply($, requests).done(function() {

                data.forEach(function(obj){
                    ids = ids + obj.id + "+";
                });

                if(ids !== ""){
                    ids = ids.slice(0,-1);
                }

                var layer = "";

                _this.layer_selection.forEach(function(obj){
                    layer += obj+"+";
                });

                if(layer !== ""){
                    layer = layer.slice(0,-1);
                }

                var url = "/deepzoomweb/api/image/fetching/colonyframe?ids="+ids+"&layer="+layer;

                if(ids !== ""){
                    $.fileDownload(url, {});
                }

            });
        });

    };

    // Register itself
    $$.Module.MODULES[name] = $$.ObjectFetchingModule;

    $.extend($$.ObjectFetchingModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 52;
        },
        supportLayer: function(layer) {
            return !!layer.colonyFeatures;
        },
        clickHandler: function(event) {
            if (this.isEnabled) {
                handler(this, event.position);
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

    function updateObjArray(_this){
        _this.obj_array.forEach(function(obj){
            var output = obj.cid;
            output += "  " + obj.selectedFrame;
        });
    }


    function deferExecute(_this, callback){
        if(_this.timer !== null){
            clearTimeout(_this.timer);
        }
        _this.timer = setTimeout(callback, 1500, _this);
    }



    function showTable(_this){
        $("#"+ _this.tableId).empty();

        _this.obj_array.forEach(function(obj){
            var $row = $("<tr/>");
            $row.append($('<td><span value="' + obj.id + '" title="remove" class="wdzt-object-fetching-remove-'+_this.hash+'" >X</span></td><td>CID:' + obj.cid + '</td><td>FID:<div id="wdzt-distance-measurement-birthdeathtime-'+_this.hash+'-' + obj.id + '" class="wdzt-object-fetching-editableframe" value="' + obj.id +'"  contenteditable="true">' + obj.selectedFrame + '</div></td>'));
            $("#"+ _this.tableId).append($row);
        });



        $(".wdzt-object-fetching-editableframe").keyup(function(){
            var id = parseInt( $(this).attr('value') );
            var frames = $(this).text();
            _this.obj_array.forEach(function(obj){
                if(obj.id === id ){
                    obj.selectedFrame = frames;
                }
            });
            deferExecute(_this, updateObjArray);

        });

        $(".wdzt-object-fetching-remove-"+_this.hash).click(function () {
            var id = $(this).attr('value');

            removeBoundingBox(_this,id);

            $(this).closest('tr').remove();

        });
    }

    function removeAllBoundingBoxes(_this){
        var objs = _this.obj_array;

        for (var i = objs.length - 1 ; i>=0 ; i--) {
            removeBoundingBox(_this, objs[i].id);
        }
    }


    function removeBoundingBox(_this, id){

        var objs = _this.obj_array;

        for (var i = 0 ; i <  objs.length ; i++) {
            if(objs[i].id === parseInt(id)) {
                break;
            }
        }

        if(i !== objs.length){
            var $boundBoxOverlay = objs[i].bboxUI;
            var viewer = _this.viewer;
            var movie = viewer.osdMovie;
            var osd = movie.viewer;
            osd.removeOverlay($boundBoxOverlay.get(0));
            $boundBoxOverlay.remove();

            objs.splice(i,1);
        }



    }

    function showBoundingBox(_this, position){

        var viewer = _this.viewer;
        var movie = viewer.osdMovie;
        var frame = movie.getCurrentFrame();
        var imagePosition = movie.viewer.viewport.viewerElementToImageCoordinates(position);
        var x = Math.round(imagePosition.x);
        var y = Math.round(imagePosition.y);

        var settings = viewer.selectedLayer.colonyFeatures;
        // var layer = settings.layer;

        var obj_array = _this.obj_array;

        function onSuccess(result) {

            var colony = result.colony;
            var hash = result.id + "-" + _this.hash;
            if ($("#wdzt-object-fetching-overlay-boundbox-colony-" + hash).length) {
                return;
            }
            var osd = movie.viewer;
            var viewport = osd.viewport;
            var color = $$.ColonyHelper.getColonyColor(colony);


            var boundBox = result.boundingBox;
            var boundBoxRect = viewport.imageToViewportRectangle(boundBox.x, boundBox.y, boundBox.width, boundBox.height);
            var $boundBoxOverlay = $("<div/>");
            $boundBoxOverlay.attr("id", "wdzt-object-fetching-overlay-boundbox-colony-" + hash);
            $boundBoxOverlay.css({
                border: "2px solid " + color
            });
            osd.addOverlay($boundBoxOverlay.get(0), boundBoxRect);


            $.getJSON( "/deepzoomweb/api/data/colonyfeature/colonyframe/"+result.id+"/frames", function( data ) {
                //$('#wdzt-distance-measurement-birthdeathtime-'+_this.hash+'-' + obj.id).text(data.birth + "-" + data.death);
                var obj = {id: result.id, cid: result.colony, selectedFrame: (data.birth + "-" + data.death), boudingBox: result.boundingBox, bboxUI: $boundBoxOverlay, dataset: result.dataset.name} ;
                obj_array.push(obj);
                showTable(_this);
            });


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
                var message = "Cannot get colony features for frame " + frame + ", position " + x + "," + y + ".";
                if (request.response) {
                    message += "<br>" + request.response;
                }
                viewer.displayWarning(message);
            }
        });
    }



    function handler(_this, position){
        showBoundingBox(_this, position);
    }


}(WDZT));
