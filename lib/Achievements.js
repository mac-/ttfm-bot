/*
	Achievements require 3 props: name, description, and check.

	the check method should accept 2 paramters:
		the first being the original data before the event happened
		the second being the new data after the event happened
	the check method should return true if the achievement has been satisfied

	As a best practice, the check method should always validate the parameters,
	and return false if the data doesn't match what is expected since all achievements
	are checked against different types of events and data for those events.
*/
module.exports = [

	// Achievements for: POINTS
	{
		name: 'Johnny Five',
		description: 'acquire 5 points',
		check: function(oldData, newData) {
			if (!newData.points) return false;
			return (newData.points >= 5);
		}
	},
	{
		name: 'Wannabe',
		description: 'acquire 50 points',
		check: function(oldData, newData) {
			if (!newData.points) return false;
			return (newData.points >= 50);
		}
	},
	{
		name: 'DJ Extraodinaire',
		description: 'acquire 500 points',
		check: function(oldData, newData) {
			if (!newData.points) return false;
			return (newData.points >= 500);
		}
	},
	{
		name: 'Spin Master',
		description: 'acquire 5000 points',
		check: function(oldData, newData) {
			if (!newData.points) return false;
			return (newData.points >= 5000);
		}
	},



	// Achievements for: UP VOTES GIVEN
	{
		name: 'Thumbs Upper',
		description: 'vote for 10 songs',
		check: function(oldData, newData) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 10);
		}
	},
	{
		name: 'Boppin\' Betty',
		description: 'vote for 50 songs',
		check: function(oldData, newData) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 50);
		}
	},
	{
		name: 'It\'s Your Duty',
		description: 'vote for 100 songs',
		check: function(oldData, newData) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 100);
		}
	},
	{
		name: 'I\'m Lovin\' It',
		description: 'vote for 200 songs',
		check: function(oldData, newData) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 200);
		}
	},
	{
		name: 'Green Thumber',
		description: 'vote for 500 songs',
		check: function(oldData, newData) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 500);
		}
	},
	{
		name: 'Millennial',
		description: 'vote for 1000 songs',
		check: function(oldData, newData) {
			if (!newData.upVotesGiven) return false;
			return (newData.upVotesGiven >= 1000);
		}
	}
];