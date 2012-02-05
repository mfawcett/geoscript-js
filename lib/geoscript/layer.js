/**
 * @module geoscript/layer
 */

var UTIL = require("./util");
var GeoObject = require("./object").GeoObject;
var Registry = require("./registry").Registry;
var Factory = require("./factory").Factory;

var Feature = require("./feature").Feature;
var FILTER = require("./filter");
var Schema = require("./feature").Schema;
var Cursor = require("./cursor").Cursor;
var WORKSPACE = require("./workspace");
var PROJ = require("./proj");
var GEOM = require("./geom");
var STYLE = require("./style");

var geotools = Packages.org.geotools;
var DefaultQuery = geotools.data.DefaultQuery;
var Query = geotools.data.Query;
var Transaction = geotools.data.Transaction;
var FeatureCollections = geotools.feature.FeatureCollections;
var CQL = geotools.filter.text.cql2.CQL;
var FilterFactory2 = geotools.factory.CommonFactoryFinder.getFilterFactory2(geotools.factory.GeoTools.getDefaultHints());


// TODO: remove when changed in GeoTools
// supress info about "Building quadtree spatial index with depth 3 for file" 
var logger = geotools.util.logging.Logging.getLogger(
    "org.geotools.data.shapefile"
);
logger.setLevel(java.util.logging.Level.WARNING); 

var getTempName = function() {
    var count = WORKSPACE.memory.names.length;
    var name = "layer_" + count;
    while (WORKSPACE.memory.names.indexOf(name) > -1) {
        ++count;
        name = "layer_" + count;
    }
    return name;
};

