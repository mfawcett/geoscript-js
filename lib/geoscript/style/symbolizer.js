/**
 * @module geoscript/style/symbolizer
 */
var UTIL = require("../util");
var STYLE_UTIL = require("./util");
var GeoObject = require("../object").GeoObject;
var Filter = require("../filter").Filter;
var Brush = require("./brush").Brush;
var Expression = require("../filter").Expression;

var Symbolizer = exports.Symbolizer = UTIL.extend(GeoObject, /** @lends Symbolizer# */ {
    
    /**
        with higher zIndex values will be drawn over symbolizers with lower
        values.  By default, symbolizers have a zIndex of ``0``.
        @type {Number} The zIndex determines draw order of symbolizers.  Symbolizers
     */
    zIndex: 0,

    /**
        Instances of the symbolizer base class are not created directly.  
        See the constructor details for one of the symbolizer subclasses.
        @constructs Symbolizer
     */
    constructor: function Symbolizer(config) {
        this.cache = {};
        if (config) {
            UTIL.apply(this, config);
        }
    },

    /**
        Sets a filter for this symbolizer
        @arg {filter.Filter}
        @returns {symbolizer.Symbolizer} This symbolizer
     */
    where: function(filter) {
        this.filter = filter;
        return this;
    },
    
    /**
        Optional filter that determines where this symbolizer applies.
        @name Symbolizer#filter
        @type {filter.Filter}
     */
    set filter(filter) {
        if (typeof filter === "string") {
            filter = new Filter(filter);
        }
        this.cache.filter = filter;
    },
    get filter() {
        return this.cache.filter;
    },
    
    /**
        @arg {Object} config - An object with optional ``min`` and ``max`` 
            properties specifying the minimum and maximum scale denominators
            for applying this symbolizer.
        @returns {Symbolizer} This symbolizer.
    */
    range: function(config) {
        this.minScaleDenominator = config.min;
        this.maxScaleDenominator = config.max;
        return this;
    },
    
    /**
        Generate a composite style from this symbolizer and the provided
        symbolizer.

        @arg {Symbolizer} symbolizer 
        @returns {style.Style}
     */
    and: function(symbolizer) {
        var Style = require("./style").Style;
        return new Style({parts: [this, symbolizer]});
    },

    get _symbolizer() {
        throw new Error("Subclasses must implement a _symbolizer getter.");
    },

    /**
        This symbolizer represented as a rule.
        @type {org.geotools.styling.Rule}
        @private
     */
    get _rule() {
        var _rule = STYLE_UTIL._builder.createRule([this._symbolizer]);
        if (this.filter) {
            _rule.setFilter(this.filter._filter);
        }
        if (this.minScaleDenominator) {
            _rule.setMinScaleDenominator(this.minScaleDenominator);
        }
        if (this.maxScaleDenominator) {
            _rule.setMaxScaleDenominator(this.maxScaleDenominator);
        }
        return _rule;
    },

    /**
        @private
     */
    get config() {
        return {};
    },

    /**
        @private
     */
    toFullString: function() {
        var items = [];
        var config = this.config;
        var val;
        for (var key in config) {
            if (key !== "type") {
                val = config[key];
                if (typeof val === "string") {
                    val = '"' + val + '"';
                }
                items.push(key + ": " + val);
            }
        }
        return items.join(", ");
    }

});
