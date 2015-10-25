
// Various helpers for getting/setting slowms.


// db.getSlowms()
// db.slowms()
//  - returns the current value of slowms


// db.setSlowms(value)
// db.slowms(value)
//  - sets the value of slowms to be `value`


DB.prototype.getSlowms = function () {
	return this.getProfilingStatus().slowms;
};

DB.prototype.setSlowms = function (value) {
	return this.setProfilingLevel(db.getProfilingLevel(), value);
};

DB.prototype.slowms = function (value) {
	if (typeof(value) === "undefined") {
		return this.getSlowms();
	}
	return this.setSlowms(value);
};

