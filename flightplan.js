var Flightplan = require('./index');

var plan = new Flightplan();

plan.briefing({
	destinations: {
		'default': [
			{
				host: 'jookbox.me',
				username: 'pstadler',
				port: 22,
				//&debug: console.log,
				//tryKeyboard: true,
				//privateKey: '/Users/pstadler/.ssh/id_rsa-do'
				agent: process.env.SSH_AUTH_SOCK
			}
		]
	}
});

plan.local(function(local) {
	console.log('Current destination: ' + plan.target.destination);
	console.log('Hosts of current destination: ' + plan.target.hosts);

	// if(plan.target.destination === 'default') {
	// 	var input = local.prompt('Ready for deploying to production? [yes]');
	// 	if(input.indexOf('yes') === -1) {
	// 	  local.abort('user canceled flight');
	// 	}
	// }

	  // Flight specific information
	//local.ls('foo', {failsafe: true});
	// var input = local.prompt('Are you sure you want to continue? [yes]');
	// if(input.indexOf('yes') === -1) {
	//  	local.abort();
	// }
	// local.prompt('Enter your password:', { hidden: true });
	local.exec('echo test', {silent: true});
	//local.silent();
	//local.failsafe();
	local.with('cd /tmp', function() {
		//local.ls('-l foo');
	});
	//local.abort('foo');
	//throw new Error('failed');
	//local.ls('-l bar');
	local.transfer(local.git('ls-files'), '/tmp/foo');
});

// plan.local(function(local) {
// 	local.log('Running `ls`');
// 	local.ls();
// 	local.log('Running `ls -al` silent');
// 	local.ls('-al', { silent: true });
// 	local.log('Running `sudo ls` as root');
// 	local.sudo('ls', { user: 'root'});
// 	local.log('Running `ls foo` failsafe');
// 	local.ls('foo', { failsafe: true });
// });

plan.remote(function(remote) {
	remote.ls('-al /tmp/foo');
	console.log(plan.target.destination);
	console.log(plan.target.hosts);
	console.log(remote.target.host);

	remote.sudo('ls', {user: 'node', failsafe: true, silent: false});
	// console.log(remote.waitFor(function(done) {
	//   require('node-notifier').notify({
	//     message: 'Hello World'
	//   }, function(err, response) {
	//     done(err || 'sent!');
	//   });
	// }));
});

plan.disaster(function(local) {
	// local.ls('bar');
	// local.waitFor(function(done) {
	// 	console.log('yep');
	// 	done();
	// });
});