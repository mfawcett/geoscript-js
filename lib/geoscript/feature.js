/**
    Feature related functionality.
 */

/**
    The :mod:`feature` module provides a provides constructors for features
    and feature schema.
  
    .. code-block:: javascript
    
        js> var FEATURE = require("geoscript/feature");
 */

exports.Feature = require("./feature/feature").Feature;

exports.Field = require("./feature/field").Field;

exports.Schema = require("./feature/schema").Schema;

/**
    Create a feature or schema given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {feature.Feature} or :class`feature.Schema`
    @private
 */
exports.create = require("./feature/util").create;
