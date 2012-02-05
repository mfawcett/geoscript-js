/**
 * @module geoscript/workspace/spatialite
 */
var register = require("./util").register;
var Factory = require("../factory").Factory;
var Workspace = require("./workspace").Workspace;
var UTIL = require("../util");

var SpatiaLiteDataStoreFactory = Packages.org.geotools.data.spatialite.SpatiaLiteDataStoreFactory;

var prepConfig = function(config) {
    if (config) {
        if (typeof config === "string") {
            config = {database: config};
        }
        if (!(typeof config.database === "string" || config.database instanceof file.Path)) {
            throw "SpatiaLite config must include database path.";
        }
        config = {
            database: String(config.database)
        };
    }
    return config;
};

var SpatiaLite = UTIL.extend(Workspace, /** @lends SpatiaLite# */ {
    
    /**
        Path to the database (required).
        @type {String}
        @private
     */

    /**
        Create a workspace from a SpatiaLite enabled database.
        @constructs SpatiaLite
        @extends Workspace
        @arg {Object} config - Configuration object.
     */
    constructor: function SpatiaLite(config) {
        Workspace.prototype.constructor.apply(this, [prepConfig(config)]);
    },
    
    /**
        Create the underlying store for the workspace.

        @arg {Object} config 
        @returns {org.geotools.jdbc.JDBCDataStore}
        @private
     */
    _create: function(config) {
        config.dbtype = "spatialite";
        var factory = new SpatiaLiteDataStoreFactory();
        return factory.createDataStore(config);
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

exports.SpatiaLite = SpatiaLite;

// register a spatialite factory for the module
register(new Factory(SpatiaLite, {
    handles: function(config) {
        var capable = false;
        if (typeof config.type === "string" && config.type.toLowerCase() === "spatialite") {
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
