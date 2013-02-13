var opter = require('opter'),
	version = require('./package.json').version,
	express = require('express');

/*******************************
	PARSING OPTIONS
*******************************/
var options = {
		authToken: {
			argument: 'token',
			description: 'The token for the user to log in as.'
		},
		userId: {
			argument: 'id',
			description: 'The user id of the user to log in as.'
		},
		roomId: {
			argument: 'id',
			description: 'The id of the room to join.'
		},
		dbHost: {
			argument: 'host',
			defaultValue: 'localhost',
			description: 'The Mongo DB host to connect to'
		},
		dbPort: {
			argument: 'number',
			defaultValue: '27017',
			description: 'The Mongo DB port'
		},
		dbName: {
			argument: 'name',
			defaultValue: 'ttfm',
			description: 'The Mongo DB to connect to'
		},
		dbUser: {
			argument: 'user',
			description: 'The Mongo DB user'
		},
		dbPassword: {
			argument: 'password',
			description: 'The Mongo DB password'
		}
	},
	config = opter(options, version);

/*******************************
	Status route (to keep heroku happy)
*******************************/
var app = express.createServer(express.logger());
app.get('/', function(request, response) {
  response.send('Bot is running!');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log('Listening on ' + port);
});

/*******************************
	Bot Logic
*******************************/
var ExtendedBot = require('./lib/ExtendedBot.js'),
	BopperAddOn = require('./lib/BopperAddOn.js'),
	TwssAddOn = require('./lib/TwssAddOn.js'),
	GreeterAddOn = require('./lib/GreeterAddOn.js'),
	SongTrackerAddOn = require('./lib/SongTrackerAddOn.js'),
	UserTrackerAddOn = require('./lib/UserTrackerAddOn.js'),
	AchievementsTrackerAddOn = require('./lib/AchievementsTrackerAddOn.js'),
	DjAddOn = require('./lib/DjAddOn.js'),
	EscortMeAddOn = require('./lib/EscortMeAddOn.js'),
	AfkAddOn = require('./lib/AfkTrackerAddOn.js'),
	AfkDjAddOn = require('./lib/AfkDjAddOn.js'),
	DjQueueAddOn = require('./lib/DjQueueAddOn.js'),
	bot = new ExtendedBot(config.authToken, config.userId, config.roomId),
	dbConnectionString = 'mongodb://';

if (config.dbUser.length && config.dbPassword.length) {
	dbConnectionString += config.dbUser + ':' + config.dbPassword + '@';
}
dbConnectionString += config.dbHost + ':' + config.dbPort + '/' + config.dbName;


// register greeter addon
bot.registerAddOn(GreeterAddOn);

// register bopper addon
bot.registerAddOn(BopperAddOn);

// register escort me addon
bot.registerAddOn(EscortMeAddOn);

// register twss addon
bot.registerAddOn(TwssAddOn);

// register dj addon
bot.registerAddOn(DjAddOn);

// register dj queue addon
bot.registerAddOn(DjQueueAddOn, { djSongLimit: 2 });

// register afk addon
bot.registerAddOn(AfkAddOn, { afkThreshold: 60 * 15 }); // afk threshold of 15 minutes

// register afk dj addon
bot.registerAddOn(AfkDjAddOn, { warnTime: 60 }); // warn time of 60 seconds

// register song tracker addon
bot.registerAddOn(SongTrackerAddOn, { dbConnectionString: dbConnectionString });

// register user tracker addon
bot.registerAddOn(UserTrackerAddOn, { dbConnectionString: dbConnectionString });

// register achievements tracker addon
bot.registerAddOn(AchievementsTrackerAddOn, { dbConnectionString: dbConnectionString });
