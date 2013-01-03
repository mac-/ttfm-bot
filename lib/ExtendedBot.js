var _ = require('underscore'),
	Bot = require('ttapi'),
	util = require('util');

function ExtendedBot(auth, userId, roomId) {

	ExtendedBot.super_.call(this, auth, userId, roomId);
	var self = this;

	/*
		Emits a 'connect' event when the bot has successfully joined the room.
	*/
	this.on('registered', function(data) {
		if (data.success && userId === data.user[0].userid) {
			self.emit('connect');
		}
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
				cmdRegex = new RegExp(name, 'i');
			// check names for exact match
			for (i = 0; i < roomData.users.length; i++) {
				
				if (roomData.users[i].name === name) {
					userId = user.userid;
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
		this.stalk(userId, true, function(userData) {
			self.removeFan(userId, function() {
				callback(userData.user);
			});
		});
	};

	/*
		Gets the properties of all the users that are currently DJs in the room.

		Params:
			callback	{Function}	The function to call when the users are determined. The function
									should expect to receive one parameter which will be an object with keys
									that are the user IDs of the current DJs and values that are the properties
									of that user.
		Returns:
			None
	*/
	this.getCurrentDjsInRoom = function(callback) {
		var users = {};
		this.roomInfo(true, function(roomData) {
			if (roomData.success) {
				_.each(roomData.users, function(user) {
					if (roomData.djids.indexOf(user.userid) >= 0) {
						users[user.userid] = user;
					}
				});
				callback(users);
			}
			else {
				callback({});
			}
		});
	};

	/*
		Gets the properties of all the users that are currently in the room.

		Params:
			callback	{Function}	The function to call when the users are determined. The function
									should expect to receive one parameter which will be an object with keys
									that are the user IDs of the current users in the room and values that are the properties
									of that user.
		Returns:
			None
	*/
	this.getCurrentUsersInRoom = function(callback) {
		var users = {};
		this.roomInfo(true, function(roomData) {
			if (roomData.success) {
				_.each(roomData.users, function(user) {
					users[user.userid] = user;
				});
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
									that are the properties of that user.
		Returns:
			None
	*/
	this.getCurrentListenersInRoom = function(callback) {
		var users = {};
		this.roomInfo(true, function(roomData) {
			if (roomData.success) {
				_.each(roomData.users, function(user) {
					if (roomData.djids.indexOf(user.userid) < 0) {
						users[user.userid] = user;
					}
				});
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
};

util.inherits(ExtendedBot, Bot);

module.exports = ExtendedBot;