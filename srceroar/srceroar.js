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

var git = require('nodegit');
var fs = require('fs-extra');
var http = require('http');
var path = require('path');
var rimraf = require('rimraf');
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
    	.alias('g', 'gitrepo')   			
    	.describe('h', 'Show Usage and opts (i.e., this list of opt/args)')
    	.describe('i', 'Input archive file')
    	.describe('o', 'Output wordlist file')
    	.describe('u', 'Input archive download URL (e.g., http://nodejs.org/dist/v0.10.12/node-v0.10.12.tar.gz)')
    	.describe('g', 'Input git repo to clone');


function PathObj(inputfile, gitrepourl, downloadurl, outputfile, flag) { 
	this.inputfile = inputfile;
	this.gitrepourl = gitrepourl;
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
	if (flag === "gitflag" && pathentry) {
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
		winston.info("Downloading " + fileName + " to: " + tmppath);
		
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
		    	winston.info("Finished downloading " + fileName + " to: " + tmppath);
		    	
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
	} else if (pathinst['flag'] === 'gitflag') { 
		cloneGitRepo(pathinst, recurseDirectory);
	}
}

function cloneGitRepo(pathinst, callback){
	var parseurl = url.parse(pathinst['gitrepourl']);
	var fileName = parseurl.path.substr(parseurl.path.lastIndexOf('/')).replace(/^\//g, '').replace(/\.git/, '');
	winston.info("Downloading the " + fileName + " GIT repo to: " + pathinst['tmpdir']);
	git.Repo.clone(pathinst['gitrepourl'], pathinst['tmpdir'], null, function(error) {
		if (error) throw error;
		if (typeof(callback) === "function") {
			winston.info("Finished downloading " + fileName + " to: " + pathinst['tmpdir']);
			return callback(pathinst, parsePathArray);
		} 
	});
};

function recurseDirectory(pathinst, callback) {
	winston.info("Processing directory contents of: " + pathinst['tmpdir']);
	var patharr = [];
	var finder = require('findit2').find(pathinst['tmpdir']);
	finder.on('path', function(file, stat) {
		patharr.push(file);
	});
	finder.on('end', function(err) {
		if (err) {
			winston.info('Caught exception: ' + err);
		} else {
			return callback(null, pathinst, patharr, createOutputFile);
		}
	});
};

function parsePathArray(err, pathinst, patharr, callback) {
	var wordarr = [];
	if (err) {
		winston.info('Caught exception: ' + err);
	} else {
		patharr.forEach(function(item) {
			if (patharr.indexOf('/')) {
				var a = item.split('/');
				wordarr.push.apply(wordarr, a);
			} else if (patharr.indexOf('\\')) {
				var a = item.split('\\');
				wordarr.push.apply(wordarr, a);
			}
		});
		wordarr = wordarr.filter(function(n) {
			return n; 
		});
		var unique = function(wordarr) {
			var newArr = [],
			origLen = wordarr.length,
			found,
			x, y;
          
		    for ( x = 0; x < origLen; x++ ) {  
		        found = undefined;  
		        for ( y = 0; y < newArr.length; y++ ) {  
		            if ( wordarr[x] === newArr[y] ) {   
		              found = true;  
		              break;  
		            }  
		        }  
		        if ( !found) newArr.push( wordarr[x] );
		    } 
		    return newArr; 
   		}
   		return callback(null, pathinst, unique(wordarr));
   	}
}

function createOutputFile(err, pathinst, wordarr) {	
	if (err) {
		winston.info('Caught exception: ' + err);
	} else {
		winston.info("Creating wordlist file: " + pathinst['outputfile']);

		var file = fs.createWriteStream(pathinst['outputfile']);
		file.on('error', function(err) { 
			winston.info('Caught exception: ' + err); 
		});
		wordarr.forEach(function(word) { 
			file.write(word  + '\n'); 
		});
		winston.info("Finished creating wordlist file: " + pathinst['outputfile']);		
		rimraf(pathinst['tmpdir'], function(err) {
			if (err) {
				winston.info('Caught exception: ' + err);
			}
		})
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

function main() {
	var argv = optimist.argv;

	if (argv.help) {
		optimist.showHelp();
		process.exit(code=0);
	}

	if (argv.infile && argv.url) {
	    winston.info('Error! --infile and --url are mutually exclusive\n');
	    optimist.showHelp();
	    process.exit(code=0);
	}

	if (argv.url && argv.gitrepo) {
		winston.info('Error! --url and --gitrepo are mutually exclusive\n')
		optimist.showHelp();
		process.exit(code=0);
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

	if (argv.gitrepo) {
		var gitflag = "gitflag";
		if (validatePath(gitflag, argv.gitrepo) !== undefined) {
			var grepo = validatePath(gitflag, argv.gitrepo);
			var flag = "gitflag";
		} else {
			var grepo = undefined;
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

	var pathinst = new PathObj(infile, grepo, dlurl, outfile, flag);
	processArchive(pathinst);

	process.on( "SIGINT", function() {
		winston.info('CLOSING [SIGINT]');
		process.exit();
	});
}

if(require.main === module) {
	main();
}
