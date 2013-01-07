// escorts a user off the stage after their song has finished playing

module.exports = function EscortMeAddOn(bot, options) {

	var djsToEscort = [],
		escortUser = function(msgData) {
			var isPm = msgData.hasOwnProperty('senderid'),
				userId = (isPm) ? msgData.senderid : msgData.userid,
				speakFunc = function(text) {
					if (isPm) {
						return bot.pm(text, userId);
					}
					bot.speak(text);
				};
			bot.getUserInfo(userId, function(userData) {
				bot.getCurrentDjsInRoom(function(djs) {
					if (userId === userData.userid && djs.hasOwnProperty(userId)) {
						speakFunc('Ok, @' + userData.name + ' I will escort you off the stage after your song.');
						var endSongHandler = function(songData) {
								var djIndex = djsToEscort.indexOf(songData.room.metadata.current_song.djid);
								if (djIndex > -1) {
									bot.remDj(songData.room.metadata.current_song.djid);
									djsToEscort.splice(djIndex, 1);
									if (djsToEscort.length < 1) {
										bot.removeListener('endsong', endSongHandler);
									}
								}
							};
						if (djsToEscort.length < 1) {
							bot.on('endsong', endSongHandler);
						}
						djsToEscort.push(userId);
					}
					else {
						speakFunc('Well, @' + userData.name + ' it doesn\'t appear you are on stage right now.');
					}
				});
			});
		};

	this.name = 'escort-me';

	this.description = 'Provides a command to automatically escort a user off the stage after their song has finished playing.';

	this.commands = [{
		primaryCommand: '/escortme',
		secondaryCommands: [],
		help: 'get escorted off stage after your song ends',
		moderatorOnly: false,
		action: escortUser
	}];

	this.enable = function() {
		// nothing to do
	};

	this.disable = function() {
		djsToEscort = [];
	};
};