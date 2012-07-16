var GEOM		= require("geoscript/geom");
var FEATURE		= require("geoscript/feature");
var FILTER		= require("geoscript/filter");
var LAYER		= require("geoscript/layer");
var WORKSPACE	= require("geoscript/workspace");
var VIEWER		= require("geoscript/viewer");
var STYLE		= require("geoscript/style");
var MAP			= require("geoscript/map");

// Hard-coded inputs.  These should be passed in as generically as possible
var postgis = new WORKSPACE.PostGIS({
	database:	"GeoScript_Test",
	host:		"192.168.10.140",
	port:		5432,
	schema:		"public",
	user:		"postgres",
	password:	"p0stGISAdm!n"	
});
var features = postgis.get("polygons").query(new FILTER.Filter("CONTAINS(buffer(POINT(-122.7668 42.4979), 0.01), centroid(geom))"));
//		"DWITHIN(centroid(geom), POINT(-122.7668 42.4979), 700, meters)"));
// End hard-coded inputs

var i = 0;
features.forEach(function (f) {
	i = i + 1;
	var calc  = new Packages.org.geotools.referencing.GeodeticCalculator();
	calc.setStartingGeographicPoint(-122.7668, 42.4979);
	
	var p = f.geometry.centroid;
	calc.setDestinationGeographicPoint(p.x, p.y);
	
	var bearing = calc.getAzimuth();
	print("bearing: " + bearing);
	
	var distance = calc.getOrthodromicDistance();
	print("distance: " + distance);
});

print("feature count: " + i);
postgis.close();
