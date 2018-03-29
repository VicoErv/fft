var Client     = require('instagram-private-api').V1;
var Colors     = require('./lib/colors');
var readline   = require('readline');
var Util       = require('./lib/util');
var AsciiTable = require('ascii-table');

var DataStore = require('nedb'),
  db = new DataStore({ filename: __dirname + '/' + 'db', autoload: true });

var userInput = {
  username: null,
  password: null,
  target:   null,
  delay:    null
}

var table;
var userInputKeys = Object.keys(userInput);

var user = null;
var commands = {
  list: function () {
    var ascii = new AsciiTable('User List');
    ascii.setHeading('Username', 'Target', 'Delay');
    table.forEach(element => {
      ascii.addRow(element.username, element.target, element.delay);
    });

    console.log(ascii.toString());
  },
  remove: function (command) {
    db.remove({username: command[1]});
  },
  update: function (command) {
    db.update({username: $command[1]}, {})
  },
  run: () => {
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
  add: (command) => add (command)
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
      commands[command[0]](command);
      if (command[0] === 'run') return;
    } else {
      console.log('Invalid command `' + command[0] + '`' );
    }

    askStorage();
  })
}

function add (command) {
  return Util.ask('username? ')
    .then(()=>Util.ask('password? '))
    .then(()=>Util.ask('target? '))
    .then(()=>Util.ask('delay (ms)? '))
    .then((rl) => {
      if (!Util.hasUser) {
        userInput.username = Util.responses[0];
        userInput.password = Util.responses[1];
        userInput.target   = Util.responses[2];
        userInput.delay    = Util.responses[3];
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
                    resolve(userInput);
                  });
                } else {
                  db.update({username: userInput.username}, userInput, {}, function(err, doc) {
                    resolve(userInput);
                  });
                }

                if (typeof command !== 'undefined') {
                  askStorage();
                }
              });
            })
      }
  });
}

function main () {
    return Client.Session.create(
      new Client.Device(userInput.username),
      new Client.CookieMemoryStorage(),
      userInput.username,
      userInput.password
    )
    .then((session) => {
      return Client.Account.searchForUser(session, 'instagram');
    })
    .then((account) => {
      let following = new Client.Feed.AccountFollowing(account.session, account.id);
      return following.get();
    })
    .then(following => {
      console.log(following.length);
    });
}