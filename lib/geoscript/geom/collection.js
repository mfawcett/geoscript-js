/**
 * @module geoscript/geom/collection
 */

var Geometry = require("./geometry").Geometry;
var Factory = require("../factory").Factory;
var GEOM_UTIL = require("./util");
var Point = require("./point").Point;
var LineString = require("./linestring").LineString;
var Polygon = require("./polygon").Polygon;
var UTIL = require("../util");

var _getMethod = GEOM_UTIL._getMethod;
var jts = Packages.com.vividsolutions.jts;

var GeometryCollection = exports.GeometryCollection = UTIL.extend(Geometry, /** @lends GeometryCollection# */ {
    
    /**
        @type {Object}
        @private
     */
    cache: null,
    
    /**
        The dimension of component geometries.  If `null`, the collection may
        have mixed component types.
        @type {Number}
        @private
     */
    componentDimension: null,
    
    /**
        The jts geometry constructor for this collection.
        @type {Class}
        @private
     */
    _Type: jts.geom.GeometryCollection,
    
    /**
        Create a multipart geometry with mixed geometry types.  The items
        in the coords array may be geometry coordinates or :class:`geom.Geometry`
        objects.
        @extends Geometry
        @constructs GeometryCollection
        @arg {Array} coords - Coordinates array
     */
    constructor: function GeometryCollection(coords) {
        Geometry.prototype.constructor.apply(this, [coords]);
    },
    
    /**
        @private
     */
    _create: function(coords) {
        var item, geometry, components = [], _components = [], coordinates = [];
        var constructors = [Point, LineString, Polygon];
        for (var i=0, len=coords.length; i<len; ++i) {
            item = coords[i];
            if (item instanceof Geometry) {
                geometry = item;
            } else {
                var Type;
                if (this.componentDimension !== null) {
                    Type = constructors[this.componentDimension];
                } else {
                    Type = constructors[getDimension(item)];
                }
                geometry = new Type(item);
            }
            components[i] = geometry;
            coordinates[i] = geometry.coordinates;
            _components[i] = geometry._geometry;
        }
        this.cache.components = components;
        return new this._Type(_components, Geometry._factory);
    },
    
    /**
        The component :class:`geom.Geometry` objects that make up this collection.
        @type {Array} 
     */
    get components() {
        var num = _getMethod(this._geometry, "getNumGeometries")();
        var geometries = this.cache.components;
        var dirty = false;
        if (!geometries || geometries.length !== num) {
            geometries = new Array(num);
            dirty = true;
        }
        var geometry;
        for (var i=0; i<num; ++i) {
            geometry = geometries[i];
            if (!(geometry instanceof Geometry)) {
                geometries[i] = Geometry.from_(_getMethod(this._geometry, "getGeometryN")(i));
                dirty = true;
            }
        }
        if (dirty) {
            this.cache.components = geometries;
        }
        return this.cache.components.slice();
    },
    
    /**
        An array of coordinates for the geometry.
        @name Collection#coordinates
        @readonly
        @type {Array} An array of coordinates.
     */
    get coordinates() {
        return this.components.map(function(geometry) {
            return geometry.coordinates;
        });
    }

});

/**
 * Quickly extract the geometry dimension given a coordinates array.
 * Only works with well behaved coordinates.
 * @private
 */
var getDimension = function(coords) {    
    var dim = -1;
    while (coords instanceof Array) {
        ++dim;
        coords = coords[0];
    }
    return dim;
};

// register a collection factory for the module
GEOM_UTIL.register(new Factory(GeometryCollection));
