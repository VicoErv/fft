import DataStore from "nedb";

const path = __dirname + '/local/db/following';

export default class Following {
    Following(db) {
        this.db = new DataStore({ filename: path, autoload: true });;
    }

    byId(id, callback) {
        this.db.find({ userId: id }, callback);
    }

    add(data, callback) {
        this.db.insert(data, callback);
    }
}