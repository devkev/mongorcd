
DBCollection.prototype.summary = function (opts) {
	var result = this.stats(opts);
	delete result.wiredTiger;
	return result;
};

