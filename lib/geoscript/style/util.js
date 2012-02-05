/**
 * @module geoscript/style/util
 */
var geotools = Packages.org.geotools;
var Registry = require("../registry").Registry;

var registry = new Registry();

/**
    Create a symbolizer or a rule given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {Object} A symbolizer or a rule.
    @private
 */
exports.create = registry.create;

exports.register = registry.register;

exports._builder = new geotools.styling.StyleBuilder();
exports._filterFactory = geotools.factory.CommonFactoryFinder.getFilterFactory(null);

