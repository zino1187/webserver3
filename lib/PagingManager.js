/*페이징 처리를 전담하는 객체를 모듈로 정의*/
class PagingManager{
	constructor(request, record){
		this.currentPage=1;		//현재 보고 있는 페이지

		//사용자가 링크를 누른 경우엔...넘어온 currentPage 값으로 대체!!
		if(request.query.currentPage != undefined){
			currentPage = parseInt(request.query.currentPage);
		}

		this.totalRecord=record.length;
		this.pageSize=10;		//페이지당 보여질 레코드 수
		this.totalPage=Math.ceil(this.totalRecord/this.pageSize);
		this.blockSize=10;		//블럭당 보여질 페이지 수
		this.firstPage=this.currentPage-(this.currentPage-1)%this.blockSize;//블럭당 시작페이지
		this.lastPage=this.firstPage + (this.blockSize-1);//블럭당 마지막 페이지
		this.num=this.totalRecord - ((this.currentPage-1)*this.pageSize);//페이지당 시작 게시물 갯수 번호
	}
}
//사용자 정의 모듈!!
module.exports=PagingManager;