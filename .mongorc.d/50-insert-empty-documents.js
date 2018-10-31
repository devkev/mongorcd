
// Deliberately very simplistic.
DBCollection.prototype.insertEmptyDocuments = function(num) {
	assert(num, "specify number of docs to insert");
	assert.gt(num, 0, "can't insert negative number of docs");
	assert.lt(num, 10000000, "trying to do more than 10M docs at once is asking for trouble");
	var i = 0;
	var cursor = this.find( { _id: { $type: 1 } }, { _id: 1 } ).sort( { _id: -1 } ).limit(-1);
	if (cursor.hasNext()) {
		i = cursor.next()._id;
	}
	var a = [];
	for( ; i < num; i++) {
		a.push( { _id: i } );
	}
	this.insert(a);
};

