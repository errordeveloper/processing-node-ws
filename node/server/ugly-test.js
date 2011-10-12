var FS = require ('fs'),
    Uglify = require ('uglify-js'),
    Dumper = require ('util').inspect;

FS.readFile('pde-preproc-rework.js', function (error, script) {
  if ( error ) throw error;

  console.log('Read:\n'+Dumper(script));
  script = Uglify.parser.parse(String(script));
  console.log('Parsed:\n'+Dumper(script));
  script = Uglify.uglify.ast_squeeze(script);
  console.log('Squeezed:\n'+Dumper(script));
  script = Uglify.uglify.gen_code(script);
  console.log('Compressed:\n'+Dumper(script));


});
