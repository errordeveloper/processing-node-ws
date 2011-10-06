
var http = require('http');
var sys = require('sys');
var fs = require('fs');

var par = require('./conf-parser.js');

var opt = require('optimist')

  .options('server_port',
      { describe: 'port number to listen on',
        alias: [ 'p', 'port'],
        default: 8080 })

  .options('sketch_file',
      { describe: 'path to the sketch file to serve',
        alias: [ 'f', 'file' ],
        demand: true })


  .options('config_file',
      { describe: 'JSON config file for this sketch',
        alias: ['c', 'conf' ],
        demand: true })

  .options('sketch_name', // may be set in config?
      { describe: 'name of your sketch function',
        alias: [ 'S' ] })

  .options('canvas_name', // may be set in config?
      { describe: 'name of your canvas identity',
        alias: [ 'C' ] })

  .options('pjs_version', // CLI override?
      { describe: 'version of Processing.js to use',
        alias: [ 'V' ],
        default: '1.3.0' })

  .usage('Usage: $0')
  .argv;

//var pjs_library = '/opt/devel/src/work/node.git/import/processing/processing.js';

// This is the object prototype:
var sketch_skel = {

  /* TODO: These are Processing Java libraries! */
  sketch_libs: [],
  /* These are any JavaScript libraries you may need */
  script_libs: [
    'http://haptic-data.com/toxiclibsjs/build/toxiclibs.js'
    ],

  /* You probably won't need to redefine this! */
  normal_head : '<!DOCTYPE html><html><head>',
  normal_body: "<body>",
  normal_tail: "</body></html>",
  /* We may add change_{head,body,tail} too. */

  /* Will be hardcode anyway, just have canvas_name here!
  sketch_head : '<script type=\"application/processing\" '
                  + 'data-processing-target=\"'+opt.canvas_name+'\">\n\n',
                  */

  canvas_name : 'myNewCanvas',
  sketch_name : 'myNewSketch',

  /* One may wish to set this if they really want to use
   * CoffeeScript for example ... the also add it libs */
  //script_head : '<script type=\"text/javascript\">\n<!--\n',

  /* TODO: This proto object should have only empty strings
   *       for ammend_head and ammend_body. */

  /* Notice that inputtext is hardcoded here and in HTML too. */
  ammend_head :  'function drawSomeText(id) {'
               + '  var pjs = Processing.getInstanceById(id);'
               + '  var text = document.getElementById(\'inputtext\').value;'
               + '  pjs.drawText(text);'
               + '}\n-->\n</script>',

  /* The canvas_name will need to be hardcoded also in here ;(*/
  ammend_body : '<input type=\"textfield\" id=\"inputtext\"/>'
               + '<button onclick=\"drawSomeText(\''+opt.canvas_name+'\')\"/>'

} /* END OF PROTOTYPE OBJECT */

var head = new String(),
    tail = new String();

var pjs_library = 'http://processingjs.org/content/download/'
                + 'processing-js-'+opt.pjs_version
                + '/processing-'+opt.pjs_version+'.js'

var pjs_include = '<script type=\"text/javascript\"'
                + 'src=\"'+pjs_library+'\"></script>';

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


function Config(conf) {

  sys.puts(("conf = " + sys.inspect(conf)));

  var canvas_name = opt.canvas_name || conf.canvas_name,
      sketch_name = opt.sketch_name || conf.sketch_name;

  var sketch_head = '<script type=\"application/processing\" '
                  + 'data-processing-target=\"'+canvas_name+'\">\n\n';

  /* XXX: Is it needed really ?? */
  var script_head = '<script type=\"text/javascript\">\n<!--\n';

  var ammend_head = script_head + conf.ammend_head;

  /* TODO: Read conf.script_libs and put each here. */
  var lib_include = '';

  head = conf.normal_head
       + pjs_include
       + lib_include
       + conf.ammend_head
       + conf.normal_body
       ;

  tail = '\n-->\n</script>'
       + '<canvas id=\"'+canvas_name+'\"></canvas>'
       + '<script type=\"text/javascript\">'
       + '\n<!--\n'
       + 'new Processing(document.getElementById(\''
       + canvas_name+'\'), '+sketch_name+');'
       + '\n-->\n</script>'
       + conf.ammend_body
       + conf.normal_tail
       ;


  var fake = head + sketch_head + tail,
      head = head + script_head;

  sys.puts(("head = \n" + head));
  sys.puts(("tail = \n" + tail));

}

par.async(opt.config_file, sketch_skel, Config);

// TODO: add capability to
//       * compile Java library code

var dom = require("jsdom").jsdom;

var script = '';

function Cacher(sketch_body) {
  dom.env(fake, [pjs_library], function (dom_err, window) {
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

Cacher(fs.readFileSync(opt.sketch_file, 'utf8'));

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
        Cacher(sketch_body);
      }
    });
  }
});

http.createServer(function (request, response) {

  console.log('request starting...');
  while ( script === '' ) { // FIXME! // }
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(head, 'utf-8');
  //console.log(sys.inspect(script));
  response.write(script, 'utf-8');
  response.end(tail, 'utf-8');

}).listen(opt.server_port);

console.log('Server running at http://127.0.0.1:' + opt.server_port);
