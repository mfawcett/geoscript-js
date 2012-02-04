/**
 * @module geoscript/geom/geometry
 */

var GEOM_UTIL = require("./util");
var UTIL = require("../util");
var PROJ = require("../proj");
var GeoObject = require("../object").GeoObject;

var jts = Packages.com.vividsolutions.jts;
var BufferParameters = jts.operation.buffer.BufferParameters;
var BufferOp = jts.operation.buffer.BufferOp;
var Simplifier = jts.simplify.DouglasPeuckerSimplifier;
var geotools = Packages.org.geotools;
var CRS = geotools.referencing.CRS;
var GeometryTX = geotools.geometry.jts.GeometryCoordinateSequenceTransformer;
var prepFactory = new jts.geom.prep.PreparedGeometryFactory();
var AffineTransform = java.awt.geom.AffineTransform;
var JTS = geotools.geometry.jts.JTS;
var AffineTransform2D = geotools.referencing.operation.transform.AffineTransform2D;
var _getMethod = GEOM_UTIL._getMethod;
var _prepConfig = GEOM_UTIL._prepConfig;

var arrayRepr = function(array) {
    var str;
    if (array.map) {
        str = "[" + array.map(arrayRepr).join(", ") + "]";
    } else {
        str = array;
    }
    return str;
}

var sameProjection = function(source, other) {
    if (source.projection && other.projection && !source.projection.equals(other.projection)) {
        other = other.transform(source.projection);
    }
    return other;
};

