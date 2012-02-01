var GEOM_UTIL = require("./geom/util");

/**
 * @module geoscript/geom
 */

/** api: module = geom */

/** api: synopsis
 *  A collection of geometry types.
 */

/** api: summary
 *  The :mod:`geom` module provides a provides constructors for point, line,
 *  polygon and multi-part geometries.
 *
 *  .. code-block:: javascript
 *  
 *      js> var GEOM = require("geoscript/geom");
 */

/**
 *  Used to calculate round caps for buffer operations.
 */
exports.BUFFER_CAP_ROUND = GEOM_UTIL.BUFFER_CAP_ROUND;

/**
 *  Used to calculate square caps for buffer operations.
 */
exports.BUFFER_CAP_SQUARE = GEOM_UTIL.BUFFER_CAP_SQUARE;

/**
 *  Used to calculate butt caps for buffer operations.
 */
exports.BUFFER_CAP_BUTT = GEOM_UTIL.BUFFER_CAP_BUTT;

exports.Geometry = require("./geom/geometry").Geometry;

exports.Point = require("./geom/point").Point;

exports.LineString = require("./geom/linestring").LineString;

exports.Polygon = require("./geom/polygon").Polygon;

exports.GeometryCollection = require("./geom/collection").GeometryCollection;

exports.MultiPoint = require("./geom/multipoint").MultiPoint;

exports.MultiLineString = require("./geom/multilinestring").MultiLineString;

exports.MultiPolygon = require("./geom/multipolygon").MultiPolygon;

exports.Bounds = require("./geom/bounds").Bounds;


/** 
 *  Create a geometry given a configuration object.
 *  @private
 *  @param {Object} Configuration object.
 *  @returns {geom.Geometry}
 */
exports.create = GEOM_UTIL.create;
