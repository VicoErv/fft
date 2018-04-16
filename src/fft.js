const Client = require('instagram-private-api').V1;
const Account = require('account')
const Comment = require('comment')
const Following = require('following');

function FFT(user) {
    this.comment = new Comment();
    this.following = new Following();
    this.account = new Account(user.username, user.password);
    this.user = user;
}

FFT.prototype.run = function () {
    let that = this;

    this.comment.get(doc => this.comments = doc);

    this.account.login()
        .then((session) => that.session = session)
        .then(() => {
            var account = Client.Account.searchForUser(that.session, that.user.target)
            return [that.session, account]
        })
        .spread((session, account) => {
            let following = new Client.Feed.AccountFollowers(session, account.id);
            return following.get();
        })
        .then(following => {
            let i = 0;

            var promiseWhile = Promise.method(function (condition, action) {
                if (!condition()) return;

                return new Promise((resolve) => setTimeout(function () {
                    return action()
                        .then(promiseWhile.bind(null, condition, action))
                    resolve();
                }, userInput.delay))
            });

            promiseWhile(function () {
                return typeof following[i] !== 'undefined';
            }, function () {
                let current = following[i];

                if (current.params.isPrivate) {
                    return new Promise(function (resolve) {
                        console.log(`${current._params.username}${Colors.FgRed}`
                            + `is Private, Skip${Colors.Reset}`);
                        resolve(++i);
                    });
                }

                return Client.Relationship.create(session, current.id)
                    .then(function (resp) {
                        let resolve = Promise.resolve;

                        that.following.byId(current.id, function (err, doc) {
                            if (doc.length === 0) {
                                console.log(`${current._params.username} 
                                ${Colors.FgGreen}Success Following${Colors.Reset}
                            `);

                                if (fftOptions.isSilent) return ++i;

                                let userMedia = new Client.Feed
                                    .UserMedia(this.session, current.id, 1);

                                let _userMedia = userMedia.get.bind(userMedia);

                                return _userMedia()
                                    .then(function (media) {
                                        if (media.length === 0) {
                                            console.log(`${current._params.username}`
                                                + `${Colors.FgRed}No Media, Skip`
                                                + `${Colors.Reset}`);
                                            return ++i;
                                        }
                                        Client.Comment.create(gSession, media[0].id,
                                            sample(comments).text)
                                            .then(function (resp) {
                                                console.log(`${current._params.username}` +
                                                    ` ${Colors.FgGreen}Comment Added${Colors.Reset}`);

                                                Client.Like.create(gSession, media[0].id)
                                                    .then(function (resp) {
                                                        console.log(`${current._params.username}` +
                                                            ` ${Colors.FgGreen}Like Given${Colors.Reset}`);
                                                        that.following.add({ userId: current.id },
                                                            function (err, newDoc) {

                                                                return ++i;
                                                            })
                                                    }).catch(function (error) {
                                                        console.log(error);
                                                    });
                                            }).catch(function (error) {
                                                let msg = error.json.feedback_message;
                                                console.log(`${Colors.Bright}${Colors.FgRed}` +
                                                `${current._params.username}${Colors.Reset} ` +
                                                `${Colors.FgRed}${msg}${Colors.Reset}`);

                                                return ++i;
                                            });
                                    }).catch(function () {
                                        console.log(`${current._params.username}` +
                                        ` ${Colors.FgRed}is Private${Colors.Reset}`);

                                        return ++i;
                                    })
                            } else {
                                console.log(`${current._params.username} ${Colors.FgRed}` +
                                `Already Followed${Colors.Reset}`);
                                return ++i;
                            }
                        });
                    });
            }).then();
        });
}

module.exports = FFT;