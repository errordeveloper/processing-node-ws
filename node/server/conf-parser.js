var sys = require('sys'),
    fs = require('fs');

var config_file = process.argv[2];

var config_data = JSON.parse(fs.readFileSync(config_file));

sys.puts('=> config_data:\n'+sys.inspect(config_data));

// This is the object prototype:
var sketch_skel = {
  libraries: [1,2,3],
  head: "<html><head></head>",
  body: "<body>",
  tail: "</body></html>"
}; // TODO: make it enumerable!

sys.puts('=> sketch_skel:\n'+sys.inspect(sketch_skel));

var sketch_conf = {};

function check(conf, skel, log, use) {
  if(skel.constructor === conf.constructor) {
    console.log(log + ' is OK.');
    use(conf);
  } else {
    console.log(log + ' is wrong type!'
       +' I expected '
       + skel.constructor.name + ','
       +' but encoutered '
       + conf.constructor.name + '!');
    use(skel);
  }
}

function parse(conf, skel) {

  var list = [ 'head', 'libraries', 'body', 'tail' ];

  list.forEach(function(e) {
    check(conf[e], skel[e], 'Checking setting ['+e+']',
       function(use){ sketch_conf[e] = use; });
  });
}

parse(config_data, sketch_skel);
sys.puts('=> sketch_conf:\n'+sys.inspect(sketch_conf));

if (! 'test' in config_data ) {
  console.log("If it was a book, I'd call it \"OMG, Test Failed!\"");
}
