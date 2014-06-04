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


(function($) {

    if (!$.version || $.version.major < 1) {
        throw new Error('OpenSeadragonPixelColor requires OpenSeadragon version 1.0.0+');
    }

    $.Viewer.prototype.getPixelColor = function(pixel) {
        var drawer = this.drawer;
        if (!drawer.useCanvas) {
            throw new Error("Canvas rendering required to get pixel color.");
        }
        return drawer.canvas.getContext("2d").getImageData(pixel.x, pixel.y, 1, 1).data;
    };

}(OpenSeadragon));
