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

	//사용자가 링크를 누른 경우엔...넘어온 currentPage 값으로 대체!!
	if(request.query.currentPage != undefined){
		currentPage = parseInt(request.query.currentPage);
	}

	conn.execute("select * from notice order by notice_id desc", function(err, result, fields){
		if(err){
			console.log("조회실패!!");
		}	
		var currentPage=1;		//현재 보고 있는 페이지
		var totalRecord=result.rows.length;
		var pageSize=10;		//페이지당 보여질 레코드 수
		var totalPage=Math.ceil(totalRecord/pageSize);
		var blockSize=10;		//블럭당 보여질 페이지 수
		var firstPage=currentPage-(currentPage-1)%blockSize;//블럭당 시작페이지
		var lastPage=firstPage + (blockSize-1);//블럭당 마지막 페이지
		var num=totalRecord - ((currentPage-1)*pageSize);//페이지당 시작 게시물 갯수 번호

		fs.readFile("list.ejs","utf-8", function(error, data){
			if(error){
				console.log("읽기실패", error);
			}
			response.writeHead(200, {"Content-Type":"text/html"});
			response.end(ejs.render(data, {
				currentPage:currentPage,
				totalRecord:totalRecord,
				pageSize:pageSize,
				totalPage:totalPage,
				blockSize:blockSize,
				firstPage:firstPage,
				lastPage:lastPage,
				num:num
			}));
		});
	});
});

var server=http.createServer(app);

server.listen(8888, function(){
	console.log("웹서버 가동중..");
});//서버가동




