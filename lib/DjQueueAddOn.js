// creates a DJ queue to rotate djs when stage is full

module.exports = function DjQueueAddOn(bot) {

	var self = this,
		currentDjs = {},
		activeDj = null,
		nextDjIndex = 0,
		djQueue = [],
		pendingDjs = { count: 0 },
		queuedDjsByUserId = {},
		griefers = {},
		holds = {},
		isQueueActive = false,
		afkDjs = {},
		getInitialWarning = function() {
			return '@<user>, are you AFK? No AFK DJ\'s are allowed when the stage is full. Please chat/bop/snag within ' + self.options.afkWarnTime.value + ' seconds, or you\'ll be escorted off stage.';
		},
		getSecondaryWarning = function() {
			return '@<user>, Please chat/bop/snag within ' + self.options.afkWarnTime.value/2 + ' seconds, or you\'ll be escorted off stage.';
		},
		beginWarnSequence = function(userId) {
			if (!currentDjs[userId]) {
				delete afkDjs[userId];
				return;
			}
			bot.speak(getInitialWarning().replace('<user>', currentDjs[userId].name));
						
			setTimeout(function() {
				if (afkDjs[userId]) {
					bot.speak(getSecondaryWarning().replace('<user>', currentDjs[userId].name));
				}
			}, self.options.afkWarnTime.value * 1000/2);

			setTimeout(function() {
				if (afkDjs[userId]) {
					bot.remDj(userId);
				}
			}, self.options.afkWarnTime.value * 1000);
		},
		resetDjsPlayCount = function() {
			for (var id in currentDjs) {
				if (currentDjs.hasOwnProperty(id)) {
					currentDjs[id].songNumber = 0;
					bot.pm('The queue has been deactived and your song count has been reset should it become active again.', id);
				}
			}
		},
		addToQueue = function(msgData, issuerId, replyFunc) {
			bot.getUserInfo(issuerId, function(user) {
				if (user) {
					if (currentDjs.hasOwnProperty(issuerId)) {
						replyFunc('Hey @' + user.name + ', it appears you are already on stage.');
					}
					else if (isQueueActive) {
						if (queuedDjsByUserId.hasOwnProperty(issuerId)) {
							replyFunc('@' + user.name + ', you are already in the queue at position ' + (djQueue.indexOf(issuerId) + 1) + '.');
						}
						else {
							djQueue.push(issuerId);
							queuedDjsByUserId[issuerId] = { name: user.name, hasBeenSkipped: false };
							replyFunc('Ok @' + user.name + ', you\'ve been added to the queue. You are at postion ' + (djQueue.indexOf(issuerId) + 1) + '.');
						}
					}
					else {
						replyFunc('Hey @' + user.name + ', it appears the stage has open spots. Feel free to jump up and play some music.');
					}
				}
				else {
					replyFunc('Unable to get user info');
				}
			});
		},
		listQueue = function(msgData, issuerId, replyFunc) {
			if (isQueueActive) {
				if (djQueue.length < 1) {
					replyFunc('The queue is empty.');
				}
				else {
					var messages = [], i, msg;
					messages.push(':cd: DJ Queue:');
					for (i = 0; i < djQueue.length; i++) {
						msg = ':small_orange_diamond: ' + queuedDjsByUserId[djQueue[i]].name;
						if (pendingDjs.hasOwnProperty(djQueue[i])) {
							msg += ' (opening available)';
						}
						if (holds[djQueue[i]]) {
							msg += ' (holding spot)';
						}
						messages.push(msg);
					}
					replyFunc(messages);
				}
			}
			else {
				replyFunc('The queue is not active since the stage has open spots.');
			}

		},
		removeFromQueue = function(msgData, issuerId, replyFunc) {
			bot.getUserInfo(issuerId, function(user) {
				if (user) {
					if (djQueue.indexOf(issuerId) > -1) {
						if (pendingDjs.hasOwnProperty(issuerId)) {
							delete pendingDjs[issuerId];
							pendingDjs.count--;
						}
						djQueue.splice(djQueue.indexOf(issuerId), 1);
						delete queuedDjsByUserId[issuerId];
						replyFunc('@' +  user.name + ', you have been removed from the queue.');
					}
					else {
						replyFunc('@' +  user.name + ', you don\'t appear to be in the queue.');
					}
				}
				else {
					replyFunc('Unable to get user info');
				}
			});

		},
		removeAllFromQueue = function(msgData, issuerId, replyFunc) {
			djQueue = [];
			pendingDjs = {};
			pendingDjs.count = 0;
			queuedDjsByUserId = {};
			replyFunc('The DJ queue has been cleared');
		},
		addDjHandler = function(data) {
			if (data.success) {
				if (currentDjs.hasOwnProperty(data.user[0].userid)) {
					bot.speak('@' + data.user[0].name + ', I thought you might want your spot back :)');
					clearTimeout(currentDjs[data.user[0].userid].stepDownTimeout);
					currentDjs[data.user[0].userid].stepDownTimeout = null;
				}
				else if (currentDjs.length >= self.options.djLimit.value) {
					bot.speak('Sorry @' + data.user[0].name + ', the maximum number of DJ slots are currently in use (' + self.options.djLimit.value + ').');
					bot.remDj(data.user[0].userid);
				}
				else if (isQueueActive && !pendingDjs.hasOwnProperty(data.user[0].userid)) {
					bot.speak('Sorry @' + data.user[0].name + ', it\'s not your turn to DJ yet.');
					bot.remDj(data.user[0].userid);
				}
				else  {
					if (pendingDjs.hasOwnProperty(data.user[0].userid)) {
						delete pendingDjs[data.user[0].userid];
						pendingDjs.count--;
						djQueue.splice(djQueue.indexOf(data.user[0].userid), 1);
						nextDjIndex--;
					}
					
					currentDjs[data.user[0].userid] = data.user[0];
					currentDjs.length++;

					// if queue wasn't active, and now it is, let the room know
					if ((!isQueueActive && (currentDjs.length >= self.options.djLimit.value) || pendingDjs.count > 0)) {
						bot.speak('The DJ queue has been activated. Type /aq to add yourself to the queue.');
					}

					// if the queue is active and the dj limit increased by more than 1, then we can queue up multiple 
					// users if there is an existing queue
					if (isQueueActive && currentDjs.length < self.options.djLimit.value && djQueue.length > 0) {
						queueUpNextUser();
					}
					var oldIsQueueActive = isQueueActive;
					isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);
					if (!isQueueActive && oldIsQueueActive) {
						resetDjsPlayCount();
					}
					if (isQueueActive && !oldIsQueueActive) {
						for (var userId in afkDjs) {
							if (currentDjs[userId].hasOwnProperty('name')) {
								beginWarnSequence(userId);
							}
						}
					}
					
				}
			}
		},
		queueUpNextUser = function() {
			var nextId = djQueue[nextDjIndex];
				
			if (nextId) {
				nextDjIndex++;
				var nextUser = queuedDjsByUserId[nextId];
				pendingDjs[nextId] = nextUser.name;
				pendingDjs.count++;
				var message = '@' + nextUser.name + ' is up next.';
				message = (djQueue.length > nextDjIndex) ? message + ' ' + queuedDjsByUserId[djQueue[nextDjIndex]].name + ' is on deck.' : message;
				bot.speak(message);

				setTimeout(function() {
					if (pendingDjs.hasOwnProperty(nextId)) {
						delete pendingDjs[nextId];
						pendingDjs.count--;
						nextDjIndex--;
						if (nextUser.hasBeenSkipped) {
							bot.speak('@' + nextUser.name + ' has been skipped twice and is now removed from the queue.');
							djQueue.splice(djQueue.indexOf(nextId), 1);
							delete queuedDjsByUserId[nextId];
						}
						else {
							bot.speak('@' + nextUser.name + ' failed to take a DJ spot in time and will be placed at the end of the queue.');
							djQueue.push(djQueue.splice(djQueue.indexOf(nextId), 1));
							nextUser.hasBeenSkipped = true;
						}
						setTimeout(function() {
							queueUpNextUser();
						}, 500);
					}
					else {
						// if the user is no longer pending AND not currently a dj, they must have dequeued
						if (!currentDjs.hasOwnProperty(nextId)) {
							nextDjIndex--;
							queueUpNextUser();
						}
					}
				}, self.options.nextUpWaitTime.value * 1000);
			}
			else {
				var oldIsQueueActive = isQueueActive;
				isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);
				if (!isQueueActive && oldIsQueueActive) {
					resetDjsPlayCount();
				}
			}
		},
		removeDjHandler = function(data) {
			if (data.success) {
				var changeDjs = function(userId) {
					if (isQueueActive) {
						queueUpNextUser();
					}

					delete currentDjs[userId];
					currentDjs.length--;

					var oldIsQueueActive = isQueueActive;
					isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);
					if (!isQueueActive && oldIsQueueActive) {
						resetDjsPlayCount();
					}
				};

				var songNum = (currentDjs.hasOwnProperty(data.user[0].userid)) ? currentDjs[data.user[0].userid].songNumber || 0 : 0;
				if (isQueueActive && currentDjs.hasOwnProperty(data.user[0].userid) && songNum < self.options.djSongLimit.value && !afkDjs[data.user[0].userid]) {
					bot.speak('@' + data.user[0].name + ', are you sure you are ready to step down? I\'ll hold your spot for 30 seconds so you can get back up on stage.');
					currentDjs[data.user[0].userid].stepDownTimeout = setTimeout(function() {
						bot.speak('@' + data.user[0].name + ', I\'m giving up your spot.');
						setTimeout(function() {
							changeDjs(data.user[0].userid);
						}, 300);
					}, 30000);
				}
				else if (isQueueActive && !currentDjs.hasOwnProperty(data.user[0].userid)) {
					griefers[data.user[0].userid] = griefers[data.user[0].userid] || 0;
					griefers[data.user[0].userid]++;
					if (griefers[data.user[0].userid] >= 3) {
						delete griefers[data.user[0].userid];
						bot.boot(data.user[0].userid, 'A queue is in place. Please abide by the rules.');
					}
				}
				else {
					if (isQueueActive && self.options.autoAdd.value) {
						djQueue.push(data.user[0].userid);
						queuedDjsByUserId[data.user[0].userid] = { name: data.user[0].name, hasBeenSkipped: false };
						bot.pm('@' + data.user[0].name + ', you have been added to the queue automatically.', data.user[0].userid);
					}
					// if the dj limit changed to be fewer than the current number of djs,
					// let's bleed off the dj's without queueing up new ones, OR
					// if more than one user drops off the stage can create mulitple openings,
					// don't queue up more than one user at a time
					if (currentDjs.length - 1 >= self.options.djLimit.value || pendingDjs.count > 0) {
						var oldIsQueueActive = isQueueActive;
						isQueueActive = false;
						if (oldIsQueueActive) {
							resetDjsPlayCount();
						}
					}
					changeDjs(data.user[0].userid);
				}
			}
		},
		newSongHandler = function(data) {
			if (data.success) {
				if (isQueueActive) {
					var dj = activeDj = currentDjs[data.room.metadata.current_dj];
					// dj will be null if someone tries to dj when it's not their turn and they end up getting a song start in
					if (dj) {
						dj.songNumber = dj.songNumber || 0;
						
						if (dj.songNumber >= self.options.djSongLimit.value) {
							bot.pm('You have reached the song limit. You will now be escorted off the stage.', data.room.metadata.current_dj);
							setTimeout(function() {
								bot.remDj(dj.userid);
							}, 1000);
						}
						else {
							dj.songNumber++;
							bot.pm('You are playing song number ' + dj.songNumber + ' of the ' + self.options.djSongLimit.value + ' song limit. The song limit is the number of songs you can play while the queue is in place', data.room.metadata.current_dj);
						}
					}
				}
			}
		},
		endSongHandler = function(data) {
			if (data.success) {
				if (isQueueActive) {
					var dj = currentDjs[data.room.metadata.current_dj];
					// dj will be null if someone tries to dj when it's not their turn and they end up getting a song start in
					if (dj) {
						dj.songNumber = dj.songNumber || 1;
						if (dj.songNumber >= self.options.djSongLimit.value) {
							bot.pm('You have reached the song limit. You will now be escorted off the stage.', data.room.metadata.current_dj);
							setTimeout(function() {
								bot.remDj(dj.userid);
							}, 1000);
						}
					}
				}
			}
		},
		connectHandler = function(data) {
			var djs = bot.getCurrentDjsInRoom();
			currentDjs = JSON.parse(JSON.stringify(djs));
			var oldIsQueueActive = isQueueActive;
			isQueueActive = (djs.length >= self.options.djLimit.value);
			if (isQueueActive) {
				bot.speak('The DJ queue has been activated. Type /aq to add yourself to the queue.');
			}
			else if (!isQueueActive && oldIsQueueActive) {
				resetDjsPlayCount();
			}
		},
		registerHandler = function(data) {
			if (holds[data.user[0].userid]) {
				setTimeout(function() {
					bot.speak('@' + data.user[0].name + ', I\'ve held your spot in the queue while you were away.');
				}, 3300);
				delete holds[data.user[0].userid];
			}
			else if (isQueueActive) {
				setTimeout(function() {
					bot.speak('Hey @' + data.user[0].name + ', the DJ queue is currently active. Type /aq to add yourself to the queue.');
				}, 3300);
			}
		},
		deregisterHandler = function(data) {
			if (data.success) {
				if (afkDjs[data.user[0].userid]) {
					delete afkDjs[data.user[0].userid];
				}

				if (griefers.hasOwnProperty(data.user[0].userid)) {
					delete griefers[data.user[0].userid];
				}
				for (var i = 0; i < djQueue.length; i++) {
					if (djQueue[i] === data.user[0].userid) {
						holds[data.user[0].userid] = true;
						(function(idx, userid) {
							setTimeout(function() {
								if (holds[userid]) {
									djQueue.splice(idx, 1);
									delete queuedDjsByUserId[djQueue[idx]];

									if (pendingDjs.hasOwnProperty(userid)) {
										delete pendingDjs[userid];
										pendingDjs.count--;
										nextDjIndex--;
									}

									var oldIsQueueActive = isQueueActive;
									isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);
									if (!isQueueActive && oldIsQueueActive) {
										resetDjsPlayCount();
									}
								}
							}, 30000);
						}(i, data.user[0].userid));
						
						break;
					}
				}
			}
		},
		songLimitChangeHandler = function(oldValue, newValue) {
			if (isQueueActive) {
				for (var djId in currentDjs) {
					var dj = currentDjs[djId];
					if (dj.hasOwnProperty('songNumber')) {
						if (dj.songNumber >= newValue && activeDj.userid === djId) {
							bot.pm('The song limit has changed and you are at or above the limit. You will be escorted off the stage after your song is over.', djId);
						}
						else if (dj.songNumber >= newValue) {
							bot.pm('The song limit has changed and you are at or above the limit. You will now be escorted off the stage.', djId);
							bot.remDj(dj.userid);
						}
						else {
							bot.pm('The song limit has changed to ' + newValue + '. This is the number of songs you can play while the queue is active', djId);
						}
					}
				}
			}
		},
		djLimitChangeHandler = function(oldValue, newValue) {
			if (isQueueActive) {
				if (oldValue < newValue && djQueue.length > 0) {
					queueUpNextUser();
				}
				var oldIsQueueActive = isQueueActive;
				isQueueActive = (currentDjs.length >= newValue || pendingDjs.count > 0);
				if (!isQueueActive && oldIsQueueActive) {
					resetDjsPlayCount();
				}
			}
			else {
				var oldIsQueueActive = isQueueActive;
				isQueueActive = (currentDjs.length >= newValue || pendingDjs.count > 0);
				if (isQueueActive) {
					bot.speak('The DJ queue has been activated. Type /aq to add yourself to the queue.');
					if (!oldIsQueueActive) {
						for (var userId in afkDjs) {
							if (currentDjs[userId].hasOwnProperty('name')) {
								beginWarnSequence(userId);
							}
						}
					}
				}
				else if (!isQueueActive && oldIsQueueActive) {
					resetDjsPlayCount();
				}
			}
		},
		afkHandler = function(userId) {
			if (currentDjs.hasOwnProperty(userId) && userId) {
				afkDjs[userId] = true;

				if (currentDjs.length >= self.options.djLimit.value) {
					if (currentDjs[userId].hasOwnProperty('name')) {
						beginWarnSequence(userId);
					}
				}
			}
		},
		activeHandler = function(userId) {
			if (afkDjs[userId]) {
				delete afkDjs[userId];
			}
		};

	this.name = 'dj-queue';

	this.description = 'When the stage is full, a queue is created which will allow the dj\'s on the stage to be rotated.';

	this.commands = [
		{
			primaryCommand: '/q',
			secondaryCommands: [],
			help: 'list the people in the queue',
			moderatorOnly: false,
			action: listQueue
		},
		{
			primaryCommand: '/aq',
			secondaryCommands: [],
			help: 'add yourself to the DJ queue',
			moderatorOnly: false,
			action: addToQueue
		},
		{
			primaryCommand: '/dq',
			secondaryCommands: [],
			help: 'remove yourself from the DJ queue',
			moderatorOnly: false,
			action: removeFromQueue
		},
		{
			primaryCommand: '/clearq',
			secondaryCommands: [],
			help: 'remove everyone from the DJ queue',
			moderatorOnly: true,
			action: removeAllFromQueue
		}
	];

	this.options = {
		djSongLimit: {
			value: 2,
			type: Number,
			description: 'The number of songs a DJ can play before being rotated off the stage when the queue is active (1-99).',
			isValid: function(val) {
				return (val > 0 && val < 100);
			},
			onChange: songLimitChangeHandler
		},
		nextUpWaitTime: {
			value: 30,
			type: Number,
			description: 'The number of seconds to wait for a user to step up on the stage before skipping them (1-60).',
			isValid: function(val) {
				return (val > 0 && val <= 60);
			}
		},
		djLimit: {
			value: 5,
			type: Number,
			description: 'The max number of DJs to be allowed on stage (2-5).',
			isValid: function(val) {
				return (val > 1 && val < 6);
			},
			onChange: djLimitChangeHandler
		},
		autoAdd: {
			value: true,
			type: Boolean,
			description: 'Whether or not to re-add DJs to the end of the queue after their time on the stage is over.'
		},
		afkWarnTime: {
			value: 30,
			type: Number,
			description: 'The number of seconds a user has to become active in the room before they are removed from the stage for being AFK when the stage is full (1-999).',
			isValid: function(val) {
				return (val > 0 && val < 1000);
			}
		}
	};

	this.enable = function() {
		bot.on('add_dj', addDjHandler);
		bot.on('rem_dj', removeDjHandler);
		bot.on('connect', connectHandler);
		bot.on('registered', registerHandler);
		bot.on('deregistered', deregisterHandler);
		bot.on('newsong', newSongHandler);
		bot.on('endsong', endSongHandler);
		bot.on('afk', afkHandler);
		bot.on('active', activeHandler);
	};

	this.disable = function() {
		bot.removeListener('add_dj', addDjHandler);
		bot.removeListener('rem_dj', removeDjHandler);
		bot.removeListener('connect', connectHandler);
		bot.removeListener('registered', registerHandler);
		bot.removeListener('deregistered', deregisterHandler);
		bot.removeListener('newsong', newSongHandler);
		bot.removeListener('endsong', endSongHandler);
		afkDjs = {};
	};
};