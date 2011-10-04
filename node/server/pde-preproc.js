/* Usage: node serve-pde 8080 sketch.pde */

var http = require('http');
var sys = require('sys');
var fs = require('fs');

var ev = require('events');


// Untiill PJS gusy make their code packaged
// nicelly we will have to manually split the
// parser with its dependencies and just eval:
///var parser_source = './processing-parser.js';
///eval(fs.readFileSync(parser_source, 'utf8'));
// Some of the major issues when spliting out
// are a) s/udef/undefined/ b) window object
// needs to be emulated, hence

var pjs_version = 'http://processingjs.org/content/download/'
                + 'processing-js-1.3.0/processing-1.3.0.js';
//var pjs_version = '/opt/devel/src/work/node.git/import/processing/processing.js';
var pjs_include = '<script type=\"text/javascript\" src=\"'
                + pjs_version + '\"></script>';

/* To include a pre-processed library, just add this */
var lib_include = '<script type=\"text/javascript\" src=\"'
                + 'http://haptic-data.com/toxiclibsjs/build/toxiclibs.js'
                + '\"></script>';


var sketch_head = '<script type=\"application/processing\"'
                + 'data-processing-target=\"'+canvas_name+'\">\n\n';

var canvas_name = 'myCanvas',
    sketch_name = 'mySketch';

var script_head = '<script type=\"text/javascript\">\n<!--\n';

// TODO: if we get a JSON config for these things, then it
//       should probably point to separate files really :)
//       OR we can use ejs templates or something similar!
//       there would be default head/tail template vars etc.
var ammend_head = script_head
                + 'function drawSomeText(id) {'
                + '  var pjs = Processing.getInstanceById(id);'
                + '  var text = document.getElementById(\'inputtext\').value;'
                + '  pjs.drawText(text);'
                + '}\n-->\n</script>';

var ammend_body = '<input type=\"textfield\" id=\"inputtext\"/>'
                + '<button onclick=\"drawSomeText(\''+canvas_name+'\')\"/>'



var head = '<!DOCTYPE html>'
         + '<html><head>'
         + pjs_include
         + lib_include
         + ammend_head
         + '</head><body>';

var tail = '\n-->\n</script>'
         + '<canvas id=\"'+canvas_name+'\"></canvas>'
         + '<script type=\"text/javascript\">'
         + '\n<!--\n'
         + 'new Processing(document.getElementById(\''
         + canvas_name+'\'), '+sketch_name+');'
         + '\n-->\n</script>'
         + ammend_body
         + '</body></html>';


var canvas_fake = head + sketch_head + tail,
    canvas_head = head + script_head;

// TODO: add capability to
//       * read JSON config file
//       * pre-proc library code


var dom = require("jsdom").jsdom;

// TODO: require('optimist');
var server_port = process.argv[2];
var sketch_file = process.argv[3];

var script = '';

function parser(sketch_body) {
  dom.env(canvas_fake, [pjs_version], function (dom_err, window) {
    if ( dom_err ) {
      console.error("jsdom_err:\n" + sys.inspect(dom_err));
      throw _err;
    } else {
      // This is probably quicker this way, never mind we are in the
      // context already .. alternatives should be tested sometime :)
      script = window.Processing.compile(String(sketch_body)).sourceCode;
      var splice = script.split('\n');
      script = 'var '+sketch_name+' = ' +splice.slice(1,splice.length).join('\n');
      sys.puts(script);
    }
  });
}

parser(fs.readFileSync(sketch_file, 'utf8'));

sys.puts(script);

fs.watchFile(sketch_file, { persistent: true, interval: 50 }, function (curr, prev) {
  //console.log('the current mtime is: ' + curr.mtime);
  //console.log(sys.inspect(curr));
  //console.log('the previous mtime was: ' + prev.mtime);
  //console.log(sys.inspect(prev));
  if ( curr.mtime !== prev.mtime ) {
    console.log('Will re-read `' + sketch_file + '`');
    fs.readFile(sketch_file, 'utf8', function (fs_err, sketch_body) {
      if ( fs_err ) {
        console.log('Error reading `' + sketch_file + '`');
        throw fs_err;
      } else {
        parser(sketch_body);
      }
    });
  }
});

http.createServer(function (request, response) {

  console.log('request starting...');
  while ( script === '' ) { /* FIXME! */ }
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(canvas_head, 'utf-8');
  //console.log(sys.inspect(script));
  response.write(script, 'utf-8');
  response.end(tail, 'utf-8');

}).listen(server_port);

console.log('Server running at http://127.0.0.1:' + server_port);
