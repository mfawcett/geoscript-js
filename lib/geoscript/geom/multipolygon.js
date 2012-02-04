/** 
 * @module geoscript/geom/multipolygon
 */

var Factory = require("../factory").Factory;
var GeometryCollection = require("./collection").GeometryCollection;
var Polygon = require("./polygon").Polygon;
var GEOM_UTIL = require("./util");
var UTIL = require("../util");

var jts = Packages.com.vividsolutions.jts;

var MultiPolygon = exports.MultiPolygon = UTIL.extend(GeometryCollection, /** @lends MultiPolygon# */ {
    
    /**
        The dimension of component geometries.
        @type {Number}
        @private
     */
    componentDimension: 2,
    
    /**
        The jts geometry constructor for this collection.
        @type {Class}
        @private
     */
    _Type: jts.geom.MultiPolygon,
    
    /**
        Create a new multipolygon geometry.  The items in the coords array
        may be polygon coordinates or :class:`Polygon` objects.
        @extends GeometryCollection
        @constructs MultiPolygon
        @arg {Array} coords - Coordinates array.
     */
    constructor: function MultiPolygon(coords) {
        GeometryCollection.prototype.constructor.apply(this, [coords]);
    }
    
});

// register a polygon factory for the module
GEOM_UTIL.register(new Factory(MultiPolygon, {
    handles: function(config) {
        config = GEOM_UTIL._prepConfig(config);
        var capable = false;
        if (config.coordinates && config.coordinates instanceof Array) {
            for (var i=0, ii=config.coordinates.length; i<ii; ++i) {
                var c = config.coordinates[i];
                if (c instanceof Array) {
                    for (var j=0, jj=c.length; j<jj; ++j) {
                        var r = c[j];
                        if (r instanceof Array) {
                            for (var k=0, kk=r.length; k<kk; ++k) {
                                var p = r[k];
                                var len = p.length;
                                if (len === 2 || len === 3) {
                                    capable = true;
                                    for (var l=0; l<len; ++l) {
                                        capable = capable && (typeof p[l] === "number");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return capable;
    }
}));

/**
    Sample code to new multi-polygon:
   
    .. code-block:: javascript
   
        js> var p1 = new GEOM.Polygon([
          >     [ [-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90] ],
          >     [ [-90, -45], [-90, 45], [90, 45], [90, -45], [-90, -45] ]
          > ]);
        js> var p2 = new GEOM.Polygon([
          >     [ [-60, -30], [-60, 30], [60, 30], [60, -30], [-60, -30] ]
          > ]);
        js> var mp = new GEOM.MultiPolygon([p1, p2]);
  
    Alternate method to create the same geometry as above:
   
    .. code-block:: javascript
   
        js> var mp = new GEOM.MultiPolygon([
          >     [
          >         [ [-180, -90], [-180, 90], [180, 90], [180, -90], [-180, -90] ],
          >         [ [-90, -45], [-90, 45], [90, 45], [90, -45], [-90, -45] ]
          >     ], [
          >         [ [-60, -30], [-60, 30], [60, 30], [60, -30], [-60, -30] ]
          >     ]
          > ]);
 */