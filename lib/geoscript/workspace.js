/** api: module = workspace */

/**
    A collection of workspace types.
 */

/**
    The :mod:`workspace` module provides a provides constructors for different
    workspace types.
  
    .. code-block:: javascript
    
        js> var WORKSPACE = require("geoscript/workspace");
 */

/**
    Create a workspace given a configuration object.

    @arg {Object} config - Configuration object.
    @returns {workspace.Workspace}
    @private
 */
exports.create = require("./workspace/util").create;

/** private: classes[] = workspace */
exports.Workspace = require("./workspace/workspace").Workspace;

/** api: classes[] = memory */
exports.Memory = require("./workspace/memory").Memory;

/** api: classes[] = directory */
exports.Directory = require("./workspace/directory").Directory;

/** api: classes[] = postgis */
exports.PostGIS = require("./workspace/postgis").PostGIS;

/** api: classes[] = h2 */
exports.H2 = require("./workspace/h2").H2;

/** api: classes[] = mysql */
exports.MySQL = require("./workspace/mysql").MySQL;

/** private: classes[] = spatialite */
exports.SpatiaLite = require("./workspace/spatialite").SpatiaLite;

/**
    A memory workspace that will be used to collect all temporary layers
    created without a specific workspace.
    @type {workspace.Memory}
 */
exports.memory = new exports.Memory();
