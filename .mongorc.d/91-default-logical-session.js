
// All ops go into a logical session by default.

(function () {

	var _sessionify = function (_db) {
		if (typeof(_db) !== "undefined" && "startSession" in _db.getMongo()) {
			try {
				_db = _db.getMongo().startSession().getDatabase(_db.getName());
				// SERVER-19710
				//shellPrint(_db.getSession());
				print(_db.getSession());
			} catch (e) {
				// Probably connected to an old server.  Oh well.
			}
		}
		return _db;
	};


	// The main `db` object (if there is one).
	db = _sessionify(db);


	// Any new db objects created via `connect()`.
	var _actual_connect = connect;
	connect = function (...args) {
		return _sessionify(_actual_connect.apply(null, args));
	};


})();

