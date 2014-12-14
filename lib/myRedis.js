var redis = require("redis"),
    myConsole = require('./myConsole');

var MyRedis = function(){
    var host = "127.0.0.1";
}

MyRedis.prototype.sendIssue = function(issue, callback){
    var self = this;

    var client = redis.createClient(6379,self.host,{});
    client.on("error", function (err) {
        myConsole.log("Error " + err);
        callback(err);
    });
    var date = new Date();
    var information = {};

    information["@timestamp"] = date.toISOString();
    information.type = "zabbix_alert";
    information.severity = issue.message.trigger[0].severity[0];//{{TRIGGER.SEVERITY}};
    information.status = issue.message.trigger[0].status[0];//{{TRIGGER.STATUS}};
    information.ip = issue.message.host[0].ip[0];
    information.hostName = issue.message.host[0].name[0];
    information.url = issue.message.trigger[0].url[0];
    information.subject = issue.subject;//{{subject}}
    information.duration = issue.message.event[0].age[0];//{{EVENT.AGE}};
    information.message = "Alert Time: "+issue.message.date[0]+"-"+issue.message.event[0].time[0]+"\n\nItem Name: "+issue.message.item[0].name[0]+"\nItem Value: "+issue.message.item[0].value[0]+"\nItem Key: "+issue.message.item[0].key[0]+"\n\nHost Name: "+issue.message.host[0].name[0]+"\nHost DNS: "+issue.message.host[0].dns[0]+"\nHost IP: "+issue.message.host[0].ip[0]+"\n\nEvent ID:"+issue.eventid;//{{description}};

    client.lpush("zabbix_alert" , JSON.stringify(information), redis.print);
    client.quit();
}

module.exports = new MyRedis();