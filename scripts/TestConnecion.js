var GEOM		= require("../lib/geoscript/geom");
var FEATURE		= require("../lib/geoscript/feature");
var FILTER		= require("../lib/geoscript/filter");
var PROJ		= require("../lib/geoscript/proj");
var LAYER		= require("../lib/geoscript/layer");
var WORKSPACE	= require("../lib/geoscript/workspace");
var VIEWER		= require("../lib/geoscript/viewer");
var STYLE		= require("../lib/geoscript/style");
var MAP			= require("../lib/geoscript/map");
var UTIL		= require("../lib/geoscript/util");
var BUCKETS 	= require("../lib/buckets").buckets;

/*
String url = "jdbc:postgresql://localhost/test";
Properties props = new Properties();
props.setProperty("user","fred");
props.setProperty("password","secret");
props.setProperty("ssl","true");
Connection conn = DriverManager.getConnection(url, props);

String url = "jdbc:postgresql://localhost/test?user=fred&password=secret&ssl=true";
Connection conn = DriverManager.getConnection(url);
*/


var driver = new Packages.org.postgresql.Driver();

if (driver instanceof org.postgresql.Driver) {
	print("-- driver is valid");
	
	for (k in driver) {
		print("k: ", k);
	}
} else {
	print("-- driver invalid");
}

var meta = {
    pg: {
    	connection: null,
        driver: new Packages.org.postgresql.Driver,
        setUp: function() {
            var uri = "jdbc:postgresql://localhost:5432/postgres";
            var params = new java.util.Properties();
            params.setProperty("user", "postgres");
            params.setProperty("password", "postgres");
            connection = meta.pg.driver.connect(uri, params);
        }
    }
};

meta.pg.setUp();
print(connection);
print("==========================");

//var PostGIS_Medford = new WORKSPACE.PostGIS({database: "geoscript", host: "localhost", password: "geoscript", port: "54321", schema: "public", user: "geoscript"});
//print(PostGIS_Medford);