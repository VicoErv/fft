import Util from "../lib/util";
import DataStore from "nedb";

const path = __dirname + '/local/db/db';

export default class Account {
    Account(username, password) {
        this.username = username;
        this.password = password;
        this.cookie = __dirname + '/local/cookie/' + this.username + '.cookie';
        this.db = new DataStore({ filename: dbFolder.db, autoload: true });
    }

    login() {
        console.log(` ${Colors.FgGreen}Please wait...${Colors.Reset}`);

        if (Util.fileExists(this.cookie)) {
            return new Promise(function (resolve) {
                var session = new Client.Session(
                    new Client.Device(this.username),
                    new Client.CookieFileStorage(this.cookie)
                );

                if (typeof arg === 'undefined')
                    console.log(`${Colors.Bright}${Colors.FgGreen}Login `
                        + `using stored Session!${Colors.Reset}`);

                return session;
            }).catch(function (err) {
                console.log(err.message);
            })
        } else {

            return new Promise(function (resolve) {
                Client.Session.create(
                    new Client.Device(username),
                    new Client.CookieFileStorage(this.cookie),
                    this.username,
                    this.password
                ).then(function (session) {
                    if (typeof arg === 'undefined')
                        console.log(`${Colors.Bright}${Colors.FgGreen}Login `
                            + `Completed!${Colors.Reset}`);

                    return session;
                }).catch(function () {
                    if (fs.existsSync(this.cookie))
                        fs.unlinkSync(this.cookie);

                    console.log(`${Colors.FgRed}Invalid username or `
                        + `password${Colors.Reset}`);
                })
            })
        }
    }

    byUsername(username, callback) {
        this.db.find({ username: username }, callback);
    }

    add(data, callback) {
        this.db.insert(data, callback);
    }

    change(search, data, callback) {
        this.db.update(search, data, {}, callback);
    }

    static addAccount(command) {
        let that = this;

        return Util.ask('username? ')
            .then(() => Util.ask('password? '))
            .then(() => Util.ask('target? '))
            .then(() => Util.ask('delay (ms)? '))
            .then((rl) => {
                that.login(Util.responses[0], Util.responses[1])
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
                    });
            });
    }
}