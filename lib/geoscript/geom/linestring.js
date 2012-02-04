/**
 * @module geoscript/geom/linestring
 */

var Geometry = require("./geometry").Geometry;
var Factory = require("../factory").Factory;
var UTIL = require("../util");
var GEOM_UTIL = require("./util");

var _arrayToCoord = GEOM_UTIL._arrayToCoord;
var _coordToArray = GEOM_UTIL._coordToArray;
var _getMethod = GEOM_UTIL._getMethod;

var LineString = exports.LineString = UTIL.extend(Geometry, /** @lends LineString# */ {
    
    /**
        Create a new linestring.
        @extends Geometry
        @constructs LineString
        @arg {Array} coords - Coordinates array.
     */
    constructor: function LineString(coords) {
        Geometry.prototype.constructor.apply(this, [coords]);
    },
    
    /**
        The last point in the linestring.
        @name LineString#endPoint
        @readonly
        @type {geom.Point}
     */
    get endPoint() {
        return Geometry.from_(this._geometry.getEndPoint());
    },
    
    /**
        The first point in the linestring.
        @name LineString#startPoint
        @readonly
        @type {geom.Point}
     */
    get startPoint() {
        return Geometry.from_(this._geometry.getStartPoint());
    },

    /**
        List of start point and end point.
        @type {Array}
     */
    get endPoints() {
        return [this.startPoint, this.endPoint];
    },

    /**
        Create a new linestring whose coordinates are in the reverse order of
        this linestring.

        @returns {geom.LineString}
     */
    reverse: function() {
        return Geometry.from_(this._geometry.reverse());
    },

    /**
        Create a JTS geometry from an array of coordinates.

        @arg {Array} coords - A coordinates array.
        @private
     */
    _create: function(coords) {
        var _coords = new Array(coords.length);
        coords.forEach(function(c, i) {
            _coords[i] = _arrayToCoord(c);
        });
        return Geometry._factory.createLineString(_coords);
    },

    /**
        Generate an array of coordinates for the geometry.

        @arg {com.vividsolutions.jts.geom.Geometry} _geometry 
        @returns {Array} An array of coordinates.
        @private
     */
    _extractCoordinates: function(_geometry) {
        var _coords = _getMethod(_geometry, "getCoordinates")();
        return _coords.map(_coordToArray);
    }
    
});

// register a linestring factory for the module
GEOM_UTIL.register(new Factory(LineString, {
    handles: function(config) {
        config = GEOM_UTIL._prepConfig(config);
        var capable = false;
        if (config.coordinates && config.coordinates instanceof Array) {
            for (var i=0, ii=config.coordinates.length; i<ii; ++i) {
                var p = config.coordinates[i];
                if (p instanceof Array) {
                    var len = p.length;
                    if (len === 2 || len === 3) {
                        capable = true;
                        for (var j=0; j<len; ++j) {
                            capable = capable && (typeof p[j] === "number");
                        }
                    }
                }
            }
        }
        return capable;
    }
}));

/**
    Sample code to new linestring:
   
    .. code-block:: javascript
   
        js> var line = new GEOM.LineString([[-180, -90], [0, 0], [180, 90]]);
        js> line.coordinates.length
        3
        js> line.length
        402.49223594996215
 */

