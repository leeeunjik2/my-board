# 은직이의 게시판

제목과 내용을 작성해 등록하는 로컬 게시판입니다.

## 실행 방법

`index.html`을 브라우저에서 열거나, 프로젝트 폴더에서 다음 명령으로 로컬 서버를 실행합니다.

```powershell
node -e "const http=require('http'),fs=require('fs'),path=require('path'); const root=process.cwd(); const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'}; http.createServer((req,res)=>{const requestPath=decodeURIComponent((req.url||'/').split('?')[0]); const relative=requestPath==='/'?'index.html':requestPath.slice(1); const file=path.resolve(root,relative); if(!file.startsWith(root+path.sep)){res.writeHead(403); return res.end('Forbidden');} fs.readFile(file,(err,data)=>{if(err){res.writeHead(404); return res.end('Not found');} res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}); res.end(data);});}).listen(8000,'127.0.0.1',()=>console.log('http://127.0.0.1:8000'));"
```

접속 주소는 <http://127.0.0.1:8000>입니다.

## 데이터 저장

- 게시글은 `simple-board-posts`라는 `localStorage` 항목에 저장됩니다.
- 같은 브라우저에서 새로고침해도 게시글이 유지됩니다.
- 게시글은 서버나 GitHub에 자동 업로드되지 않습니다.
- 브라우저 저장 데이터를 삭제하면 게시글도 사라질 수 있습니다.

## GitHub에 저장할 때

- 비밀번호, API 키, 토큰, 개인키와 같은 민감 정보를 저장하지 않습니다.
- `.gitignore`가 환경변수 파일과 인증서 파일을 제외합니다.
- 게시글 내용은 이 프로젝트 파일에 저장되지 않고 브라우저에만 있으므로 GitHub에 포함되지 않습니다.
