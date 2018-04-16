import DataStore from "nedb";

const path = __dirname + '/local/db/' + 'comment';

export default class Comment {
    Comment(db) {
        this.db = new DataStore({ filename: path, autoload: true });
    }

    get(callback) {
        this.db.find({}, function (err, doc) {
            callback(doc);
        })
    }
}