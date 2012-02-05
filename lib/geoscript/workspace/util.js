/**
 * @module geoscript/workspace/util
 */
var Registry = require("../registry").Registry;

var registry = new Registry();

/**
    Create a workspace given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {workspace.Workspace}
    @private
 */
exports.create = registry.create;

exports.from_ = registry.from_;

exports.register = registry.register;
