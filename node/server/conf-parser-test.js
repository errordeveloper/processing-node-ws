var sys = require('sys'),
    par = require('./conf-parser.js');

// This is the object prototype:
var sketch_skel = {
  libraries: [1,2,3],
  head: "<html><head></head>",
  body: "<body>",
  tail: "</body></html>",
  func: function() { do_something(); }
}

config_file = process.argv[2];

// I looks like the async method is
// faster and I did 10 consequtive
// test with redirecting the output
// of this test to a new file each
// time - when I diffed the files
// pair by pair, it appeared that
// the order of lines was the same!
// and the lines appeared out of
// oreder, of course!

par.parse(par.input(config_file), sketch_skel,
    function(x){
      console.error('=> parser.parse:\n'
        + sys.inspect(x));
    });

console.error('=> parser.usual:\n'
    + sys.inspect(par.usual(config_file, sketch_skel)));

par.async(config_file, sketch_skel,
    function(x){
      console.error('=> parser.async:\n'
        + sys.inspect(x));
    });
