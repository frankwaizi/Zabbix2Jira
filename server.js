var express = require('express'),
    serveStatic = require('serve-static'),
    handler = require('./handler'),
    config = require('./config.json'),
    bodyParser = require('body-parser'),
    myConsole = require('./lib/myConsole'),
    app = express();

// 解析器
app.use(bodyParser());

app.use(serveStatic('pages'));

//欢迎
app.get('/', function(req, res) {
    console.log("Welcome");
    res.status(200).send("Welcome to frank's node server!");
});


var clock = function() {
    handler.monitor(function(err, response, result){
        console.log(result);
     });
}

var init = setInterval(clock, 300000)

//获取zabbix报警信息生成报表
app.get('/zabbixAlerts', function(req, res){

    handler.getZabbixAlerts(config.action_id, config.time_from, function(err, response, result){
        res.status(200).send(result);
     });
});

//获取jira信息生成报表
app.get('/monitor/jiraissue', function(req, res){
    
});


process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

myConsole.log("connect successful on port 18080!");
app.listen(18080);