var Client     = require('instagram-private-api').V1;
var Colors     = require('./lib/colors');
var readline   = require('readline');
var Util       = require('./lib/util');
var AsciiTable = require('ascii-table');
var Promise    = require('bluebird');
var sample     = require('lodash.sample');

var DataStore = require('nedb'),
  db          = new DataStore({ filename: __dirname + '/' + 'db', autoload: true }),
  dbFollowing = new DataStore({ filename: __dirname + '/' + 'following', autoload: true}),
  dbComment   = new DataStore({ filename: __dirname + '/' + 'comment', autoload: true});

var userInput = {
  username: null,
  password: null,
  target:   null,
  delay:    null,
  _login:   false
}

var table;
var userInputKeys = Object.keys(userInput);

var user     = null;
var comments = null;
var commands = {
  list: function () {
    if (table.length === 0) {
      console.log("No user");
      console.log(`- use ${Colors.FgRed}add${Colors.Reset} command to add new user`);
      return;
    }

    var ascii = new AsciiTable('User List');
    ascii.setHeading('Username', 'Target', 'Delay');
    table.forEach(element => {
      ascii.addRow(element.username, element.target, element.delay);
    });

    console.log(ascii.toString());
  },
  clist: function () {
    dbComment.find({}, {}, function (err, doc) {
      if(doc.length === 0) {
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
    db.remove({username: command[1]});
  },
  update: function (command) {
    db.update({username: $command[1]}, {})
  },
  run: () => {
    if (user === null) {
      console.log(`Please \`${Colors.FgBlue}use ${Colors.FgRed}[user index|username]${Colors.Reset}\` before run FFT.`);
      return false;
    }

    Util.hasUser = (user !== null);
    main();
  },
  use: function (command) {
    if (table.length === 0) {
      console.log(Colors.FgRed + 'No User' + Colors.Reset);
      return;
    }

    if (command[1].search(/^\d+$/) > -1) {
      user      = table[parseInt(command[1]) - 1];
      userInput = user;

      console.log(`${Colors.FgBlue}${user.username}${Colors.Reset} Used as default user.`);
      console.log(`Type ${Colors.FgGreen}Run${Colors.Reset} to start program.`);
      return true;
    } else if (typeof command[1] === 'string') {
      db.findOne({username: command[1]}, {}, function(err, doc) {
        user      = doc;
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
  add: (command) => add (command),
  comment: (command) => comment(command)
}

askStorage();

function askStorage() {
  new Promise(function(resolve, reject) {
    db.find({}, function(err, doc) {
      if (err) {
        reject(err);
      } else {
        table = doc;
        resolve(Util.ask(Colors.FgGreen + 'command' + Colors.Reset + '> '))
      }
    })
  }).then(function(rl) {
    Util.responses.length = 0;
    command = Util.response.split(' ');

    if (command.length > 0 && commands.hasOwnProperty(command[0])) {
      let res = commands[command[0]](command);
      if (command[0] === 'run' && res !== false) return;
    } else {
      console.log('Invalid command `' + command[0] + '`' );
    }

    askStorage();
  })
}

function comment (command) {
  return Util.ask('Please type your comment: ')
    .then(function (rl) {
      dbComment.insert({text: Util.response}, function (err, newDoc) {
        console.log("Your comment has been added to database.");
        console.log(`Type ${Colors.FgGreen}clist${Colors.Reset} for list your comments.`);
        loadComment(function(doc) {
          comments = doc;
          Promise.resolve(askStorage());
        })
      })
    });
}

function loadComment (callback) {
  dbComment.find({}, function(err, doc) {
    callback(doc);
  })
}

function add (command) {
  return Util.ask('username? ')
    .then(()=>Util.ask('password? '))
    .then(()=>Util.ask('target? '))
    .then(()=>Util.ask('delay (s)? '))
    .then((rl) => {
      login(Util.responses[0], Util.responses[1])
        .then(function(session) {
          if (!Util.hasUser) {
            userInput.username = Util.responses[0];
            userInput.password = Util.responses[1];
            userInput.target   = Util.responses[2];
            userInput.delay    = Util.responses[3];
            userInput._login   = false;
          }
    
          Util.responses.length = 0;
    
          if (typeof command === 'undefined') {
            rl.close();
          }
    
          console.log('');
          
          if (typeof command !== 'undefined') {
            console.log(`${Colors.FgGreen}*User Registered*${Colors.Reset}`);
          } else {
            console.log(`${Colors.FgGreen}*Processing User*${Colors.Reset}`);
          }
    
          console.log('Username\t'   + Colors.FgRed      + userInput.username + Colors.Reset);
          console.log('Target is\t'  + Colors.FgBlue     + userInput.target   + Colors.Reset);
          console.log('With delay\t' + Colors.Underscore + userInput.delay    + Colors.Reset + ' ms');
    
          if (userInput.username.length > 0 &&
              userInput.password.length > 0) {
                return new Promise(function (resolve, reject) {
                  db.find({username: userInput.username}, function(err, res) {
                    if (err) reject(err);
    
                    if (res.length === 0) {
                      db.insert(userInput, function(err, doc) {
                        if (err) reject(err);

                        resolve(userInput);
                      });
                    } else {
                      db.update({username: userInput.username}, userInput, {}, function(err, doc) {
                        if (err) reject(err);

                        resolve(userInput);
                      });
                    }
    
                    if (typeof command !== 'undefined') {
                      askStorage();
                    }
                  });
                })
          }
        }).catch(function(error) {
          console.log(error);
        })
  });
}

function login(username, password) {
  console.log(` ${Colors.FgGreen}Please wait...${Colors.Reset}`);
  if (Util.fileExists(username + '.cookie')) {
    return new Promise(function(resolve) {
      gSession = new Client.Session(
        new Client.Device(username),
        new Client.CookieFileStorage(username + '.cookie')
      );
      resolve(gSession);
    })
  } else {
    return new Promise(function (resolve) {
      Client.Session.create(
        new Client.Device(username),
        new Client.CookieFileStorage(username + '.cookie'),
        username,
        password
      ).then(function(session) {
        gSession = session;
        console.log(gSession);
        resolve(gSession);
      })
    })
  }
}

function follow(userId) {
  return Client.Relationship.create(gSession, userId);
}

var gSession = null;

function main () {
  loadComment(doc => comments = doc);

  login(userInput.username, userInput.password)
    .then((session) => {
      return Client.Account.searchForUser(gSession, userInput.target);
    })
    .then((account) => {
      let following = new Client.Feed.AccountFollowing(gSession, account.id);
      return following.get();
    })
    .then(following => {
      let i = 0;
      var pValue, pAction, pCondition;

      var promiseFor = Promise.method(function(condition, action, value) {
        pValue     = value;
        pAction    = action;
        pCondition = condition;

        if (!condition(value)) return value;
        return new Promise((resolve) => setTimeout(function() {
          pAction(pValue).then(promiseFor.bind(null, pCondition, pAction))
          resolve();
        }, userInput.delay))
      });

      promiseFor(function(count) {
        return typeof following[i] !== 'undefined';
      }, function(count) {
        return follow(following[i].id).then(function(resp) {
          let resolve = Promise.resolve;
          if (following[i].params.isPrivate) {
            console.log(`${Colors.FgRed}User is Private, Skip${Colors.Reset}`);
            return i++;
          }

          dbFollowing.find({userId: following[i].id}, function (err, doc) {
            if (doc.length === 0) {
              console.log(`${Colors.FgGreen}Success Following${Colors.Reset} | ${following[i]._params.username}`);
            let userMedia  = new Client.Feed.UserMedia(gSession, following[i].id, 1);
              let _userMedia = userMedia.get.bind(userMedia);
              return _userMedia()
                .then(function (media) {
                 Client.Comment.create(gSession, media[0].id, sample(comments).text)
                    .then(function (resp) {
                      Client.Like.create(gSession, media[0].id)
                        .then(function (resp) {
                          // dbFollowing.insert({userId: following[i].id}, function (err, newDoc) {
                          //   
                            return ++i;
                            console.log(`${Colors.FgYellow}Sleep for ${Colors.Reset}${Colors.Underscore}${userInput.delay}${Colors.Reset} Seconds...`);
                
                          // })
                        });
                    });
                })
            } else {
              console.log(`${Colors.FgRed}Already Followed${Colors.Reset} | ${following[i]._params.username}`);
              console.log(`${Colors.FgYellow}Sleep for ${Colors.Reset}${Colors.Underscore}${userInput.delay}${Colors.Reset} Seconds...`);
              resolve();
              return ++i;
            }
          });
        });
      }, 0).then();
    });
}