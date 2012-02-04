var FILTER_UTIL = require("./filter/util");

/**
    Filter related functionality.
 */

/**
    The :mod:`filter` module provides a constructor for Filter objects.
  
    .. code-block:: javascript
    
        js> var FILTER = require("geoscript/filter");
 */

var Filter = exports.Filter = require("./filter/filter").Filter;
exports.Expression = require("./filter/expression").Expression;
exports.and = Filter.and;
exports.or = Filter.or;
exports.not = Filter.not;
exports.fids = Filter.fids;

/**
    Convenience method for creating filters.  May be called in one of three
    forms:
  
    1. where(cql) - This is equivalent to new Filter(cql).
  
    2. where(fn, arg1, arg2, ...) - Constructs cql from string arguments 
       assuming the first argument is a function name.  E.g. 
       where("WITHIN", "the_geom", "POINT(1 1)").
  
    3. where(args) - Constructs a cql string from an array of strings assuming
       the first item in the array is a function name.  E.g.
       where(["WITHIN", "the_geom", "POINT(1 1)"]).
    @private
 */
var where = exports.where = function() {
    var cql;
    if (arguments.length === 1 && typeof arguments[0] === "string") {
        cql = arguments[0];
    } else {
        var args;
        if (arguments.length > 1) {
            args = Array.slice(arguments);
        } else {
            // assume an array is given for first arg
            args = arguments[0];
        }
        cql = args[0] + "(" + args.slice(1).join(",") + ")";
    }
    return new Filter(cql);
};

/**
    Create a filter given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {filter.Filter}
    @private
 */
exports.create = FILTER_UTIL.create;
