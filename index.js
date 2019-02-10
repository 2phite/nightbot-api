// Append timestamps to log messages
const moment = require("moment");
require("console-stamp")(console, {formatter: () => { return moment().utcOffset('+0800').format("YYYY-MM-DD HH:mm:ss ZZ"); }});

// Routing
var http = require('http');
var server = http.createServer(function(request, response) {
	// console.log(request);
	console.log("%s %s %s", request.method, request.headers.host, request.url);
	if (request.method == "GET" &&
		/^api\.majestic-moonmoon\.com$/i.test(request.headers.host) &&
		(url = /^\/*nightbot(\/.*)$/i.exec(request.url))
	) {
		response.writeHead(200, {"Content-Type": "text/plain"});
		response.end(nightbot(url[1]));
	} else {
		response.writeHead(404, {});
		response.end();
	}
});

// Start server
var port = process.env.PORT || 80;
server.listen(port);
console.log("Server running at http://localhost:%d", port);

// Global variables
var queue = {};

/*
 * General handler for Nightbot API requests
 * http://api.majestic-moonmoon.com/nightbot/$channel/$request
 */
function nightbot(url) {
	console.log("nightbot('%s')", url);

	if (match = /^\/([^\/]+)(\/.+)$/.exec(url)) {
		var channel = match[1];
		var request = match[2];
		cleanup(channel);
		if (arg = /^\/addmyign\/([^\/]+)\/(.+)$/i.exec(request))
			return addmyign(channel, arg[1], arg[2]);
		else if (arg = /^\/showmyign\/([^\/]+)$/i.exec(request))
			return showmyign(channel, arg[1]);
		else if (arg = /^\/whosnext\/(.*)$/i.exec(request))
			return whosnext(channel, arg[1]);
	}

	console.log("Invalid request");
	return ":bork:";
}

/*
 * Internal cleanup, remove expired entries
 */
function cleanup(channel) {
	console.log("cleanup('%s')", channel);

	const ttl = 5 * 60 * 1000; // Expires in 5 minutes
	const now = Date.now();

	if (!queue[channel]) queue[channel] = [];
	while (queue[channel].length > 0 && queue[channel][0].time + ttl < now) {
		var expired = queue[channel].shift();
		console.log(expired);
	}
}

/*
 * Anyone in chat who wants to be inspected, type !addmyign $ign
 * eg. http://api.majestic-moonmoon.com/nightbot/leewhat/addmyign/Majestic/MoonMoon
 * To add this custom command, enter the following:
 * Command: !addmyign
 * Message: $(urlfetch http://api.majestic-moonmoon.com/nightbot/$channel/addmyign/$(eval encodeURIComponent(`$(user)`))/$(eval encodeURIComponent(`$(1)`)))
 * Userlevel: Everyone
 */
function addmyign(channel, user, ign) {
	console.log("addmyign('%s', '%s', '%s')", channel, user, ign);

	// Already in queue
	for (i = 0; i < queue[channel].length; i++) {
		if (queue[channel][i].user == user) {
			queue[channel][i].ign = ign;
			return showmyign(channel, user);
		}
	}

	// Not in queue
	queue[channel].push({user: user, ign: ign, time: Date.now()});
	return showmyign(channel, user);
}

/*
 * Anyone in chat may check their queue position, type !showmyign
 * eg. http://api.majestic-moonmoon.com/nightbot/leewhat/showmyign/Majestic
 * To add this custom command, enter the following:
 * Command: !showmyign
 * Message: $(urlfetch http://api.majestic-moonmoon.com/nightbot/$channel/showmyign/$(eval encodeURIComponent(`$(user)`)))
 * Userlevel: Everyone
 */
function showmyign(channel, user) {
	console.log("showmyign('%s', '%s')", channel, user);

	var entry = null;
	var i = 0;
	for (i = 0; i < queue[channel].length; i++) {
		if (queue[channel][i].user == user) {
			entry = queue[channel][i];
			break;
		}
	}

	var str = "";
	if (entry && i == 0)
		str = `${user} (IGN: ${entry.ign}), you're up next!`;
	else if (entry)
		str = `${user} (IGN: ${entry.ign}), you're at position ${i+1}.`;
	else
		str = `${user}, you're not queued. Try !addmyign $ign`;

	str = decodeURIComponent(str);
	console.log("return '%s'", str);
	return str;
}

/*
 * Only moderators may check out and remove the frontmost entries, type !whosnext, or type !whosnext 3
 * eg. http://api.majestic-moonmoon.com/nightbot/leewhat/whosnext
 * eg. http://api.majestic-moonmoon.com/nightbot/leewhat/whosnext/3
 * To add this custom command, enter the following:
 * Command: !whosnext
 * Message: $(urlfetch http://api.majestic-moonmoon.com/nightbot/$channel/whosnext/$(eval encodeURIComponent(`$(1)`)))
 * Userlevel: Moderator
 */
function whosnext(channel, count) {
	console.log("whosnext('%s', '%s')", channel, count.toString());
	const countMax = 5;

	var str = "";
	if (isNaN(count) || count <= 0) count = 1;
	if (count > queue[channel].length) count = queue[channel].length;
	if (count > countMax) count = countMax;
	for (i = 0; i < count; i++) {
		var next = queue[channel].shift();
		if (str == "")
			str = "Next is ";
		else
			str += ", followed by ";
		str += `${next.user} (IGN: ${next.ign})`;
	}

	if (str == "") str = "Nobody in queue!";

	str = decodeURIComponent(str);
	console.log("return '%s'", str);
	return str;
}
