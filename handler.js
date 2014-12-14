var zabbix = require('./lib/zabbix'),
    jira = require('./lib/jira'),
    //myRedis = require('./lib/myRedis'),
    config = require('./config.json'),
    issueCache = require('./issue/issueCache.json'),
    alertCache = require('./issue/alertCache.json'),
    myConsole = require('./lib/myConsole'),
    cacheService = require('./lib/cacheService');//database = require('./databaseConnector')(config.databaseUrl);

var Handler = function() {
	this.ZABBIX = new zabbix(config.zabbixconfig.url, config.zabbixconfig.username, config.zabbixconfig.password, config.zabbixconfig.proxy);
	this.JIRA = new jira(config.jiraconfig.url, config.jiraconfig.username, config.jiraconfig.password); 

	//Zabbix alerts cache
	this.alertCachePath = "/issue/alertCache.json";
	this.issueCachePath = "/issue/issueCache.json";
}

Handler.prototype.monitor = function(){
	var self = this;
	
	//获取自2014.11.05以来的报警信息
	//(new Date(2014, 11, 5)/1000).getTime().toString();
	
	self.ZABBIX.getAlerts(config.action_id, config.time_from, function(err, res, result) {

		if(alertCache.length !== result.length){
			myConsole.log("There are "+ (result.length-alertCache.length) +" new zabbix alerts");
			self.createIssue(result);
			//cacheService.cache(cachepath, data);
			alertCache = result;

			cacheService.cache("w", self.alertCachePath, alertCache);
		}

		self.closeIssue(result);
	});
}

//monitor zabbix and create issue or change issue state in jira
Handler.prototype.createIssue = function(result) {

	var self = this;

	for(var i = alertCache.length ; i < result.length ; i++){

		if(result[i].esc_step === "1" && !issueCache.hasOwnProperty(result[i].eventid)){
			
			myConsole.log("Will create new Jira issue of Zabbix alert "+result[i].eventid);

			var description = "Alert Time: "+result[i].message.date[0]+"-"+result[i].message.event[0].time+"\nTrigger Severity: "+result[i].message.trigger[0].severity[0]+"\nTrigger URL: "+result[i].message.trigger[0].url[0]+"\n\nItem Name: "+result[i].message.item[0].name[0]+"\nItem Value: "+result[i].message.item[0].value[0]+"\nItem Key: "+result[i].message.item[0].key[0]+"\n\nHost Name: "+result[i].message.host[0].name[0]+"\nHost DNS: "+result[i].message.host[0].dns[0]+"\nHost IP: "+result[i].message.host[0].ip[0]+"\n\nEvent ID:"+result[i].eventid; 
			
			var msg = {
				"eventid": result[i].eventid,
				"issue" : {
					"fields": {
                      	    "project":
                      	    {
                      	       "key": "DEVOPS"
                      	    },
                      	    "summary": result[i].subject,
                      	    "description": description,
                      	    "issuetype": {
                      	       "name": "Online Incident"
                      	    },
                      	    "assignee": { "name": "i070616" }
                      	}
                      }//issue
			};//msg

			//createJiraIssue
			self.JIRA.createIssue(msg, function(err, res, resData){
				myConsole.log(resData);
				resData.closed = false;
				issueCache[resData.eventid] = resData;
				cacheService.cache("w", self.issueCachePath, issueCache);
			});

			// myRedis.sendIssue(result[i],function(err){
			// 	myConsole.log(err);
			// });


		}//if
	}//for

}//createIssue


//关闭jiraIssue
//轮询所有创建过的issue，关闭已修复issue
Handler.prototype.closeIssue = function(result) {

	var self = this;

	for(var i=0; i<result.length; i++){

		if(result[i].esc_step === "0" && issueCache.hasOwnProperty(result[i].message.event[0].id) && !issueCache[result[i].message.event[0].id].closed){

			myConsole.log("Will create new Jira issue of Zabbix alert "+result[i].message.event[0].id);

			var issuekey = issueCache[result[i].message.event[0].id].key;
			//var issueid = "DEVOPS-119";

			var comment = result[i].subject+"\nRecovery Time: "+result[i].message.event[0].recovery[0].date[0]+"-"+result[i].message.event[0].recovery[0].time[0]+"\nDuration: "+result[i].message.event[0].age[0]+"\nTrigger Severity: "+result[i].message.trigger[0].severity[0]+"\nTrigger URL: "+result[i].message.trigger[0].url[0]+"\n\nItem Name: "+result[i].message.item[0].name[0]+"\nItem Value: "+result[i].message.item[0].value[0]+"\nItem Key: "+result[i].message.item[0].key[0]+"\n\nHost Name: "+result[i].message.host[0].name[0]+"\nHost DNS: "+result[i].message.host[0].dns[0]+"\nHost IP: "+result[i].message.host[0].ip[0]+"\n\nOriginal EventID: "+result[i].message.event[0].id;

    		var transition = {
    		    "update": {
    		    "comment": [
    		        {
    		            "add": {
    		                "body": comment
    		            }
    		        }
    		    ]
    		},
    		"fields": {
    		    "resolution": {
    		        "name": "Fixed"
    		    }
    		},
    		"transition": {
    		    "id": "2"
    		}
    		};
    		var msg = {
    			eventid : result[i].message.event[0].id,
    			issuekey : issuekey,
    			transition : transition
    		};

    		//closeJiraIssue
			self.JIRA.closeIssue(msg, function(err, res, resData){
				issueCache[resData].closed = true;
				cacheService.cache("w", self.issueCachePath, issueCache);
			});

			// myRedis.sendIssue(result[i],function(err){
			// 	myConsole.log(err);
			// });
		}//if
	}//for
}//closeIssue

//Get format zabbix alerts
Handler.prototype.getZabbixAlerts = function(action_id, time_from, callback) {

	var self = this;

	self.ZABBIX.getAlerts(action_id, time_from, callback);
}

//ns.database = database;

module.exports = new Handler();
