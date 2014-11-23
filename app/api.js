var express = require('express');

function listen (port) {
	var app = express();

	port = port || 2048;

	var server = app.listen(port, function () {

		console.log("Localijse API listening on http://%s:%s", server.address().address, port);
	});
}

exports.listen = listen;