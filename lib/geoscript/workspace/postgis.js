/**
 * @module geoscript/workspace/postgis
 */
var register = require("./util").register;
var Factory = require("../factory").Factory;
var Workspace = require("./workspace").Workspace;
var UTIL = require("../util");

var geotools = Packages.org.geotools;
var PostgisNGDataStoreFactory = geotools.data.postgis.PostgisNGDataStoreFactory;

var prepConfig = function(config) {
    if (config) {
        if (typeof config === "string") {
            config = {database: config};
        }
        if (typeof config.database !== "string") {
            throw "PostGIS config must include database name.";
        }
        config = UTIL.applyIf({}, config, PostGIS.prototype.defaults);
        config = {
            host: config.host,
            port: config.port,
            schema: config.schema,
            database: config.database,
            user: config.user,
            passwd: config.password
        };
    }
    return config;
};

var PostGIS = UTIL.extend(Workspace, /** @lends PostGIS# */ {
    
    /**
        @type {Object}
        @private
     */
    defaults: {
        /**
            Hostname for database connection.  Default is ``"localhost"``.
            @type {String}
         */
        host: "localhost",

        /**
            Port for database connection.  Default is ``5432``.
            @type {Number}
         */
        port: 5432,

        /**
            The named database schema containing the tables to be accessed.
            Default is ``"public"``.
            @type {String}
         */
        schema: "public",

        /**
            Username for database connection.  Default is ``"postgres"``.
            @type {String}
         */
        user: "postgres",

        /**
            Password for database connection.  Default is ``"postgres"``.
            @type {String}
         */
        password: "postgres"
    },
    
    /**
        Database name (required).
        @type {String}
     */

    /**
        Create a workspace from a PostGIS enabled database.
        @constructs PostGIS
        @extends Workspace
        @arg {Object} config - Configuration object.
     */
    constructor: function PostGIS(config) {
        Workspace.prototype.constructor.apply(this, [prepConfig(config)]);
    },
    
    /**
        Create the underlying store for the workspace.

        @arg {Object} config 
        @returns {org.geotools.jdbc.JDBCDataStore}
        @private
     */
    _create: function(config) {
        config.dbtype = "postgis";
        config.port = java.lang.Integer(config.port);
        var factory = new PostgisNGDataStoreFactory();
        return factory.createDataStore(config);
    },

    /**
        TODO: include user/pass in JSON?
        @private
     */
    get config() {
        return {
            type: this.constructor.name,
            host: this.host,
            port: this.port,
            schema: this.schema,
            database: this.database
        };
    }
    
});

/**
    Create a geoscript workspace object from a GeoTools store.

    @arg {org.geotools.data.DataStore} _store - A GeoTools store.
    :returns: :class`PostGIS`
    @private
 */
PostGIS.from_ = function(_store) {
    var workspace = new PostGIS();
    workspace._store = _store;
    return workspace;
};

/**
    Sample code create a new workspace for accessing data in a PostGIS database:
   
    .. code-block:: javascript
  
        js> var pg = new WORKSPACE.PostGIS({database: "geoscript"});
        js> pg
        <PostGIS ["states"]>
        js> var states = pg.get("states");
        js> states
        <Layer name: states, count: 49>
 */

exports.PostGIS = PostGIS;

// register a postgis factory for the module
register(new Factory(PostGIS, {
    handles: function(config) {
        var capable = false;
        if (typeof config.type === "string" && config.type.toLowerCase() === "postgis") {
            try {
                config = prepConfig(config);
                capable = true;
            } catch (err) {
                // pass;
            }
        }
        return capable;
    },
    wraps: function(_store) {
        var wraps = false;
        if (_store instanceof geotools.jdbc.JDBCDataStore) {
            var dialect = _store.getSQLDialect();
            if (dialect instanceof geotools.data.postgis.PostGISDialect) {
                wraps = true;
            }
        }
        return wraps;
    }
}));
