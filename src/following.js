const DataStore = require('nedb');

const path = __dirname + '/local/db/following';

function Following (db) {
    this.db = new DataStore({ filename: path, autoload: true});;
}

Following.prototype.byId = function (id, callback) {
    this.db.find({ userId: id }, callback);
}

Following.prototype.add = function (data, callback) {
    this.db.insert(data, callback);
}

module.exports = Following;