var Layer = UTIL.extend(GeoObject, /** @lends Layer# */ {
    
    /**
        @type {Object}
        @private
     */
    cache: null,

    /**
        Create a new layer.  If a workspace is not provided, a temporary
        layer will be created.  If a layer is created without a schema, a
        default schema will be applied.
        @constructs Layer
     */
    constructor: function Layer(config) {
        this.cache = {};
        var name;
        if (typeof config === "string") {
            config = {name: config};
        }
        if (config) {
            var schema = config.schema;
            name = config.name || (schema && schema.name) || getTempName();
            if (!schema) {
                schema = new Schema({
                    name: name,
                    fields: config.fields || [{name: "geom", type: "Geometry"}]
                });
            }
            if (config.workspace) {
                if (config.workspace instanceof WORKSPACE.Workspace) {
                    this.workspace = config.workspace;
                } else {
                    this.workspace = WORKSPACE.create(config.workspace);
                }
            } else {
                this.workspace = WORKSPACE.memory;
                if (WORKSPACE.memory.names.indexOf(name) > -1) {
                    throw new Error("Temporary layer named '" + name + "' already exists.");
                }
                this.workspace._store.createSchema(schema._schema);
            }
            this._source = this.workspace._store.getFeatureSource(name);
            var projection = config.projection;
            if (projection) {
                this.projection = projection;
            }
            if (config.title) {
                this.title = config.title;
            }
            if (config.style) {
                this.style = config.style;
            }
        }
    },
    
    /**
        Get a single feature using the feature id.

        @arg {String || Filter} id - Feature identifier.  Alternatively you can
            provide an arbitrary filter.  In the case of a filter, only the 
            first feature in the resulting query will be returned.
        @returns {feature.Feature}
     */
    get: function(id) {
        var filter;
        if (id instanceof FILTER.Filter) {
            filter = id;
        } else {
            try {
                filter = new FILTER.Filter(id);
            } catch (err) {
                filter = FILTER.fids([id]);
            }
        }
        var cursor = this.query(filter);
        var feature = cursor.next();
        cursor.close();
        return feature;
    },

    /**
        Create a temporary copy of this layer.

        @arg {String} name - New layer name.  If not provided, one will be
            generated.
        @returns {layer.Layer} The layer clone.
     */
    clone: function(name) {
        name = name || getTempName();
        if (WORKSPACE.memory.names.indexOf(name) > -1) {
            throw new Error("Layer named '" + name + "' already exists.");
        }
        var schema = this.schema.clone({name: name});
        var layer = new Layer({schema: schema});
        this.features.forEach(function(feature) {
            layer.add(feature.clone());
        });
        return layer;
    },
    
    /**
        Optional style to be used when rendering this layer as part of a map.
        In addition to a style instance, a style config object can be provided.
        @type {style.Style}
     */
    set style(style) {
        if (!(style instanceof STYLE.Style)) {
            if (style instanceof STYLE.Symbolizer) {
                style = new STYLE.Style([style]);
            } else {
                throw new Error("Style must be set to a Style or Symbolizer");
            }
        }
        this.cache.style = style;
    },
    /**
        The style to be used when rendering this layer as part of a map.
        @type {style.Style}
     */
    get style() {
        if (!this.cache.style) {
            // set up the default style
            var geomName = this.schema.geometry.name;
            this.style = new STYLE.Style({parts: [
                new STYLE.Fill("#FFFFEF"),
                new STYLE.Stroke({brush: "#504673", width: 0.5}),
                new STYLE.Shape({name: "circle", fill: "#FFE1A8", size: 6})
                    .where("geometryType(" + geomName + ") = 'Point'")
            ]});
        }
        return this.cache.style;
    },
    
    /**
        The schema for this layer (read-only).
        @type {feature.Schema}
     */
    get schema() {
        if (!this.cache.schema) {
            this.cache.schema = Schema.from_(this._source.getSchema());
        }
        return this.cache.schema;
    },
    
    /**
        Optional projection for the layer.  If set, any features added to the
        layer will be tranformed to this projection if they are in a different
        projection.  This must be set before features are added to the layer.
        @type {proj.Projection}
     */
    get projection() {
        var projection = this.cache.projection;
        if (!projection && this.schema) {
            var field = this.schema.geometry;
            if (field) {
                projection = field.projection;
                this.cache.projection = projection;
            }
        }
        return projection;
    },
    set projection(projection) {
        if (!(projection instanceof PROJ.Projection)) {
            projection = new PROJ.Projection(projection);
        }
        if (this.projection && !projection.equals(this.projection)) {
            throw "Layer projection already set: " + this.projection.id;
        }
        this.cache.projection = projection;
    },
    
    /**
        The layer has not been persisted to a workspace (read-only).
        @type {Boolean}
     */
    get temporary() {
        return (this.workspace instanceof WORKSPACE.Memory);
    },
    
    /**
        The layer name.
        @type {String}
     */
    /**
        The layer name (read-only).
        @type {String}
     */
    get name() {
        return String(this._source.getName().getLocalPart());
    },
    
    /**
        Optional title for the layer.
        @type {String}
     */
    set title(title) {
        this.cache.title = title;
    },
    /**
        The layer title.  Defaults to the layer name.
        @type {String}
     */
    get title() {
        var title = this.cache.title;
        if (!title) {
            title = this.name;
        }
        return title;
    },
    
    /**
        Get the number of features on the layer matching the given filter.

        @arg {filter.Filter} filter - Optional filter or CQL string.
        @returns {Number}
     */
    getCount: function(filter) {
        if (filter) {
            if (!(filter instanceof FILTER.Filter)) {
                filter = new FILTER.Filter(filter);
            }
        } else {
            filter = FILTER.Filter.PASS;
        }
        var count = this._source.getCount(new DefaultQuery(this.name, filter._filter));
        if (count === -1) {
            // count manually for layers that don't support this query
            count = 0;
            this.query(filter).forEach(function(feature) {
                ++count;
            });
        }
        return count;
    },
    
    /**
        The number of features contained in the layer.
        @type {Number}
     */
    get count() {
        return this._source.getCount(Query.ALL);
    },
    
    /**
        Get the bounds for all features on the layer.  Optionally, the bounds
        can be generated for all features that match the given filter.

        @arg {filter.Filter} filter - Optional filter or CQL string.
        @returns {geom.Bounds}
     */
    getBounds: function(filter) {
        if (filter) {
            if (!(filter instanceof FILTER.Filter)) {
                filter = new FILTER.Filter(filter);
            }
        } else {
            filter = FILTER.Filter.PASS;
        }
        var bounds;
        var _bounds = this._source.getBounds(new DefaultQuery(this.name, filter._filter));
        if (_bounds) {
            bounds = GEOM.Bounds.from_(_bounds);
        } else {
            // manually calculate bounds for layers that don't support getBounds with a filter
            this.features.forEach(function(feature) {
                if (filter.evaluate(feature)) {
                    if (!bounds) {
                        bounds = feature.bounds.clone();
                    } else {
                        bounds.include(feature.bounds);
                    }
                }
            });
            
        }
        return bounds;
    },
    
    /**
        The bounds for all features on this layer.
        @type {geom.Bounds}
     */
    get bounds() {
        return this.getBounds();
    },

    /**
        Query for features from the layer.  The return will be an object with
        ``forEach``, ``hasNext``, and ``next`` methods.  If no filter is
        provided, all features will be included in the results.
      
        Example use:
      
        .. code-block:: javascript
      
            js> layer.query("name = 'foo'").forEach(function(feature) {
              >     print(feature.toString());
              > });

        @arg {filter.Filter or String} filter - A filter or a CQL string.
        @returns {cursor.Cursor} A cursor for accessing queried features.
     */
    query: function(filter) {
        if (!filter) {
            filter = FILTER.Filter.PASS;
        } else {
            if (!(filter instanceof FILTER.Filter)) {
                // must be CQL string
                filter = new FILTER.Filter(filter);
            }
        }
        var _schema = this.schema._schema;
        
        var cursor = new Cursor({
            open: function() {
                var query = new DefaultQuery(this.name, filter._filter);
                return this._source.dataStore.getFeatureReader(query, Transaction.AUTO_COMMIT);
            },
            cast: function(_feature) {
                var feature = Feature.from_(_feature, _schema);
                feature.layer = this;
                return feature;
            },
            scope: this
        });
        
        return cursor;
    },
    
    /**
        A cursor object for accessing all features on the layer.
      
        Example use:
      
        .. code-block:: javascript
      
            js> layer.features.forEach(function(feature) {
              >     print(feature.toString());
              > });
        @type {cursor.Cursor}
     */
    get features() {
        return this.query();
    },
    
    /**
        Add a feature to a layer.  Optionally, an object with feature attribute
        values may be provided.
      
        Example use:
      
        .. code-block:: javascript
      
            js> var GEOM = require("geoscript/geom");
            js> layer.add({geom: new GEOM.Point([0, 1])});
            

        @arg {Object} obj - A :class:`feature.Feature` or a feature attribute 
            values object.
     */
    add: function(obj) {
        var feature;
        if (obj instanceof Feature) {
            feature = obj;
            if (feature.layer) {
                feature = feature.clone();
            }
        } else {
            // has to be a values object
            feature = new Feature({schema: this.schema, values: obj});
        }
        if (this.projection) {
            if (feature.projection) {
                if (!this.projection.equals(feature.projection)) {
                    feature.geometry = PROJ.transform(
                        feature.geometry,
                        feature.projection,
                        this.projection
                    );
                }
            } else {
                feature.projection = this.projection;
            }
        }
        this.workspace._onFeatureAdd(feature);
        var collection = FeatureCollections.newCollection();
        collection.add(feature._feature);
        this._source.addFeatures(collection);
        feature.layer = this;
    },
    
    /**
        Remove features from a layer that match the given filter or CQL string.
        Alternatively, a feature can be provided to remove a single feature from
        the layer.
      
        Example use:
      
        .. code-block:: javascript
      
            js> var GEOM = require("geoscript/geom");
            js> layer.add({geom: new GEOM.Point([1, 2])});
            js> layer.remove("INTERSECTS(geom, POINT(1 2))");
        

        @arg {filter.Filter} filter - or ``String`` or 
            :class:`feature.Feature`
     */
    remove: function(filter) {
        if (!filter) {
            throw new Error("Call remove with a filter or a feature.");
        }
        if (filter instanceof Feature) {
            filter = new FILTER.fids([filter.id]);
        } else if (!(filter instanceof FILTER.Filter)) {
            filter = new FILTER.Filter(filter);
        }
        this._source.removeFeatures(filter._filter);
    },

    /**
        @private
     */
    queueModified: function(feature, name) {
        if (!this.cache.modifiedFeatures) {
            this.cache.modifiedFeatures = {};
        }
        var modified = this.cache.modifiedFeatures;
        var id = feature.id;
        if (!(id in modified)) {
            modified[id] = {names: {}};
        }
        modified[id].feature = feature;
        modified[id].names[name] = true;
    },

    /**
        persists feature changes.
     */
    update: function() {
        var modified = this.cache.modifiedFeatures;
        if (modified) {
            var _filter = FilterFactory2.createFidFilter();
            for (var id in modified) {
                _filter.addFid(id);
            }
            var results = this._source.dataStore.getFeatureWriter(this.name, _filter, Transaction.AUTO_COMMIT);
            try {
                while (results.hasNext()) {
                    var _feature = results.next();
                    id = _feature.getIdentifier();
                    var names = modified[id].names;
                    for (var name in names) {
                        // modify clean feature with dirty attributes
                        _feature.setAttribute(
                            name, 
                            modified[id].feature._feature.getAttribute(name)
                        );
                    }
                    results.write();
                    delete modified[id];
                }
            } finally {
                results.close();
            }
            delete this.cache.modifiedFeatures;
        }
    },

    /**
        @private
     */
    get config() {
        var config = {
            type: "Layer",
            name: this.name
        };
        if (this.temporary) {
            config.schema = this.schema.config;
        } else {
            config.workspace = this.workspace.config;
        }
        return config;
    },
    
    /**
        The JSON representation of this layer.  This representation does not
        include members for each feature in the layer.
        @type {String}
     */
    
    /**
        @private
     */
    toFullString: function() {
        return "name: " + this.name + ", count: " + this.count;
    }
    
});

Layer.from_ = function(_source, workspace) {
    var layer = new Layer();
    layer._source = _source;
    layer.workspace = workspace;
    return layer;
};

/*
    Sample code to create a temporary layer:
   
    .. code-block:: javascript
   
        js> var layer = new LAYER.Layer({name: "temp"});
  
        js> var layer = new LAYER.Layer({
          >     name: "temp",
          >     fields: [{name: "geom", type: "Geometry"}]
          > });
  
        js> var FEATURE = require("geoscript/feature");
        js> var schema = new FEATURE.Schema({
          >     name: "temp",
          >     fields: [{name: "geom", type: "Geometry"}]
          > });
        js> var layer = new LAYER.Layer({schema: schema});
 */

exports.Layer = Layer;

/**
    Create a layer given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {layer.Layer}
    @private
 */
var registry = new Registry();
exports.create = registry.create;

// register a layer factory for the module
registry.register(new Factory(Layer, {
    handles: function(config) {
        return true;
    }
}));
