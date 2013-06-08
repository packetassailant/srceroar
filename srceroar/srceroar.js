/*
 CODE: SRCEROAR
 AUTHOR: Chris Patten
 LANG: Node.js/JavaScript
 EMAIL: cpatten[t.a.]packetresearch.com
 TWITTER: packetassailant
 
 FUNCTION: Explode source code archives into a word-list comprised of unique words.
 		   This is useful for targeted attacks against open-source implementations.
 		   Examples of use might be when deriving admin functionality through forceful browsing. 
 */
fs = require('fs');

var data = fs.readFileSync(filepath, 'utf-8');



