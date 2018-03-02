
DB.prototype.listSessions = function (opts) {
	opts = Object.extend({}, opts);
	return this.getSiblingDB("config").system.sessions.aggregate( [ { "$listSessions": opts } ] );
};

DB.prototype.listLocalSessions = function (opts) {
	opts = Object.extend({}, opts);
	return this.aggregate( [ { "$listLocalSessions": opts } ] );
};


DB.prototype.listAllSessions = function (opts) {
	opts = Object.extend({ allUsers: true }, opts);
	return this.listSessions(opts);
};

DB.prototype.listAllLocalSessions = function (opts) {
	opts = Object.extend({ allUsers: true }, opts);
	return this.listLocalSessions(opts);
};


DB.prototype.listCurrentUserSessions = function (opts) {
	return this.listSessions(opts);
};

DB.prototype.listCurrentUserLocalSessions = function (opts) {
	return this.listLocalSessions(opts);
};


DB.prototype.listUserSessions = function (users) {
	return this.listSessions( { users } );
};

DB.prototype.listUserLocalSessions = function (users) {
	return this.listLocalSessions( { users } );
};




[
	"listSessions", "listLocalSessions",
	"listAllSessions", "listAllLocalSessions",
	"listCurrentUserSessions", "listCurrentUserLocalSessions",
	"listUserSessions", "listUserLocalSessions",
].forEach(function (fn) {
	Mongo.prototype[fn] = function (...args) {
		var _db = this.getDB("config");
		return _db[fn].apply(_db, args);
	};
});

