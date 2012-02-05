/**
 * @module geoscript/workspace/memory
 */
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

var Memory = UTIL.extend(Workspace, /** @lends Memory# */ {
    
    /**
        Create a memory based workspace.
        @constructs Memory
        @extends Workspace
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
