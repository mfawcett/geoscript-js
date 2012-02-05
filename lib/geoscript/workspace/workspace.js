/**
 * @module geoscript/workspace/workspace
 */
var UTIL = require("../util");
var GeoObject = require("../object").GeoObject;
var WS_UTIL = require("./util");
var Schema = require("../feature/schema").Schema;
var Filter = require("../filter").Filter;
var Projection = require("../proj").Projection;

var geotools = Packages.org.geotools;
var DefaultQuery = geotools.data.DefaultQuery;
var ListFeatureCollection = geotools.data.collection.ListFeatureCollection;
var Transaction = geotools.data.Transaction;

var Workspace = UTIL.extend(GeoObject, /** @lends Workspace# */ {
    
    /**
        A Workspace instance should not be created directly.  
        Create an instance of a Workspace subclass instead.
        @constructs Workspace
     */
    constructor: function Workspace(config) {
        if (config) {
            UTIL.applyIf(this, config);
            this._store = this._create(config);
        }
    },
    
    /**
        Create the underlying store for the workspace.

        @arg {Object} config 
        @returns {org.geotools.data.AbstractDataStore?}
        @private
     */
    _create: function(config) {
        throw new Error("Workspace subclasses must implement _create.");
    },
    
    /**
        The available layer names in the workspace.
        @type {Array}
     */
    get names() {
        var _names = this._store.getTypeNames();
        var len = _names.length;
        var names = new Array(len);
        for (var i=0; i<len; ++i) {
            names[i] = String(_names[i]);
        }
        return names;
    },
    
    /**
        Get a layer by name.  Returns ``undefined`` if name doesn't correspond
        to a layer source in the workspace.

        @arg {String} name - Layer name.
        @returns {layer.Layer}
     */ 
    get: function(name) {
        var layer;
        if (this.names.indexOf(name) >= 0) {
            try {
                var _source = this._store.getFeatureSource(name);
            } catch (err) {
                throw new Error("Failed to create layer from source named '" + name + "'.");
            }
            var Layer = require("../layer").Layer;
            layer = Layer.from_(_source, this);
        }
        return layer;
    },

    /**
        The available layers in the workspace.
        @type {Array}
     */
    get layers() {
        var layers = [];
        this.names.forEach(function(name) {
            try {
                var layer = this.get(name);
                if (layer) {
                    layers.push(layer);
                }
            } catch (err) {
                // pass
            }
        }, this);
        return layers;
    },
    
    /**
        @private
     */
    _createSource: function(_schema, type) {
        this._store.createSchema(_schema);
        return this._store.getFeatureSource(_schema.getName());
    },
    
    /**
        Options:
         * `name`: ``String`` Name for the new layer.
         * `filter`: :class:`filter.Filter` Filter to apply to features before adding.
         * `projection: :class:`proj.Projection` Destination projection for the layer.
      
        :returns: :class:`layer.Layer`
      
        Create a new layer in this workspace with the features from an existing
        layer.  If a layer with the same name already exists in this workspace,
        you must provide a new name for the layer.

        @arg {layer.Layer} layer - The layer to be added.
        @arg {Object} options - Options for adding the layer.
     */
    add: function(layer, options) {
        var Layer = require("../layer").Layer;
        options = options || {};
        
        var filter = options.filter || Filter.PASS;
        if (!(filter instanceof Filter)) {
            filter = new Filter(filter);
        }
        
        var name = options.name || layer.name;
        if (this.get(name)) {
            throw new Error("A layer named '" + options.name + "' already exists in the workspace.");
        }

        var projection = options.projection;
        if (projection && !(projection instanceof Projection)) {
            projection = new Projection(projection);
        }
        
        // clone the schema, optionally changing geometry projection
        var geomField = layer.schema.geometry;
        var schema = layer.schema.clone({
            name: options.name,
            fields: [{
                name: geomField.name, 
                type: geomField.type, 
                projection: projection || geomField.projection
            }]
        });

        var _source = this._createSource(schema._schema);

        var query = new DefaultQuery(layer.name, filter._filter);
        if (projection) {
            if (layer.projection) {
                query.setCoordinateSystem(layer.projection._projection);
            }
            query.setCoordinateSystemReproject(projection._projection); 
        }

        // loop through batches of features and add to the new layer
        var iterator = layer._source.dataStore.getFeatureReader(query, Transaction.AUTO_COMMIT);
        var i, _features;
        var _schema = layer._source.getSchema();
        while (true) {
            i = 0;
            _features = new ListFeatureCollection(_schema);
            while (iterator.hasNext() && i < 1000) {
                _features.add(iterator.next());
                ++i;
            }
            if (_features.isEmpty()) {
                break;
            }
            _source.addFeatures(_features);
        }
        iterator.close();
        return Layer.from_(_source, this);
    },
    
    /**
        Do any specific processing on a feature before it is added to a layer.

        @arg {feature.Feature} feature 
        @private
     */
    _onFeatureAdd: function(feature) {
        // pass
    },
    
    /**
        @private
     */
    get config() {
        return {
            type: this.constructor.name
        };
    },
        
    /**
        Close the workspace.  This discards any existing connection to the 
        underlying data store and discards the reference to the store.
     */
    close: function() {
        if (this._store) {
            this._store.dispose();
            delete this._store;
        }
    },
    
    /**
        @private
     */
    toFullString: function() {
        return '["' + this.names.join('", "') + '"]';
    }    
    
});

/**
    Create a geoscript workspace object from a GeoTools store.

    @arg {org.geotools.data.DataStore} _store - A GeoTools store.
    :returns: :class`Workspace`
    @private
 */
Workspace.from_ = function(_store) {
    var workspace;
    try {
        workspace = WS_UTIL.from_(_store);
    } catch (err) {
        // as a fallback, use a generic workspace and hope for the best
        workspace = new Workspace();
        workspace._store = _store;
    }
    return workspace;
};

exports.Workspace = Workspace;
