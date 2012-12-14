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
	{
		name: 'beginner',
		description: 'acquire 5 points',
		check: function(oldData, newData) {
			if (!newData.points) return false;
			return (newData.points >= 5);
		}
	},
	{
		name: 'experienced',
		description: 'acquire 50 points',
		check: function(oldData, newData) {
			if (!newData.points) return false;
			return (newData.points >= 50);
		}
	}
];