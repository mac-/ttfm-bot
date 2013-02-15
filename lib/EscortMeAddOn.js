// escorts a user off the stage after their song has finished playing

module.exports = function EscortMeAddOn(bot) {

	var djsToEscort = [],
		escortUser = function(msgData, issuerId, replyFunc) {
			bot.getUserInfo(issuerId, function(userData) {
				if (userData) {
					var djs = bot.getCurrentDjsInRoom();
					if (issuerId === userData.userid && djs.hasOwnProperty(issuerId)) {
						replyFunc('Ok, @' + userData.name + ' I will escort you off the stage after your song.');
						var endSongHandler = function(songData) {
								var djIndex = djsToEscort.indexOf(songData.room.metadata.current_song.djid);
								if (djIndex > -1) {
									setTimeout(function() {
										bot.remDj(songData.room.metadata.current_song.djid);
									}, 2000);
									djsToEscort.splice(djIndex, 1);
									if (djsToEscort.length < 1) {
										bot.removeListener('endsong', endSongHandler);
									}
								}
							};
						if (djsToEscort.length < 1) {
							bot.on('endsong', endSongHandler);
						}
						djsToEscort.push(issuerId);
					}
					else {
						replyFunc('Well, @' + userData.name + ' it doesn\'t appear you are on stage right now.');
					}
				}
				else {
					replyFunc('Unable to get user info');
				}
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