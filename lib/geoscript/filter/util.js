var Registry = require("../registry").Registry;

var registry = new Registry();

/**
    Create a filter given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {filter.Filter}
    @private
 */
exports.create = registry.create;

exports.register = registry.register;
