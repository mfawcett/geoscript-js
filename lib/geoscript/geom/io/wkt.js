/**
 * @module geoscript/geom/io/wkt
 */
var Geometry = require("../geometry").Geometry;

var jts = Packages.com.vividsolutions.jts;
var wktReader = new jts.io.WKTReader();
var wktWriter = new jts.io.WKTWriter();

/**
    Create a geometry from WKT.  The specific geometry type depends on the
    given WKT.

    @arg {String} wkt - The Well-Known Text representation of a geometry.
    @returns {geom.Geometry}
    @private
 */
var read = function(str) {

    var _geometry = wktReader.read(str);
    return Geometry.from_(_geometry);

};

/**
    Generate a Well-Known Text string from a geometry.

    @arg {geom.Geometry} geometry - A geometry.
    @returns {String} The Well-Known Text representation of a geometry.
    @private
 */
var write = function(geometry) {
    
    var str;
    if (geometry._geometry) {
        str = String(wktWriter.write(geometry._geometry));
    } else {
        str = "undefined";
    }
    return str;
    
};

exports.read = read;
exports.write = write;
