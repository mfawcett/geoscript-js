/** 
 * @module geoscript/geom/multipoint
 */

var Factory = require("../factory").Factory;
var GeometryCollection = require("./collection").GeometryCollection;
var Point = require("./point").Point;
var UTIL = require("../util");
var GEOM_UTIL = require("./util");

var jts = Packages.com.vividsolutions.jts;

var MultiPoint = exports.MultiPoint = UTIL.extend(GeometryCollection, /** @lends MultiPoint# */ {
    
    /**
        The dimension of component geometries.
        @type {Number}
        @private
     */
    componentDimension: 0,
    
    /**
        The jts geometry constructor for this collection.
        @type {Class}
        @private
     */
    _Type: jts.geom.MultiPoint,
    
    /**
        Create a new multi-point geometry.  The items in the coords array
        may be point coordinates or :class:`Point` objects.
        @extends GeometryCollection
        @constructs MultiPoint
        @arg {Array} coords - Coordinates array.
     */
    constructor: function MultiPoint(coords) {
        GeometryCollection.prototype.constructor.apply(this, [coords]);
    }
    
});


// register a multipoint factory for the module
GEOM_UTIL.register(new Factory(MultiPoint));

/**
    Sample code to new multi-point:
   
    .. code-block:: javascript
   
        js> var p1 = new GEOM.Point([-180, 90]);
        js> var p2 = new GEOM.Point([-45, 45]);
        js> var mp = new GEOM.MultiPoint([p1, p2]);
  
    Alternate method to create the same geometry as above:
   
    .. code-block:: javascript
   
        js> var mp = new GEOM.MultiPoint([
          >     [-180, 90], [-45, 45]
          > ]);
 */
