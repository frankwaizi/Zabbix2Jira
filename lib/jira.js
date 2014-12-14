var requestModule = require('request');

/*
* JIRA 类
* method list
*
* queryIssue(user, callback); //查询JIRA issue，目前是实现查询某一个人
* 
* issueMeta（callback）; //获取创建JIRA issue必须的meatadata
* 
* createIssue(issue, callback);//创建JIRA issue
* 
*
*/
var JIRA = function (url, username, password){
	this.apiUrl = url;

	//签名验证
	var auth = new Buffer(username+":"+password).toString('base64');

	this.reqBody = {
		json: true,
		followAllRedirects : true,
		headers : {
			"Authorization" : "Basic " + auth,
			"Content-Type" : "application/json"}
	};

	this.request = requestModule;
}

//查询issue
JIRA.prototype.queryIssue = function(user, callback){
	console.log("---------------queryIssue-----------------");
	
	var that = this;

	that.reqBody.url = this.apiUrl + "api/latest/search?jql=assignee="+user+"+order+by+duedate";
	that.reqBody.method = "GET";

	that.request(that.reqBody, function(err, res, result){
		console.log("res----"+res.statusCode);
		if (!err && res.statusCode == 200 || res.statusCode) {
			callback(null, res, result.issues);
		}
		else{
			console.log("err------"+err);
			console.log("res----"+res.statusCode);
			callback(err, res, result);
		}
	});
}


//获取创建issue metadata
JIRA.prototype.issueMeta = function(callback){
	console.log("---------------issueMeta-----------------");
	
	var that = this;

	that.reqBody.url = this.apiUrl + "api/latest/issue/createmeta";
	that.reqBody.method = "GET";
	
	that.request(that.reqBody, function(err, res, result){
		console.log("res----"+res.statusCode);
		if (!err && res.statusCode == 200 || res.statusCode) {
			callback(null, res, result);
		}
		else{
			console.log("error--"+err);
			console.log("res----"+res.statusCode);
			callback(err, res, result);
		}
	});
}
//创建issue
JIRA.prototype.createIssue = function(msg, callback){
	console.log("---------------createIssue-----------------");
	
	var that = this;

	that.reqBody.url = this.apiUrl + "api/latest/issue";
	that.reqBody.method = "POST";

	that.reqBody.body = JSON.stringify(msg.issue);

	that.request(that.reqBody, function(err, res, result){
		console.log("res----"+res.statusCode);
		if (!err && (res.statusCode == 200 || res.statusCode)) {
			console.log("Create JIRA issue successfully!");
			result.eventid = msg.eventid;
			callback(null, res, result);
		}
		else{
			console.log("err------"+err);
			console.log("res----"+res.statusCode);
			callback(err, res, result);
		}
	});
}

//关闭issue
JIRA.prototype.closeIssue = function(msg, callback){
	console.log("---------------closeIssue "+msg.issuekey+"-----------------");
	
	var that = this;

	that.reqBody.url = this.apiUrl + "api/latest/issue/"+msg.issuekey+"/transitions";
	that.reqBody.method = "POST";

	that.reqBody.body = JSON.stringify(msg.transition);

	that.request(that.reqBody, function(err, res, result){
		console.log("res----"+res.statusCode);
		if (!err && (res.statusCode == 200 || res.statusCode)) {
			console.log("Close Jira Issue "+msg.issuekey+" successfully!");
			callback(null, res, msg.eventid);
		}
		else{
			console.log("err------"+err);
			callback(err, res, result);
		}
	});
}

//获取transition
JIRA.prototype.getTransition = function(issueid, callback){
	console.log("---------------getTransition of "+issueid+"-----------------");
	
	var that = this;

	that.reqBody.url = this.apiUrl + "api/latest/issue/"+issueid+"/transitions";
	that.reqBody.method = "GET";

	//that.reqBody.body = JSON.stringify(issue);

	that.request(that.reqBody, function(err, res, result){
		console.log("res----"+res.statusCode);
		if (!err && (res.statusCode == 200 || res.statusCode)) {
			callback(null, res, result);
		}
		else{
			console.log("err------"+err);
			console.log("res----"+res.statusCode);
			callback(err, res, result);
		}
	});
}

module.exports = JIRA;