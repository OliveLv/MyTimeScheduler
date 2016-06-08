var gulp=require('gulp');
var gls = require('gulp-live-server');
var data=require('gulp-data');
var fs=require("fs");
var jade=require('gulp-jade');
var minifier=require('node-minifier');

var server = gls.static('dist', 8000);
//var json=require('data.json');
/******************* Jade to html ***********/
function time_max(a,b){
	var x=new Date(a).getTime();
	var y=new Date(b).getTime();
	return x-y;
}
function readJson(file,dict){
	var data=require(file);
	
	//console.log(data);
	data.start=data.begin;
	if(data.events.length==0){
		data.name="未投递";
		data.end=data.finish;
	}else{
		var max=data.events[0].at;
		var maxName=data.events[0].label;
		for(var i=0;i<data.events.length;i++){
			var evt=data.events[i];
			//console.log(evt);
			data.events[i].classes='item-event-'+dict.event_label[evt.label];
			if(time_max(max,evt.at)<0){
				max=evt.at;
				maxName=evt.label;
			}
			
		}
		data.name=maxName;
		if(time_max(max,data.finish)<0)max=data.finish;
		else{
			data.events.push({
				"label":"投递截至",
				"at":data.finish,
				"classes":'item-event-submit-end'
			});
		}
		data.end=max;
	}
	data.classes='item-status-'+dict.item_status[data.name];
	delete data.begin;
	delete data.finish;
	//console.log(data.events);
	return data;
}
function mergeJson(path){
	var dict = require('./src/dict.js');
	//var json=readJson(path+'/美团.json',dict);
	//console.log(json);
	
	//console.log(dict);
	var res={
		items:[],
		sections:[]
	};
	var files=fs.readdirSync(path);
	var idx=0;
	files.forEach(function(file){
		var pathname=path+'/'+file;
		var json=readJson(pathname,dict);
		var id=getId(res.sections,json.company);
		if(id==-1){
			id=idx;
			idx++;
			res.sections.push({
				"id":id,
				"name":json.company
			});
		}
		json.sectionID=id;
		delete json.company;
		res.items.push(json);
	});
	var tmp=JSON.stringify(res);
	console.log(tmp);
	
	//fs.writeFile('dist/data/huizong.json',tmp,'utf-8');
	return res;
}
function getId(sections,name){
	for(var i=0;i<sections.length;i++)
		if(sections[i].name==name)return sections[i].id;
	return -1;
}
gulp.task('read',function(){
	//var file='data/test.json';
	//var json=require('data.json');
	//console.log(json);
	return gulp.src('./src/jade/index.jade')
		.pipe(data(function(file){
			mergeJson('./data');
			//console.log(data);
			return require('./dist/data/huizong.json');
			//return require('./data/美团.json');
		}))
		.pipe(jade())
		.pipe(gulp.dest('dist/'));
});
gulp.task('css',function(){
	return gulp.src(['./src/css/*.css','./src/css/*.scss'])
	.pipe(gulp.dest('dist/css/'));
});
gulp.task('images',function(){
	return gulp.src(['./src/css/images/*.png','./src/css/images/*.gif'])
	.pipe(gulp.dest('dist/css/images'));
});
gulp.task('js',function(){
	return gulp.src('./src/js/*js')
	.pipe(gulp.dest('dist/js/'));
});
gulp.task('build',['css','images','js','read']);
gulp.task('jade', function() {
  return gulp.src('./src/jade/index.jade')
    .pipe(plugins.jade({ locals: getLocals() }))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('new',function(){
	filename=gulp.env.name;
	fs.exists('data',function(exists){
		if(!exists)fs.mkdir("data");
	});
	var file='data/'+filename+'.json';
	fs.readFile('data.json','utf-8',function(err,data){
		if(!err){
			fs.writeFile(file,data,'utf-8');
		}else{
			console.log("fail to read data.json");
		}
	});
	
});
gulp.task('serve', function () {
	//console.log("server");
  server.start();
});