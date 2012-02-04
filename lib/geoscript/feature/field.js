/**
 * @module geoscript/feature/field
 */

var UTIL = require("../util");
var GeoObject = require("../object").GeoObject;
var PROJ = require("../proj");
var GEOM = require("../geom");
var Cursor = require("../cursor").Cursor;

var jts = Packages.com.vividsolutions.jts;
var geotools = Packages.org.geotools;
var AttributeTypeBuilder = geotools.feature.AttributeTypeBuilder;
var types = {};

function addTypeMapping(str, type) {
    types[str] = type;
    types[type] = type;
}

// map type names to java.lang types
var javaTypeNames = ["String", "Integer", "Short", "Float", "Long", "Double", "Boolean"];
javaTypeNames.forEach(function(str) {
    addTypeMapping(str, java.lang[str]);
});

// map type names to jts geometry types
var jtsTypeNames = ["Geometry", "Point", "LineString", "Polygon", "MultiPoint", "MultiLineString", "MultiPolygon"];
jtsTypeNames.forEach(function(str) {
    addTypeMapping(str, jts.geom[str]);
});

// add assorted types
addTypeMapping("FeatureCollection", geotools.feature.FeatureCollection);
addTypeMapping("Date", java.sql.Date);
addTypeMapping("Time", java.sql.Time);
addTypeMapping("Datetime", java.util.Date);
addTypeMapping("Timestamp", java.sql.Timestamp);
addTypeMapping("BigDecimal", java.math.BigDecimal);
addTypeMapping("URI", java.net.URI);


var getTypeName = function(type) {
    var name;
    for (var str in types) {
        if (types[str] === type) {
            name = str;
            break;
        };
    }
    if (!name) {
        throw new Error("Can't get name for field type: " + type);
    }
    return name;
};

var getType = function(value) {
    var name;
    // deal with geometries
    if (value instanceof GEOM.Geometry) {
        name = value._geometry.getGeometryType();
    } else if (value instanceof Date) {
        name = "Datetime";
    } else {
        var t = typeof value;
        if (t === "string") {
            name = "String";
        } else if (t === "number") {
            name = "Double";
        } else if (t === "boolean") {
            name = "Boolean";
        }
    }
    var type = types[name];
    if (!type) {
        if (name) {
            throw new Error("Can't resolve field type name: " + name);
        } else {
            throw new Error("Unsupported field type: " + value);
        }
    }
    return type;
};

