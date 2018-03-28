var Client   = require('instagram-private-api').V1;
var readline = require('readline');
var Util     = require('./lib/util');
var Colors   = require('./lib/colors');


var userInput = {
  username: null,
  password: null,
  target: null,
  delay: null
}

var userInputKeys = Object.keys(userInput);

Util.ask('username')
  .then(()=>Util.ask('password'))
  .then(()=>Util.ask('target'))
  .then(()=>Util.ask('delay (ms)'))
  .then((rl) => {
    userInput.username = Util.responses[0];
    userInput.password = Util.responses[1];
    userInput.target = Util.responses[2];
    userInput.delay = Util.responses[3];

    Util.responses.length = 0;

    rl.close();
  })
  .then(() => {
    console.log('Processing\t' + Colors.FgRed + userInput.username + Colors.Reset);
    console.log('Target is\t' + Colors.FgBlue + userInput.target + Colors.Reset);
    console.log('With delay\t' + Colors.Underscore + userInput.delay + Colors.Reset);
  })
  .then(() => {
    return Client.Session.create(
      new Client.Device(userInput.username),
      new Client.CookieMemoryStorage(),
      userInput.username,
      userInput.password
    )
  })
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