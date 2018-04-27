const Client = require('instagram-private-api').V1;
const Util = require("../lib/util");
const DataStore = require("nedb");
const fs = require('fs');
var AsciiTable = require('ascii-table');

const path = __dirname + '/../local/db/db';

function Account() {
    this.cookie = __dirname + '/../local/cookie/' + this.username + '.cookie';
    this.db = new DataStore({ filename: path, autoload: true });
}

Account.prototype.getCookie = function () {
    this.cookie = __dirname + '/../local/cookie/' + this.username + '.cookie';

    return this.cookie;
}

Account.prototype.login = function (username, password) {
    this.username = username;
    this.password = password;
    let that = this;

    console.log(` ${Colors.FgGreen}Please wait...${Colors.Reset}`);

    if (Util.fileExists(that.getCookie())) {
        return new Promise(function (resolve) {
            var session = new Client.Session(
                new Client.Device(that.username),
                new Client.CookieFileStorage(that.getCookie())
            );

            if (typeof arg === 'undefined')
                console.log(`${Colors.Bright}${Colors.FgGreen}Login `
                    + `using stored Session!${Colors.Reset}`);

            resolve(session);
        }).catch(function (err) {
            console.log(err.message);
        })
    } else {

        return new Promise(function (resolve) {
            Client.Session.create(
                new Client.Device(that.username),
                new Client.CookieFileStorage(that.getCookie()),
                that.username,
                that.password
            ).then(function (session) {
                if (typeof arg === 'undefined')
                    console.log(`${Colors.Bright}${Colors.FgGreen}Login `
                        + `Completed!${Colors.Reset}`);

                resolve(session);
            }).catch(function () {
                if (fs.existsSync(that.getCookie()))
                    fs.unlinkSync(that.getCookie());

                console.log(`${Colors.FgRed}Invalid username or `
                    + `password${Colors.Reset}`);
            })
        })
    }
}

Account.prototype.list = function () {
    let that = this;

    return new Promise(function (resolve, reject) {
        that.db.find({}, function (err, docs) {
            if (err) reject(err);

            if (docs.length === 0) {
                console.log("No user");
                console.log(`- use ${Colors.FgRed}add${Colors.Reset} command to add new user`);

                resolve();
            } else {
                var ascii = new AsciiTable('User List');
                ascii.setHeading('Username', 'Target', 'Delay');
                docs.forEach(element => {
                    ascii.addRow(element.username, element.target, element.delay);
                });

                console.log(ascii.toString());
                resolve();
            }
        });
    })
}

Account.prototype.byUsername = function (username, callback) {
    this.db.find({ username: username }, callback);
}

Account.prototype.add = function (data, callback) {
    this.db.insert(data, callback);
}

Account.prototype.change = function (search, data, callback) {
    this.db.update(search, data, {}, callback);
}

Account.prototype.addAccount = function (command) {
    let that = this;

    return Util.ask('username? ')
        .then(() => Util.ask('password? '))
        .then(() => Util.ask('target? '))
        .then(() => Util.ask('delay (ms)? '))
        .then((rl) => {
            return that.login(Util.responses[0], Util.responses[1])
                .then(function (session) {
                    var user = {};

                    user.username = Util.responses[0];
                    user.password = Util.responses[1];
                    user.target = Util.responses[2];
                    user.delay = Util.responses[3];

                    Util.responses.length = 0;

                    if (typeof command === 'undefined') {
                        rl.close();
                    }

                    if (typeof command !== 'undefined') {
                        console.log(`${Colors.FgGreen}*User Registered*`
                            + `${Colors.Reset}`);
                    } else {
                        console.log(`${Colors.FgGreen}*Processing User*`
                            + `${Colors.Reset}`);
                    }

                    console.log('Username\t' + Colors.FgRed
                        + user.username + Colors.Reset);

                    console.log('Target is\t' + Colors.FgBlue
                        + user.target + Colors.Reset);

                    console.log('With delay\t' + Colors.Underscore
                        + user.delay + Colors.Reset + ' ms');

                    if (user.username.length > 0 &&
                        user.password.length > 0) {

                        return new Promise(function (resolve, reject) {
                            that.byUsername({
                                username: user.username
                            }, function (err, res) {
                                if (err) reject(err);
                                if (res.length === 0) {
                                    that.add(user,
                                        function (err, doc) {
                                            if (err) reject(err);
                                            resolve(user);
                                        });
                                } else {
                                    that.change(
                                        { username: user.username },
                                        user, {}, function (err, doc) {
                                            if (err) reject(err);
                                            resolve(user);
                                        });
                                }
                            });
                        }).catch(function (error) {
                            console.log(error);
                        });
                    }
                }).catch(function (error) {
                    console.log(error);

                    return false;
                });
        });
}

module.exports = Account;