# srceroar

## Objective
Srceroar, pronounced Sorcerer, is a somewhat different way of creating wordlists. Specifically, srceroar uses archives obtained from various locations, such as sourceforge and git repositories, in order to build custom wordlists. The wordlists are comprised of only those unique words found in the archive source bundle (e.g., directory paths and file names). 

This allows a security pen tester to leverage this utility as a means to attack an application that they may have very limited prior knownledge. For instance, a penetration test might identify an open-source content management system (CMS) but might be a relatively new project, or the penetration tester has noted that the CMS has been installed in non standard build locations. The pen tester can then use the srceroar tool to download the CMS source code and generate a custom wordlist necessary to explore the runtime application. 

As of now, this utility only accomodates downloading and wordlist generation. It is up to the penetration tester to use this wordlist in conjunction with an automated exploration tool. The following tools are commonly used for wordlist based attacks in similar situations:

1. Burp Suite Intruder
2. Dirbuster
3. Dirb


## Usage
$ node srceroar.js -h <br>
Create wordlists from source code archives (e.g., src-tarball.tar.gz).    	
Usage: node ./srceroar.js (-i archive || -u download-url) -o wordlist-output-file

Options:
  -h, --help     Show Usage and opts (i.e., this list of opt/args)                                      
  -i, --infile   Input archive file                                                                     
  -o, --outfile  Output wordlist file                                                                   
  -u, --url      Input archive download URL (e.g., http://nodejs.org/dist/v0.10.12/node-v0.10.12.tar.gz)
  -g, --gitrepo  Input git repo to clone 


## Developing
Currently under active development and soon to be completely fucntional.




