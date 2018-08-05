//insert, delete , update, select 
//Create = insert 
//Read = select 
//Update = update 
//Delete = delete  , jsp / node=front developer
var http=require("http");
var express=require("express"); 
var ejs=require("ejs");// 동적 html 생성 모듈...
var fs=require("fs");//파일 읽어들이는 모듈!!
var oracledb=require("oracledb");
var PagingManager=require("./lib/PagingManager.js");

var app=express();//모듈생성

//express 모듈의 최대 장점!! 각종 미들웨어라 불리는 기능들을 지원
//미들웨어 사용시 use() 로 호출!!

// 어떤효과? - 정적파일들을 일일이 라우팅 시킬 필요없다...
app.use(express.static(__dirname)); 

var conn;

//오라클 접속 
oracledb.getConnection({
	user:"node",
	password:"node",
	connectString:"localhost/XE"
}, function(error, con){
	if(error){
		console.log("접속에 실패!!", error);
	}
	conn=con;
});


//리스트 요청받기
app.get("/list", function(request, response){
	//클라이언트가 전송한 get방식의 데이터를 request 객체에서 끄집어 내자!!
	console.log(request.query.currentPage);

	conn.execute("select * from notice order by notice_id desc", function(err, result, fields){
		console.log("execute 안쪽");
		console.log(result);
		
		//변수들을 여기서 나열하지 말고, 대신 페이징 매니져한테 맡기자!!
		var pm = new PagingManager(request,result.rows);

		if(err){
			console.log("조회실패!!");
		}	
		fs.readFile("list.ejs","utf-8", function(error, data){
			if(error){
				console.log("읽기실패", error);
			}
			response.writeHead(200, {"Content-Type":"text/html"});
			response.end(ejs.render(data, {
				pm:pm,
				record:result.rows
			}));
		});
	});

	console.log("execute 바깥쪽");
});

var server=http.createServer(app);

server.listen(8888, function(){
	console.log("웹서버 가동중..");
});//서버가동




