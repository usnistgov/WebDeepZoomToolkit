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

    var containerId;
    var wdzt;

    module("viewer", {
        setup: function() {
            containerId = WDZT.guid();
            $('<div id="' + containerId + '"/>').appendTo("#qunit-fixture");
            wdzt = WDZT({
                id: containerId
            });
        },
        teardown: function() {
            $("#" + containerId).remove();
        }
    });

    asyncTest("open", function() {
        equal(wdzt.manifest, null, "Manifest should not be set before opening.");

        wdzt.addHandler("open", function openHandler() {
            wdzt.removeHandler("open", openHandler);

            ok(wdzt.manifest, "Manifest should be set after opening.");

            start();
        });
        wdzt.open("data/manifest.json");
    });

    test("toggleMenu", function() {
        ok(wdzt.isMenuDisplayed, "Menu should be displayed by default.");
        ok(wdzt.$menuContainer.is(":visible"), "Menu should be displayed by default.");

        wdzt.toggleMenu();

        ok(!wdzt.isMenuDisplayed, "Menu should be hidden after toggle.");
        ok(!wdzt.$menuContainer.is(":visible"), "Menu should be hidden after toggle.");

        wdzt.toggleMenu();

        ok(wdzt.isMenuDisplayed, "Menu should be visible after 2 toggles.");
        ok(wdzt.$menuContainer.is(":visible"), "Menu should be visible after 2 toggles.");
    });

    test("toggleFullScreen", function() {
        expect(4); // 2 pre-full-page and 2 full-page events raised.
        var fullPage = false;
        function fullPageHandler(event) {
            equal(event.fullPage, !fullPage,
                    "event.fullPage should be opposite of previous state.");
        }

        wdzt.addHandler("pre-full-page", fullPageHandler);
        wdzt.addHandler("full-page", fullPageHandler);
        wdzt.toggleFullScreen();

        fullPage = !fullPage;
        wdzt.toggleFullScreen();
        wdzt.removeHandler("pre-full-page", fullPageHandler);
        wdzt.removeHandler("full-page", fullPageHandler);
    });

})();

