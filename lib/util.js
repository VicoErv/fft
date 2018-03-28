var readline = require('readline');

rl = readline.createInterface(process.stdin, process.stdout);
var Util = {
  responses: [],
  ask: function (msg) {
    return new Promise((resolve) => {
      rl.question(msg + '? ', (res) => {
        Util.responses.push(res);
        
        resolve(rl);
      });
    });
  }
}

module.exports = Util;