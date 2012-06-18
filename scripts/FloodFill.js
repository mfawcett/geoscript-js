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

var startPoint = new GEOM.Point([10, 10]);	//Create a new point at the coordinates [X, Y].

var poly = new GEOM.Polygon([
                             	[ [5, 5], [5, 15], [15, 15], [15, 5], [5, 5] ]
                            ]);

var gird = [];
var g_rows = 20;
var g_columns = 20;

for (ii = 0; ii < g_rows; ii++) {
	gird[ii] = [];
	for (j = 0; j < g_columns; j++) {
		var currentPoint = new GEOM.Point([ii, j]);
		
		if (poly.contains(currentPoint)) {
			gird[ii][j] = 1;
		} else {
			gird[ii][j] = 0;
		}
	}
} 

// dump grid
/*
for (ii = 0; ii < g_rows; ii++) {
	for (j = 0; j < g_columns; j++) {
		print(gird[ii][j] + ",");
	}
} 
*/

var PlannerNode = UTIL.extend(Object, {
	
	x: null,
	y: null,
	parent: null,
	g: 0,

    constructor: function PlannerNode(parent, x, y, g) {
    	this.parent = parent;
    	this.x = x;
    	this.y = y;
		this.g = g;
    },

    getHash: function() {
    	return (this.x << 16 | this.y);
    },
    
    toString: function() {
    	return ("x: " + this.x + ", y: " + this.y + ", g: " + this.g + ", parent: " + (this.parent?true:false) + ", hash: " + this.getHash());
	}
});


function comparePlannerNode(n1, n2) {
	if (n1.g < n2.g) {
		return -1;
	} else if (n1.g > n2.g) {
		return 1;
	} 
	
	return 0;
}

var openQueue = new BUCKETS.PriorityQueue(comparePlannerNode);
var allMap = new BUCKETS.Dictionary();

var startNode = new PlannerNode(null, 10, 10, 0);
openQueue.add(startNode);
allMap.set(startNode.getHash(), startNode);

var gMax = 3;

while (!openQueue.isEmpty()) {
	
	print("openQueue.length: " + openQueue.size());
	print("allMap.length: " + allMap.size());
	var node = openQueue.dequeue();
	
	// check a potential solution's parents
	/*
	if (node.g >= gMax) {
		print("node reached max reachability");
		var n = node;
		print ("---- solution: ");
		
		while (n) {
			print(n.toString());
			n = n.parent;
		}
		
		break;
	}
	*/
	
	for (ii = 0; ii < 3; ii++) {
		for (j = 0; j < 3; j++) {
			// skip center spot
			if (ii == 1 && j == 1)
				continue;
			
			var cx = node.x - 1 + ii;
			var cy = node.y - 1 + j;
			
			// if we are in bounds
			if (cx > -1 && cx < g_rows && cy > -1 && cy < g_columns) {
				var hash = (cx << 16 | cy);
				
				var existingNode = allMap.get(hash);
				print("-- child.x: ", cx, ", child.y: ", cy, ", hash: ", hash, ", new: ", (existingNode==undefined?true:false));
				
				// only if this spot has not been visited in the past
				if (existingNode == undefined) {
					var cg = node.g + 1;
					
					// do not push nodes that are beyond reachability cut-off
					if(cg <= gMax) {
						var point = new GEOM.Point([cx, cy]);
						// only if the poly containes it
						if (poly.contains(point)) {
							var child =  new PlannerNode(node, cx, cy, cg);
							openQueue.add(child);
							// added to allMap so we do not regenerate this node again 
							allMap.set(hash, child);
						}
							
					}
				} else {
					//print("-- location is already closed: " + closedNode.toString())
				}
			}
		}
	}	
}


print("==========================");
print(" - [Number] Point.area: " + poly.Area); //The geometry area.
print(" - [geom.bounds] Point.bounds: " + poly.bounds); //The bounds defined by minimum and maximum x and y values in this geometry.
print(" - [geom.Point] Point.centroid: " + poly.centroid); //The centroid of this geometry.
print(" - [Array] Point.coordinates: " + poly.coordinates); //The geometry’s coordinates array.
print(" - [Number] Point.dimension: " + poly.dimension); //The dimension of this geometry.
print(" - [Boolean] Point.empty: " + poly.empty); //The geometry is empty.
print(" - [String] Point.json: " + poly.json); //The JSON representation of the geometry (see http://geojson.org).
print(" - [Number] Point.length: " + poly.length); //The geometry length.
print(" - [Boolean] Point.prepared: " + poly.prepared); //This is a prepared geometry.
print(" - [proj.Projection] Point.projection: " + poly.projection); //Optional projection for the geometry. If this is set, it is assumed that the geometry coordinates are in the corresponding coordinate reference system. Use the transform() method to transform a geometry from one coordinate reference system to another.
print(" - [Boolean] Point.rectangle: " + poly.rectangle); //This geometry is a rectangle.
print(" - [Boolean] Point.simple: " + poly.simple); //The geometry is simple.
print(" - [Boolean] Point.valid: " + poly.valid); //The geometry is valid.
//print(" - [Number] Point.x: " + Point.x); //The first coordinate value.
//print(" - [Number] Point.y: " + Point.y); //The second coordinate value.
//print(" - [Number] Point.z: " + Point.z); //The third coordinate value (or NaN if none).

//Point.buffer(dist,options)
// - dist: Width of buffer. May be positive, negative, or zero.
// - options: Options for the buffer operation.
//    - geom.BUFFER_CAP_BUTT: Used to calculate butt caps for buffer operations.
//    - geom.BUFFER_CAP_ROUND: Used to calculate round caps for buffer operations.
//    - geom.BUFFER_CAP_SQUARE: Used to calculate square caps for buffer operations.
//var bufferDistance = 10;
//var bufferOptions = {segs: 8, caps: GEOM.BUFFER_CAP_ROUND, single: false };
//var PointBuffer = Point.buffer(bufferDistance, bufferOptions);

VIEWER.draw(poly);