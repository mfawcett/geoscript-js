var GEOM		= require("../lib/geoscript/geom");
var FEATURE		= require("../lib/geoscript/feature");
var FILTER		= require("../lib/geoscript/filter");
var PROJ		= require("../lib/geoscript/proj");
var LAYER		= require("../lib/geoscript/layer");
var WORKSPACE	= require("../lib/geoscript/workspace");
var VIEWER		= require("../lib/geoscript/viewer");
var STYLE		= require("../lib/geoscript/style");
var MAP			= require("../lib/geoscript/map");

print("Point"); //http://geoscript.org/js/api/geom/point.html
var Point = new GEOM.Point([1, 1]);	//Create a new point at the coordinates [X, Y].

print("==========================");
print(" - [Number] Point.area: " + Point.Area); //The geometry area.
print(" - [geom.bounds] Point.bounds: " + Point.bounds); //The bounds defined by minimum and maximum x and y values in this geometry.
print(" - [geom.Point] Point.centroid: " + Point.centroid); //The centroid of this geometry.
print(" - [Array] Point.coordinates: " + Point.coordinates); //The geometry’s coordinates array.
print(" - [Number] Point.dimension: " + Point.dimension); //The dimension of this geometry.
print(" - [Boolean] Point.empty: " + Point.empty); //The geometry is empty.
print(" - [String] Point.json: " + Point.json); //The JSON representation of the geometry (see http://geojson.org).
print(" - [Number] Point.length: " + Point.length); //The geometry length.
print(" - [Boolean] Point.prepared: " + Point.prepared); //This is a prepared geometry.
print(" - [proj.Projection] Point.projection: " + Point.projection); //Optional projection for the geometry. If this is set, it is assumed that the geometry coordinates are in the corresponding coordinate reference system. Use the transform() method to transform a geometry from one coordinate reference system to another.
print(" - [Boolean] Point.rectangle: " + Point.rectangle); //This geometry is a rectangle.
print(" - [Boolean] Point.simple: " + Point.simple); //The geometry is simple.
print(" - [Boolean] Point.valid: " + Point.valid); //The geometry is valid.
print(" - [Number] Point.x: " + Point.x); //The first coordinate value.
print(" - [Number] Point.y: " + Point.y); //The second coordinate value.
print(" - [Number] Point.z: " + Point.z); //The third coordinate value (or NaN if none).

//Point.buffer(dist,options)
// - dist: Width of buffer. May be positive, negative, or zero.
// - options: Options for the buffer operation.
//    - geom.BUFFER_CAP_BUTT: Used to calculate butt caps for buffer operations.
//    - geom.BUFFER_CAP_ROUND: Used to calculate round caps for buffer operations.
//    - geom.BUFFER_CAP_SQUARE: Used to calculate square caps for buffer operations.
var bufferDistance = 10;
var bufferOptions = {segs: 8, caps: GEOM.BUFFER_CAP_ROUND, single: false };
var PointBuffer = Point.buffer(bufferDistance, bufferOptions);

VIEWER.draw(PointBuffer);

var PostGIS_Medford = new WORKSPACE.PostGIS({database: "geoscript", host: "localhost", password: "geoscript", port: "54321", schema: "public", user: "geoscript"});
print(PostGIS_Medford);