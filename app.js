var commander = require('commander'),
	version = require('./package.json').version;
commander
	.version(version)
	.usage('[options] <file ...>');

/*******************************
	PARSING OPTIONS
*******************************/
var config = {},
	optName,
	description,
	dashRegex = /-\w/gi,
	applicationOptions = [
		{ shortOption: 'a', longOption: 'auth-token', longOptionArgument: 'token', defaultValue: '', description: 'The token for the user to log in as.' },
		{ shortOption: 'u', longOption: 'user-id', longOptionArgument: 'id', defaultValue: '', description: 'The user id of the user to log in as.' },
		{ shortOption: 'r', longOption: 'room-id', longOptionArgument: 'id', defaultValue: '', description: 'The id of the room to join.' }
	];

// apply options to command line
applicationOptions.forEach(function(option) {
	description = option.description
	if (option.hasOwnProperty('defaultValue') && option.defaultValue !== null) {
		description += ' Defaults to: ';
		description += (typeof(option.defaultValue) === 'string') ? '"' + option.defaultValue + '"' : option.defaultValue;
	}
	var longOptionStr = (option.longOptionArgument) ? option.longOption + ' <' + option.longOptionArgument + '>' : option.longOption;
	commander.option('-' + option.shortOption + ', --' + longOptionStr, description);
});

// parse options form arguments
commander.parse(process.argv);

// save options to config obj (from env vars first, command line second, and defaults last)
applicationOptions.forEach(function(option) {
	optName = option.longOption;
	option.longOption.match(dashRegex).forEach(function(match) {
		optName = optName.replace(match, match[1].toUpperCase());
	});
	config[optName] = process.env[optName] || commander[optName] || option.defaultValue;
});





/*******************************
	Bot Logic
*******************************/
var Bot = require('ttapi');
var bot = new Bot(config.authToken, config.userId, config.roomId);


var FileStore = require("file-store"),
    userStore = FileStore("userLogins.txt"),
    achievementsStore = FileStore("achievements.txt");


bot.on('registered', function(data) {
	console.log('registered!',data);
	if (data.success) {
		userStore.push(data.user[0].userid, new Date(), function(err) {
			if (err) {
				console.log('Error logging user registration.')
			}
		});
		if (data.user[0].userid === config.userId) {
			bot.roomInfo(true, function(roomData) {
				if (roomData.djids.length < 3) {
					bot.addDj();
				}
			});
		}
	}
});

bot.on('speak', function (data) {
  // Respond to "/hello" command
  if (data.text.match(/^\/hello$/)) {
    bot.speak('Hey! How are you @'+data.name+' ?');
  }

  if (data.text.match(/^\/awesome$/)) {
    
   bot.stalk(data.userid, true, function(stalkerData) {
    	console.log(stalkerData.room);
    	try {
		//if (stalkerData.room.metadata.moderator_id.indexOf(stalkerData.user.userid) > -1) {
		bot.speak('Yeah, ' + stalkerData.user.name + '! I like this shit too!');
		bot.bop();
		//}
	}
	catch (ex) {
		console.log("WTF:", ex);
	}
    });
    
  }
});



bot.on('rem_dj', function(data) {
	bot.roomInfo(true, function(roomData) {
		if (roomData.djids.length < 3 && roomData.djids.indexOf(config.userId) < 0) {
			bot.addDj();
		}
	});
});

bot.on('add_dj', function(data) {
	bot.roomInfo(true, function(roomData) {
		if (roomData.djids.length > 3 && roomData.djids.indexOf(config.userId) > -1) {
			bot.remDj();
		}
	});
});


