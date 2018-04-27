var Client = require('instagram-private-api').V1;
var Colors = require('./lib/colors');
var readline = require('readline');
var Util = require('./lib/util');
var Promise = require('bluebird');
var sample = require('lodash.sample');
var fs = require('fs');
var mkdirp = require('mkdirp');
var request = require('request');
var Account = require('./src/account');

mkdirp(__dirname + '/local/db/', function (err) {
    mkdirp(__dirname + '/local/cookie/', function (err) {
        account = new Account();

        dispatch();
    });
});

var account;
var table;

var user = null;
var comments = null;

var fftOptions = {
    isSilent: false
}

var commands = {
    list: () => account.list().then(askStorage),
    clist: function () {
        dbComment.find({}, {}, function (err, doc) {
            if (doc.length === 0) {
                console.log('No Comment');
                console.log(`- Use ${Colors.FgGreen}comment${Colors.Reset} command to add new comment`);

                return;
            }

            var ascii = new AsciiTable('Comment List');
            ascii.setHeading('Comment');
            doc.forEach(element => {
                ascii.addRow(element.text);
            });

            console.log(ascii.toString());
        })
    },
    remove: function (command) {
        if (command.length < 2) {
            console.log(`${Colors.FgRed}Error: Expected identifier${Colors.Reset}`);
            console.log(` Please provide username`);
            console.log(` example:`);
            console.log(`   - remove yourusername`);

            return;
        }

        db.remove({ username: command[1] });
        console.log(`${Colors.FgGreen}Success${Colors.Reset}`);
        console.log(` User ${command[1]} has been removed.`);
    },
    run: (commands) => {
        for (let i = 1; i < commands.length; i++) {
            if (commands[i] === '-quiet') {
                fftOptions.isSilent = true;
            }
        }

        if (user === null) {
            console.log(`Please \`${Colors.FgBlue}use ${Colors.FgRed}[user index|username]${Colors.Reset}\` before run FFT.`);

            return false;
        }

        Util.hasUser = (user !== null);
        main();
    },
    use: function (command) {
        if (command.length < 2) {
            console.log(`${Colors.FgRed}Error: Expected identifier${Colors.Reset}`);
            console.log(` Please provide index of user or username`);
            console.log(` example:`);
            console.log(`   - use 1`);
            console.log(`   - use yourusername`);

            return;
        }

        if (table.length === 0) {
            console.log(Colors.FgRed + 'No User' + Colors.Reset);

            return;
        }

        if (command[1].search(/^\d+$/) > -1) {
            user = table[parseInt(command[1]) - 1];
            userInput = user;

            console.log(`${Colors.FgBlue}${user.username}${Colors.Reset} Used as default user.`);
            console.log(`Type ${Colors.FgGreen}Run${Colors.Reset} to start program.`);

            return true;
        } else if (typeof command[1] === 'string') {
            db.findOne({ username: command[1] }, {}, function (err, doc) {
                user = doc;
                userInput = user;

                console.log(`Use ${Colors.FgBlue}${user.username}${Colors.Reset} as User`);
                console.log(`Type ${Colors.FgGreen}Run${Colors.Reset} to start program.`);

                return true;
            });
        }
    },
    exit: function () {
        process.exit(0);
    },
    menu: function () {
        dispatch();
    },
    add: (command) => account.addAccount(command).then(askStorage),
    comment: (command) => comment(command),
    cclear: function () {
        dbComment.remove({}, { multi: true });
        console.log(`${Colors.FgGreen}Success${Colors.Reset} remove all comment.`);
        askStorage();
    },
    unfollow: unfollow,
    addsch: addScheduler,
    repost: repost
}

function askStorage() {
    new Promise(function (resolve, reject) {
        resolve(Util.ask(Colors.Bright + Colors.FgGreen
            + 'command' + Colors.Reset + '> '))
    }).then(function (rl) {
        Util.responses.length = 0;
        command = Util.response.split(' ');

        if (command.length > 0 && commands.hasOwnProperty(command[0])) {
            let res = commands[command[0]](command);
            return;
        } else {
            console.log('Invalid command `' + command[0] + '`');
        }

        askStorage();
    })
}

function comment(command) {
    return Util.ask('Please type your comment: ')
        .then(function (rl) {
            dbComment.insert({ text: Util.response }, function (err, newDoc) {
                console.log("Your comment has been added to database.");
                console.log(`Type ${Colors.FgGreen}clist${Colors.Reset} for list your comments.`);
                loadComment(function (doc) {
                    comments = doc;
                    Promise.resolve(askStorage());
                })
            })
        });
}

function add(command) {
}

var gSession = null;

