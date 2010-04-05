var ASSERT = require("test/assert");
var GEOM = require("geoscript/geom");
var read = require("geoscript/geom/io/json").read;
var write = require("geoscript/geom/io/json").write;

var cases = [{
    str: '{"type": "Point", "coordinates": [0, 1]}',
    geo: new GEOM.Point([0, 1]),
    id: "point"
}, {
    str: '{' +
        '"type": "GeometryCollection",' + 
        '"geometries": [' + 
            '{' +
                '"type": "Point",' + 
                '"coordinates": [100.0, 0.0]' + 
            '}, {' +
                '"type": "LineString",' + 
                '"coordinates": [[101.0, 0.0], [102.0, 1.0]]' + 
            '}' + 
        ']' + 
    '}',
    geo: [
        new GEOM.Point([100.0, 0.0]),
        new GEOM.LineString([[101.0, 0.0], [102.0, 1.0]])
    ],
    id: "collection"
}, {
    str: '{"coordinates": [0, 1]}',
    geo: Error,
    id: "invalid GeoJSON"
}];

exports["test: read"] = function() {
    
    var c, got;
    for (var i=0, ii=cases.length; i<ii; ++i) {
        c = cases[i];
        if (c.geo === Error) {
            ASSERT.throwsError(
                function() {
                    read(c.str);
                },
                c.geo,
                c.id + ": throws error"
            )
        } else {
            got = read(c.str);
            if (c.geo instanceof Array) {
                if (!(got instanceof Array)) {
                    ASSERT.isTrue(false, c.id + ": expected array, got " + got);
                } else {
                    if (got.length !== c.geo.length) {
                        ASSERT.isTrue(false, c.id + ": expected " + c.geo.length + " geometries, got " + got.length);
                    } else {
                        for (var j=0, jj=c.geo.length; j<jj; ++j) {
                            ASSERT.isTrue(c.geo[j].equals(got[j]), c.id + "[" + j + "]: got equivalent geometry");
                        }
                    }
                }
            } else {
                ASSERT.isTrue(c.geo.equals(got), c.id + ": got equivalent geometry");
            }
        }
    }
    
};


exports["test: write"] = function() {
    
    var c, got, gotObj, expObj, err;
    for (var i=0, ii=cases.length; i<ii; ++i) {        
        c = cases[i];
        if (c.geo !== Error) {
            got = write(c.geo);
            err = false;
            try {
                gotObj = JSON.decode(got);
            } catch (e) {
                err = true;
            }
            if (!err) {
                expObj = JSON.decode(c.str);
                ASSERT.isSame(expObj, gotObj, c.id + ": correctly serialized");
            } else {
                ASSERT.isTrue(false, c.id + ": invalid json '" + got + "'");
            }
        }
    }
    
};

if (require.main == module) {
    require("test/runner").run(exports);
}
