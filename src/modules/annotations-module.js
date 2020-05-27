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


/**
 * This module is organized following the MVC pattern and using the component approach.
 * Subcomponents are in charge of part of the UI interactions.
 * Internally it relies on creating singleton through constructors which allow to control methods visibility.
 * It departs from other modules implementation where adhoc object initialization and prototype extension are used.
 * A factory method is used to initialized all objects so dependencies are clearly defined.
 */

 // TODO performance of render_all. Is that the only option? Caching?
 // Refactor now that we have full understanding of the problem.
 // change save to ok / add a cancel button
 // check if we can cancel object creation if they go beyond the image limit


(function($$) {

    'use strict';

    var name = "AnnotationsModule";
    var WDZTViewer;

    $$.AnnotationsModule = function(options) {
        //Module registration boilerplate
        this.name = name;
        WDZTViewer = options.viewer;
        this.title = "Annotations (beta)";
        $$.Module.apply(this, [options]);
        init(this);
    };


    // Register itself to th general module framework.
    $$.Module.MODULES[name] = $$.AnnotationsModule;

    //Add the module capabilities
    $.extend($$.AnnotationsModule.prototype, $$.Module.prototype, {
        getOrderIndex: function() {
            return 81; //after distance measurement module
        },
        supportLayer: function(layer) {
            return true;
        },
        clickHandler: function(event) {
            if (this.isEnabled) {
                clickHandler(this, event.position);
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
        },

        yo: function(){
            console.log('yo');
        }
    });

    //Define helper functions for this module 
    $.extend($$.AnnotationsModule, {

        getRgbaFromColorAndOpacity: function(hex_color, opacity) {
                var color = new fabric.Color(hex_color);
                var source = color.getSource();
                source[3] = 0.5;
                color.setSource(source);
                return color.toRgba();
        }
    });

    function init(module) {
        setTimeout(_init,1000, module);
    }

    function _init(module){
        var WDZTViewer = module.viewer; //the WDZT wrapper is our entry point to osd.
        var leftMenu = module.$container; //wdzt-menu-content div (leftmenu)
        var rootDiv =WDZTViewer.$container; //wdzt-container div (rootDiv)
        
        var movie = WDZTViewer.osdMovie; //movie contains the underlying frames we are annotating.
        var osdViewer = WDZTViewer.osd; // underlying openseadragon viewer needs to be manipulated.

        osdViewer.viewport.fitHorizontally();
        osdViewer.viewport.fitVertically();

        //display : we add another layer to opendragon to draw on a fabric canvas.
        var overlay = osdViewer.fabricjsOverlay({ scale: 100 });
        var canvas = overlay.fabricCanvas('c', { selection: true });


        var canvasUtils = new CanvasUtils(osdViewer);
        // Model Backend
        var persistence = new Persistence(movie, canvas); 

        
        var dialogBox = AnnotationFactory(canvas, $('body'), osdViewer, 'SingleChoice'); 

        // Main Controller : handle view events and interaction with the persistence layer.
        var controls = new CanvasController(overlay, persistence, movie, canvas, rootDiv, dialogBox, canvasUtils, leftMenu);


        console.log("number of frames", movie.getNumberOfFrames());

        return controls;
    }

    /*
     * AnnotatedObject Factory
     * @param {fabric.Object} [o] 
     * @return {fabric.Object} an decorated object which can contain annotation labels.
     */
    function AnnotatedObject(o) {
        console.log('adding wdzt info...');
        o.wdzt = {
            shape: o.shape, //CAUTION needs to be defined at construction.
            color: o.fill,
            id: $$.guid(),
            // absolute: true to get coordinates relative to the image / calculate : false get .oCoords
            boundingBox: o.getBoundingRect(true,false), 
            labels: {} //dependent on annotationUI implementation
        };
        return o;
    }


    var CanvasUtils = function(viewer) {
            
            this.objectWithinBounds = function(o) {
                    var topLeft = viewer.viewport.viewportToImageCoordinates(new OpenSeadragon.Point(0,0));
                    var height = viewer.world.getItemAt(0).normHeight; // width-height-ratio
                    var bottomRight = viewer.viewport.viewportToImageCoordinates(new OpenSeadragon.Point(1, height));
                    return o.isContainedWithinRect(topLeft, bottomRight, true, true);
            }
    };

    function CanvasController(overlay, persistence, movie, canvas, rootDiv, dialogBox, canvasUtils, leftMenu) {

        var viewer = WDZTViewer.osd;
        var osdViewer = viewer;

        //in active mode, zoom and drag openseadragon moves are allowed.
        var trackerActive = new OpenSeadragon.MouseTracker({
            element: osdViewer.canvas, //not the fabric canvas
            scrollHandler: onCanvasScroll,
            dragHandler: onCanvasDrag,
         //   clickHandler: onCanvasClick
        });

        //in editing mode, no drag in allowed (would compete with click events)
        var trackerEdit = new OpenSeadragon.MouseTracker({
            element: osdViewer.canvas,
            scrollHandler: onCanvasScroll,
            pressHandler: function(e){canvas._handleEvent(e.originalEvent, 'down')},
            moveHandler: function(e){canvas._handleEvent(e.originalEvent, 'move')},
            releaseHandler: function(e){canvas._handleEvent(e.originalEvent, 'up')}
        });

        function onCanvasDrag( event ) {

            $('#imageDialog').hide();

            var gestureSettings;

            if ( !event.preventDefaultAction && osdViewer.viewport ) {
                gestureSettings = osdViewer.gestureSettingsByDeviceType( event.pointerType );
                if( !osdViewer.panHorizontal ){
                    event.delta.x = 0;
                }
                if( !osdViewer.panVertical ){
                    event.delta.y = 0;
                }
                osdViewer.viewport.panBy( osdViewer.viewport.deltaPointsFromPixels( event.delta.negate() ), gestureSettings.flickEnabled );
                if( osdViewer.constrainDuringPan ){
                    osdViewer.viewport.applyConstraints();
                }
            }
            /**
             * Raised when a mouse or touch drag operation occurs on the {@link OpenSeadragon.Viewer#canvas} element.
             *
             * @event canvas-drag
             * @memberof OpenSeadragon.Viewer
             * @type {object}
             * @property {OpenSeadragon.Viewer} eventSource - A reference to the Viewer which raised this event.
             * @property {OpenSeadragon.MouseTracker} tracker - A reference to the MouseTracker which originated this event.
             * @property {OpenSeadragon.Point} position - The position of the event relative to the tracked element.
             * @property {OpenSeadragon.Point} delta - The x,y components of the difference between start drag and end drag.
             * @property {Number} speed - Current computed speed, in pixels per second.
             * @property {Number} direction - Current computed direction, expressed as an angle counterclockwise relative to the positive X axis (-pi to pi, in radians). Only valid if speed > 0.
             * @property {Boolean} shift - True if the shift key was pressed during this event.
             * @property {Object} originalEvent - The original DOM event.
             * @property {?Object} userData - Arbitrary subscriber-defined object.
             */
            canvas.fire( 'canvas-drag', {
                tracker: event.eventSource,
                position: event.position,
                delta: event.delta,
                speed: event.speed,
                direction: event.direction,
                shift: event.shift,
                originalEvent: event.originalEvent
            });
        }

        function onCanvasScroll( event ) {

            var osdViewer = WDZTViewer.osd;

            var zoomPerScroll = 1.2;
            var factor = Math.pow(zoomPerScroll, event.scroll );
            osdViewer.viewport.zoomBy(
                factor,
                osdViewer.viewport.pointFromPixel( event.position, true )
            );
            osdViewer.viewport.applyConstraints();
            /**
             * Raised when a scroll event occurs on the {@link OpenSeadragon.Viewer#canvas} element (mouse wheel).
             *
             * @event canvas-scroll
             * @memberof OpenSeadragon.VieweronCanvasScroll
             * @type {object}
             * @property {OpenSeadragon.Viewer} eventSource - A reference to the Viewer which raised this event.
             * @property {OpenSeadragon.MouseTracker} tracker - A reference to the MouseTracker which originated this event.
             * @property {OpenSeadragon.Point} position - The position of the event relative to the tracked element.
             * @property {Number} scroll - The scroll delta for the event.
             * @property {Boolean} shift - True if the shift key was pressed during this event.
             * @property {Object} originalEvent - The original DOM event.
             * @property {?Object} userData - Arbitrary subscriber-defined object.
             */
            canvas.fire( 'canvas-scroll', {
                tracker: event.eventSource,
                position: event.position,
                scroll: event.scroll,
                shift: event.shift,
                originalEvent: event.originalEvent
            });
        }

        function onCanvasClick(e){

                var webPoint = e.position;
                var viewportPoint = osdViewer.viewport.pointFromPixel(webPoint);
                var imagePoint = osdViewer.viewport.viewportToImageCoordinates(viewportPoint);
                // Show the results.
                console.log(webPoint.toString(), viewportPoint.toString(), imagePoint.toString());

                var ev = e.originalEvent;
                canvas._currentTransform = null; //critical.
                canvas._onMouseDown(ev);
        }


        this.focusOnObject = function(o){
            osdViewer.viewport.panTo(new OpenSeadragon.Point(o.left / overlay._scale , o.top / overlay._scale), true);
            osdViewer.viewport.zoomTo( osdViewer.viewport.imageToViewportZoom( 1.0 ), true);
        }


        this.activateModule = function(active) {
            osdViewer.setMouseNavEnabled(!active);
            osdViewer.outerTracker.setTracking(!active);
            trackerEdit.setTracking(active);
            if(!active) {
                canvas.off('mouse:up');
                canvas.off('mouse:down');
                canvas.off('mouse:move');
             }
        }

        /**
         * FabricCanvas already maitains a state for free drawing that we need to activate.
         * We are extending it to provide various drawing modes.
         * NOTE : we could implemented modes as an array, relying on string to index translation.
         * This format would be more compact and extensible, but we decided to rather extend existing behavior.
         * @private
         * @param {FabricCanvas} [canvas] fabric canvas
         * @param {String} [_mode] mode we want modify
         * @param {Boolean} [on] turning mode on or off
        * @return {String} the mode.
         **/
        this.toggleMode = function(mode, on) {
            canvas.off('mouse:up');
            canvas.off('mouse:down');
            canvas.off('mouse:move');

            //if we are entering a mode, we need to disable other modes.
            if(on){
                trackerActive.setTracking(false); 
                trackerEdit.setTracking(true);
                allowObjectSelection(canvas,false);
                canvas.defaultCursor = canvas.freeDrawingCursor;
                canvas.hoverCursor = canvas.freeDrawingCursor;

                switch (mode) {
                    case 'FREE_DRAW':
                        canvas.isFreeDrawingMode= true;
                        canvas.isRectangleMode= false;
                        canvas.isPolygonMode= false;
                        canvas.isCircleMode= false;
                        new FreeDrawMode(canvas);
                        break;
                    case 'RECTANGLE':   
                        canvas.isFreeDrawingMode= false;
                        canvas.isRectangleMode= true;
                        canvas.isPolygonMode= false;
                        canvas.isCircleMode= false;
                        new RectangleMode(canvas, canvasUtils); //add support for rectangle.
                        break;
                    case 'POLYGON':
                        canvas.isFreeDrawingMode= false;
                        canvas.isRectangleMode= false;
                        canvas.isPolygonMode= true;
                        canvas.isCircleMode= false;
                        break;
                    case 'CIRCLE':
                        canvas.isFreeDrawingMode= false;
                        canvas.isRectangleMode= false;
                        canvas.isPolygonMode= false;
                        canvas.isCircleMode= true;
                        new CircleMode(canvas);
                        break;
                }
            }
            //we are just turning off the current mode.
            else{
                trackerActive.setTracking(true);
                trackerEdit.setTracking(false);
                allowObjectSelection(canvas, true);
                canvas.renderAll();
                canvas.defaultCursor = 'default';
                canvas.hoverCursor = 'move';

                switch (mode) {
                    case 'FREE_DRAW':
                        canvas.isDrawingMode= false;
                        break;
                    case 'RECTANGLE':
                        canvas.isRectangleMode= false;
                        break;
                    case 'POLYGON':
                        canvas.isPolygonMode= false;
                        break;
                    case 'CIRCLE':
                        canvas.isCircleMode= false;
                        break;
                }
            }
            return mode;
        }

        function allowObjectSelection(canvas, selectable){
            //prevent objects from being selectable while we draw other objects.
            canvas.forEachObject(function(o) {
              o.selectable = selectable;
            });
            canvas.renderAll();
            fabric.Object.prototype.selectable = selectable;
        }


        var annotationListUI = new AnnotationListUI(canvas, persistence, this.focusOnObject );
        var sortHandler = annotationListUI.sortList.bind(annotationListUI);
        var toolBox = new ToolboxUI(persistence, viewer, movie, canvas, leftMenu, canvasUtils, this.toggleMode.bind(this), this.activateModule.bind(this), sortHandler);


        function loadMovie(movie) {
            console.log('load movie.');
            var data = persistence.loadMovie(movie);
            loadFrame();
        };

        function loadFrame() {
            console.log('load frame.');
            var data = persistence.loadFrame();
            resetCanvas(data);
        };

        function resetCanvas(data) {
            var topleft = viewer.viewport.viewportToImageCoordinates(new OpenSeadragon.Point(0,0)); //GOOD
            var topright = viewer.viewport.viewportToImageCoordinates(new OpenSeadragon.Point(1,0)); //GOOD
            var ImageWidth = topright.x - topleft.x;
            overlay._scale =ImageWidth;
            canvas.clear();
            data.forEach(function(o){
                canvas.add(o);
            });
        }

        function importObjects(objects) {
            var data = persistence.getAnnotations();
            var error = 0;
            objects.objects.forEach(function(jsonO) {
                if(validImport(jsonO)){
                    if(data.has(jsonO.wdzt.id)) { return; }; //if data already exists
                    var klass = fabric.util.getKlass(jsonO.type);
                    var o = klass.fromObject(jsonO);
                    canvas.add(o);
                    o.selectable = true;
                    saveAnnotation(o);
                }
                else {
                    error += 1
                }
            });
            console.log('# of malformed objects not imported: ', error);
        }

        function validImport(o) {
            return o.wdzt
        }

        /**
         * @param {fabric.Object} [o] annotated Object. 
         */
        function updateLabels(o) {
            console.log("update labels.");
            if(!o.wdzt){
                throw new Error('attempt to save labels on a non annoted fabric object.');
            }
            return persistence.updateAnnotation(o);
        }

        /**
         * @param {fabric.Object} [o]
         * @return {fabric.Object} [o]
         */
        function saveAnnotation(o) {
            var contained = canvasUtils.objectWithinBounds(o);
            if(!contained){
                console.log('object not fitting in image. Ignored...');
                return;
            }

            canvas.add(o);

            console.log("save annotation object.");
            if (!o.wdzt) { 
                o = AnnotatedObject(o); //decorate object with wdzt attributes.
            }
            o = setObjectAttributes(o); //set object properties.
            return persistence.saveAnnotation(o);
        }

        function removeAnnotation(o) {
            o.remove();
            persistence.removeAnnotation(o);
        }

        function setObjectAttributes(o) {
            o.lockRotation = true;
            o.lockMovementX = true;
            o.lockMovementY = true;
            o.lockScalingX = true;
            o.lockScalingY = true;
            o.lockUniScaling = true;
            return o;
        }

        /**
         * Event registration. - All communications are handled through those events.
         **/

        //what happen when change frame
        movie.addHandler("movie-changed", loadMovie);
        movie.addHandler("frame-changed", loadFrame);

        //we can delete objects with the keyboard      
        rootDiv.keydown(function(e){ //keydown event must be registered on the openseadragon container div
                console.log('keydown event : keycode : ' + e.keyCode);
                var BACKSPACE_CODE = 8;
                var ENTER_CODE = 13;
            if (BACKSPACE_CODE === e.keyCode && canvas.getActiveObject()) {
              console.log( "Deleting active object." );
              var o = canvas.getActiveObject();
              removeAnnotation(o);
            }
            else {
                console.log('no registered shortcut for this keycode : ' , e.keyCode);
            }
        });

        //when we click outside an fabric object, we hide the annotation dialog.
        canvas.on('before:selection:cleared', function(e) {
            console.log('before:selection:cleared');
            $('#imageDialog').hide();
        });

        canvas.on('object:remove', function(o){
            console.log('object:remove');
            removeAnnotation(o);
        })

        //when we select a fabric object, we show the annotation dialog.
        canvas.on('object:selected', function(e){
            console.log('object:selected', e);
            dialogBox.displayObjectPopup(e.target);
        });

        /*
         * Cannot be used for saving because temp object would also trigger it.
         */
        canvas.on('object:added', function(e){
            console.log('object:added');
        });

        canvas.on('object:persist', function(o){
            console.log('object:persist');
            saveAnnotation(o);
        });

        canvas.on('labels:persist', function(o){
            console.log('labels:persist');
            updateLabels(o);
        });

        canvas.on('object:import', function(objects){
            importObjects(objects);
        })

        /**
         * Register all events to manage free draw.
         **/
        function FreeDrawMode(canvas) {

         var _isCurrentlyDrawing = false
                    /**
         * @private
         * @param {Event} e Event object fired on mousedown
         */
        canvas.on('mouse:down' , function(e) {
            e.e.preventDefault()
            e.e.stopPropagation()
            console.log('mouse down')
          _isCurrentlyDrawing = true;
          if (canvas.getActiveObject()) {
            canvas.discardActiveObject(e.e).requestRenderAll();
          }
          if (canvas.clipTo) {
            fabric.util.clipContext(canvas, canvas.contextTop);
          }
          var pointer = canvas.getPointer(e.e);
          canvas.freeDrawingBrush.onMouseDown(pointer);
        })

        /**
         * @private
         * @param {Event} e Event object fired on mousemove
         */
        canvas.on('mouse:move' , function(e) {
            e.e.preventDefault()
            e.e.stopPropagation()
       //    console.log('mouse move')
          if (_isCurrentlyDrawing) {
            var pointer = canvas.getPointer(e.e);
            canvas.freeDrawingBrush.onMouseMove(pointer);
          }
          canvas.setCursor(canvas.freeDrawingCursor);
        })

        /**
         * @private
         * @param {Event} e Event object fired on mouseup
         */
        canvas.on('mouse:up' , function(e) {
            if(!_isCurrentlyDrawing){
                return 
            }
            e.e.preventDefault()
            e.e.stopPropagation()
            console.log('mouse up in free draw')
          _isCurrentlyDrawing = false;
          if (canvas.clipTo) {
            canvas.contextTop.restore();
          }

          var ctx = canvas.contextTop;
          ctx.closePath();

          var pathData = canvas.freeDrawingBrush.convertPointsToSVGPath(canvas.freeDrawingBrush._points).join('');
          if (pathData === 'M 0 0 Q 0 0 0 0 L 0 0') {
            // do not create 0 width/height paths, as they are
            // rendered inconsistently across browsers
            // Firefox 4, for example, renders a dot,
            // whereas Chrome 10 renders nothing
            canvas.requestRenderAll();
            return;
          }


            var path = canvas.freeDrawingBrush.createPath(pathData);
            canvas.clearContext(canvas.contextTop);

            var o = path
            o.path.push("z");

            var color = canvas.freeDrawingBrush.color;
            var opacity = 0.5;
            var rgba = $$.AnnotationsModule.getRgbaFromColorAndOpacity(color, opacity);
            var strokeWidth = canvas.freeDrawingBrush.width;
            o.set("fill", rgba);
            o.set("stroke", color);
            o.set("strokeWidth", strokeWidth);
            o.shape = "freedraw";
            o.dirty = true;

            canvas.trigger("object:modified", o);
            canvas.remove(o);
            saveAnnotation(o);
 
            canvas.renderAll();


        })

            // canvas.on('mouse:up', freedrawMouseReleaseHandler.bind(canvas));

            // function freedrawMouseReleaseHandler(options) {
            //     console.log('free draw completed');
            //     var o = options.target;
            //     var r = o.getBoundingRect();

            //     //heuristic for discareding very small drawing as errors
            //     if (r.width < 2 && r.height < 2) {
            //         o.remove();
            //         return;
            //     }

            //     if(o) {
            //         var color = canvas.freeDrawingBrush.color;
            //         var opacity = 0.5;
            //         var rgba = $$.AnnotationsModule.getRgbaFromColorAndOpacity(color, opacity);
            //         var strokeWidth = canvas.freeDrawingBrush.width;
            //         o.path.push("z");
            //         o.set("fill", rgba);
            //         o.set("stroke", color);
            //         o.set("strokeWidth", strokeWidth);
            //         o.shape = "freedraw";
            //         o.dirty = true;
            //         canvas.trigger("object:modified", o);
            //         canvas.remove(o);
            //         saveAnnotation(o);
            //         canvas.renderAll();

            //         /* FOR DEBUG to graphically prove that the bounding boxes match the objects */
            //             // var rect = new fabric.Rect({
            //             //   left: boundingBox.left,
            //             //   top: boundingBox.top,
            //             //   fill: 'red',
            //             //   width: boundingBox.width,
            //             //   height: boundingBox.height
            //             // });

            //             // canvas.add(rect);
            //     }
            // }
        }

        /**
         * Register all events to manage the creation of rectangle shape.
         **/
        function RectangleMode(canvas, canvasUtils) {

            var rect, isDown, origX, origY;

            canvas.on('mouse:down', function(o) {
                isDown = true;
                var pointer = canvas.getPointer(o.e);
                origX = pointer.x;
                origY = pointer.y;
                var pointer = canvas.getPointer(o.e);

                var color = canvas.freeDrawingBrush.color;
                var opacity = 0.3;
                var rgba = $$.AnnotationsModule.getRgbaFromColorAndOpacity(color, opacity);
                var strokeWidth = canvas.freeDrawingBrush.width;

                rect = new fabric.Rect({
                    left: origX,
                    top: origY,
                    stroke:color,
                    fill: rgba,
                    strokeWidth: strokeWidth,
                    originX: 'left',
                    originY: 'top',
                    width: pointer.x-origX,
                    height: pointer.y-origY,
                });
                canvas.add(rect);
                canvas.renderAll();
            });

            canvas.on('mouse:move', function(o) {
                if (!isDown) return;

                var pointer = canvas.getPointer(o.e);        
                if(origX>pointer.x){
                    rect.set({ left: Math.abs(pointer.x) });
                }
                if(origY>pointer.y){
                    rect.set({ top: Math.abs(pointer.y) });
                }
                rect.set({ width: Math.abs(origX - pointer.x) });
                rect.set({ height: Math.abs(origY - pointer.y) });
    
                canvas.renderAll();
            });

            canvas.on('mouse:up', function(o) {
                if(!isDown) {
                    return 
                }
                isDown = false;
                //guard against random clicks
                if(rect.width == 0 || rect.height == 0){
                    canvas.remove(rect);
                    return;
                }

                var color = canvas.freeDrawingBrush.color;
                var opacity = 0.5;
                var rgba = $$.AnnotationsModule.getRgbaFromColorAndOpacity(color, opacity);
                var strokeWidth = canvas.freeDrawingBrush.width;
                //create the final object
                var o = new fabric.Rect({
                        left: rect.left,
                        top: rect.top,
                        width: rect.width,
                        height: rect.height,
                        stroke: color,
                        fill: rgba,
                        strokeWidth: strokeWidth,
                        hasBorders: true,
                        hasControls: true
                    });
                o.shape = "rectangle";
                canvas.remove(rect);

                // to test we have the right coordinates
                // var line = new fabric.Line([start.x, start.y , end.x, end.y],{stroke:'red'});
                // canvas.add(line);
                // canvas.renderAll();

                saveAnnotation(o);
                canvas.renderAll();
            });
        };

        /**
         * Register all events to manage the creation of circle shape.
         **/
        function CircleMode(canvas) {

            var circle, isDown, origX, origY;

            canvas.on('mouse:down', function(o) {
                isDown = true;
                var pointer = canvas.getPointer(o.e);
                origX = pointer.x;
                origY = pointer.y;
                var pointer = canvas.getPointer(o.e);

                var color = canvas.freeDrawingBrush.color;
                var opacity = 0.3;
                var rgba = $$.AnnotationsModule.getRgbaFromColorAndOpacity(color, opacity);
                var strokeWidth = canvas.freeDrawingBrush.width;

                circle = new fabric.Circle({
                    left: origX,
                    top: origY,
                    stroke:color,
                    fill: rgba,
                    strokeWidth: strokeWidth,
                    radius: 0,
                    originX: 'center', originY: 'center'
                });
                o.shape = "circle";
                canvas.add(circle);
                canvas.renderAll();
            });

            canvas.on('mouse:move', function(o) {
                if (!isDown) return;

                var pointer = canvas.getPointer(o.e);
                var radius = Math.sqrt( Math.pow((pointer.y - origY),2) + Math.pow((pointer.x- origX),2) );  
                circle.set({ radius: radius }); 
                canvas.renderAll();
            });

            canvas.on('mouse:up', function(o) {
                if(!isDown){
                    return 
                }
                isDown = false;
                canvas.remove(circle);

                //guard against random clicks
                if(circle.radius == 0) {
                    return;
                }
                circle.set({ shape: "circle"});

                saveAnnotation(circle);
                canvas.renderAll();
            });
        };

    }

    /**
     * Persistence - Handles backend.
     * @param {Movie} [movie] tracks what image & associated annotations we want to load.  
     */
    function Persistence(movie, canvas) {


        this.init = function(movie, canvas) {
            this.data =[]; // our backend data.

            console.log("number of frames", movie.getNumberOfFrames());

            // //TODO REMOVE - FOR TESTING ONLY - 
            for(var i = 0 ; i <= movie.getNumberOfFrames(); i++) {
            //     // var id = WDZT.guid();
            //     // var rect = new fabric.Rect({
            //     //   left: 100 + 100 * i,
            //     //   top: 100,
            //     //   fill: 'red',
            //     //   width: 20,
            //     //   height: 20
            //     // });
            //     // rect = AnnotatedObject(rect);
                this.data[i] = new Map();
            //     // data[i].set(id,rect);
            }

            this.models = new Map();
            this.models.set('cell',{  name: 'cell',
                                 type: 'single-choice',
                                 values: ['homogeneous','heterogeneous', 'dark']
                             });
        };

        this.getModel = function(id) {
            return this.models[id];
        };

        this.getModelNames = function() {
            return this.models.keys();
        };

        this.getAnnotations = function() {
            return this.data[movie.getCurrentFrame()];
        };

        /**
         * Load all objects registered with the first frame.
         * @return {Object} all objects.
         */
        this.loadMovie = function(movie) {
            this.init(movie, canvas);
        };

        // to be used in loadFrame outside of ToolBoxUI
        this.getAnnotationFile = function() {
            console.log("Get annotation file");
            var annotId;
            var frameId = movie.getCurrentFrame();
            var pyramidId = WDZTViewer.selectedLayer.id;
            var settings = WDZTViewer.selectedLayer.pyramidAnnotations;
            var serviceUrl = settings.serviceUrl;

            // Search for already existing pyramidAnnotation by pyramidId
            $.ajax({
                url: serviceUrl + "/search/findByPyramid",
                async: false,
                type: 'GET',
                data: {
                    pyramid: pyramidId
                },
                success: function (response){
                    console.log("SUCCESS : ", response);
                    annotId = response.id;
                },
                error: function (e) {
                    console.log("ERROR : ", e);
                }
            });

            // Get annotation file by annotationId and frameId
            $.ajax({
                url: serviceUrl + "/" + annotId + "/timeSlices/"+ frameId +"/annotationPositions",
                async: false,
                type: 'GET',
                success: function (data){
                    console.log("SUCCESS : ", data);
                    var objects = JSON.parse(data);
                    console.log('content : ', objects);
                    //importObjects(objects);
                    canvas.trigger('object:import', objects);
                },
                error: function (e) {
                    console.log("ERROR : ", e);
                }
            });
        };

        /**
         * TODO should be a rest call
         * Load all objects registered with the current frame.
         * @return {Object} all objects.
         */
        this.loadFrame = function() {
            var annotations = this.data[movie.getCurrentFrame()];
            canvas.trigger('frame:reloaded', annotations);
            //this.getAnnotationFile();
            return annotations;
        };

        /**
         * Persist a given object for the current frame.
         * @param {Object} [object] object to persist
         * @return {Object} the persisted object
         */
        this.saveAnnotation = function(o) {
            this.data[movie.getCurrentFrame()].set(o.wdzt.id, o);
            canvas.trigger('object:persisted',o);
            return o;
        };

        this.updateAnnotation = function(o) {
            this.data[movie.getCurrentFrame()].set(o.wdzt.id, o);
            canvas.trigger('object:updated',o);
            return o;
        };

        /**
         * Delete a given object for the current frame.
         * @param {Object} [object] object to remove
         * @return {Boolean} Returns true if the object existed and has been removed, or false if the object does not exist.
         */
        this.removeAnnotation = function(o) {
            var objects = this.getAnnotations();
            objects.delete(o.wdzt.id);
            canvas.trigger('object:deleted',o);
            return o;
        };

        this.init(movie, canvas);
    }

    function AnnotationFactory(canvas, parentDiv, osdViewer, type) {
        
        // var DialogBoxMaker = { SingleChoice , MultipleTags };

        function SingleChoice(canvas, parentDiv, osdViewer){
            return new AnnotationDialogUI(canvas, parentDiv, osdViewer);
        }

        // function MultipleTags(canvas, parentDiv, osdViewer){
        //     return new AnnotationDialogUI(canvas, parentDiv, osdViewer); // should be another implementation.
        // }
        
    //    return DialogBoxMaker[type](canvas, parentDiv, osdViewer);

        return new SingleChoice(canvas, parentDiv, osdViewer);
    }

    /**
     * Annotation Dialog/Popup
     * @param {FabricCanvas} [canvas] the fabric canvas it must interact with.
     * @param {DOMElement} [parentDiv] the DOMElement it needs to be attached to.
     */
    function AnnotationDialogUI(canvas, parentDiv, osdViewer) {

         //TODO CHECK what happen in production? can we use this technique?
        $$.getHbsTemplate('src/modules/annotation-dialog.hbs', function(htmlFragment) {
            console.log('annotation-module-ui loaded.');
            
            // This is the default context, which is passed to the template
            var context = {
                tags: [
                    {tag: 'homogeneous'},
                    {tag: 'heterogeneous'},
                    {tag: 'dark'},
                ]
            };
            var elt = htmlFragment( context , {data: context} );
            parentDiv.append(elt);
            registerControls();
        });

        /**
         * @public
         * Display the dialog box.
         */
        this.displayObjectPopup = function(o) {

            populateFields(o);
            
            var w = $('#imageDialog').width();
            var h = $('#imageDialog').height();

            var coords;
            if(o.originX == 'left' && o.originY == 'top'){
                coords = fromImageToWindowCoordinates(o.left + o.width / 2 , o.top + o.height / 2);
            }
            else {
                coords = fromImageToWindowCoordinates(o.left,o.top)
            }
            var left = coords.x;
            var top = coords.y;

            /* USED TO DEBUG POSITIONING */
            // var p = new fabric.Rect({
            //     top: o.top,
            //     left: o.left,
            //     width: 10,
            //     height: 10,
            //     stroke:'red',
            //     fill: 'red',
            //     strokeWidth: 1,
            // });
            // canvas.add(p);
            // canvas.renderAll();

            console.log('image dialog width : ' , w);
            console.log('left coordinates : ' , left);
            console.log('top coordinates : ' , top);

           $('#imageDialog').show();
           $('#imageDialog').css({top: top, left: left});
        }

        function fromImageToWindowCoordinates(x,y) {
            console.log('top bounding box :: ', x);
            console.log('left boudning box :: ', y);
            var p1 = osdViewer.viewport.imageToViewportCoordinates(x, y);
            console.log('viewport coordinates :: ', p1);
            var coords = osdViewer.viewport.viewportToWindowCoordinates(p1); //this function is buggy with the zoom
            var coords2 = osdViewer.viewport.viewportToViewerElementCoordinates(p1); 
            console.log('coords : ' , coords);
            console.log('coords2 : ' , coords2);
            return coords;
        }

        /**
         * @private
         * Populate dialogBox with the annotation values.
         */
        function populateFields(obj) {
            $('#annotation-id').text(obj.wdzt.id || '');
            $('#annotation-author').val(obj.wdzt.labels.author || '');
            $('#annotation-text').val(obj.wdzt.labels.annotationText || '');
            
            var radios = $('#tags label');
            radios.removeClass("active");

            var tags = obj.wdzt.labels.tags;
            if(tags){
                tags.forEach(function(tag){
                    console.log(tag);
                    var elt = $('label[for="'+tag+'"]');
                    elt.addClass("active");
                });
            }
        }

        /** @private
         * Register event handlers
         */
        function registerControls() {
            $('#imageDialog').keydown(function(e) { //We prevent input editing to interfere with canvas keyboard shortcuts.
                console.log('keydown event for image dialog : keycode : ' + e.keyCode);
                e.stopPropagation();
            });

            $('#saveBtn').click(function(e) {
                console.log('save button clicked.');
                var o = canvas.getActiveObject();
                if(!o){
                    console.log('could not get active object when clicking at : ', e);
                }
                save(o);
                canvas.discardActiveObject();
                canvas.renderAll(); 
            });

            $('#cancelBtn').click(function(e) {
                console.log('cancel button clicked.');
                $('#imageDialog').hide();
                canvas.discardActiveObject();
                canvas.renderAll(); 
            });
        }

        function save(o){
            console.log("collecting attributes from ui...")

            var checked = $('#tags input:checked').toArray();
            var selectedTags = checked.map(function(tag){
                console.log(tag.id);
                return tag.id
            });

            var labels = new Labels();
            labels.tags = selectedTags;
            labels.author = $('#annotation-author').val();
            labels.annotationText = $('#annotation-text').val();
            o.wdzt.labels = labels;
            
            $('#imageDialog').hide(); //no errors we can close the dialog
            
            canvas.fire('labels:persist', o); //broadcast this object needs to be saved.
        }


        /*
         * Labels Constructor.
         * A convenient description of the labels implementation for this ui component.
         */
        function Labels() {
            this.type = '';
            this.author = '';
            this.annotationText = '';
            this.tags = [];
            this.model = {
                name: 'free',
                values: []
            };
        }
    }

    function AnnotationListUI(canvas, persistence, focusOnObjectHandler) {

        this.sortList = function(attr) {
            var objects = Array.from(persistence.getAnnotations().values());
            var annotations = sort(objects, attr);
            this.updateList(annotations);
        }

        this.updateList = function(objects) {
            console.log('update annotation list.');
            _updateList(objects);
        }

        this.addItem = function(o) {
            _addItem(o);
        }

        this.removeItem = function(o) {
            var $row = $('#' + o.wdzt.id);
            return _removeItem($row);
        }

        this.updateItem = function(o) {
            console.log("update annotation list item label.");
            var $row = $('#' + o.wdzt.id);
            var label = $row.find( ".anno-label" );
            label[0].innerHTML = generateLabelContent(o);
        };

        //EVENTS REGISTRATION
        canvas.on('frame:reloaded', this.updateList);
        canvas.on('object:persisted', this.addItem);
        canvas.on('object:deleted', this.removeItem);
        canvas.on('object:updated', this.updateItem);



        function _addItem(o) {
            var $row = $('<div style="width:100%; background-color:#f7f9fc;" class="row btn" id='+ o.wdzt.id +'/>');

            close = Handlebars.compile ('<div class="GridCell"><img width="16" src="{{imageFolder}}/close.svg" alt="remove" title="remove" class="wdzt-img-button"></div>');
            var $close = $(close({imageFolder: WDZTViewer.imagesPrefix}));
            $close.click(function(e) {
                e.preventDefault();
                console.log('remove annotation');
                canvas.fire('object:remove', o);
            })
            $row.append($close);
            var $label = $('<div class="anno-label GridCell">' + generateLabelContent(o) + '</div>');
            $row.append($label); 

            var color = o.fill.replace(/[^,]+(?=\))/, '1')
            var $colorMarker = $('<div class="GridCell" style="background-color:' + color + '"></div>');
            $row.append($colorMarker);

            //Zoom and Pan. Problem for displaying popup : [pan and zoom are asynchronous](https://github.com/openseadragon/openseadragon/issues/320)
            $row.click(function() {
                console.log("annotation clicked");
                // Solution 1 : without animation
                focusOnObjectHandler(o);
                canvas.setActiveObject(o);
                //Solution 2 - need to click to have to popup appear.
                // osdViewer.viewport.panTo(new OpenSeadragon.Point(o.left / 1000 , o.top / 1000)).zoomTo( osdViewer.viewport.imageToViewportZoom( 1.0 ), true);
                // canvas.setActiveObject(o);
                //Solution 3 - lag
                // osdViewer.viewport.panTo(new OpenSeadragon.Point(o.left / 1000 , o.top / 1000));
                // osdViewer.viewport.zoomTo( osdViewer.viewport.imageToViewportZoom( 1.0 ));
                // window.setTimeout(function(){
                //         canvas.setActiveObject(o);
                //     }, 300);
            });
            
            $('#annotationList').append($row);

            if(annotationsExist()){
                $('#list-controls').show();
            }
        }

        function _removeItem($row) {
            $row.remove();
            if(!annotationsExist()){
                $('#list-controls').hide();
            }
        }

        function _updateList(annotations) {
            $('#annotationList').empty();
            annotations.forEach(function(o) {
                _addItem(o);
            });
        }

        function annotationsExist(){
            return $('#annotationList div').length != 0
        }

        function generateLabelContent(o){
            var labelContent = o.wdzt.labels.annotationText || "no annotations";
            return '(' + o.wdzt.shape.slice(0,1).toUpperCase() + ') ' + labelContent;
        }

        function sort(annotations, sortAttr) {
            //ugly hack to deal with labels sorting - could be generalized with some work
            if(sortAttr.split(".").length == 2){
                var attrs = sortAttr.split(".");
                annotations.sort(function(a, b){
                    if(!a.wdzt[attrs[0]][attrs[1]]){
                        return -1;
                    }
                    if(!b.wdzt[attrs[0]][attrs[1]]){
                        return 1;
                    }
                    if(a.wdzt[attrs[0]][attrs[1]] < b.wdzt[attrs[0]][attrs[1]]) {
                        return -1;
                    }
                    if(a.wdzt[attrs[0]][attrs[1]] > b.wdzt[attrs[0]][attrs[1]]) {
                        return 1;
                    }
                    return 0;
                });

                return annotations;
            }

            annotations.sort(function(a, b){
                if(a.wdzt[sortAttr] < b.wdzt[sortAttr]) {
                    return -1;
                }
                if(a.wdzt[sortAttr] > b.wdzt[sortAttr]) {
                    return 1;
                }
                return 0;
            });

            return annotations;
        }
    }

    /**
     * Left Menu Annotation ToolBox
     * @param {Viewer} [osdViewer] the openseadragon viewer provides control to disable default events handlers.
     * @param {FabricCanvas} [canvas] the fabric canvas it must interact with.
     * @param {DOMElement} [leftMenu] the left menu DOMElement it needs to be attached to.
     */
    function ToolboxUI(persistence, osdViewer, movie, canvas, leftMenu, canvasUtils, toggleModeHandler, activeModuleHandler, sortHandler) {

        var activeCheckboxId = "wdzt-annotations-active-" + WDZT.guid();
        var template;

        var settings = WDZTViewer.selectedLayer.pyramidAnnotations;

        //TODO REMOVE MODELS
        //load the module toolbox in the left panel
        $$.getHbsTemplate('src/modules/annotations-module-template.hbs', function(_template) {
            template = _template;
            var models = Array.from(persistence.getModelNames());
            leftMenu.html(template({
                imagesPrefix: WDZTViewer.imagesPrefix,
                models: models,
                activeCheckboxId: activeCheckboxId, //inject value in template
            }));
            activateModule(false);
            registerControls();
            registerAppEvents();
        });


        //TODO REMOVE WILL BE USEFUL WHEN DEALING WITH MODELS
        function registerAppEvents(){
            canvas.on('model:update', function(models) {
                leftMenu.html(template({
                    models: [],
                    activeCheckboxId: activeCheckboxId, //inject value in template
                }));
            });
        }

        function getAnnotationFile(){
            console.log("Get annotation file");
            var annotId;
            var frameId = movie.getCurrentFrame();
            var pyramidId = WDZTViewer.selectedLayer.id;
            var serviceUrl = settings.serviceUrl;

            // Search for already existing pyramidAnnotation by pyramidId
            $.ajax({
                url: serviceUrl + "/search/findByPyramid",
                async: false,
                type: 'GET',
                data: {
                    pyramid: pyramidId
                },
                success: function (response){
                    console.log("SUCCESS : ", response);
                    annotId = response.id;
                },
                error: function (e) {
                    console.log("ERROR : ", e);
                }
            });

            // Get annotation file by annotationId and frameId
            $.ajax({
                url: serviceUrl + "/" + annotId + "/timeSlices/"+ frameId +"/annotationPositions",
                async: false,
                type: 'GET',
                success: function (data){
                    console.log("SUCCESS : ", data);
                    var objects = JSON.parse(data);
                    console.log('content : ', objects);
                    importObjects(objects);
                },
                error: function (e) {
                    console.log("ERROR : ", e);
                }
            });
        };

        /**
         ** API
         */

        function activateModule(active) {
            console.log("activate module", active);
            (!active) ? disable_control() : enable_control();
            activeModuleHandler(active);
        }

        /**
         * @private
         * define all the controls appearing in the menu
         */
        function registerControls() {

            $("#" + activeCheckboxId).click(function() {
                if ($(this).is(':checked')) {
                    activateModule(true);
                    //persistence.getAnnotationFile();
                    getAnnotationFile();
                } else {
                    activateModule(false);
                }
            });

            $('#colorpicker').change(function (e) {
                canvas.freeDrawingBrush.color = e.target.value;
                console.log('selected color : ' + e.target.value);
            });

            $("#draw").click(function(e) {
                toggleModeHandler('FREE_DRAW', true);
                console.log("drawing_mode : " + true + ", " + canvas['isDrawingMode']);
            });

            $("#rectangle").click(function(e) {
                toggleModeHandler('RECTANGLE' , true);
                console.log("rectangle_mode : " + true + ", " + canvas['isRectangleMode']);
            });

            $("#circle").click(function(e) {
                toggleModeHandler('CIRCLE' , true);
                console.log("circle_mode : " + true + ", " + canvas['isCircleMode']);
            });

            $('#import').click(function(e) {
                $('#file-input').trigger('click');
                $('#file-input').val("");
                if($("#file-input [type='file']")[0]) {
                    $("#file-input [type='file']")[0].value=""
                }
            });

            if(!WDZT.enableImport){
                $('#import').remove()   
            }

            $('#file-input').change(function(e) {
                console.log('file-input value' , this);
                var file = this.files[0];
                var reader = new FileReader();
                reader.onload = function(event) {
                    console.log('reading file...', event);
                    var objects = JSON.parse(event.target.result);
                    console.log('content : ', objects);
                    importObjects(objects);
                }     
                reader.readAsText(file);
            });

            $('#export').click(function(e) {
                exportObjects();  
            });

            $('#sort').change(function(e) {
                var attr = e.target.value;
                console.log("sort by : " + attr );
                sortHandler(attr);
            })
        }


        function exportObjects() {
            console.log("export");
            var frameId = movie.getCurrentFrame();
            var annotations = canvas.toJSON(["wdzt"]);
            annotations.frameId = frameId;
            var objects = JSON.stringify(annotations);

            var blob = new Blob([objects], {type: 'text/plain'});
            var fileName = "annotations-frame" + frameId + ".json";

            var pyramidId = WDZTViewer.selectedLayer.id;
            var annotName = WDZTViewer.selectedLayer.name + "-annotations";
            var annotId;
            var serviceUrl = settings.serviceUrl;

            // Create a FormData object
            var data = new FormData();
            data.append("file", blob, fileName);

            // Search for already existing pyramidAnnotation by pyramidId
            $.ajax({
                url: serviceUrl + "/search/findByPyramid",
                async: false,
                type: 'GET',
                data: {
                    pyramid: pyramidId
                },
                success: function (response){
                    console.log("SUCCESS : ", response);
                    annotId = response.id;
                },
                error: function (e) {
                    console.log("ERROR : ", e);
                }
            });

            var annotData = '{"name": "' + annotName + '", "pyramid": "' + pyramidId +'"}';
            //var annotStr = JSON.stringify(annotData);

            // If no pyramidAnnotation was found, create a new one
            if(annotId === undefined){
                console.log("creating new annotId");
                $.ajax({
                    url: serviceUrl,
                    async: false,
                    dataType: 'json',
                    contentType: 'application/json',
                    type: 'POST',
                    data: annotData,
                    processData: false,
                    success: function (response){
                        console.log("SUCCESS : ", response);
                        annotId = response.id;
                    },
                    error: function (e) {
                        console.log("ERROR : ", e);
                    }
                });
            }

            // Store pyramidAnnotation file
            $.ajax({
                type: "POST",
                enctype: 'multipart/form-data',
                url: serviceUrl + "/" + annotId + "/timeSlices/"+ frameId +"/annotationPositions",
                data: data,
                processData: false,
                contentType: false,
                cache: false,
                timeout: 600000,
                success: function (data) {
                    console.log("SUCCESS : ", data);
                },
                error: function (e) {
                    console.log("ERROR : ", e);
                }
            });
        }

        function importObjects(objects) {
            console.log("import");
            canvas.trigger('object:import', objects);
        }      

        /**
         * @private
         * Disable module controls
         **/
        function disable_control() {
            $('input[name="draw-method"]').prop('checked', false);
            $('input[name="draw-method"]').attr("disabled",true);
            $('#controls button').attr('disabled','disabled');
            $('#colorpicker').attr('disabled','disabled');
            $("#draw").attr('disabled', 'disabled');
            $("#rectangle").attr('disabled', 'disabled');
            $("#circle").attr('disabled', 'disabled');
            if (canvas.isFreeDrawingMode) {
                toggleModeHandler('FREE_DRAW', false);
            }
            if (canvas.isRectangleMode) {
                toggleModeHandler('RECTANGLE', false);
            }
            if (canvas.isCircleMode) {
                toggleModeHandler('CIRCLE', false);
            }
        }

        /**
         * @private
         * Enable module controls
         **/
        function enable_control() {
            $('input[name="draw-method"]').attr("disabled",false);
            $('#controls button').removeAttr('disabled');
            $('#colorpicker').removeAttr('disabled');
        }
    }


}(WDZT));
