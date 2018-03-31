var readline = require('readline');
var fs       = require('fs');

rl = readline.createInterface(process.stdin, process.stdout);

var Util = {
  hasUser: false,
  responses: [],
  response: '',
  ask: function (msg) {
    return new Promise((resolve) => {
      if (Util.hasUser) {
        resolve(rl);
        return true;
      }
      
      rl.question(msg, (res) => {
        Util.responses.push(res);
        Util.response = res;
        resolve(rl);
      });
    });
  },
  fileExists: function(fileName) {
    return fs.existsSync(fileName);
  }
}

module.exports = Util;