function main() {
    loadComment(doc => comments = doc);

    login(userInput.username, userInput.password)
        .then((session) => {

            return Client.Account.searchForUser(gSession, userInput.target);
        })
        .then((account) => {
            let following = new Client.Feed.AccountFollowers(gSession, account.id);

            return following.get();
        })
        .then(following => {
            let i = 0;

            var promiseWhile = Promise.method(function (condition, action) {
                if (!condition()) return;

                return new Promise((resolve) => setTimeout(function () {

                    return action().then(promiseWhile.bind(null, condition, action))
                    resolve();
                }, userInput.delay))
            });

            promiseWhile(function () {

                return typeof following[i] !== 'undefined';
            }, function () {
                let current = following[i];

                if (current.params.isPrivate) {

                    return new Promise(function (resolve) {
                        console.log(`${current._params.username}${Colors.FgRed} is Private, Skip${Colors.Reset}`);
                        resolve(++i);

                        return true;
                    });
                }

                return follow(following[i].id).then(function (resp) {
                    let resolve = Promise.resolve;

                    dbFollowing.find({ userId: current.id }, function (err, doc) {
                        if (doc.length === 0) {
                            console.log(`${current._params.username} ${Colors.FgGreen}Success Following${Colors.Reset}`);
                            if (fftOptions.isSilent) {

                                return ++i;
                            }

                            let userMedia = new Client.Feed.UserMedia(gSession, current.id, 1);
                            let _userMedia = userMedia.get.bind(userMedia);

                            return _userMedia()
                                .then(function (media) {
                                    if (media.length === 0) {
                                        console.log(`${current._params.username} ${Colors.FgRed}No Media, Skip${Colors.Reset}`);

                                        return ++i;
                                    }
                                    Client.Comment.create(gSession, media[0].id, sample(comments).text)
                                        .then(function (resp) {
                                            console.log(`${current._params.username} ${Colors.FgGreen}Comment Added${Colors.Reset}`);
                                            Client.Like.create(gSession, media[0].id)
                                                .then(function (resp) {
                                                    console.log(`${current._params.username} ${Colors.FgGreen}Like Given${Colors.Reset}`);
                                                    dbFollowing.insert({ userId: current.id }, function (err, newDoc) {

                                                        return ++i;
                                                    })
                                                }).catch(function (error) {
                                                    console.log(error);
                                                });
                                        }).catch(function (error) {
                                            let msg = error.json.feedback_message;
                                            console.log(`${Colors.Bright}${Colors.FgRed}${current._params.username}${Colors.Reset} ${Colors.FgRed}${msg}${Colors.Reset}`);
                                            return ++i;
                                        });
                                }).catch(function () {
                                    console.log(`${current._params.username} ${Colors.FgRed}is Private${Colors.Reset}`);

                                    return ++i;
                                })
                        } else {
                            console.log(`${current._params.username} ${Colors.FgRed}Already Followed${Colors.Reset}`);
                            resolve();

                            return ++i;
                        }
                    });
                });
            }).then();
        });
}

function unfollow() {
    login(userInput.username, userInput.password)
        .then(function (resp) {

            return resp.getAccountId()
                .then(function (accountId) {
                    let following = new Client.Feed.AccountFollowing(gSession, accountId);
                    following.get.bind(following)()
                        .then(function (following) {
                            var i = 0;

                            var promiseWhile = Promise.method(function (condition, action) {
                                if (!condition()) return;
                                return new Promise((resolve) => setTimeout(function () {

                                    return action().then(promiseWhile.bind(null, condition, action))
                                    resolve();
                                }, userInput.delay))
                            });

                            promiseWhile(function () {

                                return typeof following[i] !== 'undefined';
                            }, function () {
                                let current = following[i];

                                return new Promise(function (resolve) {
                                    resolve();
                                }).then(function () {
                                    Client.Relationship.get(gSession, current.id)
                                        .then(function (status) {
                                            let username = current.params.username;
                                            if (!status.params.followed_by) {
                                                console.log(`${Colors.Bright}${Colors.FgRed}${username}${Colors.Reset} ${Colors.FgRed}is not following you${Colors.Reset}`);

                                                Client.Relationship.destroy(gSession, current.id)
                                                    .then(function (resp) {
                                                        if (!resp.params.following) {
                                                            console.log(`${Colors.Bright}${Colors.FgRed}${username}${Colors.Reset} ${Colors.FgGreen}has been unfollowed!${Colors.Reset}`);
                                                        }

                                                        return ++i;
                                                    });
                                            } else {
                                                console.log(`${Colors.Bright}${Colors.FgGreen}${username}${Colors.Reset} ${Colors.FgGreen}is following you${Colors.Reset}`);

                                                return ++i;
                                            }
                                        });
                                });
                            });
                        })
                })
        })
}

function addScheduler() {
    Util.ask('interval? ')
        .then(() => Util.ask('username? '))
        .then(() => Util.ask('password? '))
        .then(function (rl) {
            dbScheduler.find({ username: Util.responses[1] }, {},
                function (err, doc) {
                    if (doc.length === 0) {
                        dbScheduler.insert({
                            incoming: ((new Date()).getHours() * 60 + (new Date()).getMinutes()) + parseInt(Util.responses[0]),
                            interval: Util.responses[0],
                            username: Util.responses[1],
                            password: Util.responses[2],
                            picIndex: 0
                        }, function (err, doc) {
                            //todo: add positive response here
                            askStorage();
                        });
                    } else {
                        dbScheduler.update({ username: Util.responses[1] }, {
                            incoming: ((new Date()).getHours() * 60 + (new Date()).getMinutes()) + parseInt(Util.responses[0]),
                            interval: Util.responses[0],
                            username: Util.responses[1],
                            password: Util.responses[2],
                            picIndex: 0
                        }, {}, function (err, doc) {
                            //todo: add positive response here
                            askStorage();
                        })
                    }

                    Util.responses.length = 0;
                });
        });
}

