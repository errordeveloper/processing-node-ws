var http = require('http');
var sys = require('sys');
var fs = require('fs');

var opt = require('optimist')

  .options('sketch_file',
      { describe: 'path to the sketch file to serve',
        alias: [ 'f', 'file' ],
        demand: true })

  .options('server_port',
      { describe: 'port number to listen on',
        alias: [ 'p', 'port'],
        default: 8080 })

  .options('sketch_name',
      { describe: 'name of your sketch function',
        alias: [ 'S' ],
        default: 'mySketch' })

  .options('canvas_name',
      { describe: 'name of your canvas identity',
        alias: [ 'C' ],
        default: 'myCanvas' })

  .options('pjs_version',
      { describe: 'version of Processing.js to use',
        alias: [ 'V' ],
        default: '1.3.0' })

  .usage('Usage: $0')
  .argv;

//var pjs_library = '/opt/devel/src/work/node.git/import/processing/processing.js';


var pjs_library = 'http://processingjs.org/content/download/'
                + 'processing-js-'+opt.pjs_version
                + '/processing-'+opt.pjs_version+'.js'

var pjs_include = '<script type=\"text/javascript\"'
                + 'src=\"'+pjs_library+'\"></script>';

var lib_include = ''; /* "Safe & Easy" */

/*
if (opt.jssource) {
  lib_include += '<script type=\"text/javascript\" src=\"'
              +  opt.jslibfile
              +  '\"></script>';
}

if (opt.toxiclib) {
  lib_include += '<script type=\"text/javascript\" src=\"'
              +  'http://haptic-data.com/toxiclibsjs/build/toxiclibs.js'
              +  '\"></script>';
}
*/

// TODO: if we get a JSON config for these things, then it
//       should probably point to separate files really :)
//       OR we can use ejs templates or something similar!
//       there would be default head/tail template vars etc.

sys.puts(sys.inspect(opt));

var sketch_head = '<script type=\"application/processing\"'
                + 'data-processing-target=\"'+opt.canvas_name+'\">\n\n';

var script_head = '<script type=\"text/javascript\">\n<!--\n';

var ammend_head = script_head
                + 'function drawSomeText(id) {'
                + '  var pjs = Processing.getInstanceById(id);'
                + '  var text = document.getElementById(\'inputtext\').value;'
                + '  pjs.drawText(text);'
                + '}\n-->\n</script>';

var ammend_body = '<input type=\"textfield\" id=\"inputtext\"/>'
                + '<button onclick=\"drawSomeText(\''+opt.canvas_name+'\')\"/>'



var head = '<!DOCTYPE html>'
         + '<html><head>'
         + pjs_include
         + lib_include
         + ammend_head
         + '</head><body>';

var tail = '\n-->\n</script>'
         + '<canvas id=\"'+opt.canvas_name+'\"></canvas>'
         + '<script type=\"text/javascript\">'
         + '\n<!--\n'
         + 'new Processing(document.getElementById(\''
         + opt.canvas_name+'\'), '+opt.sketch_name+');'
         + '\n-->\n</script>'
         + ammend_body
         + '</body></html>';


var canvas_fake = head + sketch_head + tail,
    canvas_head = head + script_head;

// TODO: add capability to
//       * read JSON config file
//       * pre-proc library code


var dom = require("jsdom").jsdom;

var script = '';

function parser(sketch_body) {
  dom.env(canvas_fake, [pjs_library], function (dom_err, window) {
    if ( dom_err ) {
      console.error("jsdom_err:\n" + sys.inspect(dom_err));
      throw _err;
    } else {
      // This is probably quicker this way, never mind we are in the
      // context already .. alternatives should be tested sometime :)
      script = window.Processing.compile(String(sketch_body)).sourceCode;
      var splice = script.split('\n');
      script = 'var '+opt.sketch_name+' = ' +splice.slice(1,splice.length).join('\n');
      sys.puts(script);
    }
  });
}

parser(fs.readFileSync(opt.sketch_file, 'utf8'));

sys.puts(script);

fs.watchFile(opt.sketch_file, { persistent: true, interval: 50 }, function (curr, prev) {
  //console.log('the current mtime is: ' + curr.mtime);
  //console.log(sys.inspect(curr));
  //console.log('the previous mtime was: ' + prev.mtime);
  //console.log(sys.inspect(prev));
  if ( curr.mtime !== prev.mtime ) {
    console.log('Will re-read `' + opt.sketch_file + '`');
    fs.readFile(opt.sketch_file, 'utf8', function (fs_err, sketch_body) {
      if ( fs_err ) {
        console.log('Error reading `' + opt.sketch_file + '`');
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

}).listen(opt.server_port);

console.log('Server running at http://127.0.0.1:' + opt.server_port);
