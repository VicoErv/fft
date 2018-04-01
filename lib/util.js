var readline = require('readline');
var fs       = require('fs');

rl = readline.createInterface(process.stdin, process.stdout);

rl._writeToOutput = function _writeToOutput(stringToWrite) {
  if (rl.stdoutMuted)
    rl.output.write("\x1B[2K\x1B[200D"+rl.query+"["+((rl.line.length%2==1)?"=-":"-=")+"]");
  else
    rl.output.write(stringToWrite);
};

var Util = {
  hasUser: false,
  responses: [],
  response: '',
  ask: function (msg) {
    if (msg === 'password? ') {
      rl.stdoutMuted = true;
      rl.query='password? ';
    }

    return new Promise((resolve) => {
      if (Util.hasUser) {
        resolve(rl);
        return true;
      }
      
      rl.question(msg, (res) => {
        Util.responses.push(res);
        Util.response = res;
        rl.stdoutMuted = false;
        resolve(rl);
      });
    });
  },
  fileExists: function(fileName) {
    return fs.existsSync(fileName);
  }
}

module.exports = Util;