function startScheduler(doc) {
    let now = (new Date()).getHours() * 60 + (new Date()).getMinutes();

    if (doc.incoming >= now) {
        scheduler(doc);
    } else {
        setTimeout(schedulerPoll, 60000);
    }
}

function scheduler(doc) {
    login(doc.username, doc.password, 'silent')
        .then(function () {
            let dir = __dirname + '/local/images/' + doc.username + '/';
            let images = fs.readdirSync(dir);
            let index = doc.picIndex;

            Client.Upload.photo(gSession, dir + images[index])
                .then(function (upload) {
                    return Client.Media.configurePhoto(gSession, upload.params.uploadId);
                }).then(function (medium) {
                    doc.incoming = (new Date()).getHours() * 60 + parseInt(doc.interval);
                    doc.picIndex += 1;
                    delete doc._id;

                    dbScheduler.update({ username: doc.username }, doc, {}, function () {
                        //todo: give some uninterruptible
                        setTimeout(schedulerPoll, 60000);
                    })
                }).catch(function (err) {
                    //todo: catch some error
                });
        });
}

function dispatch() {
    //dispatcher
    console.log('Contributor: ');
    console.log(`${Colors.BgWhite}${Colors.FgBlack}VicoErv/fft${Colors.Reset} ${Colors.BgWhite}${Colors.FgBlack}DandyRaka${Colors.Reset}`);
    console.log(`${Colors.BgWhite}${Colors.FgBlack}JaluxsCyber${Colors.Reset} ${Colors.BgWhite}${Colors.FgBlack}Hwnestyan${Colors.Reset}`);
    console.log(`${Colors.Bright}${Colors.FgBlue}Report problem or recommend new feature please create new issue on github.${Colors.Reset}`);
    console.log(`- Commands: `);
    console.log(`  ${Colors.Bright}${Colors.FgGreen}User${Colors.Reset}`);
    console.log(`   add       add new user`);
    console.log(`   list      list added user`);
    console.log(`   update    update added user`);
    console.log(`   remove    remove added user`);
    console.log('');
    console.log(`  ${Colors.Bright}${Colors.FgGreen}Comment${Colors.Reset}`);
    console.log(`   comment   add new comment`);
    console.log(`   clist     list added comment`);
    console.log(`   cclear    remove all added comment`);
    console.log('');
    console.log(`  ${Colors.Bright}${Colors.FgGreen}Program${Colors.Reset}`);
    console.log(`   use       set user for fft program`);
    console.log(`   run       start fft program`);
    console.log(`   unfollow  unfollow not following back`);
    console.log(`   menu      show menu`);
    console.log(`   exit      exit program`);
    console.log('');

    askStorage();
}

function repost(command) {
    let target = command[1];
    login(userInput.username, userInput.password)
        .then(function () {
            return Client.Account.searchForUser(gSession, target);
        })
        .then(function (account) {
            let mediaObj = new Client.Feed.UserMedia(gSession, account.id);
            let mediaFun = mediaObj.all.bind(mediaObj);

            return mediaFun();
        })
        .then(function (media) {
            let i = 0;
            let path = __dirname + '/media/' + userInput.username + '/';

            mkdirp(path, function (err) {
                promiseWhile(function () {
                    return i < media.length;
                }, function () {
                    return new Promise(function (resolve) {
                        console.log(`Processing ${i + 1} of ${media.length}`);

                        if (media[i].params.mediaType === 1) {
                            request(media[i].params.images[0].url)
                                .on('response', function (res) {
                                    res.pipe(fs.createWriteStream(path + i + '~' + media[i].id + '.jpg'));

                                    resolve(++i);
                                })
                        } else if (media[i].params.mediaType === 2) {
                            request(media[i].params.videos[0].url)
                                .on('response', function (res) {
                                    res.pipe(fs.createWriteStream(path + i + '~v~' + media[i].id + '.mp4'));

                                    resolve(++i);
                                });
                        } else if (media[i].params.mediaType === 8) {
                            let items = media[i].params;

                            for (let n = 0; n < items.images.length; n++) {
                                let image = items.images[n][0].url;
                                request.get(image)
                                    .on('response', function (res) {
                                        if (typeof media[i] === 'undefined')
                                            console.log('undefined');
                                        res.pipe(fs.createWriteStream(path + i + '~c~' + n + '~' + media[i].id + '.jpg'));

                                        resolve(++i);
                                    })
                            }
                        }
                    })
                })
            })

            var promiseWhile = Promise.method(function (condition, action) {
                if (condition()) return action().then(promiseWhile.bind(null, condition, action));
            });
        })
}