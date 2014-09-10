Obviously Turntable is no longer available, however I think this repo serves as good reference material for a plugin implementation, and so I'm going to keep it around for the foreseeable future.

ttfm-bot
===

ttfm-bot is a turntable.fm bot that can be easily extended and configured at runtime.

[![Dependency Status](https://david-dm.org/mac-/ttfm-bot.png)](https://david-dm.org/mac-/ttfm-bot)

Installation
===

You'll need:

* a non-windows machine that has [Node](http://nodejs.org/) installed in order to run the application.
* a MongoDB instance (optional - used by a couple of the add ons, specified below)

Pull down the source code and run the tests to make sure everything you are in a good state:

	$ git clone git@github.com:mac-/ttfm-bot.git
	$ cd ttfm-bot
	$ make install
	$ make test

Running The App
===

You can run ttfm-bot with the -h flag to see the various options:

	$ node app.js -h
	Usage: app.js [options]

	Options:

		-h, --help                    output usage information
		-V, --version                 output the version number
		-a, --auth-token <token>      The token for the user to log in as.
		-u, --user-id <id>            The user id of the user to log in as.
		-r, --room-id <id>            The id of the room to join.
		-d, --db-host <host>          The Mongo DB host to connect to Defaults to: "localhost"
		-D, --db-port <number>        The Mongo DB port Defaults to: "27017"
		-n, --db-name <name>          The Mongo DB to connect to Defaults to: "ttfm"
		-U, --db-user <user>          The Mongo DB user
		-p, --db-password <password>  The Mongo DB password
		-l, --lastfm-api-key <key>    The last.fm API key
		-L, --lastfm-secret <secret>  The last.fm secret

Example usage:

	$ node app.js -u 50c62dd8aa0000164e781234 -a DlOlzXALTMpWGLBcTtAr1234 -r 55c61c00aaa5cd164e781234

You may also specify values for the options in env variables. The format of the option name is camelcase with dashes removed (so "auth-token" would be "authToken"). If a value is specified in both env vars and the command line args, the env vars value will take precedence.

Using the App
===

Once the bot is up and running, you'll want to promote it to a moderator for the room. The bot will warn you in the chat window if it is not a moderator. There are a set of commands that only moderators can run via a PM to the bot that will allow you to configure the bot at runtime. To see a list of commands, type <code>/bot</code> in a PM to the bot.

For every other user in the room, it is possible to type <code>/help</code> in the room chat window or in a PM to the bot to see what other commands the bot will accept. The commands listed by the bot will only contain commands that the requesting user has access to. For example, a moderator will see the <code>/say</code> command in the help menu, but a regualr user will not.

The rest of this README contains information about the API and how to program additional functionality against this bot. If you are interested, please read on.

For Developers
===

Extended Bot
---

The Extended Bot is a class that extends the original [turntable.fm api](https://github.com/alaingilbert/Turntable-API). Instanciating the extened bot is as easy it's super class:

	var ExtendedBot = require('./lib/ExtendedBot.js'),
		bot = new ExtendedBot(authToken, userId, roomId);

The extended bot provides the following additional methods:

* registerAddOn(constructorFunction:Function, [options:Object]) - Registers an add on with the bot. This method takes a constructor function of the add on and an opject of name value pairs that is used to initally set the add on's option values.

```
	// example
	bot.registerAddOn(DjQueueAddOn, { djSongLimit: 2 });
```

* enableAddOn(name:String) - Calls the enable method on the specifed add on. This method takes one parameter which is the name of the add on to enable.

```
	// example
	bot.enableAddOn('dj-queue');
```

* disableAddOn(name:String) - Calls the disable method on the specifed add on. This method takes one parameter which is the name of the add on to disable.

```
	// example
	bot.disableAddOn('dj-queue');
```

* isConnected() - A method that returns a Boolean value specifying whether or not the bot is connected to turntable.fm

```
	// example
	bot.isConnected(); // true of false
```

* findUserIdInRoomByName(name:String, callback:Function) - Searches the room for a user with a given name. This method takes two parameters. The first one is the name of a user to get the user ID of in String format. The first parameter can also be a RegExp object which will match the desired user name. If more than 1 user matches the RegExp provided, the first one found will be the one returned in the callback. The second parameter is a function that will be called once the user is found. This callback can expect to recieve one parameter which is the ID of the user that it found, or null if no match was found.

```
	// example
	bot.findUserIdInRoomByName(/dj.*/i, function(userId) { console.log(userId); });
	bot.findUserIdInRoomByName('exact match dj', function(userId) { console.log(userId); });
```

* getUserInfo(userId:String, callback:Function) - Gets information about a user by ID. This method takes a user ID as the first parameter and a function as a second parameter which will be called once the user information is found. This function should expect to recieve one parameter which will be an object conatining properties about the user.

```
	// example
	bot.getUserInfo('4e9d9ec3f75112a602b13a', function(user) { console.log(user); });
```

* getModsInRoom(callback:Function) - Gets the IDs of the moderators in the room. This method takes one parameter which is a function to be called when the moderator IDs are determined. This function should expect to recieve one paramter that is an Array of user IDs.

```
	// example
	bot.getModsInRoom(function(mods) { console.log(mods); });
```

* getCurrentSong() - Gets information about the current song being played, or null if no song is being played.

```
	//example
	var songObject = bot.getCurrentSong();
```

* getCurrentDjsInRoom() - Gets the current DJs in the room. The object returned by this method has user IDs as keys and user objects as values. It also conatins a "length" property which is the number of current DJs.

```
	//example
	var djsObject = bot.getCurrentDjsInRoom();
```

* getCurrentUsersInRoom(callback:Function) - Gets all users in the room. The object returned by this method has user IDs as keys and user objects as values. It also conatins a "length" property which is the number of current users.

```
	//example
	bot.getCurrentUsersInRoom(function(users) { console.log(users); });
```

* getCurrentListenersInRoom(callback:Function) - Gets all listeners (non-DJs) in the room. The object returned by this method has user IDs as keys and user objects as values. It also conatins a "length" property which is the number of listeners.

```
	//example
	bot.getCurrentListenersInRoom(function(listeners) { console.log(listeners); });
```

* multiSpeak(messages:Array, [timeInMs:Number], [callback:Function]) - Same functionality as "speak" but this method allows you to send multiple messages at once with a specified time period between each message. This method takes an Array of Strings as the first paramter, an optional number as the second paramter, and an optional callback function as the third parameter.

```
	//example
	bot.multiSpeak(['hi', 'how are you?']);
	bot.multiSpeak(['hi', 'how are you?'], 1000);
	bot.multiSpeak(['hi', 'how are you?'], function() { console.log('messages were sent'); });
	bot.multiSpeak(['hi', 'how are you?'], 500, function() { console.log('messages were sent'); });
```

* multiPm(messages:Array, userId:String, [timeInMs:Number], [callback:Function]) - Same functionality as "pm" but this method allows you to send multiple messages at once with a specified time period between each message. This method takes an Array of Strings as the first paramter, a user ID as the second paramter, an optional number as the third paramter, and an optional callback function as the fourth parameter.

```
	//example
	bot.multiPm(['hi', 'how are you?'], '4e9d9ec3f75112a602b13a');
	bot.multiPm(['hi', 'how are you?'], '4e9d9ec3f75112a602b13a', 1000);
	bot.multiPm(['hi', 'how are you?'], '4e9d9ec3f75112a602b13a', function() { console.log('messages were sent'); });
	bot.multiPm(['hi', 'how are you?'], '4e9d9ec3f75112a602b13a', 500, function() { console.log('messages were sent'); });
```

Add Ons
---

ttfm-bot comes with several add ons that provide a bunch of additional functionality. Every add on adheres to a contract which allows it to be disabled/enabled or configured at runtime. An add on must provide the following public properties/methods:

* name - A String that is the name that the add on can be referenced by.
* description - A String that describes what the add on does.
* commands (optional) - A collection of command objects that have the following properties:
	* primaryCommand - A String that is the main command used to invoke the associated action.
	* secondaryCommands - A collection of Strings or RegExp Strings that will also trigger the command but will not be displayed by the help menu.
	* help - A String of text that is used to describe what the command does.
	* moderatorOnly - A Boolean used to determine if the command can be run by anyone or only moderators.
	* action - A Function that will get executed when the command has been issued. This function will recieve three parameters:
		* An object containing information about the message that was sent.
		* The ID of the user who sent the message.
		* A function that can be used to reply to that user that takes one parameter, a String, or a collection of Strings.
* options (optional) - An object that contains keys that are the names of options that con be configured at runtime with corresponding values that are objects that contain the following propterties:
	* value - The default or starting value of the option.
	* type - The JS type that the value is.
	* description - A description of what the option is or does.
	* isValid (optional) - A function that will be executed before the value is changed. The function will recieve the value that the option will be set to, and it should return true if the value should be allowed, and false otherwise.
	* onChange (optional) - A function that will get executed after the value changes. The function will recieve the old value as the first parameter and the new value as the second parameter.
* enable - A function that should handle enabling the add on.
* disable - A function that should handle disabling the add on.

Simple Example Add On
---

```javascript
// ./lib/GreeterAddOn.js
module.exports = function GreeterAddOn(bot) {

	var self = this,
		niceResponse = 'Hey! How are you @<user>?',
		meanResponse = 'Leave me alone @<user>!',
		respond = function(msgData, issuerId, replyFunc) {
			var phrase = (self.options.isNice.value) ? niceResponse : meanResponse;

			bot.getUserInfo(issuerId, function(userInfo) {
				phrase = phrase.replace('<user>', userInfo.name);
				replyFunc(phrase);
			});
		},
		registeredHandler = function(data) {
			if (data.success) {
				if (bot.userId !== data.user[0].userid) {
					setTimeout(function() {
						bot.speak('Welcome @' + data.user[0].name + '! Type /help to see what I can do.');
					}, 3000);
					
				}
			}
		};

	this.name = 'greeter';

	this.description = 'Greets users as they enter the room and if they say hi to the bot.';

	this.commands = [
		{
			primaryCommand: '/hello',
			secondaryCommands: ['^.*hi dude.*$', '^.*hey dude.*$', '^.*hello dude.*$', '^.*whats? ?up dude.*$'],
			help: 'say "hi" to me',
			moderatorOnly: false,
			action: respond
		}
	];

	this.options = {
		isNice: {
			value: true,
			type: Boolean,
			description: 'Determines whether the bot responds with a friendly message or not'
		}
	};

	this.enable = function() {
		bot.on('registered', registeredHandler);
	};

	this.disable = function() {
		bot.removeListener('registered', registeredHandler);
	};
};
```

The above add on can then be registered with the bot like so:

```javascript
var GreeterAddOn = require('./lib/GreeterAddOn.js');
bot.registerAddOn(GreeterAddOn, { isNice: false });
```


Add ons that come with this bot
===

* <code>twss</code> - The bot will randomly reply in the chat window with "That's what she said"
* <code>dj</code> - Allows users to control when the bot DJs and which songs get added to the bot's playlist
* <code>dj-queue</code> - Creates a queue for users to add themselves to in order to DJ when the stage is full
* <code>escort-me</code> - Provides a command for a DJ to let the bot escort them off stage after their song completes
* <code>afk-tracker</code> - Provides a system for tracking when users are active or afk
* <code>greeter</code> - Welcomes users to your room, and will respond to users who say hello to the bot
* <code>bopper</code> - Allows people to issue a command to make the bot bop to the current song
* <code>song-tracker</code> - Requires a MongoDB instance. Tracks songs that have been played and announces information about those songs.
* <code>user-tracker</code> - Requires a MongoDB instance. Tracks user's activity in the room including songs they've played, voted for, and votes they've recieved.
* <code>achievements-tracker</code> - Requires a MongoDB instance. Adds an achievements system to the room, and tracks achievements that people have earned.
* <code>lastfm</code> - Requires a [last.fm API key and secret](http://www.last.fm/api). Provides commands for retrieving artist info, similar artists and songs.
* <code>voting</code> - Creates a system for having users participate in a vote via chat.

License
===
The MIT License (MIT) Copyright (c) 2012 Mac Angell

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


