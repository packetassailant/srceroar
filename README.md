# srceroar

## Objective
```
Srceroar, pronounced Sorcerer, is a NodeJS application that is a somewhat different way of creating wordlists. Specifically, srceroar uses archives obtained from various locations, such as sourceforge and git repositories, in order to build custom wordlists. The wordlists are comprised of only those unique words found in the archive source bundle (e.g., directory paths and file names). 

This allows a security pen tester to leverage this utility as a means to attack an application that they may have very limited prior knownledge. For instance, a penetration test might identify an open-source content management system (CMS) but might be a relatively new project, or the penetration tester has noted that the CMS has been installed in non standard build locations. The pen tester can then use the srceroar tool to download the CMS source code and generate a custom wordlist necessary to explore the runtime application. 

As of now, this utility only accomodates downloading and wordlist generation. It is up to the penetration tester to use this wordlist in conjunction with an automated exploration tool. The following tools are commonly used for wordlist based attacks in similar situations:

1. Burp Suite Intruder
2. Dirbuster
3. Dirb
```


## Usage
```
$ node srceroar.js -h 
Create wordlists from source code archives (e.g., src-tarball.tar.gz).    	
Usage: node ./srceroar.js (-i archive || -u download-url) -o wordlist-output-file

Options: <br>
  -h, --help     Show Usage and opts (i.e., this list of opt/args)                                      
  -i, --infile   Input archive file                                                                     
  -o, --outfile  Output wordlist file                                                                   
  -u, --url      Input archive download URL (e.g., http://nodejs.org/dist/v0.10.12/node-v0.10.12.tar.gz) 
  -g, --gitrepo  Input git repo to clone 

Note: Srceroar will clean up after itself by recursively deleting the temporary download directory (e.g., /tmp/cdhimt2c6) 
```

## Installation 
```
Srceroar was developed and tested on OSX ML <br>
 ----------- OSX --------------- <br>
git clone https://github.com/packetassailant/srceroar.git <br>
cd srceroar <br>
sudo npm install //this will install npm dependent modules in the local ./node_modules directory <br>

Note: The nodegit module requires cmake in order to build the native C implementation of git (this is not a wrapper for git). It is advised that you leverage the operating system's package management system to install cmake to a location that is available within the path. For instance, macports has a cmake binary and will automagically install within /opt/local/bin.
```

## Sample Run
```
$ node srceroar.js -g https://github.com/nodegit/nodegit.git -o /tmp/test.out <br>
info: Downloading the nodegit GIT repo to: /tmp/cdhimt2c6 <br>
info: Finished downloading nodegit to: /tmp/cdhimt2c6 <br>
info: Processing directory contents of: /tmp/cdhimt2c6 <br>
info: Creating wordlist file: /tmp/test.out <br>
info: Finished creating wordlist file: /tmp/test.out <br>
```

## Developing
Alpha code under active development




