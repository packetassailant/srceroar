/*
CODE:		SRCEROAR
AUTHOR:		Chris Patten
LANG:		NodeJS/JavaScript
EMAIL:		cpatten[t.a.]packetresearch.com
TWITTER:	packetassailant
 
FUNCTION:	Explode source code archives into a word-list comprised of unique words.
			This is useful for targeted attacks against open-source implementations.
EXAMPLE:	Locating privileged functionality in non-standard installs through forceful browsing. 
*/

var fs = require('fs-extra');
var http = require('http');
var path = require('path');
var tar = require('tar');
var url = require('url');
var wget = require('wget');
var winston = require('winston');
var zlib = require('zlib');
var optimist = require('optimist')
	.usage('Create wordlists from source code archives (e.g., src-tarball.tar.gz).\
    	\nUsage: $0 (-i archive || -u download-url) -o wordlist-output-file')
    	.alias('h', 'help')
    	.alias('i', 'infile')
    	.alias('o', 'outfile')
    	.alias('u', 'url')    			
    	.describe('h', 'Show Usage and opts (i.e., this list of opt/args)')
    	.describe('i', 'Input archive file')
    	.describe('o', 'Output wordlist file')
    	.describe('u', 'Input archive download URL (e.g., http://nodejs.org/dist/v0.10.12/node-v0.10.12.tar.gz)');


function PathObj(inputfile, downloadurl, outputfile, flag) { 
	this.inputfile = inputfile;
	this.outputfile = outputfile;
	this.downloadurl = downloadurl;
	this.tmpdir = fs.mkdirsSync('/tmp/' + Math.random().toString(36).substr(2,9));
	this.flag = flag;
}

function validatePath(flag, pathentry) {
	var urlregex = /^http/;
	if (flag === "urlflag" && urlregex.test(pathentry)) {
		return pathentry;
	}
	if (flag === "inflag" && pathentry) {
		return pathentry;
	}
	if (flag === "outflag") {
		return pathentry;
	}
}

function createOutFile(outputFile) {
	fs.writeFile(outputFile, { overwrite: false }, function (err) {
		if(err) {
	        winston.info("The filepath %s apparently already exists!", outputFile);
	        process.exit(0);
	    } else {
	        winston.info("The output filepath %s was created!", outputFile);
	    }
	});
}

function downloadArchive(pathinst, callback){
	var parseurl = url.parse(pathinst['downloadurl']);
	var fileName = parseurl.path.substr(parseurl.path.lastIndexOf('/')).replace(/^\//g, '');
	var tmppath = path.join(pathinst['tmpdir'] + '/' + fileName);

	var headers = {
		"accept-charset" : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
		"accept-language" : "en-US,en;q=0.8",
		"accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"user-agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20100101 Firefox/21.0",
		"accept-encoding" : "gzip,deflate"
	};
			 
	var options = {
	    hostname: parseurl.hostname,
	    port: parseurl.port,
	    path: parseurl.path,
	    headers: headers
	};
	
	function urlstream(response) {
		var contentLength = parseInt(response.headers['content-length'], 10);
		winston.info("Downloading file to: " + tmppath);
		
		if (contentLength) {
			var dlprogress = 0;
		    var count = 0;
		    var pace = require('pace')({total: contentLength, maxBurden: 10});
		    
		    var downloadfile = fs.createWriteStream(tmppath, {'flags': 'w'});
		    response.on('data', function (chunk) {
		    	dlprogress += chunk.length;
		    	while (count < dlprogress) {
		    		pace.op();
		    		count++;
		    	}
		    	downloadfile.write(chunk, encoding='binary');			    	
		    });
		    response.on("end", function() {		    	
		    	downloadfile.end();
		    	winston.info("Finished downloading " + fileName);
		    	
		    	if (typeof(callback) === "function") {
					return callback(tmppath, path.dirname(tmppath));
				} 
		    });
		    response.on('response', function(){
		    	if(!response.STATUS_CODES[200]){
		    		throw new Error('HTTP Response not 200');
		    	}
		    });			    
		}					
	}
	http.request(options, urlstream).end();	 
}

function processArchive(pathinst) {
	if (pathinst['flag'] === 'urlflag') {
		downloadArchive(pathinst, extractArchive);
	} else if ( pathinst['flag'] === 'inflag') {
		extractArchive(pathinst['inputfile'], pathinst['tmpdir']);
	}
}

function extractArchive(abspath, basedir) {
	if (abspath.match(/\.tar|tgz|gz/)) {
		winston.info("Extracting archive " + path.basename(abspath) + " to " + basedir)
		var count = 0;
		var gzip = fs.createReadStream(abspath).pipe(zlib.createGunzip()).pipe(tar.Extract({
			path: basedir}));
		gzip.on('end', function() {	
			gzip.end();
	    	winston.info('Finished extracting ' + path.basename(abspath));
	    });
	    gzip.on('error', function(er) { 
	    	winston.log('error', er);
	    });
	} else {
		winston.info("The file %s contains an unsupported extension!", archiveFile);
		process.exit(0);
	}
}

function recurseDirectory(fileName, tmppath) {
	winston.info("this is a recurse test of: %s and %s", fileName, tmppath);
}

function main() {
	var argv = optimist.argv;

	if (argv.help) {
		optimist.showHelp();
	}

	if (argv.infile && argv.url) {
	    winston.info('Error! --infile and --url are mutually exclusive\n');
	    optimist.showHelp();
	}

	if (argv.infile) {
		var inflag = "inflag";
		if (validatePath(inflag, argv.infile) !== undefined) {
			var infile = validatePath(inflag, path.resolve(argv.infile));
			var flag = "inflag";
		} else {
			var infile = undefined;
		}
	}

	if (argv.url) {
		var urlflag = "urlflag";
		if (validatePath(urlflag, argv.url) !== undefined) {
			var dlurl = validatePath(urlflag, argv.url);
			var flag = "urlflag";
		} else {
			var dlurl = undefined;
		}
	}

	if (argv.outfile) {
		var outflag = "outflag";
		if (validatePath(outflag, argv.outfile) !== undefined) {
			var outfile = validatePath(outflag, path.resolve(argv.outfile));
		} else {
			var outfile = undefined;
		}
	}

	var pathinst = new PathObj(infile, dlurl, outfile, flag);
	processArchive(pathinst);

	process.on( "SIGINT", function() {
		winston.info('CLOSING [SIGINT]');
		process.exit();
	});
}

if(require.main === module) {
	main();
}
