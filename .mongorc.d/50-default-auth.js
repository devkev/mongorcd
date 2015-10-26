
// I don't run any real systems, only test ones.  When auth is involved, it has
// almost always been setup by mtools (mlaunch), with the default user/password
// ("user", "password") on the admin db.
//
// This lets you simply do
//
//   db.auth()
//
// or
//
//   auth()
//
// to authenticate with these default parameters when none are provided.
//
// Authing with credentials (eg. `db.auth("<username>", "<password>")`, or with GSSAPI, etc),
// continues to work as normal.

function auth() {
	return db.getSiblingDB("admin").auth("user","password");
}

if (typeof(DB.prototype.__original_auth) == "undefined") {
	DB.prototype.__original_auth = DB.prototype.auth;
}

DB.prototype.auth = function(args) {
	if (arguments.length == 0) {
		print("NOTE: Using default credentials on admin db...");
		print("--> db.getSiblingDB(\"admin\").auth(\"user\",\"password\");");
		return auth();
	} else {
		return DB.prototype.__original_auth.apply(this, arguments);
	}
}

