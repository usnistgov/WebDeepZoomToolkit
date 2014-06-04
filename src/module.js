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

    $$.Module = function(options) {
        this.viewer = options.viewer;
        this.$container = options.$container;
    };

    $$.Module.prototype = {
        /**
         * The name of the module used for registering it.
         * @returns {String} the name of the module
         */
        getName: function() {
            return this.name;
        },
        /**
         * Get the title of the module (which is displayed as a header in the menu)
         * @returns {String} the title of the module
         */
        getTitle: function() {
            return this.title;
        },
        /**
         * Get the order index of the module. This is used by the menu to order
         * modules. The index should be a number between 0 and 100 with 0 being
         * the most important module and 100 the least important.
         * Decimals are possible for fine-grained adjustment.
         * @returns {Number}
         */
        getOrderIndex: function() {
            return 100;
        },
        /**
         * Tell if this plugin supports the specified layer.
         * @param {Object} layer the layer's json configuration
         * @return {Boolean} true if supported, false otherwise.
         */
        supportLayer: function(layer) {
            /*jshint unused:vars */
            return false;
        },
        /**
         * Set specific state of the module to directly display usefull informations.
         * @param {Object} options The state options (module specific).
         */
        loadState: function(options) {
            /*jshint unused:vars */
            return this;
        },
        /**
         * Re-enable the module after it has been disabled.
         * @returns {$$.Module} chainable
         */
        enable: function() {
            return this;
        },
        /**
         * Temporarly disable the module when it is not displayed.
         * Events which are updating this module's UI should be unsubscribed.
         * @returns {$$.Module} chainable
         */
        disable: function() {
            return this;
        },
        /**
         * Destroy the module when no longer needed.
         * All events should be unsubscribed.
         * @returns {$$.Module} chainable
         */
        destroy: function() {
            return this.disable(); // At least disable the module
        }
    };

    /**
     * The list of registered module. Each module must register itself via:
     * $$.Module.MODULES[name] = $$.MyModuleConstructor;
     */
    $$.Module.MODULES = {};

}(WDZT));