var Field = exports.Field = UTIL.extend(GeoObject, /** @lends Field# */ {

    /**
        The field title (optional).
        @type {String}
     */
    title: undefined,

    /**
        Create a new field.
        @constructs Field
        @arg {Object} config - Configuration object.
     */
    constructor: function Field(config) {
        if (config) {
            if (!config.name) {
                throw new Error("Field config must include 'name' property.");
            }
            if (!config.type) {
                throw new Error("Field config must include 'type' property.");
            }
            if (!types[config.type]) {
                throw new Error("Unsupported field type: " + config.type);
            }
            // set optional title
            if ("title" in config) {
                this.title = config.title;
            }
            var builder = new AttributeTypeBuilder();
            builder.setName(config.type);
            if (config.description) {
                builder.setDescription(config.description);
            }
            builder.setBinding(types[config.type]);
            var projection = config.projection;
            if (projection) {
                if (!(projection instanceof PROJ.Projection)) {
                    projection = new PROJ.Projection(projection);
                }
                builder.setCRS(projection._projection);
            }
            builder.setMinOccurs(config.minOccurs || 0);
            builder.setMaxOccurs(config.maxOccurs || 1);
            if ("isNillable" in config) {
                builder.setNillable(!!config.isNillable);
            }
            if ("defaultValue" in config) {
                // TODO: pass java values
                builder.setDefaultValue(config.defaultValue);
            }
            this._field = builder.buildDescriptor(config.name);
        }
    },
    
    /**
        The field name (required).
        @name Field#name
        @readonly
        @type {String}
     */
    get name() {
        return String(this._field.getLocalName());
    },

    /**
        The field description.
        @name Field#description
        @readonly
        @type {String}
     */
     get description() {
         return String(this._field.getType().getDescription());
     },

    /**
        The field type (required).
        @name Field#type
        @readonly
        @type {String}
     */
    get type() {
        return getTypeName(this._field.getType().getBinding());
    },
    
    /**
        The minimum occurences for field values (optional).  Default is 0.
        @name Field#minOccurs
        @readonly
        @type {Number}
     */
    get minOccurs() {
        return Number(this._field.getMinOccurs());
    },
    
    /**
        The maximum occurences for field values (optional).  Default is 1.
        @name Field#maxOccurs
        @readonly
        @type {Number}
     */
    get maxOccurs() {
        return Number(this._field.getMaxOccurs());
    },
    
    /**
        The field is nillable (optional).  Default is true.
        @name Field#isNillable
        @readonly
        @type {Boolean}
     */
    get isNillable() {
        return Boolean(this._field.getIsNillable());
    },
    
    get defaultValue() {
        return this._field.getDefaultValue();
    },
    
    /**
        Geometry projection (optional).  Relevant for geometry type fields only.
        @name Field#projection
        @readonly
        @type {proj.Projection}
     */
    get projection() {
        var projection;
        if (GEOM[this.type]) {
            var _projection = this._field.getCoordinateReferenceSystem();
            if (_projection) {
                projection = PROJ.Projection.from_(_projection);
            }
        }
        return projection;
    },
    
    /**
        Determine if another field is equivalent to this one.

        @arg {Field} field 
        @returns {Boolean} The two fields are equivalent.
     */
    equals: function(field) {
        return Boolean(this._field.equals(field._field));
    },

    /**
        @type {Object}
        @private
     */
    get config() {
        var def = {
            name: this.name,
            type: this.type
        };
        if (this.projection) {
            // TODO: fall back to wkt?
            def.projection = this.projection.id;
        }
        return {
            type: "Field",
            def: def
        };
    },
    
    /**
        Cast a JS value to appropriate Java type.

        @arg {Object} vlaue 
        @returns {java.lang.Object}
        @private
     */
    valueTo_: function(value) {
        var _value = value;
        if (_value !== null) {
            var type = this.type;
            if (value instanceof GEOM.Geometry) {
                _value = value._geometry;
            } else if (value instanceof Cursor) {
                _value = value._cursor;
            } else if (value instanceof Date) {
                _value = new types[type](value.getTime());
            }
        }
        return _value;
    },

    /**
        Cast a Java value to appropriate JS type.

        @arg {java.lang.Object} value 
        @returns {Object}
        @private
     */
    valueFrom_: function(_value) {
        var value = _value;
        if (value !== null) {
            if (_value instanceof jts.geom.Geometry) {
                value = GEOM.Geometry.from_(_value);
            } else if (_value instanceof geotools.feature.FeatureCollection) {
                var _schema = _value.getSchema();
                var Feature = require("./feature").Feature;
                value = new Cursor({
                    _cursor: _value,
                    open: function() {
                        return _value.features();
                    },
                    cast: function(_feature) {
                        return Feature.from_(_feature, _schema);
                    }
                });
            } else {
                var type = this.type;
                if (type === "Date" || type === "Time" || type === "Datetime" || type === "Timestamp") {
                    value = new Date(_value.getTime());
                } else if (_value instanceof java.lang.Number) {
                    value = Number(_value);
                } else if (_value instanceof java.lang.String) {
                    value = String(_value);
                } else if (_value instanceof java.lang.Boolean) {
                    value = !!_value.booleanValue();
                }
            }
        }
        return value;
    },

    /**
        @private
     */
    toFullString: function() {
        return "name: \"" + this.name + "\", type: " + this.type;
    }

});

/**
    Create a field given a name and value.

    @arg {String} name 
    @arg {Object} value 
    @returns {Field}
    @private
 */
Field.fromValue = function(name, value) {
    var config = {
        name: name, 
        type: getTypeName(getType(value))
    };
    if (value instanceof GEOM.Geometry && value.projection) {
        config.projection = value.projection;
    }
    return new Field(config);
};

Field.from_ = function(_field) {
    var field = new Field();
    field._field = _field;
    return field;
};


/**
    Sample code to create a new field:
   
    .. code-block:: javascript
   
        js> var field = new FEATURE.Field({
          >     name: "age",
          >     type: "Double"
          > });
  
        js> var field = new FEATURE.Field({
          >     name: "location",
          >     type: "Point",
          >     projection: "EPSG:4326"
          > });
 */
