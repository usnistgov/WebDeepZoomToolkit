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

window.WDZT = window.WDZT || function(options) {
    return new WDZT.Viewer(options);
};


(function($$) {

    $$.DEFAULT_SETTINGS = {
    };

    /**
     * Generate a GUID. Taken from http://stackoverflow.com/a/2117523/1440403
     * @returns {String} the guid
     */
    $$.guid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    /**
     * Pad a string with a char until it length reaches min
     * @param {String} str The String to pad
     * @param {Number} min The minimum expected length
     * @param {String} [character="0"] The chararacter to pad
     * @returns {String} The string padded with 0
     */
    $$.pad = function(str, min, character) {
        character = character || "0";
        return str.length < min ? $$.pad(character + str, min, character) : str;
    };
    
    /**
     * Set to true if window.URL.createObjectURL is supported, false otherwise.
     */
    $$.isObjectURLSupported = typeof window.URL === "function" &&
                typeof window.URL.createObjectURL === "function";

}(WDZT));
