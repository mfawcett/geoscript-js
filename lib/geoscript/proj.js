/** api: module = proj */

/**
    Projection related functionality.
 */

/**
    The :mod:`proj` module exports a Projection constructor and methods for
    transforming geometries between coordinate reference systems.
  
    .. code-block:: javascript
    
        js> var PROJ = require("geoscript/proj");
 */

/** api: classes[] = projection */
var Projection = require("./proj/projection").Projection;

/**
    Tranform a geometry from one coordinate reference system to another.
    Returns a new geometry.  The ``from`` and ``to`` arguments can be
    :class:`proj.Projection` instances or the string values used to construct
    them.
  
    Example use:
  
    .. code-block:: javascript
    
        js> var GEOM = require("geoscript/geom");
        js> var p1 = new GEOM.Point([-111.0, 45.7]);
        js> var p2 = PROJ.transform(p1, "epsg:4326", "epsg:26912");
        js> Math.floor(p2.x)
        499999
        js> Math.floor(p2.y)
        5060716

    @arg {geom.Geometry} geometry 
    @arg {proj.Projection} from - or ``String``
    @arg {proj.Projection} to - or ``String``
    @returns {geom.Geometry}
 */
var transform = function(geometry, from, to) {
    if (!(from instanceof Projection)) {
        from = new Projection(from);
    }
    geometry.projection = from;
    return geometry.transform(to);
};

exports.transform = transform;
exports.Projection = Projection;

