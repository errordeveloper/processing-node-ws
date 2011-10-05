var sys = require('sys'),
    fs = require('fs');

var config_file = process.argv[2];

var config_data = JSON.parse(fs.readFileSync(config_file));

console.log('=> config_data:\n'+sys.inspect(config_data));

// This is the object prototype:
var sketch_skel = {
  libraries: [1,2,3],
  head: "<html><head></head>",
  body: "<body>",
  tail: "</body></html>",
  func: function() { do_something(); }
};


console.log('=> sketch_skel:\n'+sys.inspect(sketch_skel));

var sketch_conf = {};

function check(conf, skel, log, use) {
  if(conf) { // if(typeof(conf) === typeof(skel)
    if (conf.constructor === skel.constructor) {
      console.log(log + ' is OK.');
      use(conf);
    } else {
      console.log(log + ' is wrong type!\n\t'
         +' I expected '
         + skel.constructor.name + ','
         +' but encoutered '
         + conf.constructor.name + '!\n\t'
         +' Applying default setting.');
      use(skel);
    }
  } else {
    console.log(log + ' is undefined!\n\t'
       +' Applying default setting.');
    use(skel);
  }
}

function parse(conf, skel) {

  for(e in sketch_skel) {
    //console.log('sketch_skel['+e+'] = ' + sketch_skel[e] + ' (' +typeof(sketch_skel[e])+')');
    //console.log('config_data['+e+'] = ' + config_data[e] + ' (' +typeof(config_data[e])+')');
    check(conf[e], skel[e], 'Checking field ['+e+']',
       function(use){ sketch_conf[e] = use; });
  }
}

parse(config_data, sketch_skel);
console.log('=> sketch_conf:\n'+sys.inspect(sketch_conf));

if (! 'test' in config_data ) {
  console.log("If it was a book, I'd call it \"OMG, Test Failed!\"");
}
