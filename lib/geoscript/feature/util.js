var Registry = require("../registry").Registry;

var registry = new Registry();

/**
    Create a feature or schema given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {feature.Feature} or :class`feature.Schema`
    @private
 */
exports.create = registry.create;

/** private: method[register] */
exports.register = registry.register;
