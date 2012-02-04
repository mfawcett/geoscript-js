/**
 * @module geoscript/feature/feature
 */

var register = require("./util").register;
var Factory = require("../factory").Factory;
var GEOM = require("../geom");
var UTIL = require("../util");
var GeoObject = require("../object").GeoObject;
var Schema = require("./schema").Schema;

var jts = Packages.com.vividsolutions.jts;
var SimpleFeatureBuilder = Packages.org.geotools.feature.simple.SimpleFeatureBuilder;

var prepConfig = function(config) {
    config = UTIL.apply({}, config);
    if (!config.schema) {
        if (config.values) {
            config.schema = Schema.fromValues(config.values);
        }
    } else if (!(config.schema instanceof Schema)) {
        config.schema = new Schema(config.schema);
    }
    return config;
};

var Feature = exports.Feature = UTIL.extend(GeoObject, /** @lends Feature# */ {
    
    /**
        Cache for setters & getters.
        @type {Object}
        @private
     */ 
    cache: null,

    /**
        The feature schema.  If not provided, a schema will be derived from
        the provided ``values`` in the configuration.
        @type {feature.Schema}
     */
    schema: null,
    
    /**
        If this feature is read from a layer, this property will reference that
        layer.
        @type {layer.Layer}
        @private
     */
    layer: null,

    /**
        Create a new feature.
        @constructs Feature
        @arg {Object} config - Configuration object.
     */
    constructor: function Feature(config) {
        this.cache = {};
        if (config) {
            config = prepConfig(config);
            if (config.schema) {
                this.schema = config.schema;
            } else {
                throw new Error("Feature must be constructed with a schema or values.");
            }

            var builder = new SimpleFeatureBuilder(this.schema._schema);
            var field, value, _value, defaultGeom;
            for (var name in config.values) {
                field = this.schema.get(name);
                if (!field) {
                    throw new Error("Feature schema has no field named '" + name + "'");
                }
                value = config.values[name];
                if (field.type in GEOM) {
                    if (!(value instanceof GEOM.Geometry)) {
                        value = GEOM.create(value);
                    }
                    if (!defaultGeom) {
                        defaultGeom = value;
                    }
                }
                _value = field.valueTo_(value);
                builder.set(name, _value);
            }
            if (defaultGeom) {
                // cache the default geometry
                this.cache.geometry = defaultGeom;
            }
            this._feature = builder.buildFeature(config.id); 
        }
    },
    
    /**
        Create a clone of this feature.

        @returns {feature.Feature}
     */
    clone: function(config) {
        
        config = config || {};
        
        var schema;
        if (config.schema) {
            if (config.schema instanceof Schema) {
                schema = config.schema;
            } else {
                schema = new Schema(config.schema);
            }
        } else {
            schema = this.schema.clone();
        }
        
        var values = {};
        var names = schema.fieldNames;
        if (config.values) {
            for (var name in config.values) {
                if (names.indexOf(name) > -1) {
                    values[name] = config.values[name];
                }
            }
        }
        for (var name in this.values) {
            if (!(name in values) && names.indexOf(name) > -1) {
                values[name] = this.get(name);
            }
        }
        
        var feature = new Feature({
            schema: schema,
            values: values
        });

        // ensure all geometries are clones
        var value;
        for (var name in feature.values) {
            value = feature.get(name);
            if (value instanceof GEOM.Geometry) {
                feature.set(name, value.clone());
            }
        }

        return feature;
    },
    
    /**
        The feature identifier.  Read only.
        @name Feature#id
        @readonly
        @type {String}
     */
    get id() {
        return String(this._feature.getIdentifier());
    },
    
    /**
        Field name for the default geoemtry, or ``undefined`` if the feature
        has no geometry.
        @name Feature#geometryName
        @readonly
        @type {String}
     */
    get geometryName() {
        var name;
        var geomProp = this._feature.getDefaultGeometryProperty();
        if (geomProp) {
            name = String(geomProp.getName());
        }
        return name;
    },
    
    /**
        The default geometry (if any) for the feature.  Will be ``undefined`` 
        if the feature does not have a geometry.
        @name Feature#geometry
        @type {geom.Geometry}
     */
    get geometry() {
        if (this.cache.geometry == null) {
            var _geometry = this._feature.getDefaultGeometry();
            if (_geometry) {
                this.cache.geometry = GEOM.Geometry.from_(_geometry); // may be undefined
            }
        }
        return this.cache.geometry;
    },
    set geometry(geometry) {
        this.set(this.geometryName, geometry);
    },
    
    /**
        Optional projection for the feature.  This corresponds to the projection
        of the default geometry for the feature.
        @name Feature#projection
        @type {proj.Projection}
     */
    get projection() {
        return this.geometry && this.geometry.projection;
    },
    set projection(projection) {
        if (this.geometry) {
            this.geometry.projection = projection;
        }
    },
    
    /**
        The bounds of the default geometry (if any) for this feature.  Will be
        ``undefined`` if the feature has no geometry.
        @name Feature#bounds
        @readonly
        @type {geom.Bounds}
     */
    get bounds() {
        var bounds;
        if (this.geometry) {
            return this.geometry.bounds;
        }
    },
    
    /**
        Set a feature attribute.

        @arg {String} name - Attribute name.
        @arg {String} value - Attribute value.
     */
    set: function(name, value) {
        var field = this.schema.get(name);
        if (!field) {
            throw new Error("Feature schema has no field named '" + name + "'");
        }
        // special treatment for default geometry
        if (name === this.geometryName) {
            // TODO: check if this is handled by setAttribute
            this._feature.setDefaultGeometry(value._geometry);
            this.cache.geometry = value;
        }
        var _value = field.valueTo_(value);
        this._feature.setAttribute(name, _value);
        if (this.layer) {
            this.layer.queueModified(this, name);
        }
    },
    
    /**
        Get an attribute value.

        @arg {String} name - Attribute name.
     */
    get: function(name) {
        var value;
        var field = this.schema.get(name);
        if (field) {
            if (name === this.geometryName) {
                value = this.geometry;
            } else {
                var _value = this._feature.getAttribute(name);
                value = field.valueFrom_(_value);
            }
        }
        return value;
    },
    
    /**
        An object with all the feature property names and values.  Used for 
        property access only.  Use :meth:`set` to set property values.
        @name Feature#values
        @readonly
        @type {Object}
     */
    get values() {
        var values = {};
        if (this.schema) {
            this.schema.fieldNames.forEach(function(name) {
                values[name] = this.get(name);
            }, this);            
        }
        return values;
    },

    /**
        @type {Object}
        @private
     */
    get config() {
        var values = this.values;
        var properties = {}, val;
        for (var name in values) {
            val = values[name];
            if (typeof val === "number" ||
                typeof val === "string" ||
                val === null) {
                properties[name] = val;
            }
        }
        return {
            type: "Feature",
            geometry: this.geometry && this.geometry.config || null,
            properties: properties
        };
    },

    /**
        The JSON representation of the feature (see {@link http://geojson.org}).
        @name Feature#json
        @readonly
        @type {String}
     */

    /**
        @private
     */
    toFullString: function() {
        var values = this.values;
        var value;
        var items = [];
        for (var name in values) {
            value = values[name];
            if (value instanceof GEOM.Geometry) {
                items.push(name + ": <" + value.constructor.name + ">");
            } else {
                if (typeof(value) === "string") {
                    value = '"' + value + '"';
                }
                items.push(name + ": " + value);
            }
        }
        return items.join(", ");
    }
    
});

/**
    Create a feature from corresponding GeoTools parts.

    @arg {org.geotools.feature.simple.SimpleFeatureImpl} _feature 
    @arg {org.geotools.feature.simple.SimpleFeatureTypeImpl} _schema - Optional schema.
    @returns {Feature}
    @private
 */
Feature.from_ = function(_feature, _schema) {
    var feature = new Feature();
    feature._feature = _feature;
    feature.schema = Schema.from_(_schema || _feature.type);
    if (feature.schema.geometry && feature.schema.geometry.projection) {
        feature.projection = feature.schema.geometry.projection;
    }
    return feature;
};

// register a feature factory for the module
register(new Factory(Feature, {
    handles: function(config) {
        config = prepConfig(config);
        return (config.schema instanceof Schema);
    }
}));

/**
    Sample code to create a new feature:
   
    .. code-block:: javascript
   
        js> var city = new FEATURE.Feature({
          >     values: {
          >         location: new GEOM.Point([-110, 45]),
          >         name: "Metropolis"
          >     }
          > });
          
        js> city.get("name");
        Metropolis
        js> city.get("location");
        <Point [-110, 45]>
 */
