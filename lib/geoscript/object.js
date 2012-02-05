/**
 * @module geoscript/object
 */

var extend = require("./util").extend;

exports.GeoObject = extend(Object, /** @lends GeoObject */{

    /**
        @constructs GeoObject
     */
    constructor: function GeoObject() {},
    
    /**
        @type {Object}
        @private
     */
    get config() {
        return {};
    },
    
    /**
        The JSON representation of the object.
        @type {String}
     */
    get json() {
        return JSON.stringify(this.config);
    },

    /**
        Returns a short string representation of the object.

        @returns {String}
        @private
     */
    toFullString: function() {
        return "";
    },
    
    /**
        Returns a string representation of the object.

        @arg {Boolean} draw - Try drawing the geometry.
        @returns {String}
        @private
     */
    toString: function(draw) {
        var str = this.toFullString();
        if (str && str.length > 60) {
            str = str.substring(0, 60) + "...";
        }
        if (draw !== false) {
            try {
                require("./viewer").drawIfBound(this);
            } catch (err) {
                // pass
            }
        }
        return "<" + this.constructor.name + (str ? " " + str : "") + ">";
    }
    
});
