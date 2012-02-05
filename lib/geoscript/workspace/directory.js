/**
 * @module geoscript/workspace/directory
 */
var register = require("./util").register;
var Factory = require("../factory").Factory;
var Workspace = require("./workspace").Workspace;
var UTIL = require("../util");

var geotools = Packages.org.geotools;
var ShapefileDataStoreFactory = geotools.data.shapefile.ShapefileDataStoreFactory;

var prepConfig = function(config) {
    if (config) {
        if (typeof config === "string") {
            config = {path: String(config)};
        }
        if (!config.path) {
            throw "Directory config must include a path.";
        }        
    }
    return config;
};

var Directory = UTIL.extend(Workspace, /** @lends Directory# */ {
    
    /**
        The absolute directory path.
        @type {String}
     */
    
    /**
        Create a workspace from a directory.
        @constructs Directory
        @extends Workspace
        @arg {String} path - Path to the directory.
     */
    constructor: function Directory(config) {
        Workspace.prototype.constructor.apply(this, [prepConfig(config)]);
    },
    
    /**
        Create the underlying store for the workspace.

        @arg {Object} config 
        @returns {org.geotools.data.directory.DirectoryDataStore}
        @private
     */
    _create: function(config) {
        if (!UTIL.isDirectory(config.path)) {
            throw "Directory path must exist.";
        }
        var factory = new ShapefileDataStoreFactory();
        return factory.createDataStore({url: UTIL.toURL(config.path)});
    },

    /**
        @private
     */
    get config() {
        return {
            type: this.constructor.name,
            path: this.path
        };
    }
    
});

/**
    Create a geoscript workspace object from a GeoTools store.

    @arg {org.geotools.data.DataStore} _store - A GeoTools store.
    :returns: :class`Directory`
    @private
 */
Directory.from_ = function(_store) {
    var workspace = new Directory();
    workspace._store = _store;
    return workspace;
};

/**
    Sample code create a new workspace for accessing data on the filesystem:
   
    .. code-block:: javascript
  
        js> var dir = new WORKSPACE.Directory("data/shp");
        js> dir
        <Directory ["states"]>
        js> var states = dir.get("states");
        js> states
        <Layer name: states, count: 49>
 */

exports.Directory = Directory;

// register a directory factory for the module
register(new Factory(Directory, {
    handles: function(config) {
        var capable;
        try {
            config = prepConfig(config);
            capable = true;
        } catch (err) {
            capable = false;
        }
        return capable;
    },
    wraps: function(_store) {
        return (
            _store instanceof geotools.data.shapefile.ShapefileDataStore ||
            _store instanceof geotools.data.directory.DirectoryDataStore
        );
    }
}));
