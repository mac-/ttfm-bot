var _ = require('underscore'),
	Cache = require('eidetic'),
	cacheOptions = {
		maxSize: 1000,
		canPutWhenFull: true
	},
	cacheDuration = 60 * 60 * 24, // cache user info for 24 hours
	cache = new Cache(cacheOptions),
	currentSong = null,
	currentDjs = { length: 0 },
	Bot = require('ttapi'),
	util = require('util');

function ExtendedBot(auth, userId, roomId) {

	ExtendedBot.super_.call(this, auth, userId, roomId);
	var self = this,
		addOns = {},
		isConnected = false,
		isRegexString = function(str) {
			if (!str || !str.length) return false;
			var check = str.match(/^\^.*\$$/);
			if (!check || !check.length) return false;
			return true;
		},
		botConfigCommands = [
			{
				command: '/bot',
				help: 'lists the bot controls',
				action: function(msgData) {
					var args, messages = [];
					messages.push('Available Admin Commands:');

					botConfigCommands.forEach(function(command) {
						args = (command.arguments && command.arguments.length > 0) ? ' <' + command.arguments.join('> <') + '> ' : '';
						messages.push(':small_blue_diamond: ' + command.command + args + ' - ' + command.help);
					});

					self.multiPm(messages, msgData.senderid, 300);
				}
			},
			{
				command: '/enable',
				arguments: ['addOn'],
				help: 'enables an add on by name',
				action: function(msgData) {
					var args = msgData.text.split(/\s/);
					args.shift();
					var name = args.join(' '),
						result = self.enableAddOn(name),
						message = (result) ? 'Sucessfully enabled: ' + name : 'Unable to enable: ' + name;
					self.pm(message, msgData.senderid);
				}
			},
			{
				command: '/disable',
				arguments: ['addOn'],
				help: 'disables an add on by name',
				action: function(msgData) {
					var args = msgData.text.split(/\s/);
					args.shift();
					var name = args.join(' '),
						result = self.disableAddOn(name),
						message = (result) ? 'Sucessfully disabled: ' + name : 'Unable to disable: ' + name;
					self.pm(message, msgData.senderid);
				}
			},
			{
				command: '/list',
				help: 'lists all registered add ons',
				action: function(msgData) {
					var prop, status, messages = [];

					messages.push('Registered Add Ons:');

					for (prop in addOns) {
						status = (addOns[prop].isEnabled) ? '' : ' (disabled)';
						messages.push(':small_orange_diamond: ' + prop + status);
					}
					self.multiPm(messages, msgData.senderid, 300);
				}
			},
			{
				command: '/desc',
				arguments: ['addOn'],
				help: 'get the description of a specific add on',
				action: function(msgData) {
					var args = msgData.text.split(/\s/);
					args.shift();
					var name = args.join(' '),
						message = (addOns[name]) ? addOns[name].description : 'Unknown add on: ' + name;

					message = (message.length > 0) ? message : 'No description available';
					self.pm(message, msgData.senderid);
				}
			},
			{
				command: '/option',
				arguments: ['addOn', 'optionName', 'optionValue'],
				help: 'gets all option names and values or gets or sets a specific option value on a specific add on, "optionName" and optionValue" are optional',
				action: function(msgData) {
					var args = msgData.text.split(/\s/),
						addOnName = args[1],
						optionName = args[2],
						optionValue = args[3],
						messages = [];

					if (!addOnName) {
						self.pm('Sorry you are missing some parameters for this command.', msgData.senderid);
					}
					else if (!addOns[addOnName]) {
						self.pm('Unknown add on: ' + addOnName, msgData.senderid);
					}
					else if (!optionName) {
						for (var opt in addOns[addOnName].options) {
							messages.push(opt + '=' + addOns[addOnName].options[opt].value);
						}
						if (messages.length > 0) {
							self.multiPm(messages, msgData.senderid, 300);
						}
						else {
							self.pm('This add on has no options.', msgData.senderid);
						}
					}
					else if (addOns[addOnName].options[optionName]) {
						if (optionValue) {
							var oldValue = addOns[addOnName].options[optionName].value,
								Type = addOns[addOnName].options[optionName].type;

							optionValue = (Type) ? new Type(optionValue) : optionValue;
							// if value is valid, set it
							if (optionValue == oldValue) {
								self.pm('"' + optionName + '" is already set to: ' + optionValue, msgData.senderid);
							}
							else if (!addOns[addOnName].options[optionName].isValid ||
								addOns[addOnName].options[optionName].isValid(optionValue)) {
								addOns[addOnName].options[optionName].value = optionValue;
								if (addOns[addOnName].options[optionName].onChange) {
									addOns[addOnName].options[optionName].onChange(oldValue, optionValue);
								}
								self.pm('Successfully changed "' + optionName + '" to: ' + optionValue, msgData.senderid);
							}
							else {
								self.pm('Unable to change "' + optionName + '" to: ' + optionValue + ' due to constraints', msgData.senderid);
							}
						}
						else {
							self.pm(optionName + '=' + addOns[addOnName].options[optionName].value, msgData.senderid);
						}
					}
					else {
						self.pm('Unable to find option "' + optionName + '" on addOn "' + addOnName + '"', msgData.senderid);
					}
				}
			}
		],
		commands = [
			{
				primaryCommand: '/help',
				secondaryCommands: ['^.*help (me)? ?tes.*$'],
				help: 'lists all the available commands',
				moderatorOnly: false,
				action: function(msgData) {
					var userId = (msgData.hasOwnProperty('senderid')) ? msgData.senderid : msgData.userid;
					self.roomInfo(function(roomData) {
						var isMod = (roomData.room.metadata.moderator_id.indexOf(userId) >= 0),
							allCommands = commands,
							messages = [],
							prop, i, args;

						for (prop in addOns) {
							if (addOns[prop].commands && addOns[prop].commands.length > 0) {
								allCommands = (addOns[prop].isEnabled) ? allCommands.concat(addOns[prop].commands) : allCommands;
							}
						}
						messages.push('Available Commands:' );
						for (i = 0; i < allCommands.length; i++) {
							if ((allCommands[i].moderatorOnly && isMod) || !allCommands[i].moderatorOnly) {
								args = (allCommands[i].arguments && allCommands[i].arguments.length > 0) ? ' <' + allCommands[i].arguments.join('> <') + '> ' : '';
								messages.push(':small_blue_diamond: ' + allCommands[i].primaryCommand + args + ' - ' + allCommands[i].help);
							}
						}

						self.multiPm(messages, userId, 300);
					});
				}
			},
			{
				primaryCommand: '/say',
				secondaryCommands: [],
				help: 'make me say something in chat',
				moderatorOnly: true,
				action: function(msgData) {
					var args = msgData.text.split(/\s/);
					args.shift();
					var text = args.join(' ');
					self.speak(text);
				}
			}
		],
		findActionByCommand = function(command, checkBotConfigCommands) {
			var cmdRegex, allCommands = [], prop, i, j;

			// check config commands first
			if (checkBotConfigCommands) {
				for (i = 0; i < botConfigCommands.length; i++) {
					cmdRegex = new RegExp('^' + botConfigCommands[i].command + '(\\s.*)?$');
					if (command.toLowerCase().match(cmdRegex)) {
						return botConfigCommands[i].action;
					}
				}
			}
			allCommands = allCommands.concat(commands);

			for (prop in addOns) {
				if (addOns[prop].commands && addOns[prop].commands.length > 0) {
					allCommands = (addOns[prop].isEnabled) ? allCommands.concat(addOns[prop].commands) : allCommands;
				}
			}

			// then check primary commands
			for (i = 0; i < allCommands.length; i++) {
				cmdRegex = new RegExp('^' + allCommands[i].primaryCommand + '(\\s.*)?$');
				if (command.toLowerCase().match(cmdRegex)) {
					return allCommands[i].action;
				}
				// then check secondary commands
				for (j = 0; j < allCommands[i].secondaryCommands.length; j++) {

					cmdNameStr = allCommands[i].secondaryCommands[j];

					if (isRegexString(cmdNameStr)) {
						cmdRegex = new RegExp(cmdNameStr);
					} else {
						cmdNameStr = cmdNameStr.replace("/", "\/");
						cmdRegex = new RegExp('^' + cmdNameStr + '$');
					}

					if (command.toLowerCase().match(cmdRegex)) {
						return allCommands[i].action;
					}
				}
			}
			return null;
		};

	/*
		Emits a 'connect' event when the bot has successfully joined the room.
	*/
	this.on('registered', function(data) {
		if (data.success && userId === data.user[0].userid) {


			// check to see if bot is a moderator
			self.roomInfo(function(roomData) {
				if (roomData.success) {
					if (roomData.room.metadata.moderator_id.indexOf(userId) < 0) {
						self.speak(':heavy_exclamation_mark: I am currently not fully functional. Please promote me to moderator to enable all my features.');

						var newModHandler = function (modData) {
								if (modData.userid === userId) {
									self.speak('Thank you! I am now fully operational.');
									self.removeListener('new_moderator', newModHandler);
								}
							};

						self.on('new_moderator', newModHandler);
					}

					if (roomData.room.metadata.current_song) {
						currentSong = { _id: roomData.room.metadata.current_song._id };
						_.extend(currentSong, roomData.room.metadata.current_song.metadata);
					}

					if (roomData.djids.length > 0) {
						_.each(roomData.djids, function(djid) {
							self.getUserInfo(djid, function(userData) {
								currentDjs.length++;
								currentDjs[djid] = userData;
								if (currentDjs.length >= roomData.djids.length) {
									self.emit('connect');
									isConnected = true;
								}
							});
						});
					}
					else {
						self.emit('connect');
						isConnected = true;
					}
				}
			});
		}
		else if (data.success) {
			cache.put('user:' + data.user[0].userid, data.user[0], cacheDuration, true);

			// greet all moderators with a PM
			self.getModsInRoom(function(modList) {
				if (modList.indexOf(data.user[0].userid) >= 0) {
					self.pm('Welcome back ' + data.user[0].name + '! You have the ability to control my configuration. Just type /bot.', data.user[0].userid);
				}
			});
		}
	});

	// clear user cache if a user is updated
	this.on('update_user', function(data) {
		cache.del('user:' + data.userid);
	});

	/*
		Emits a 'skipsong' event when a user skips their song. Same contract as 'endsong' event.
	*/
	this.on('endsong', function(data) {
		if (data.room.metadata.current_song) {
			var startTime = new Date(data.room.metadata.current_song.starttime * 1000),
				endTime = new Date(),
				songLength = data.room.metadata.current_song.metadata.length * 1000,
				currentDj = data.room.metadata.current_song.djid,
				remDjEventFired = false,
				removeDjHandler = function(remDjData) {
					remDjEventFired = (currentDj === remDjData.user[0].userid);
				};
			if (endTime - startTime <= (songLength - 1000)) {
				// possible skip, check for rem_dj events, that doesn't really count as a skip
				this.once('rem_dj', removeDjHandler);

				setTimeout(function() {
					self.removeListener('rem_dj', removeDjHandler);
					// if the rem_dj event wasn't fired for the user who's song ended,
					// emit skipsong event
					if (!remDjEventFired) {
						self.emit('skipsong', data);
					}
				}, 500);
			}
		}
	});

	this.on('newsong', function(data) {
		if (data.success) {
			currentSong = { _id: data.room.metadata.current_song._id };
			_.extend(currentSong, data.room.metadata.current_song.metadata);
		}
	});

	this.on('nosong', function(data) {
		if (data.success) {
			currentSong = null;
		}
	});

	this.on('pmmed', function(pmData) {
		var action = null;
		if (self.userId !== pmData.senderid) {
			self.getModsInRoom(function(modList) {
				var isMod = (modList.indexOf(pmData.senderid) >= 0);

				action = findActionByCommand(pmData.text, isMod);
				// if action was found, invoke it
				action && action(pmData, pmData.senderid, function(text, callback) { self.multiPm(text, pmData.senderid, 300, callback); });
				// if we couldn't find an action, and it looked like the user tried to issue a command, let them know we don't understand it
				!action && pmData.text[0] === '/' && self.pm('I don\'t understand that command', pmData.senderid);
			});
		}
	});

	this.on('speak', function(msgData) {
		var action = null;
		//if (self.userId !== msgData.userid) {
			action = findActionByCommand(msgData.text);
			// if action was found, invoke it
			action && action(msgData, msgData.userid, function(text, callback) { self.multiSpeak(text, 300, callback); });
			// if we couldn't find an action, and it looked like the user tried to issue a command, let them know we don't understand it
			!action && msgData.text[0] === '/' && self.speak('I don\'t understand that command');
		//}
	});

	this.on('add_dj', function(data) {
		if (data.success) {
			this.getUserInfo(data.user[0].userid, function(userData) {
				currentDjs.length++;
				currentDjs[data.user[0].userid] = userData;
			});
		}
	});

	this.on('rem_dj', function(data) {
		if (data.success) {
			currentDjs.length--;
			delete currentDjs[data.user[0].userid];
		}
	});

	/*
		Registers an add on with the bot. All add ons should be a constructor function that
		can be newed up and passed this bot object as the first parameter and an options object
		as a second praramter.

		Each add on should expose a "name" property that is a unique string, a "description" property that
		describes the add on, a "options" property that contains options that can be configured at runtime,
		and "enable" and "disable" methods which should enable and disable the
		functionality of the add on. The add on may also expose a "commands" property which should
		be a collection of commands that the bot will add to its help. Each command should be an
		object with the following properties: "primaryCommand", "secondaryCommands", "help", and "moderatorOnly".

		Params:
			AddOnFunc	{Function}	The constructor function of an add on to be registered with the bot.
			options		{Object}	A object containing options that will be used to configure the add on's options.
		Returns:
			None
	*/
	this.registerAddOn = function(AddOnFunc, options) {
		if (!_.isFunction(AddOnFunc)) {
			throw new Error('Missing or Invalid Parameters!');
		}

		var addOn = new AddOnFunc(self, options);
		if (!addOn.hasOwnProperty('name') ||
			!addOn.hasOwnProperty('description') ||
			!addOn.hasOwnProperty('enable') ||
			!addOn.hasOwnProperty('disable')) {
			throw new Error('Addon does not adhere to the expected contract!');
		}
		if (addOns.hasOwnProperty(addOn.name)) {
			throw new Error(addOn.name +' is already registered!');
		}

		// apply passed in options to addon
		if (addOn.hasOwnProperty('options')) {
			for (var option in options) {
				if (addOn.options.hasOwnProperty(option)) {
					var oldValue = addOn.options[option].value;
					addOn.options[option].value = options[option];
					if (addOn.options[option].onChange) {
						addOn.options[option].onChange(oldValue, options[option]);
					}
				}
				else {
					console.log('Option "' + option + '" does not exist on add on "' + addOn.name + '"! Ignoring the option.');
				}
			}
		}

		addOn.enable();

		addOns[addOn.name] = {
			isEnabled: true
		};

		_.extend(addOns[addOn.name], addOn);
	};

	/*
		Disables the specified add on.

		Params:
			name		{String}	The name of the add on to enable
		Returns:
			None
	*/
	this.disableAddOn = function(name) {
		if (addOns.hasOwnProperty(name) && addOns[name].isEnabled) {
			addOns[name].disable();
			addOns[name].isEnabled = false;
			return true;
		}
		else {
			console.log('Add on: ' + name + ' doesn\'t exist or is already disabled');
			return false;
		}
	};

	/*
		Enables the specified add on.

		Params:
			name		{String}	The name of the add on to enable
		Returns:
			None
	*/
	this.enableAddOn = function(name) {
		if (addOns.hasOwnProperty(name) && !addOns[name].isEnabled) {
			addOns[name].enable();
			addOns[name].isEnabled = true;
			return true;
		}
		else {
			console.log('Add on: ' + name + ' doesn\'t exist or is already enabled');
			return false;
		}
	};


	/*
		Gets the connected status of the bot.

		Params:
			None
		Returns:
			true if the bot is connected to the room, otherwise false
	*/
	this.isConnected = function() {
		return isConnected;
	};


	/*
		Gets the ID of a user by the provided name in the current room.

		Params:
			name		{String}	The exact name of a user in the room,
									or a regex string that will match the desired user in the room
			callback	{Function}	The function to call when the user ID is determined. The function
									should expect to receive one parameter which will be the ID of the
									desired user. If the user ID could not be determined, then the
									parameter will be null.
		Returns:
			None
	*/
	this.findUserIdInRoomByName = function(name, callback) {

		if (!name || !callback) {
			throw new Error('Missing parameters');
		}

		this.roomInfo(function(roomData) {
			var i, userId = null,
				cmdRegex = _.isRegExp(name) ? name : new RegExp('^' + name + '$', 'i');
			// check names for exact match
			for (i = 0; i < roomData.users.length; i++) {

				if (roomData.users[i].name === name) {
					userId = roomData.users[i].userid;
					break;
				}
			}
			if (!userId) {
				// check names for regex matches
				for (i = 0; i < roomData.users.length; i++) {
					// check name
					if (roomData.users[i].name.match(cmdRegex)) {
						userId = user.userid;
						break;
					}
				}
			}
			callback(userId);
		});
	};


	/*
		Gets the info of a user by user ID.

		Params:
			userId		{String}	The ID of the user to get the name of
			callback	{Function}	The function to call when the user name is determined. The function
									should expect to receive one parameter which will be an object
									with properties of desired user.
		Returns:
			None
	*/
	this.getUserInfo = function(userId, callback) {
		var userInfo = cache.get('user:' + userId);
		if (!userInfo) {
			this.stalk(userId, true, function(userData) {
				if (userData.success) {
					cache.put('user:' + userId, userData.user, cacheDuration, true);
					callback(userData.user);
				}
				else {
					console.log('Unable to get userInfo for:', userId);
				}
			});
		}
		else {
			callback(userInfo);
		}
	};

	/*
		Gets the moderators that are currently in the room. Data is cached for 3 mins to alleviate API calls to TT.

		Params:
			callback	{Function}	The function to call when the mods are determined. The function
									should expect to receive one parameter which will be an array
									of user ID's of the moderators in the room.
		Returns:
			None
	*/
	this.getModsInRoom = function(callback) {
		var cacheKey = 'mods:' + roomId,
			roomCacheDuration = 60 * 3, // 3 min cache time
			modInfo = cache.get(cacheKey);
		if (!modInfo) {
			this.roomInfo(function(roomData) {
				cache.put(cacheKey, { list: roomData.room.metadata.moderator_id }, roomCacheDuration, false);
				callback(roomData.room.metadata.moderator_id);
			});
		}
		else {
			callback(modInfo.list);
		}
	};


	/*
		Gets the properties of the current song being played in the room.

		Params:
			None
		Returns:
			An object containing properties about the current song
	*/
	this.getCurrentSong = function() {
		return currentSong;
	};

	/*
		Gets the properties of all the users that are currently DJs in the room.

		Params:
			None
		Returns:
			An object with keys that are user IDs of the current DJs and values that are the properties
			of that user. The object property will also contain a length property that is a count of
			current DJs.
	*/
	this.getCurrentDjsInRoom = function() {
		return currentDjs;
	};

	/*
		Gets the properties of all the users that are currently in the room.

		Params:
			callback	{Function}	The function to call when the users are determined. The function
									should expect to receive one parameter which will be an object with keys
									that are the user IDs of the current users in the room and values that are the properties
									of that user. The object property will also contain a length property that is a count of
									current users.
		Returns:
			None
	*/
	this.getCurrentUsersInRoom = function(callback) {
		var users = { length: 0 };
		this.roomInfo(true, function(roomData) {
			if (roomData.success) {
				_.each(roomData.users, function(user) {
					users[user.userid] = user;
				});
				users.length = roomData.users.length;
				callback(users);
			}
			else {
				callback({});
			}
		});
	};

	/*
		Gets the properties of all the users that are currently not DJ'ing (listeners) in the room.

		Params:
			callback	{Function}	The function to call when the users are determined. The function
									should expect to receive one parameter which will be an object with keys
									that are the user IDs of the current listeners in the room and values
									that are the properties of that user. The object property will also contain
									a length property that is a count of current listeners.
		Returns:
			None
	*/
	this.getCurrentListenersInRoom = function(callback) {
		var users = { length: 0 };
		this.roomInfo(true, function(roomData) {
			if (roomData.success) {
				_.each(roomData.users, function(user) {
					if (roomData.djids.indexOf(user.userid) < 0) {
						users[user.userid] = user;
					}
				});
				users.length = roomData.users.length - roomData.djids.length;
				callback(users);
			}
			else {
				callback({});
			}
		});
	};


	/*
		Allow a sequence of messages over a timed interval.

		Params:
			msgArray	{Array or String}	A message or collection of messages to be spoken by the bot
			interval	{Number}			[Optional] The number of milliseconds to wait between each message (Default: 1000)
			callback	{Function}			The function to call when the bot is done speaking
		Returns:
			None
	*/
	this.multiSpeak = function(msgArray, interval, callback) {
		var i, messages = (_.isArray(msgArray)) ? msgArray : [msgArray.toString()];
		callback = (_.isFunction(interval)) ? interval : callback;
		interval = (_.isNumber(interval)) ? interval : 1000;

		for (i = 0; i < messages.length; i++) {
			(function(idx) {
				setTimeout(function() {
					if (idx === (messages.length - 1)) {
						self.speak(messages[idx], callback);
					}
					else {
						self.speak(messages[idx]);
					}
				}, interval * idx);
			}(i));
		}
	};


	/*
		Allow a sequence of messages over a timed interval.

		Params:
			msgArray	{Array or String}	A message or collection of messages to be pm'ed by the bot
			interval	{Number}			[Optional] The number of milliseconds to wait between each message (Default: 1000)
			callback	{Function}			The function to call when the bot is done pm'ing
		Returns:
			None
	*/
	this.multiPm = function(msgArray, receiverId, interval, callback) {
		var i, messages = (_.isArray(msgArray)) ? msgArray : [msgArray.toString()];
		callback = (_.isFunction(interval)) ? interval : callback;
		interval = (_.isNumber(interval)) ? interval : 1000;

		for (i = 0; i < messages.length; i++) {
			(function(idx) {
				setTimeout(function() {
					if (idx === (messages.length - 1)) {
						self.pm(messages[idx], receiverId, callback);
					}
					else {
						self.pm(messages[idx], receiverId);
					}
				}, interval * idx);
			}(i));
		}
	};
}

util.inherits(ExtendedBot, Bot);

module.exports = ExtendedBot;