var gulp = require('gulp');
var gls = require('gulp-live-server');
var data = require('gulp-data');
var fs = require("fs");
var jade = require('gulp-jade');
var plugins = require('gulp-load-plugins')();
var server = gls.static('dist', 8000);

/******************* merge json -- data/*.json to dist/data/all.json ***********/
// determine the max time. >0 means a>b; <0 means a<b; =0 means a=b.
function time_max(a, b) {
	var x = new Date(a).getTime();
	var y = new Date(b).getTime();
	return x - y;
}
// read json and get start end time
function readJson(file, dict) {
	var data = require(file);

	//console.log(data);
	data.start = new Date(data.begin).format("yyyy-MM-dd hh:mm:ss");
	if (data.events.length == 0) {
		data.name = "未投递";
		data.end = new Date(data.finish).format("yyyy-MM-dd hh:mm:ss");
	} else {
		var max = data.events[0].at;
		var maxName = data.events[0].label;
		for (var i = 0; i < data.events.length; i++) {
			var evt = data.events[i];
			//console.log(evt);
			data.events[i].classes = 'item-event-' + dict.event_label[evt.label];
			if (time_max(max, evt.at) < 0) {
				max = evt.at;
				maxName = evt.label;
			}
			data.events[i].at = new Date(data.events[i].at).format('yyyy-MM-dd hh:mm:ss');

		}
		data.name = maxName;
		if (time_max(max, data.finish) < 0)
			max = data.finish;
		data.events.push({
			"label" : "投递截至",
			"at" : new Date(data.finish).format("yyyy-MM-dd hh:mm:ss"),
			"type":"",
			"classes" : 'item-event-submit-end'
		});
		data.end = new Date(max).format("yyyy-MM-dd hh:mm:ss");
	}
	data.classes = 'item-status-' + dict.item_status[data.name];
	delete data.begin;
	delete data.finish;
	//console.log(data.events);
	return data;
}
// format the date 
Date.prototype.format = function (format) {

	var o = {
		"M+" : this.getMonth() + 1, //month
		"d+" : this.getDate(), //day
		"h+" : this.getHours(), //hour
		"m+" : this.getMinutes(), //minute
		"s+" : this.getSeconds(), //second
		"q+" : Math.floor((this.getMonth() + 3) / 3), //quarter
		"S" : this.getMilliseconds() //millisecond
	}
	//console.log(o);
	if (/(y+)/.test(format))
		format = format.replace(RegExp.$1,
				(this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(format))
			format = format.replace(RegExp.$1,
					RegExp.$1.length == 1 ? o[k] :
					("00" + o[k]).substr(("" + o[k]).length));
	return format;
}
function mergeJson(path) {
	var dict = require('./src/js/dict.js');
	//console.log(dict);
	var res = {
		items : [],
		sections : []
	};
	var files = fs.readdirSync(path);
	var idx = 0;
	var ans=0;
	files.forEach(function (file) {
		var pathname = path + '/' + file;
		var json = readJson(pathname, dict);
		var id = getId(res.sections, json.company);
		if (id == -1) {
			id = idx;
			idx++;
			res.sections.push({
				"id" : id,
				"name" : json.company
			});
		}
		json.sectionID = id;
		json.id = ans;
		ans++;
		delete json.company;
		res.items.push(json);
	});
	var tmp = JSON.stringify(res);
	//console.log(tmp);
	var savePath = 'dist/data/all.json';
	fs.writeFile(savePath, tmp, 'utf-8');
	return tmp;
}
function getId(sections, name) {
	for (var i = 0; i < sections.length; i++)
		if (sections[i].name == name)
			return sections[i].id;
	return -1;
}
/******************* jade to html -- using dist/data/all.json ***********/
gulp.task('jade', function () {
	//var file='data/test.json';
	//var json=require('data.json');
	//console.log(json);
	mergeJson('./data');
	return gulp.src('./src/jade/index.jade')
	//.pipe(plugins.jade({data:mergeJson('./data')}))
	//.pipe(mergeJson('./data'))
	.pipe(data(function (file) {
			//mergeJson('./data');
			//console.log(data);
			//return mergeJson('./data');

			//var tmp=require('./dist/data/huizong.json');
			//delete require.cache[require.resolve('./dist/data/huizong.json')];
			//console.log(tmp);
			return require('./dist/data/all.json');
		}))
	.pipe(jade())
	.pipe(gulp.dest('dist/'));
});
gulp.task('jade_sub',function(){
	return gulp.src('./src/jade/infor.jade')
	.pipe(jade())
	.pipe(gulp.dest('dist/'))
})
/******************* css to dist/css ***********/
gulp.task('css', function () {
	return gulp.src(['./src/css/*.css', './src/css/*.scss'])
	.pipe(gulp.dest('dist/css/'));
});
/******************* images to dist/css/images ***********/
gulp.task('images', function () {
	return gulp.src(['./src/css/images/*.png', './src/css/images/*.gif'])
	.pipe(gulp.dest('dist/css/images'));
});
/******************* js to dist/js ***********/
gulp.task('js', function () {
	return gulp.src('./src/js/*js')
	.pipe(gulp.dest('dist/js/'));
});
/******************* build ***********/
gulp.task('build', ['css', 'images', 'js','jade_sub','jade']);

/******************* new json ***********/
gulp.task('new', function () {
	filename = gulp.env.name;
	fs.exists('data', function (exists) {
		if (!exists)
			fs.mkdir("data");
	});
	var file = 'data/' + filename + '.json';
	fs.readFile('data.json', 'utf-8', function (err, data) {
		if (!err) {
			fs.writeFile(file, data, 'utf-8');
		} else {
			console.log("fail to read data.json");
		}
	});

});
/******************* serve ***********/
gulp.task('serve', function () {
	//console.log("server");
	server.start();
});
/******************* deploy ***********/
gulp.task('deploy', ['build'], function () {
	return gulp.src('./dist/**/*')
	.pipe(plugins.ghPages());
});
