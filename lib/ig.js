var Client = require('instagram-private-api').V1;
var Util = require('./util')

var ig = {
  login: function (username, password, arg) {
    if (typeof arg === 'undefined') {
      console.log(` ${Colors.FgGreen}Please wait...${Colors.Reset}`);
    }
  
    if (Util.fileExists(__dirname + '/../local/cookie/' + username + '.cookie')) {
      
      return new Promise(function(resolve) {
        gSession = new Client.Session(
          new Client.Device(username),
          new Client.CookieFileStorage(__dirname + '/../local/cookie/' + username + '.cookie')
        );
  
        if (typeof arg === 'undefined') {
          console.log(`${Colors.Bright}${Colors.FgGreen}Login using stored Session!${Colors.Reset}`);
        }
  
        resolve(gSession);
      })
    } else {
      
      return new Promise(function (resolve) {
        Client.Session.create(
          new Client.Device(username),
          new Client.CookieFileStorage(__dirname + '/../local/cookie/' + username + '.cookie'),
          username,
          password
        ).then(function(session) {
          gSession = session;
          
          if (typeof arg === 'undefined') {
            console.log(`${Colors.Bright}${Colors.FgGreen}Login Completed!${Colors.Reset}`);
          }
  
          resolve(gSession);
        }).catch(function() {
          if (fs.existsSync(__dirname + '/../local/cookie/' + username + '.cookie')) {
            fs.unlinkSync(__dirname + '/../local/cookie/' + username + '.cookie');
          }
          
          if (typeof arg !== 'undefined') {
            console.log(`${Colors.FgRed}Invalid username or password${Colors.Reset}`);
          }
  
          askStorage();
      
          return false;
        })
      })
    }
  }
}

module.exports = ig;
