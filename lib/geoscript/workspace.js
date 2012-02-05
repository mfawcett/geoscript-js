/**
 * @module geoscript/workspace
 */

exports.create = require("./workspace/util").create;

exports.Workspace = require("./workspace/workspace").Workspace;

exports.Memory = require("./workspace/memory").Memory;

exports.Directory = require("./workspace/directory").Directory;

exports.PostGIS = require("./workspace/postgis").PostGIS;

exports.H2 = require("./workspace/h2").H2;

exports.MySQL = require("./workspace/mysql").MySQL;

exports.SpatiaLite = require("./workspace/spatialite").SpatiaLite;

/**
    A memory workspace that will be used to collect all temporary layers
    created without a specific workspace.
    @type {workspace.Memory}
 */
exports.memory = new exports.Memory();
