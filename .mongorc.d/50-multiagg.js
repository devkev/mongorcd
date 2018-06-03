
/*
 * Want to run many disparate aggregations without suffering all the client-server round-trips?
 * Then this is the module for you.
 *
 * If your results are too large to return, then add to the end of each sub-aggregation's pipeline a stage like `{ $project: { _id: 1 } }`, to just return the matching `_id` values.
 * You can then efficiently look those up using a separate query/aggregation which just matches on `{ _id: { $in: arrayOfIdValues } }`.
 *
 * Requires MongoDB 3.6+.
 *
 * Examples:
 * 
 * multiAgg = new MultiAggregation();
 * muttiAgg.aggregate("values", [ { $match: { ts: { $gte: value1 } } }, { $limit: 1 }, ]);
 * muttiAgg.aggregate("values", [ { $match: { ts: { $gte: value2 } } }, { $limit: 1 }, ]);
 * muttiAgg.aggregate("values", [ { $match: { ts: { $gte: value3 } } }, { $limit: 1 }, ]);
 * db.values.multiAggregate(multiAgg).forEach(printjson);
 * 
 * db.values.multiAggregate(new MultiAggregation()
 *     .aggregate("values", [ { $match: { ts: { $gte: value1 } } }, { $limit: 1 }, ])
 *     .aggregate("values", [ { $match: { ts: { $gte: value2 } } }, { $limit: 1 }, ])
 *     .aggregate("values", [ { $match: { ts: { $gte: value3 } } }, { $limit: 1 }, ])).forEach(printjson);
 * 
 */

// Public interface:

function MultiAggregation(options) {
	this.options = options;
	this.subaggs = [];
	this.dbName;
}

MultiAggregation.prototype.aggregate = function (coll, pipeline) {
	if (typeof(this.dbName) == "undefined") {
		this.dbName = coll.getDB().getName();
	} else {
		assert.eq(coll.getDB().getName(), this.dbName, "All sub-aggs must be in the same db.");
	}
	this.subaggs.push( { coll: coll, pipeline: pipeline } );
	return this;
};

DBCollection.prototype.multiAggregate = function (multiAggregate, options) {
	return multiAggregate._execute(this, options);
};



// Private interface:

MultiAggregation._constructPipeline = function (subaggs) {
	var pipeline = [];
	var outputs = [];

	// Get a single empty doc.
	pipeline.push( { $limit: 1 } );
	pipeline.push( { $project: { _id: 0, foo: "" } } );
	pipeline.push( { $project: { foo: 0 } } );

	// Do each sub-agg.
	subaggs.forEach( function (subagg, outputNum) {
		var output = "o" + outputNum;
		pipeline.push( { $lookup: { from: subagg.coll.getName(), as: output, pipeline: subagg.pipeline } } );
		outputs.push("$" + output);
	} );

	// Merge and post-proc the results.
	pipeline.push( { $project: { o: { $concatArrays: outputs } } } );
	pipeline.push( { $unwind: "$o" } );
	pipeline.push( { $replaceRoot: { newRoot: "$o" } } );

	return pipeline;
};

MultiAggregation.prototype._execute = function (coll, options) {
	assert.eq(coll.getDB().getName(), this.dbName, "MultiAggregation must be run in the same db as all the sub-aggs.");

	options = Object.merge(this.options || {}, options || {});

	var pipeline = MultiAggregation._constructPipeline(this.subaggs);

	if (options.multiAggregationDebug) {
		delete options.multiAggregationDebug;
		printjson(this.subaggs.length);
		printjson(this.subaggs);
		printjson(pipeline);
		printjson(Object.bsonsize(pipeline));
		printjson(Object.bsonsize(pipeline)/this.subaggs.length);
	}

	return coll.aggregate(pipeline, options);
};

