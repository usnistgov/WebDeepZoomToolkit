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

    window.TestsTools = {
        /**
         * Chain trigger/handlers to avoid pyramidal code.
         * Each test must be an object containing eventSource, eventName,
         * trigger and handler.
         * @param {Array} tests Array of tests to chain.
         * @param {function} end Function to call at the end of the tests.
         * @returns {undefined}
         */
        chainTriggersHandlers: function(tests, end) {
            if (!tests || tests.length === 0) {
                if (end) {
                    end();
                }
                return;
            }
            var test = tests.shift();
            var eventSource = test.eventSource;
            var eventName = test.eventName;
            var eventRaisedCount = test.eventRaisedCount || 1;
            var trigger = test.trigger;
            var handler = test.handler;

            var count = 0;
            
            eventSource.addHandler(eventName, function thisHandler(eventData) {
                count++;
                if (count !== eventRaisedCount) {
                    return;
                }
                eventSource.removeHandler(eventName, thisHandler);
                setTimeout(function() {
                    handler(eventData);
                    TestsTools.chainTriggersHandlers(tests, end);
                }, 0);
            });

            trigger();
        },
        /**
         * Retrieve a module instance from its name for a given WDZT viewer.
         * @param {type} viewer
         * @param {type} moduleName
         * @returns {Object} The module instance or undefined if not found.
         */
        getModuleInstance: function(viewer, moduleName) {
            for (var i = 0; i < viewer._modules.length; i++) {
                var module = viewer._modules[i];
                if (module.name === moduleName) {
                    return module.instance;
                }
            }
        }
    };

})();
