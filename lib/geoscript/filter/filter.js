/**
 * @module geoscript/filter/filter
 */

var FILTER_UTIL = require("./util");
var Factory = require("../factory").Factory;
var UTIL = require("../util");
var GeoObject = require("../object").GeoObject;

var _Filter = Packages.org.opengis.filter.Filter;
var CQL = Packages.org.geotools.filter.text.cql2.CQL;
var ECQL = Packages.org.geotools.filter.text.ecql.ECQL;
var Parser = Packages.org.geotools.xml.Parser;
var Encoder = Packages.org.geotools.xml.Encoder;
var _factory = Packages.org.geotools.factory;
var FilterFactory2 = _factory.CommonFactoryFinder.getFilterFactory2(_factory.GeoTools.getDefaultHints());

var OGC = {
    "1.0": {
        OGC: Packages.org.geotools.filter.v1_0.OGC,
        OGCConfiguration: Packages.org.geotools.filter.v1_0.OGCConfiguration
    },
    "1.1": {
        OGC: Packages.org.geotools.filter.v1_1.OGC,
        OGCConfiguration: Packages.org.geotools.filter.v1_1.OGCConfiguration
    }
};


var Filter = exports.Filter = UTIL.extend(GeoObject, /** @lends Filter# */ {
    
    /**
        Create a new filter to express constraints.  Filters are typically
        used when querying features from a layer.  A feature will be
        returned in a query if the filter's {@link Filter#evaluate} method
        returns true for the given feature.

        Filters are created using Common Query Language (CQL).

        @constructs Filter
        @arg {String} cql - A CQL string representing filter constraints.      
     */
    constructor: function Filter(cql) {
        if (cql) {
            if (typeof cql !== "string") {
                cql = cql.cql;
            }
            var _filter;
            try {
                _filter = ECQL.toFilter(cql);
            } catch (err) {
                try {
                    _filter = CQL.toFilter(cql);
                } catch (err2) {
                    throw err;
                }
            }
            this._filter = _filter;
        }
    },
    
    /**
        Determine whether a feature matches the constraints of the filter.

        @arg {feature.Feature} feature - A feature.
        @returns {Boolean}  The feature matches the filter.
     */
    evaluate: function(feature) {
        return Boolean(this._filter.evaluate(feature._feature));
    },
    
    /**
        A filter that represents the negation of the constraints in this filter.
        @type {filter.Filter}
     */
    get not() {
        return Filter.from_(FilterFactory2.not(this._filter));
    },

    /**
        Returns a new filter that is the logical AND of this filter and the
        input filter.  Provide multiple arguments to AND multiple filters.

        @arg {filter.Filter} filter - Input filter.
        @returns {filter.Filter}
     */
    and: function(filter) {
        var filters = Array.prototype.slice.call(arguments);
        filters.push(this);
        return Filter.and(filters);
    },
    
    /**
        Returns a new filter that is the logical OR of this filter and the
        input filter.  Provide multiple arguments to OR multiple filters.

        @arg {filter.Filter} filter - Input filter.
        @returns {filter.Filter}
     */
    or: function(filter) {
        var filters = Array.prototype.slice.call(arguments);
        filters.push(this);
        return Filter.or(filters);
    },
    
    /**
        The CQL string that represents constraints in this filter.
        @type {String}
     */
    get cql() {
        var string;
        try {
            string = ECQL.toECQL(this._filter);
        } catch (err) {
            string = CQL.toCQL(this._filter);
        }
        return String(string);
    },
    
    get config() {
        return {
            type: "Filter",
            cql: this.cql
        };
    },
    
    /**
        Generate an XML document string following the Filter Encoding
        specification.

        @arg {String} version - Filter Encoding specification version
            (default is `"1.0"`).
        @arg {Boolean} pretty - Use whitespace to indent document elements
            (default is `false`).
        @returns {String}
        @private
     */
    toXML: function(version, pretty) {
        version = version || "1.0";
        var _config = new OGC[version].OGCConfiguration();
        var ogc = OGC[version].OGC.getInstance();
        var encoder = new Encoder(_config);
        encoder.setIndenting(!!pretty);
        encoder.setOmitXMLDeclaration(true);
        var out = new java.io.ByteArrayOutputStream();
        encoder.encode(this._filter, ogc.Filter, out);
        return String(java.lang.String(out.toByteArray()));
    },
    
    toFullString: function() {
        var str;
        try {
            str = this.cql;
        } catch (err) {
            str = String(this._filter);
        }
        return str;
    }
    
});

Filter.from_ = function(_filter) {
    var filter = new Filter();
    filter._filter = _filter;
    return filter;
};

Filter.PASS = Filter.from_(_Filter.INCLUDE);
Filter.FAIL = Filter.from_(_Filter.EXCLUDE);

// logical operators

var getArrayList = function(filters) {
    var len = filters.length;
    var list = new java.util.ArrayList(len);
    var filter;
    for (var i=0; i<len; ++i) {
        filter = filters[i];
        if (!(filter instanceof Filter)) {
            filter = new Filter(filter);
        }
        list.add(filter._filter);
    }
    return list;
};

Filter.and = function(filters) {
    return Filter.from_(FilterFactory2.and(getArrayList(filters)));    
};

Filter.or = function(filters) {
    return Filter.from_(FilterFactory2.or(getArrayList(filters)));
};

Filter.not = function(filter) {
    if (!(filter instanceof Filter)) {
        filter = new Filter(filter);
    }
    return Filter.from_(FilterFactory2.not(filter._filter));
};

Filter.fids = function(fids) {
    var _filter = FilterFactory2.createFidFilter();
    for (var i=0, len=fids.length; i<len; ++i) {
        _filter.addFid(fids[i]);
    }
    return Filter.from_(_filter);
};

// register a filter factory for the module
FILTER_UTIL.register(new Factory(Filter, {
    handles: function(config) {
        return true;
    }
}));

/**
    Examples of filters that represent various simple constraints:
   
    .. code-block:: javascript
   
        js> var namedFoo = new FILTER.Filter("name = 'foo'");
        js> var oneThing = new FILTER.Filter("thing = 1");
        js> var few = new FILTER.Filter("count < 4");
        js> var many = new FILTER.Filter("count > 36");
        js> var teens = new FILTER.Filter("age BETWEEN 13 AND 19");
  
    Examples of filters representing spatial constraints:
  
    .. code-block:: javascript
    
        js> var box = new FILTER.Filter("BBOX(the_geom, -10, -10, 10, 10)");
        js> var close = new FILTER.Filter("DWITHIN(the_geom, POINT(1 0), 3, kilometers)");
        js> var has = new FILTER.Filter("CONTAINS(the_geom, POINT(1 0))");
        js> var hit = new FILTER.Filter("INTERSECTS(the_geom, LINESTRING(0 0, 1 1))");
 */

