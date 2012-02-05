/**
 * @module geoscript/workspace/h2
 */
var register = require("./util").register;
var Factory = require("../factory").Factory;
var Workspace = require("./workspace").Workspace;
var UTIL = require("../util");
var H2DataStoreFactory = Packages.org.geotools.data.h2.H2DataStoreFactory;

var prepConfig = function(config) {
    if (config) {
        if (typeof config === "string") {
            config = {database: config};
        }
        if (typeof config.database !== "string") {
            throw "H2 config must include database path.";
        }
        config = {database: String(config.database)};
    }
    return config;
};

var H2 = UTIL.extend(Workspace, /** @lends H2# */ {
    
    /**
        Path to the database (required).
        @type {String}
     */

    /**
        Create a workspace from an H2 database.
        @constructs H2
        @extends Workspace
        @arg {Object} config - Configuration object.
     */
    constructor: function H2(config) {
        Workspace.prototype.constructor.apply(this, [prepConfig(config)]);
    },
    
    /**
        Create the underlying store for the workspace.

        @arg {Object} config 
        @returns {org.geotools.jdbc.JDBCDataStore}
        @private
     */
    _create: function(config) {
        config.dbtype = "h2";
        var factory = new H2DataStoreFactory();
        return factory.createDataStore(config);
    },

    /**
        Do any specific processing on a feature before it is added to a layer.

        @arg {feature.Feature} feature 
        @private
     */
    _onFeatureAdd: function(feature) {
        // TODO: update when CRS is persisted in H2
        // if (feature.geometry) {
        //     var projection = feature.projection;
        //     if (projection) {
        //         feature.geometry._geometry.userData = projection._projection;
        //     }
        // }
    },
    
    /**
        @private
     */
    get config() {
        return {
            type: this.constructor.name,
            database: this.database
        };
    }
        
});

/**
    Sample code create a new workspace for accessing data in a H2 database:
   
    .. code-block:: javascript
  
        js> var h2 = new WORKSPACE.H2({database: "data/h2/geoscript"});
        js> h2
        <H2 ["states"]>
        js> var states = h2.get("states");
        js> states
        <Layer name: states, count: 49>
 */

exports.H2 = H2;

// register an H2 factory for the module
register(new Factory(H2, {
    handles: function(config) {
        var capable = false;
        if (config && typeof config.type === "string" && config.type.toLowerCase() === "h2") {
            try {
                config = prepConfig(config);
                capable = true;
            } catch (err) {
                // pass
            }            
        }
        return capable;
    }
}));
