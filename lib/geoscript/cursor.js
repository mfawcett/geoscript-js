/**
 * @module geoscript/cursor
 */

var UTIL = require("./util");
var GeoObject = require("./object").GeoObject;

var Cursor = exports.Cursor = UTIL.extend(GeoObject, /** @lends Cursor# */ {
    
    /**
        The underlying cursor object with ``hasNext``, `next``, and ``close``
        methods.
        @type {Object}
        @private
     */
    _cursor: null,
    
    /**
        The method called to cast an underlying result object to a GeoScript
        object.
        @type {Function}
        @private
     */
    cast: null,
    
    /**
        Optional method to open the cursor.  If not provided, the cursor must
        be provided an ``iterator`` and will be considered open upon 
        construction.
        @type {Function}
        @private
     */
    open: null,

    /**
        The index of the most recently read result.  This is intialized as
        -1 and is incremented with each result read.
        @type {Number}
     */
    index: -1,
    
    /**
        The most recently read object in the collection.  This will be ``null``
        if no results have been read or if the cursor has been exhausted.
        @type {Object}
     */
    current: null,

    /**
        Close has been called on the cursor.
        @type {Boolean}
        @private
     */
    closed: false,    
    
    /**
        The cursor has been opened.
        @type {Boolean}
        @private
     */
    opened: false,    
    
    /**
        A cursor will not generally need to be created.  Instead, cursors are 
        returned when querying features from a layer.
        
        @constructs Cursor
     */
    constructor: function Cursor(config) {
        this._cursor = config._cursor;
        this.cast = config.cast;
        this.open = config.open;
        if (!this.open) {
            this.opened = true;
        }
        this.scope = config.scope;
    },
    
    /**
        Determine whether there are more results to retrieve.

        @returns {Boolean}
     */
    hasNext: function() {
        var has = false;
        if (!this.opened) {
            this._cursor = this.open.call(this.scope);
            this.opened = true;
        }
        if (this._cursor) {
            try {
                has = this._cursor.hasNext();
            } catch (err) {
                has = false;
            }
        }
        if (!has) {
            this.close();
        }
        return has;
    },

    /**
        Retrieve the next result in the results set.  If no more results are
        available, `undefined` will be returned.

        @returns {Object} The next result.
     */
    next: function() {
        var results = this.read(1);
        return results[0];
    },
    
    /**
        Get the next number of results.  The length of the resulting array
        will be shorter than the given number in cases where the cursor is
        exhausted of results before the given number is reached.  This method
        differs from the :meth:`read` method in that the cursor is always closed
        when calling :meth:`get` before the results are returned.  This serves
        as a convenient way to get a list of results and close a cursor in one
        call.
       
        Note that in the special case where ``num`` is ``1`` a single result
        will be returned instead of an array of results.

        @arg {Number} num - The number of results to get.  Default is ``1``.
        @returns {Array || Object} An array of results.  In the case where
            ``num`` is ``1``, a single result will be returned instead of an
            array of results.
     */
    get: function(num) {
        num = num || 1;
        var results = this.read(num);
        this.close();
        return num === 1 ? results[0] : results;
    },

    /**
        Read the next number of results.  The length of the resulting array
        will be shorter than the given number in cases where the cursor is
        exhausted of results before the given number is reached.

        @arg {Number} len - Number of results to read.
        @returns {Array} An array of results.
     */
    read: function(len) {
        var _result, results = [];
        for (var i=0; i<len; ++i) {
            if (this.hasNext()) {
                _result = this._cursor.next();
            } else {
                break;
            }
            ++this.index;
            this.current = this.cast.call(this.scope, _result);
            results.push(this.current);
        }
        return results;
    },
    
    /**
        Advance the cursor to skip the given number of results.

        @arg {Number} skip - Number of results to skip.
        @returns {cursor.Cursor} This cursor.
     */
    skip: function(offset) {
        for (var i=0; i<offset; ++i) {
            if (this.hasNext()) {
                this._cursor.next();
            } else {
                break;
            }
            ++this.index;
        }
        return this;
    },

    /**
        Call a function with each result in the results set.  If the function
        explicitly returns `false`, the iteration will stop.
      
        .. note::
        
            Client code should call :meth:`close` if the cursor is not exhausted
            by calling :meth:`next` or :meth:`forEach`.

        @arg {Function} func 
        @arg {Object} scope - If provided, the function will be called as if
            it were a method of this object.
     */
    forEach: function(func, scope) {
        var i=0, ret;
        while (this.hasNext()) {
            ret = func.call(scope, this.next(), i);
            ++i;
            if (ret === false) {
                break;
            }
        }
    },

    /**
        Close access to this cursor.  This method should be called if the cursor
        is not exhausted by calling :meth:`next` or :meth:`forEach`.
     */ 
    close: function() {
        this.current = null;
        if (this._cursor) {
            this._cursor.close();
            delete this._cursor;
        }
        this.closed = true;
    }
    
});

