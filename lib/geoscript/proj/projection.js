var UTIL = require("../util");
var GeoObject = require("../object").GeoObject;

var geotools = Packages.org.geotools;
var CRS = geotools.referencing.CRS;
var GeographicCRS = org.opengis.referencing.crs.GeographicCRS;
var AxisDirection = org.opengis.referencing.cs.AxisDirection;

// Supress non-critical messages
var logger = geotools.util.logging.Logging.getLogger(
    "org.geotools.referencing.factory.epsg"
);
logger.setLevel(java.util.logging.Level.WARNING); 

// Force GeoTools' referencing system to use x,y order
if (!java.lang.System.getProperty("org.geotools.referencing.forceXY")) {
    java.lang.System.setProperty("org.geotools.referencing.forceXY", "true");
}
var Hints = geotools.factory.Hints;
if (!Hints.getSystemDefault(Hints.FORCE_LONGITUDE_FIRST_AXIS_ORDER)) {
    Hints.putSystemDefault(Hints.FORCE_AXIS_ORDER_HONORING, "http");
}
Hints.putSystemDefault(Hints.COMPARISON_TOLERANCE, 1e-9);


/** api: (define)
 *  module = proj
 *  class = Projection
 */
var Projection = UTIL.extend(GeoObject, {
    
    /**
        @type {Object}
        @private
     */
    cache: null,
    
    /**
        .. class:: Projection
        
            :arg id: ``String`` Coordinate reference system identifier or 
                well-known text for the projection.
      
            Create a new projection object.
     */
    constructor: function Projection(id) {
        this.cache = {};
        if (id) {
            var _projection;
            try {
                // could be SRID
                _projection = CRS.decode(id);
            } catch(err) {
                try {
                    // could be Well-Known Text
                    _projection = CRS.parseWKT(id);
                } catch(err) {
                    throw "Unable to create Projection object from " + id;
                }
            }
            this._projection = _projection;
        }
    },
    
    /**
        Determine if this projection is equivalent to the given projection.

        @arg {proj.Projection} projection 
        @returns {Boolean} The two projections are equivalent.
     */
    equals: function(projection) {
        return CRS.equalsIgnoreMetadata(this._projection, projection._projection);
    },

    /**
        The coordinate reference system identifier.
        @type {String}
     */
    get id() {
        var id = null;
        if (this._projection) {
            id = this.cache.id;
            if (!id) {
                var _id = CRS.lookupIdentifier(this._projection, true);
                if (_id) {
                    id = String(_id);
                    this.cache.id = id;
                }
            }
        }
        return id;
    },
    
    get geographic() {
        return this._projection instanceof GeographicCRS;
    },
    
    get axesOrder() {
        var order;
        var first = this._projection.getAxis(0);
        var second = this._projection.getAxis(1);
        if (this.geographic) {
            if (first.getDirection().equals(AxisDirection.NORTH)) {
                order = [Projection.NORTH, Projection.EAST];
            } else {
                order = [Projection.EAST, Projection.NORTH];
            }
        } else {
            if (first.getDirection().equals(AxisDirection.GEOCENTRIC_X)) {
                order = [Projection.X, Projection.Y];
            } else {
                order = [Projection.Y, Projection.X];
            }
        }
        return order;
    },
    
    /**
        The well-known text representation of the coordinate reference system.
        @type {String}
     */
    get wkt() {
        var wkt = null;
        if (this._projection) {
            wkt = this.cache.wkt;
            if (!wkt) {
                wkt = String(this._projection.toString());
                this.cache.wkt = wkt;
            }
        }
        return wkt;
    },
    
    /**
        @private
     */
    get config() {
        return {
            type: this.constructor.name,
            id: this.id
        };
    },
    
    toFullString: function() {
        return this.id;
    }
    
});

Projection.from_ = function(_projection) {
    var projection = new Projection();
    projection._projection = _projection;
    return projection;
};

Projection.getIds = function(prefix) {
    var codes = [];
    prefix = prefix || "EPSG";
    CRS.getSupportedCodes(prefix).toArray().forEach(function(code) {
        codes.push(String(prefix + ":" + code));
    });
    return codes;
};

Projection.NORTH = AxisDirection.NORTH;
Projection.EAST = AxisDirection.EAST;
Projection.X = AxisDirection.GEOCENTRIC_X;
Projection.Y = AxisDirection.GEOCENTRIC_Y;

/**
    Sample code to create a new projection object:
   
    .. code-block:: javascript
  
        js> var wgs84 = new PROJ.Projection("EPSG:4326")
        js> wgs84
        <Projection EPSG:4326>
        js> wgs84.wkt
        GEOGCS["WGS 84", 
          DATUM["World Geodetic System 1984", 
            SPHEROID["WGS 84", 6378137.0, 298.257223563, AUTHORITY["EPSG","7030"]], 
            AUTHORITY["EPSG","6326"]], 
          PRIMEM["Greenwich", 0.0, AUTHORITY["EPSG","8901"]], 
          UNIT["degree", 0.017453292519943295], 
          AXIS["Geodetic longitude", EAST], 
          AXIS["Geodetic latitude", NORTH], 
          AUTHORITY["EPSG","4326"]]
 */

exports.Projection = Projection;
