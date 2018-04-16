const DataStore = require('nedb');

const path = __dirname + '/local/db/' + 'comment';

function Comment(db) {
    this.db = new DataStore({ filename: path, autoload: true });
}

Comment.prototype.get = function (callback) {
    this.db.find({}, function (err, doc) {
        callback(doc);
    })
}

module.exports = comment;