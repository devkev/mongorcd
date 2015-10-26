
// Calculates and puts the actual repllag of each member into the output of rs.status().
// (In seconds and hours.)
//
// Effect:
//
// > rs.status()
// {
//         "set" : "replset",
//         "date" : ISODate("2014-10-17T06:49:26Z"),
//         "myState" : 1,
//         "members" : [
//                 {
//                         "_id" : 0,
//                         "name" : "genique:12490",
//                         "health" : 1,
//                         "state" : 1,
//                         "stateStr" : "PRIMARY",
//                         "uptime" : 629609,
//                         "optime" : Timestamp(1404443997, 1),
//                         "optimeDate" : ISODate("2014-07-04T03:19:57Z"),
//                         "self" : true,
//+                        "repllag" : 0,
//+                        "repllagHrs" : 0
//                 },
//                 {
//                         "_id" : 1,
//                         "name" : "genique:12491",
//                         "health" : 1,
//                         "state" : 2,
//                         "stateStr" : "SECONDARY",
//                         "uptime" : 629607,
//                         "optime" : Timestamp(1404443997, 1),
//                         "optimeDate" : ISODate("2014-07-04T03:19:57Z"),
//                         "lastHeartbeat" : ISODate("2014-10-17T06:49:26Z"),
//                         "lastHeartbeatRecv" : ISODate("2014-10-17T06:49:24Z"),
//                         "pingMs" : 0,
//                         "syncingTo" : "genique:12490",
//+                        "repllag" : 0,
//+                        "repllagHrs" : 0
//                 },
//                 {
//                         "_id" : 2,
//                         "name" : "genique:12492",
//                         "health" : 1,
//                         "state" : 2,
//                         "stateStr" : "SECONDARY",
//                         "uptime" : 629607,
//                         "optime" : Timestamp(1404443997, 1),
//                         "optimeDate" : ISODate("2014-07-04T03:19:57Z"),
//                         "lastHeartbeat" : ISODate("2014-10-17T06:49:24Z"),
//                         "lastHeartbeatRecv" : ISODate("2014-10-17T06:49:26Z"),
//                         "pingMs" : 0,
//                         "syncingTo" : "genique:12490",
//+                        "repllag" : 0,
//+                        "repllagHrs" : 0
//                 }
//         ],
//         "ok" : 1
// }


rs.status = function () {
	var s = db._adminCommand("replSetGetStatus");
	if (s && s.members) {
		var latest_optime = s.members.filter(function (x) { return x.optime; })
		                             .map(function (x) { return x.optime.getTime(); } )
		                             .sort().reverse()[0];
		s.members.map(function (x) {
			if (x.optime) {
				x.repllag = latest_optime - x.optime.getTime();
				x.repllagHrs = x.repllag / (60 * 60);
			}
		} );
	}
	return s;
}


