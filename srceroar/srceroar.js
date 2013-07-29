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

var fs = require('fs');
var tarball = require('tarball-extract');
var http = require('http');
var https = require('https');
var url = require('url');
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


function PathObj() { }
PathObj.prototype = {
  	setinputfile: function (inputfile) {
  		this.inputfile = inputfile;
  		console.log(this.inputfile);
		//extractArchive(this.inputfile);
		//return this.inputfile;
	},
	setoutputfile: function (outputfile) {
		this.outputfile = outputfile;
		console.log(this.outputfile);
		//createOutFile(this.outputfile);
		//return this.outputfile;
	},
	setdownloadurl: function (downloadurl) {
		this.downloadurl = downloadurl;
		console.log(this.downloadurl);
		//downloadArchive(this.flag, this.downloadurl, extractArchive);
		//return this.downloadurl;
	},
	settmpdirectory: function () {
		this.tmppath = '/tmp/' + Math.random().toString(36).substr(2,9);
		//return this.tmppath;
	}
};

function validatePath(flag, pathentry, callback) {
	var pdtmp = pathentry;
	var urlregex = /^http/;
	if (flag === "urlflag" && urlregex.test(pdtmp)) {
		if (typeof callback === "function") {
			return callback(pdtmp);
		}
	}
	if (flag === "inflag" && pathentry) {
		fs.stat(pdtmp, function(err, stats) {
			if (err) {
				throw err;
			}
			if (stats.isFile) {
				if (typeof callback === "function") {
					return callback(pdtmp);
				}
			}
		});
	}
	if (flag === "outflag") {
		fs.exists(pathentry, function(pathentry) {
			if (pathentry === true) {
				if (typeof callback === "function") {
					return callback(pdtmp);
				}
			}
		});
	}
}

function createOutFile(outputFile) {
	fs.writeFile(outputFile, { overwrite: false }, function (err) {
		if(err) {
	        console.log("The filepath %s apparently already exists!", outputFile);
	        process.exit(0);
	    } else {
	        console.log("The output filepath %s was created!", outputFile);
	    }
	});
}

function downloadArchive(flag, urlFile, callback){
	if (flag === "urlflag"){
		var parseurl = url.parse(urlFile);
		var fileName = parseurl.path.substr(parseurl.path.lastIndexOf('/')).replace(/^\//g, '');
		
		var headers = {
				"accept-charset" : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
				"accept-language" : "en-US,en;q=0.8",
				"accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"user-agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:21.0) Gecko/20100101 Firefox/21.0",
				"accept-encoding" : "gzip,deflate"
		};
				 
		var options = {
			    host: parseurl.host,
			    port: parseurl.port,
			    path: parseurl.path,
			    headers: headers
		};
		
		function urlstream(response) {
			var contentLength = parseInt(response.headers['content-length'], 10);
			console.log("Downloading " + fileName);
			
			if (contentLength) {
				var dlprogress = 0;
			    var count = 0;
			    var pace = require('pace')({total: contentLength, maxBurden: 10});
			    
			    var downloadfile = fs.createWriteStream(fileName, {'flags': 'w'});
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
			    	console.log("Finished downloading " + fileName);
			    	
			    	if (typeof callback === "function") {
						return callback(fileName);
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
}

function extractArchive(archiveFile) {
	if (archiveFile.match(/\.tar|tgz/)) {
		tarball.extractTarball(archiveFile, '/tmp/' + fileuuid, function(err){
			if (err) {
				throw err;
			} else {
				recurseDirectory("test");
			}
		})
	} else {
		console.log("The file %s contains an unsupported extension!", archiveFile);
		process.exit(0);
	}	
}

function recurseDirectory(inFile) {
	console.log("this is a recurse test of: %s", inFile);
}

function main() {
	var argv = optimist.argv;
	var pathinst = new PathObj();

	if (argv.help) {
		optimist.showHelp();
	}

	if (argv.infile && argv.url) {
	    console.info('Error! --infile and --url are mutually exclusive\n');
	    optimist.showHelp();
	}

	if (argv.infile) {
		var inflag = "inflag";
		pathinst.settmpdirectory();
		validatePath(inflag, argv.infile, pathinst.setinputfile);
	}

	if (argv.url) {
		var urlflag = "urlflag";
		pathinst.settmpdirectory();
		validatePath(urlflag, argv.url, pathinst.setdownloadurl);
	}

	if (argv.outfile) {
		var outflag = "outflag";
		validatePath(outflag, argv.outfile, pathinst.setoutputfile);
	}

	process.on( "SIGINT", function() {
		console.log('CLOSING [SIGINT]');
		process.exit();
	});
}

if(require.main === module) {
	main();
}
