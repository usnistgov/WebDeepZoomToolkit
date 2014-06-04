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

    module("wdzt");

    test("pad", function() {

        equal(WDZT.pad("", 3), "000");
        equal(WDZT.pad("1", 3), "001");
        equal(WDZT.pad("1", 3, "0"), "001");
        equal(WDZT.pad("01", 3, "0"), "001");
        equal(WDZT.pad("001", 3, "0"), "001");
        equal(WDZT.pad("0001", 3, "0"), "0001");
        equal(WDZT.pad("1", 3, " "), "  1");
        equal(WDZT.pad("", 3, ""), "000");

    });

})();
