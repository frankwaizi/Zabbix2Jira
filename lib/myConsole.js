var cacheService = require('./cacheService');

var MyConsole = function() {
	this.logPath = "/log/log.txt";
}

MyConsole.prototype.log = function(msg){
	var self = this;
	console.log(msg);
	cacheService.cache("a", self.logPath, msg);
}

module.exports = new MyConsole();