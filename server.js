//insert, delete , update, select 
//Create = insert 
//Read = select 
//Update = update 
//Delete = delete  , jsp / node=front developer
///
var http=require("http");
var express=require("express"); 
var ejs=require("ejs");// 동적 html 생성 모듈...
var fs=require("fs");//파일 읽어들이는 모듈!!
var oracledb=require("oracledb");
var PagingManager=require("./lib/PagingManager.js");
var bodyParser=require("body-parser");
var app=express();//모듈생성
var conn;
//자동 커밋
oracledb.autoCommit=true; //별도로 명시하지 않아도 쿼리문 수행시
//자동 커밋( 트랜잭션 확정) - DML:insert, update ,delete

//express 모듈의 최대 장점!! 각종 미들웨어라 불리는 기능들을 지원
//미들웨어 사용시 use() 로 호출!!

// 어떤효과? - 정적파일들을 일일이 라우팅 시킬 필요없다...
app.use(express.static(__dirname)); 
//바디파서의 설정
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());//제이슨 형태로 파라미터 가공!!


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

	conn.execute("select notice_id,writer,title,to_char(content),to_char(regdate, 'YYYY-MM-DD'),hit from notice order by notice_id desc", function(err, result, fields){
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

//등록 요청 처리  
//http 전송 메서드라 불리는 여러 방식이 있다..
//get / post / delete / input 이 있다... 
//get : 헤더를 통해 데이터를 전송하는 방식으로 url에 데이터가 노출
// 되며 데이터량이 많지 않을 경우 사용 
//post : body를 통해 데이터를 전송하는 방식으로 데이터 노출되지
//         않으며, (내부적 스트림) 데이터량이 많을 경우 사용...
//        ex) 로그인 post(보안땜에) , 파일업로드(양이 많아서)..
app.post("/regist", function(request, response){
	//전송된 파라미터들부터 받아서 출력해본다!!
	console.log(request.body);	
	var sql="insert into notice(notice_id, writer,title,content)";
	sql+=" values(seq_notice.nextval,'"+request.body.writer+"','"+request.body.title+"','"+request.body.content+"')";

	console.log(sql);
	
	//쿼리수행!! insert ,update ,delete (트랜잭션이 걸려있음) 
	//따라서 commit 하지 않으면 그냥 메모리에만 반영됨..
	conn.execute(sql, function(error, result){
		if(error){
			console.log("에러발생 ㅜㅜ", error);
		}
		console.log("insert 결과는 ", result);
	});
	
	//클라이언트에게 리다이렉트 접속 처리 
	response.statusCode=302;
	response.setHeader("Location", "/list");
	response.end();
});

//상세보기 요청 처리 
app.use("/detail", function(request, response){
	console.log("클라이언트가 get방식으로 전송한 파라미터는 ",request.query);
	var notice_id=request.query.notice_id;
	
	//조회수 증가
	var sql="update notice set hit=hit+1 where notice_id="+notice_id;
	conn.execute(sql, function(error, result){
		if(error){
			console.log(error);
		}
	});

	sql="select notice_id, writer, title, to_char(content),to_char(regdate,'YYYY-MM-DD'),hit  from notice where notice_id="+notice_id;
	console.log(sql);

	//쿼리문 수행 
	conn.execute(sql, function(error, result, fields){
		if(error){
			console.log("조회실패",error);
		}	
		console.log(result);
		//detail.ejs 에게 정보를 전달해주자!!
		fs.readFile("detail.ejs", "utf-8", function(err, data){
			if(err){
				console.log("파일 읽기실패", err);
			}
			response.writeHead(200,{"Content-Type":"text/html"});
			response.end(ejs.render(data, {
				record:result.rows[0]
			}));
		});
	});

});

//삭제 요청 처리 
//넘겨받을 파라미터가 단순한 문자 하나이므로 데이터량이 많지
//않고, 보안도 중요하지 않으므로 get방식으로 받겠다!!
app.get("/del", function(request, response){
	var notice_id=request.query.notice_id; //json 객체 {notice_id: '47'}

	var sql="delete from notice where notice_id="+notice_id;
	console.log(sql);
	
	conn.execute(sql, function(error, result){
		if(error){
			console.log("삭제실패",error);
		}
		//클라이언트에게 리다이렉트 접속 처리 
		response.statusCode=302;
		response.setHeader("Location", "/list");
		response.end();
	});	
});

//수정 요청 처리!!
app.post("/edit", function(request, response){
	//파라미터 4개를 json으로 받아보자!! ( body-parser 능력) 
	console.log(request.body);

	var notice_id=request.body.notice_id;
	var writer=request.body.writer;
	var title=request.body.title;
	var content=request.body.content;

	var sql="update notice set writer='"+writer+"', title='"+title+"',content='"+content+"'";
	sql+=" where notice_id="+notice_id;
	
	conn.execute(sql, function(error, result){
		if(error){
			console.log("수정실패", error);
		}
		//수정 후 가야할 곳??? 수정한 내용을 확인할 수있는 상세보기로 다시보내기
		//클라이언트에게 리다이렉트 접속 처리 
		response.statusCode=302;
		response.setHeader("Location", "/detail?notice_id="+notice_id);
		response.end();
	});

});

var server=http.createServer(app);

server.listen(8888, function(){
	console.log("웹서버 가동중..");
});//서버가동





