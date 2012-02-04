var Registry = require("../registry").Registry;

var registry = new Registry();

/**
    Create a workspace given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {workspace.Workspace}
    @private
 */
exports.create = registry.create;

/** private: method[from_] */
exports.from_ = registry.from_;

/** private: method[register] */
exports.register = registry.register;