var Geometry = exports.Geometry = UTIL.extend(GeoObject, /** @lends Geometry# */ {
    
    /**
        @type {jts.geom.Geometry}
        @private
     */
    _geometry: undefined,
    
    /**
        @type {Object}
        @private
     */
    cache: null,

    /**
        A Geometry instance should not be created directly. Create an instance
        of a Geometry subclass instead.
        @constructs Geometry
     */
    constructor: function Geometry(config) {
        this.cache = {};
        config = _prepConfig(config);
        if (config.coordinates) {
            this._geometry = this._create(config.coordinates);
        }
        if (config.projection) {
            this.projection = config.projection;
        }
    },
    
    /**
        Create a JTS geometry from an array of coordinates.  Must be 
        implemented by a subclass.
        
        @param {Array} A coordinates array.
        @private
     */
    _create: function(coords) {
        throw new Error("Geometry subclass must implement _create.");
    },
    
    /**
        Optional projection for the geometry. If this is set, it is assumed that
        the geometry coordinates are in the corresponding coordinate reference
        system. Use the {@link Geometry#transform} method to transform a
        geometry from one coordinate reference system to another.

        @name Geometry#projection
        @type {proj.Projection}
     */
    get projection() {
        return this.cache.projection;
    },
    set projection(projection) {
        if (projection) {
            if (typeof projection == "string") {
                projection = new PROJ.Projection(projection);
            }
            // clear anything else in the cache
            this.cache = {projection: projection};
        }
    },
    
    /**
        Transform coordinates of this geometry to the given projection. The
        {@link Geometry#projection} of this geometry must be set before calling
        this method. Returns a new geometry.

        @arg {proj.Projection} to - the destination projection
        @returns {geom.Geometry}
     */
    transform: function(to) {
        var transformed;
        if (typeof to === "string") {
            to = new PROJ.Projection(to);
        }
        if (to instanceof PROJ.Projection) {
            var from = this.projection;
            if (!from) {
                throw "Projection must be set before calling transform.";
            }
            var gt = new GeometryTX();
            gt.mathTransform = CRS.findMathTransform(from._projection, to._projection);
            var _geometry = gt.transform(this._geometry);
            transformed = Geometry.from_(_geometry);
            transformed.projection = to;
        } else {
            // affine transform
            to = UTIL.applyIf(to, {
                dx: 0, dy: 0,
                sx: 1, sy: 1,
                shx: 0, shy: 0,
                rotation: 0
            });
            var transform = new AffineTransform(to.sx, to.shy, to.shx, to.sy, to.dx, to.dy);
            transform.rotate(to.rotation);
            var _geometry = JTS.transform(this._geometry, new AffineTransform2D(transform));
            transformed = Geometry.from_(_geometry);
            transformed.projection = this.projection;
        }
        return transformed;    
    },
    
    /** 
        Prepare a geometry for multiple spatial operations. Preparing optimizes
        the geometry for multiple calls to {@link Geometry#contains}, {@link
        Geometry#coveredBy}, {@link Geometry#covers}, {@link Geometry#crosses},
        {@link Geometry#disjoint}, {@link Geometry#intersects}, {@link
        Geometry#overlaps}, {@link Geometry#touches}, and {@link Geometry#within}.

        @returns {Geometry}
     */
    prepare: function() {
        if (!this.prepared) {
            this._geometry = prepFactory.create(this._geometry);
        }
        return this;
    },
    
    /**
        This is a prepared geometry.  See {@link Geometry#prepare}.
        @name Geometry#prepared
        @readonly
        @type {Boolean}
     */
    get prepared() {
        return this._geometry instanceof jts.geom.prep.PreparedGeometry;
    },

    /** 
        The geometry's coordinates array.
        @name Geometry#coordinates
        @readonly
        @type {Array}
     */
    get coordinates() {
        return this._extractCoordinates(this._geometry);
    },
    
    /**
        The bounds defined by minimum and maximum x and y values in this geometry.
        @name Geometry#bounds
        @readonly
        @type {geom.Bounds}
     */
    get bounds() {
        if (!this.cache.bounds) {
            var _bounds = _getMethod(this._geometry, "getEnvelopeInternal")();
            var bounds = GEOM_UTIL.create({
                type: "Bounds",
                minx: Number(_bounds.getMinX()), maxx: Number(_bounds.getMaxX()),
                miny: Number(_bounds.getMinY()), maxy: Number(_bounds.getMaxY()),
                projection: this.projection
            });
            this.cache.bounds = bounds;
        }
        return this.cache.bounds;
    },
    
    /**
        Generate an array of coordinates for the geometry.
        @returns {Array} An array of coordinates.
        @private
     */
    _extractCoordinates: function() {
        throw new Error("Geometry subclasses must implement _extractCoordinates.");
    },

    /**
        The Well-Known Text representation of the geometry.
        @returns {String}
        @private
     */
    toFullString: function() {
        return arrayRepr(this.coordinates);
    },
    
    /**
        The JSON representation of the geometry (see {@link http://geojson.org}).
        @name Geometry#json
        @readonly
        @type {String}
     */
    
    /**
        @name Geometry#config
        @readonly
        @type {Object}
        @private
     */
    get config() {
        return {
            type: this.constructor.name,
            coordinates: this.coordinates
        };
    },
    
    /**
        The centroid of this geometry.
        @name Geometry#centroid
        @readonly
        @type {geom.Point}
     */
    get centroid() {
        var _point = this._geometry.getCentroid();
        var point = Geometry.from_(_point);
        point.projection = this.projection;
        return point;
    },

    /**
        The dimension of this geometry.
        @name Geometry#dimension
        @readonly
        @type {Number}
     */
    get dimension() {
        return this._geometry.getDimension();
    },

    /** 
        Construct a geometry that buffers this geometry by the given width.

        @arg {Number} dist - Width of buffer.  May be positive, negative, or
            zero.
        @arg {Object} options - Options for the buffer operation.
        @arg {Number} options.segs - Integer number of quadrant segments for 
            circular arcs.  Default is 8.
        @arg {Number} options.caps - One of :data:`BUFFER_CAP_ROUND`,
            :data:`BUFFER_CAP_BUTT`, or :data:`BUFFER_CAP_SQUARE`.  Default
            is :data:`BUFFER_CAP_ROUND`.
        @arg {Boolean} options.single - Create a single-sided buffer.  Default is 
            ``false``.

        @returns {Geometry}
     */
    buffer: function(dist, options) {
        options = options || {};
        var params = new BufferParameters();
        params.setSingleSided(!!options.single);
        params.setQuadrantSegments(options.segs || 8);
        params.setEndCapStyle(options.caps || GEOM_UTIL.BUFFER_CAP_ROUND);
        
        var _geometry = this._geometry;
        if (this.prepared) {
            _geometry = _geometry.getGeometry();
        }
        var geometry = Geometry.from_(BufferOp.bufferOp(_geometry, dist, params)); 
        geometry.projection = this.projection;
        return geometry;
    },
    
    /**
        Simplify the geometry using the standard Douglas-Peucker algorithm.
        Returns a new geometry.

        @arg {Number} tolerance - The distance tolerance for the simplification. 
            All vertices in the simplified geometry will be within this distance
            of the original geometry. The tolerance value must be non-negative.
        @returns {Geometry}
     */
    simplify: function(tolerance) {
        tolerance = (tolerance > 0) ? tolerance : 0;
        var _geometry;
        try {
            _geometry = Simplifier.simplify(this._geometry, tolerance);
        } catch (err) {
            throw new Error("Unable to simplify geometry with tolerance: " + tolerance);
        }
        var geometry = Geometry.from_(_geometry);
        geometry.projection = this.projection;
        return geometry;
    },
    
    /**
        Returns the minimum distance between this and the supplied geometry.

        @arg {Geometry} geometry
        @returns {Number}
     */
    distance: function(geometry) {
        geometry = sameProjection(this, geometry);
        return _getMethod(this._geometry, "distance")(geometry._geometry);
    },
    
    /**
        The geometry area.
        @name Geometry#area
        @readonly
        @type {Number}
     */
    get area() {
        return _getMethod(this._geometry, "getArea")();
    },

    /**
        The geometry length.
        @name Geometry#length
        @readonly
        @type {Number}
     */
    get length() {
        return _getMethod(this._geometry, "getLength")();
    }
    
});

