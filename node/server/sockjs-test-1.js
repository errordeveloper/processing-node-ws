var http = require('http');
var sockjs = require('sockjs');

var sockjs_opts = {
  sockjs_url: "http://sockjs.github.com/sockjs-client/sockjs-latest.min.js"
};

var sjs = new sockjs.Server(sockjs_opts);
sjs.on('connection', function(conn) {
    conn.on('message', function(message) {
        conn.send(message);
    });
    conn.on('close', function() {});
});

var server = http.createServer();
server.addListener('request', function(req, res) {
    res.writeHead(404);
    res.end('404 not found');
});
server.addListener('upgrade', function(req, con) {
    con.end();
});

sjs.installHandlers(server, {prefix:'[/]echo[/]test'});

server.listen(9999, '0.0.0.0');
