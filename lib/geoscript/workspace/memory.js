var register = require("./util").register;
var Factory = require("../factory").Factory;
var Workspace = require("./workspace").Workspace;
var UTIL = require("../util");

var MemoryDataStore = Packages.org.geotools.data.memory.MemoryDataStore;

var prepConfig = function(config) {
    if (config === undefined) {
        config = {};
    }
    return config;
};

/** api: (define)
 *  module = workspace
 *  class = Memory
 */

/** api: (extends)
 *  workspace/workspace.js
 */
var Memory = UTIL.extend(Workspace, {
    
    /**
        .. class:: Memory
      
            Create a memory based workspace.
     */
    constructor: function Memory(config) {
        Workspace.prototype.constructor.apply(this, [prepConfig(config)]);
    },
    
    /**
        Create the underlying store for the workspace.

        @arg {Object} config 
        @returns {org.geotools.data.memory.MemoryDataStore}
        @private
     */
    _create: function(config) {
        return new MemoryDataStore();
    }
    
});

exports.Memory = Memory;

// register a memory factory for the module
register(new Factory(Memory, {
    handles: function(config) {
        config = prepConfig(config);
        var capable = false;
        if (typeof config === "object") {
            if (config.type) {
                if (config.type.toLowerCase() === "memory") {
                    capable = true;
                }
            } else if (Object.keys(config).length === 0) {
                capable = true;
            }
        }
        return capable;
    }
}));