var constructive = [
    /**
        Creates a complete copy of this geometry.

        @name Geometry#clone
        @method
        @returns {Geometry}
     */
    "clone",

    /**
        Computes the smallest convex :class:`Polygon` that contains this
        geometry.

        @name Geometry#convexHull
        @method
        @returns {Geometry}
     */
    "convexHull", 

    /**
        Creates a geometry made up of all the points in this geometry that are
        not in the other geometry.

        @name Geometry#difference
        @method
        @arg {Geometry} other
        @returns {Geometry}
     */
    "difference", 

    /**
        Returns the boundary, or an empty geometry of appropriate dimension if
        this geometry is empty.

        @name Geometry#getBoundary
        @method
        @returns {Geometry}
     */
    "getBoundary", 

    /**
        Returns this geometry's bounding box.

        @name Geometry#getEnvelope
        @method
        @returns {Geometry}        
     */
    "getEnvelope", 

    /**
        Creates a geometry representing all the points shared by this geometry
        and the other.

        @name Geometry#intersection
        @method
        @arg {Geometry} other
        @returns {Geometry}
     */
    "intersection", 

    /**
        Creates a geometry representing all the points in this geometry but not
        in the other plus all the points in the other but not in this geometry.

        @name Geometry#symDifference
        @method
        @arg {Geometry} other
        @returns {Geometry}
     */
    "symDifference",

    /**
        Creates a geometry representing all the points in this geometry but not
        in the other plus all the points in the other but not in this geometry.

        @name Geometry#symDifference
        @method
        @arg {Geometry} other
        @returns {Geometry}
     */
    "union"
];
constructive.forEach(function(method) {
    Geometry.prototype[method] = function() {
        var _geometry;
        if (arguments.length) {
            _geometry = _getMethod(this._geometry, method)(sameProjection(this, arguments[0])._geometry);
        } else {
            _geometry = _getMethod(this._geometry, method)();            
        }
        var geometry = Geometry.from_(_geometry);
        geometry.projection = this.projection;
        return geometry;
    };
});

var unary = [
    /**
        The geometry is empty.
        @name Geometry#empty
        @readonly
        @type {Boolean}
     */
    ["empty", "isEmpty"],

    /**
        This geometry is a rectangle.
        @name Geometry#rectangle
        @readonly
        @type {Boolean}
     */
    ["rectangle", "isRectangle"],

    /**
        The geometry is simple.
        @name Geometry#simple
        @readonly
        @type {Boolean}
     */
    ["simple", "isSimple"],

    /** 
        The geometry is valid.
        @name Geometry#valid
        @readonly
        @type {Boolean}
     */    
    ["valid", "isValid"]
];
unary.forEach(function(pair) {
    Object.defineProperty(Geometry.prototype, pair[0], {
        get: function() {
             return Boolean(_getMethod(this._geometry, pair[1])());
        },
        enumerable: true
    });
});

var binary = [
    /**
        Tests if this geometry contains the other geometry (without boundaries
        touching).

        @name Geometry#contains
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "contains",

    /**
        Tests if this geometry is covered by other geometry.

        @name Geometry#coveredBy
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */    
    "coveredBy",

    /**
        Tests if this geometry covers the other geometry.
        
        @name Geometry#covers
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */    
    "covers",

    /**
        Tests if this geometry crosses the other geometry.

        @name Geometry#crosses
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "crosses",

    /**
        Tests if this geometry is disjoint to the other geometry.
        
        @name Geometry#disjoint
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "disjoint",

    /**
        Geometries are considered equal if they share at least one point in
        common and if no point of either geometry lies in the exterior of the
        other.

        @name Geometry#equals
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "equals",

    /**
        Tests if this geometry is exactly equal to the other geometry.

        @name Geometry#equalsExact
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "equalsExact",

    /**
        Tests if this geometry overlaps the other geometry.

        @name Geometry#overlaps
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "overlaps",

    /**
        Tests if this geometry intersects the other geometry.

        @name Geometry#intersects
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "intersects",

    /**
        Tests if this geometry only touches the other geometry.

        @name Geometry#touches
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "touches",

    /**
        Tests if this geometry is within the other geometry.  This is the
        inverse of {@link Geometry#contains}.

        @name Geometry#within
        @method
        @arg {Geometry} other
        @returns {Boolean}
     */
    "within"
];
binary.forEach(function(method) {
    Geometry.prototype[method] = function(g) {
        return Boolean(_getMethod(this._geometry, method)(sameProjection(this, g)._geometry));
    }
});

/** 
    A jts geometry factory.
    @type {jts.geom.GeometryFactory}
    @private
 */
Geometry._factory = new jts.geom.GeometryFactory();

/** 
    Create a geoscript geometry object from a JTS geometry object.
    @arg {jts.geom.Geometry} geometry - A JTS geometry object.
    @returns {Geometry}
    @private
 */
Geometry.from_ = function(_geometry) {
    var name = String(_getMethod(_geometry, "getGeometryType")());
    var g = GEOM_UTIL.create({type: name});
    g._geometry = _geometry;
    return g;
};
