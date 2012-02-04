/**
 * @module geoscript/geom/point
 */

var Geometry = require("./geometry").Geometry;
var Factory = require("../factory").Factory;
var UTIL = require("../util");
var GEOM_UTIL = require("./util");

var _arrayToCoord = GEOM_UTIL._arrayToCoord;
var _coordToArray = GEOM_UTIL._coordToArray;
var _getMethod = GEOM_UTIL._getMethod;

 
var Point = exports.Point = UTIL.extend(Geometry, /** @lends Point# */ {
    
    /**
        Create a new point.
        @extends Geometry
        @constructs Point
        @arg {Array} coords - Coordinates array.
     */
    constructor: function Point(coords) {
        Geometry.prototype.constructor.apply(this, [coords]);
        Object.defineProperty(this, "0", {
            get: function() {
                return this.x;
            }
        });
        Object.defineProperty(this, "1", {
            get: function() {
                return this.y;
            }
        });
        Object.defineProperty(this, "2", {
            get: function() {
                return this.z;
            }
        });
    },

    /**
        Create a JTS geometry from JTS coordinates.

        @arg {jts.geom.Coordinates} _coords 
        @private
     */
    _create: function(coords) {
        return Geometry._factory.createPoint(_arrayToCoord(coords));
    },
    
    /**
        Generate an array of coordinates for the geometry.

        @arg {com.vividsolutions.jts.geom.Geometry} _geometry 
        @returns {Array} An array of coordinates.
        @private
     */
    _extractCoordinates: function(_geometry) {
        var _coords = _getMethod(_geometry, "getCoordinates")();
        return _coordToArray(_coords[0]);
    },

    /**
        The first coordinate value.
        @name Point#x
        @readonly
        @type {Number} 
     */
    get x() {
        return _getMethod(this._geometry, "getX")();
    },

    /**
        The second coordinate value.
        @name Point#y
        @readonly
        @type {Number} 
     */
    get y() {
        return _getMethod(this._geometry, "getY")();
    },

    /**
        The third coordinate value (or NaN if none).
        @name Point#z
        @readonly
        @type {Number} 
     */
    get z() {
        return _getMethod(this._geometry, "getCoordinate")().z;
    },

    /**
        The number of coordinates.
        @name Point#length
        @type {Number} 
        @private
     */
    get length() {
        return isNaN(this.z) ? 2 : 3;
    },
    
    /**
        Returns a shallow copy of the point, accepting arguments of the 
        Array.prototype.slice method.

        @arg {Number} begin - Zero-based index at which to begin extraction.
        @arg {Number} end -  Zero-based index at which to end extraction.
        @returns {Point} 
        @private
     */
    slice: function() {
        return Array.prototype.slice.apply(this, arguments);
    }

});

// register a point factory for the module
GEOM_UTIL.register(new Factory(Point, {
    handles: function(config) {
        config = GEOM_UTIL._prepConfig(config);
        var capable = false;
        if (config.coordinates && config.coordinates instanceof Array) {
            var len = config.coordinates.length;
            if (len == 2 || len == 3) {
                capable = true;
                for (var i=0; i<len; ++i) {
                    capable = capable && (typeof config.coordinates[i] === "number");
                }
            }
        }
        return capable;
    }
}));

/**
    Sample code to create a new point:
   
    .. code-block:: javascript
  
        js> var point = new GEOM.Point([-180, 90]);
        js> point.x;
        -180
        js> point.y;
        90
 */