var Client = require('instagram-private-api').V1;
var ig = require('./lib/ig')
var Util = require('./lib/util')
var Colors = require('./lib/colors')
var Promise = require('bluebird')

var username, password, delay, target;

function fft() {
  ig.login(username, password)
    .then((session) => {
      return Client.Account.searchForUser(gSession, target);
    })
    .then((account) => {
      let following = new Client.Feed.AccountFollowers(gSession, account.id);
      return following.get();
    })
    .then(following => {
      let i = 0;

      var promiseWhile = Promise.method(function(condition, action) {
        if (!condition()) return;

        return new Promise((resolve) => setTimeout(function() {

          return action().then(promiseWhile.bind(null, condition, action))
          resolve();
        }, delay))
      });

      promiseWhile(function() {

        return typeof following[i] !== 'undefined';
      }, function() {
        let current = following[i];

        if (current.params.isPrivate) {

          return new Promise(function (resolve) {
            console.log(`${current._params.username}${Colors.FgRed} is Private, Skip${Colors.Reset}`);
            resolve(++i);
            return true;
          });
          return true;
        }

        return Client.Relationship.create(gSession, following[i].id).then(function(resp) {
          let resolve = Promise.resolve;
          console.log(`${current._params.username} ${Colors.FgGreen}Success Following${Colors.Reset}`);
        
          let userMedia  = new Client.Feed.UserMedia(gSession, current.id, 1);
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
                      dbFollowing.insert({userId: current.id}, function (err, newDoc) {

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
            }).catch (function () {
              console.log(`${current._params.username} ${Colors.FgRed}is Private${Colors.Reset}`);
              
              return ++i;
            })
          });
        });
      }).then();

}

return Util.ask('username? ')
  .then(() => Util.ask('password? '))
  .then(() => Util.ask('target? '))
  .then(() => Util.ask('delay? '))
  .then(function (rl) {
    username = Util.responses[0];
    password = Util.responses[1];
    delay = Util.responses[2];
    target = Util.responses[3];

    rl.close();

    fft();
  })