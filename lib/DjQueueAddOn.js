// creates a DJ queue to rotate djs when stage is full

module.exports = function DjQueueAddOn(bot) {

	var clone = require('clone'),
		self = this,
		currentDjs = {},
		nextDjIndex = 0,
		djQueue = [],
		pendingDjs = { count: 0 },
		queuedDjsByUserId = {},
		isQueueActive = false,
		addToQueue = function(msgData, issuerId, replyFunc) {
			bot.getUserInfo(issuerId, function(user) {
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
			});
		},
		listQueue = function(msgData, issuerId, replyFunc) {
			if (isQueueActive) {
				if (djQueue.length < 1) {
					replyFunc('The queue is empty.');
				}
				else {
					var messages = [], i;
					messages.push(':cd: DJ Queue:');
					for (i = 0; i < djQueue.length; i++) {
						if (pendingDjs.hasOwnProperty(djQueue[i])) {
							messages.push(':small_orange_diamond: ' + queuedDjsByUserId[djQueue[i]].name + ' (opening available)');
						}
						else {
							messages.push(':small_orange_diamond: ' + queuedDjsByUserId[djQueue[i]].name);
						}
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
			});

		},
		addDjHandler = function(data) {
			if (data.success) {
				if (currentDjs.length > self.options.djLimit.value) {
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
					isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);
					
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
				message = (djQueue.length > nextDjIndex) ? message + ' @' + djQueue[nextDjIndex].name + ' is on deck.' : message;
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
							djQueue.push(djQueue.splice(djQueue.indexOf(nextId), 1)[0]);
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
				isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);
			}
		},
		removeDjHandler = function(data) {
			if (data.success) {
				if (isQueueActive) {
					queueUpNextUser();
				}
				isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);

				delete currentDjs[data.user[0].userid];
				currentDjs.length--;
			}
		},
		newSongHandler = function(data) {
			if (data.success) {
				if (isQueueActive) {
					var dj = currentDjs[data.room.metadata.current_dj];
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
							bot.pm('You are playing song number ' + dj.songNumber + ' of the ' + self.options.djSongLimit.value + ' song limit.', data.room.metadata.current_dj);
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
			currentDjs = clone(djs);
			isQueueActive = (djs.length >= self.options.djLimit.value);
			if (isQueueActive) {
				bot.speak('The DJ queue has been activated. Type /aq to add yourself to the queue.');
			}
		},
		deregisterHandler = function(data) {
			if (data.success) {
				for (var i = 0; i < djQueue.length; i++) {
					if (djQueue[i].userid === data.user[0].userid) {
						djQueue.splice(i, 1);
						delete queuedDjsByUserId[djQueue[i].userid];
						break;
					}
				}
				if (pendingDjs.hasOwnProperty(data.user[0].userid)) {
					delete pendingDjs[data.user[0].userid];
					pendingDjs.count--;
					nextDjIndex--;
				}
				isQueueActive = (currentDjs.length >= self.options.djLimit.value || pendingDjs.count > 0);
			}
		},
		songLimitChangeHandler = function(oldValue, newValue) {
			if (isQueueActive) {
				for (var dj in currentDjs) {
					if (dj.hasOwnProperty('songNumber')) {
						if (dj.songNumber >= newValue) {
							bot.pm('The song limit has changed and you are at or above the limit. You will now be escorted off the stage.', dj.userid);
							bot.remDj(dj.userid);
						}
					}
				}
			}
		},
		djLimitChangeHandler = function(oldValue, newValue) {
			if (oldValue > newValue) {
				// drop the djs that have played the most songs
				for (var dj in currentDjs) {
					if (dj.hasOwnProperty('songNumber')) {
						if (dj.songNumber >= self.options.djSongLimit.value) {
							bot.pm('The song limit has changed and you are at or above the limit. You will now be escorted off the stage.', dj.userid);
							bot.remDj(dj.userid);
						}
					}
				}
			}
			else {
				if (isQueueActive) {
					queueUpNextUser();
				}
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
		}
	];

	this.options = {
		djSongLimit: {
			value: 2,
			type: Number,
			description: 'The number of songs a DJ can play before being rotated off the stage when the queue is active (1-999).',
			isValid: function(val) {
				return (val > 0 && val < 1000);
			},
			onChange: songLimitChangeHandler
		},
		nextUpWaitTime: {
			value: 30,
			type: Number,
			description: 'The number of seconds to wait for a user to step up on the stage before skipping them (1-60).',
			isValid: function(val) {
				return (val > 0 && val < 60);
			}
		},
		djLimit: {
			value: 5,
			type: Number,
			description: 'The max number of DJs to be allowed on stage (2-5).',
			isValid: function(val) {
				return (val > 0 && val < 6);
			},
			onChange: djLimitChangeHandler
		}
	};

	this.enable = function() {
		bot.on('add_dj', addDjHandler);
		bot.on('rem_dj', removeDjHandler);
		bot.on('connect', connectHandler);
		bot.on('deregistered', deregisterHandler);
		bot.on('newsong', newSongHandler);
		bot.on('endsong', endSongHandler);
	};

	this.disable = function() {
		bot.removeListener('add_dj', addDjHandler);
		bot.removeListener('rem_dj', removeDjHandler);
		bot.removeListener('connect', connectHandler);
		bot.removeListener('deregistered', deregisterHandler);
		bot.removeListener('newsong', newSongHandler);
		bot.removeListener('endsong', endSongHandler);
	};
};