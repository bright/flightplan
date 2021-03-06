var util = require('util')
  , fs = require('fs')
  , exec = require("child_process").exec
  , tempWrite = require('temp-write')
  , Fiber = require('fibers')
  , Future = require('fibers/future')
  , Transport = require('./index');

function ShellTransport(flight) {
  ShellTransport.super_.call(this, flight);
  this.target.host = 'localhost';
  this.logger = this.logger.cloneWithPrefix(this.target.host);
}

util.inherits(ShellTransport, Transport);

ShellTransport.prototype.__exec = function(cmd, args, options) {
  var fiber = Fiber.current;
  var proc = null;
  var ret = {
    code: 0,
    stdout: null,
    stderr: null
  };
  var execOptions = { maxBuffer: 1000*1024 };
  execOptions = util._extend(execOptions, options.exec);

  cmd = (cmd !== 'sudo') ? this._execWith + cmd : cmd;
  cmd = cmd + (args ? ' ' + args : '');
  this.logger.command(cmd);

  proc = exec(cmd, execOptions);

  proc.stdout.on('data', function(data) {
    ret.stdout = (ret.stdout || '') + data;
    if(!options.silent) {
      this.logger.stdout(String(data));
    }
  }.bind(this));

  proc.stderr.on('data', function(data) {
    ret.stderr += data;
    (options.failsafe ? this.logger.stdwarn : this.logger.stderr)(String(data));
  }.bind(this));

  proc.on('close', function(code) {
    ret.code = code;
    if(ret.code === 0) {
      this.logger.success('ok'.success);
    } else if(options.failsafe) {
      this.logger.warn(this.logger.format('failed safely').warn, 'with exit code:', ret.code);
    } else {
      this.logger.error(this.logger.format('failed').error, 'with exit code:', ret.code);
      fiber.throwInto(new Error(this.logger.format('`%s` failed on %s'
                                                          , cmd.white, 'localhost'.warn)));
    }
    fiber.run(ret);
  }.bind(this));

  return Fiber.yield();
};

ShellTransport.prototype.__transfer = function(files, remoteDir, options) {
  if(!remoteDir) {
    throw new Error('transfer: missing remote path');
  }

  if(files instanceof Array) {
    files = files.join('\n');
  } else if(files instanceof Object) {
    if(!files.hasOwnProperty('stdout')) {
      throw new Error('transfer: invalid object passed');
    }
    files = files.stdout;
  }

  files = (files || '').trim().replace(/[\r|\0]/mg, '\n');
  if(!files) {
    throw new Error('transfer: empty file list passed');
  }

  var tmpTransferListFile = tempWrite.sync(files);

  var rsyncFlags = '-az' + (this.logger.debugEnabled() ? 'vv': '');
  var _results = [];
  var task = function(config) {
    var future = new Future();

    new Fiber(function() {
      var sshFlags = (config.privateKey ? ' -i ' + config.privateKey : '');
      var remoteUrl = util.format('%s%s:%s'
                                , (config.username ? config.username + '@' : '')
                                , config.host, remoteDir);

      var cmd = util.format('rsync --files-from %s %s --rsh="ssh -p%s%s" ./ %s'
                                , tmpTransferListFile, rsyncFlags, config.port || 22
                                , sshFlags, remoteUrl);

      _results.push(this.exec(cmd, options));
      return future.return();
    }.bind(this)).run();

    return future;
  }.bind(this);

  var tasks = [];
  for(var i=0, len=this.flight.hosts.length; i < len; i++) {
    tasks.push(task(this.flight.hosts[i]));
  }
  Future.wait(tasks);

  fs.unlink(tmpTransferListFile);

  return _results;
};

module.exports = ShellTransport;