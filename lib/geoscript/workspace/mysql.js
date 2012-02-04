var register = require("./util").register;
var Factory = require("../factory").Factory;
var Workspace = require("./workspace").Workspace;
var UTIL = require("../util");
var MySQLDataStoreFactory = Packages.org.geotools.data.mysql.MySQLDataStoreFactory;

/** api: (define)
 *  module = workspace
 *  class = MySQL
 */

var prepConfig = function(config) {
    if (config) {
        if (typeof config === "string") {
            config = {database: config};
        }
        if (typeof config.database !== "string") {
            throw "MySQL config must include database name.";
        }
        config = UTIL.applyIf({}, config, MySQL.prototype.defaults);
        config = {
            host: config.host,
            port: java.lang.Integer(config.port),
            database: config.database,
            user: config.user,
            passwd: config.password
        };
    }
    return config;
};

/** api: (extends)
 *  workspace/workspace.js
 */
var MySQL = UTIL.extend(Workspace, {
    
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
            Port for database connection.  Default is ``3306``.
            @type {Number}
         */
        port: 3306,

        /**
            Username for database connection.  Default is ``"root"``.
            @type {String}
         */
        user: "root",

        /**
            Password for database connection.  Default is ``"mysql"``.
            @type {String}
         */
        password: "mysql"
    },
    
    /**
        Database name (required).
        @type {String}
     */

    /**
        .. class:: MySQL
        
            :arg config: ``Object`` Configuration object.
      
            Create a workspace from a MySQL database.
     */
    constructor: function MySQL(config) {
        Workspace.prototype.constructor.apply(this, [prepConfig(config)]);
    },
    
    /**
        Create the underlying store for the workspace.

        @arg {Object} config 
        @returns {org.geotools.jdbc.JDBCDataStore}
        @private
     */
    _create: function(config) {
        config.dbtype = "mysql";
        config.port = java.lang.Integer(config.port);
        var factory = new MySQLDataStoreFactory();
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
            database: this.database
        };
    }
    
});

/**
    Sample code create a new workspace for accessing data in a MySQL database:
   
    .. code-block:: javascript
  
        js> var mysql = new WORKSPACE.MySQL({database: "geoscript"});
        js> mysql
        <MySQL ["states"]>
        js> var states = mysql.get("states");
        js> states
        <Layer name: states, count: 49>
 */

exports.MySQL = MySQL;

// register a MySQL factory for the module
register(new Factory(MySQL, {
    handles: function(config) {
        var capable = false;
        if (typeof config.type === "string" && config.type.toLowerCase() === "mysql") {
            try {
                config = prepConfig(config);
                capable = true;
            } catch (err) {
                // pass;
            }
        }
        return capable;
    }
}));
