var requestModule = require('request'),
	fs = require('fs'),
	xmlParser = require('xml2js').parseString;

//构造函数
/*

method list

getAlerts(action_id, time_from, callback);

*/
var Zabbix = function(url, username, password, proxy){
	this.username = username;
	this.password = password;

	this.data = {
		"jsonrpc" : "2.0",
		"method" : "",
		"params" : {},
		"id" : "1",
		"auth" : null
	};

	this.reqBody = {
		url: url,
		agentOptions: {
			ca: fs.readFileSync('./key/zabbix.cer')
		},
		method: 'POST',
		json: true,
		headers : {"Content-Type": "application/json"}
	};

	this.auth = "";

	if (proxy) {
		this.request = requestModule.defaults({ 'proxy': proxy });
	} else {
		this.request = requestModule;
	}
};

//身份认证
Zabbix.prototype.getAuth = function (callback){
	var that = this;

	console.log("-------------zabbix auth---------------");
	that.data.method = "user.login";

	var params = {};
	params.user = that.username;
	params.password = that.password;
	that.data.params = params;

	that.reqBody.body = JSON.stringify(that.data);

	that.request(that.reqBody, function(err, res, result){
		if (!err && res.statusCode == 200) {
			console.log(result);
			that.auth = result.result;
			callback(null, res, that.auth);
		}
	});
};

//预处理判断
Zabbix.prototype.preRequest = function (method, args) {
  var that = this;
  var callback = args[args.length - 1];
  if (that.auth) {
    method.apply(that, args);
  } else {
    that.getAuth(function (err, res, data) {
      // 如遇错误，通过回调函数传出
      if (err) {
        callback(err, res, data);
        return;
      }
      method.apply(that, args);
    });
  }
};

//获取alert信息
Zabbix.prototype.getAlerts = function(action_id, time_from, callback){
	this.preRequest(this._getAlerts, arguments);
};

//返回alerts数组
Zabbix.prototype._getAlerts = function (action_id, time_from, callback){
	var that = this;

	console.log("-------------zabbix getAlerts---------------");
	
	that.data.method = "alert.get";
	that.data.auth = that.auth;

	var params = {};
	params.output = "extend";
	params.actionids = action_id; //此处hardcode
	params.time_from = time_from;
	params.sortfield = "clock";
	that.data.params = params;

	that.reqBody.body = JSON.stringify(that.data);

	that.request(that.reqBody, function(err, res, result){
		if (!err && res.statusCode == 200) {
			var eventid = "";
			var cacheData = [];
			for(var i=0; i<result.result.length; i++){
				if(eventid !== result.result[i].eventid){
					cacheData.push(result.result[i]);
					eventid = result.result[i].eventid;
				}
			}
			console.log("Got "+ cacheData.length +" Alerts!");
			callback(err, res, cacheData);
		}
	});
};

module.exports = Zabbix;