/** 
 * @module geoscript/geom/multilinestring
 */

var Factory = require("../factory").Factory;
var GeometryCollection = require("./collection").GeometryCollection;
var LineString = require("./linestring").LineString;
var UTIL = require("../util");
var GEOM_UTIL = require("./util");

var jts = Packages.com.vividsolutions.jts;

var MultiLineString = exports.MultiLineString = UTIL.extend(GeometryCollection, /** @lends MultiLineString# */ {
    
    /**
        The dimension of component geometries.
        @type {Number}
        @private
     */
    componentDimension: 1,
    
    /**
        The jts geometry constructor for this collection.
        @type {Class}
        @private
     */
    _Type: jts.geom.MultiLineString,
    
    /**
        List all start and end points for all components.
        @type {Array}
     */
    get endPoints() {
        var points = [];
        this.components.forEach(function(line) {
            points.push(line.startPoint, line.endPoint);
        });
        return points;
    },

    /**
        Create a new multi-linestring geometry.  The items in the coords array
        may be linestring coordinates or :class:`LineString` objects.
        @extends GeometryCollection
        @constructs MultiLineString
        @arg {Array} coords - Coordinates array.
     */
    constructor: function MultiLineString(coords) {
        GeometryCollection.prototype.constructor.apply(this, [coords]);
    }
    
});

// register a polygon factory for the module
GEOM_UTIL.register(new Factory(MultiLineString));

/**
    Sample code to new multi-linestring:
   
    .. code-block:: javascript
   
        js> var l1 = new GEOM.LineString([[-180, -90], [0, 0], [180, 90]]);
        js> var l2 = new GEOM.LineString([[180, -90], [0, 0], [-180, 90]]);
        js> var ml = new GEOM.MultiLineString([l1, l2]);
  
    Alternate method to create the same geometry as above:
   
    .. code-block:: javascript
   
        js> var ml = new GEOM.MultiLineString([
          >     [[-180, -90], [0, 0], [180, 90]],
          >     [[180, -90], [0, 0], [-180, 90]]
          > ]);
 */
