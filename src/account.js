var Account = {};

function Account(username, password) {
    this.username = username;
    this.password = password;
    this.cookie = __dirname + '/local/cookie/' + this.username + '.cookie';
}

Account.prototype.login = function () {

    if (typeof arg === 'undefined')
        console.log(` ${Colors.FgGreen}Please wait...${Colors.Reset}`);

    if (Util.fileExists(this.cookie)) {
        return new Promise(function (resolve) {
            var session = new Client.Session(
                new Client.Device(this.username),
                new Client.CookieFileStorage(this.cookie)
            );

            if (typeof arg === 'undefined')
                console.log(`${Colors.Bright}${Colors.FgGreen}Login using stored Session!${Colors.Reset}`);

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
                    console.log(`${Colors.Bright}${Colors.FgGreen}Login Completed!${Colors.Reset}`);

                return session;
            }).catch(function () {
                if (fs.existsSync(this.cookie))
                    fs.unlinkSync(this.cookie);

                console.log(`${Colors.FgRed}Invalid username or password${Colors.Reset}`);
            })
        })
    }
}

module.exports = Account;