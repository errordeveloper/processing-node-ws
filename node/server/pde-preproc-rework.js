/* BEGIN REQUIRE */

var HTTP = require ('http'),
    DOM = require ('jsdom'),
    FS = require ('fs'),
    EV = require ('events');

var Uglify = require ('uglify-js');


var System = require ('sys');

var Parser = require ('./conf-parser.js');

var Events = new EV.EventEmitter();

var opts = require ('optimist')

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

/* END REQUIRE */

/* BEGIN GLOBALS */
var sketch_skel = { /* BEGIN PROTOTYPE OBJECT */

  /* Will be hardcode anyway, just have canvas_name here!
  sketch_head : '<script type=\"application/processing\" '
		  + 'data-processing-target=\"'+opts.canvas_name+'\">\n\n',
		  */

  canvas_name : 'myNewCanvas',
  sketch_name : 'myNewSketch',

  /* TODO: These are Processing Java libraries! */
  sketch_libs: [],
  /* These are any JavaScript libraries you may need */
  script_libs: [
    'http://haptic-data.com/toxiclibsjs/build/toxiclibs.js'
    ],

  /* You probably won't need to redefine this! */
  normal_head : '<!DOCTYPE html><html><head>'
              + '<title>Processing Node</title>'
              ,

  normal_body: "</head><body>",
  normal_tail: "</body></html>",
  /* We may add change_{head,body,tail} too. */

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
               + '}\n-->\n</script>'
               ,

  /* The canvas_name will need to be hardcoded also in here ;(*/
  ammend_body : '<input type=\"text\" id=\"inputtext\"/>'//</input>'
               + '<button onclick=\"drawSomeText(\''+opts.canvas_name+'\')\">'
	       + '</button>'
	       ,

}; /* END OF PROTOTYPE OBJECT */

var head = '', tail = '', fake = '';

// var script = '';

var pjs_library = 'http://processingjs.org/content/download/'
                + 'processing-js-'+opts.pjs_version
                + '/processing-'+opts.pjs_version+'.min.js';

var pjs_include = '<script type=\"text/javascript\" '
                + 'src=\"'+pjs_library+'\"></script>';

var sketch_stat = ''; // It's the easies way, but I don't see other way!

/* END GLOBALS */

/* BEGIN FUNCTIONS */

var canvas_name = 'blank',
    sketch_name = 'blank';

function Config(conf) {

  System.debug(("conf = " + System.inspect(conf)));

  canvas_name = opts.canvas_name || conf.canvas_name,
  sketch_name = opts.sketch_name || conf.sketch_name;

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
       + ammend_head
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


  fake = head + sketch_head + tail;
  head += script_head;

  Events.emit('loadedConfig', {head: head, tail: tail});

} /* Config */


function Cacher(sketch_body) {
  System.debug(arguments.callee.name + ' has been called!')
  DOM.env(fake, [pjs_library], function (dom_err, window) {
    if ( dom_err ) {
      console.error("jsdom_err:\n" + System.inspect(dom_err));
      throw _err;
    } else {
      // This is probably quicker this way, never mind we are in the
      // context already .. alternatives should be tested sometime :)
      script = window.Processing.compile(String(sketch_body)).sourceCode;
      var splice = script.split('\n');
      // In theory sketch_name may be still 'blank' here, however it should
      // never happen since Cacher() normaly takes longer to excute then Conf()
      script = 'var '+sketch_name+' = ' +splice.slice(1,splice.length).join('\n');

      //console.log('Read:\n'+Dumper(script));
      script = Uglify.parser.parse(String(script));
      //console.log('Parsed:\n'+Dumper(script));
      script = Uglify.uglify.ast_squeeze(script);
      //console.log('Squeezed:\n'+Dumper(script));
      script = Uglify.uglify.gen_code(script);
      //console.log('Compressed:\n'+Dumper(script));

      System.debug(script);
      // Perhaps one may wish to place Linter() here also :)
      Events.emit('parsedSketch');
    }
  });
} /* Cacher */

function Reader() {
  System.debug(arguments.callee.name + ' has been called!')
  FS.readFile(opts.sketch_file, 'utf8', function (fs_err, sketch_body) {
    if ( fs_err ) {
      console.log('Error reading `' + opts.sketch_file + '`');
      throw fs_err;
    } else {
      if ( sketch_stat.constructor.name !== 'StatWatcher' ) {
        System.debug('This has to be done only once!');
        sketch_stat = FS.watchFile(opts.sketch_file,
        { persistent: true, interval: 50 }, function (c, p) {
          //System.debug('CURR: '+System.inspect(curr));
          //System.debug('PREV: '+System.inspect(prev));
          if ( c.mtime.getTime() !== p.mtime.getTime() )
	    Reader();
	  });
      }

      Cacher(sketch_body);
    }
  });
} /* Reader */

var Server = HTTP.createServer(function (request, response) {

    console.log('Serving request ...');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    System.debug(System.inspect(head));
    // TODO: Wait for 'loadedConfig' ...
    response.write(head, 'utf-8');
    // TODO: Wait for 'parsedSketch' ...
    //console.log(System.inspect(script));
    //response.write(script, 'utf-8');
    response.end(tail, 'utf-8');

  });

/* END FUNCTIONS */

/* BEGIN EVENT HANDLERS */

Events.on('parsedSketch', function () {
  console.log('Sketch parsed!');
  });


Events.on('loadedConfig', function (struct) {
  System.debug("head = \n" + struct.head);
  System.debug("tail = \n" + struct.tail);
  });

/* END EVENT HANDLERS */

Parser.async(opts.config_file, sketch_skel, Config);
//Config(sketch_skel); // This will take the input from Parser!

Reader();

Server.listen(opts.server_port);
