# 은직이의 게시판

제목과 내용을 작성해 등록하는 로컬 게시판입니다.

## 실행 방법

Cloudflare Pages Functions와 D1을 함께 테스트하려면 프로젝트 폴더에서 다음 명령을 실행합니다.

```powershell
npx wrangler pages dev .
```

기본 접속 주소는 <http://localhost:8788>입니다.

## 데이터 저장

- 게시글은 Cloudflare D1의 `posts` 테이블에 저장됩니다.
- `localStorage`는 사용하지 않으므로, 모든 방문자가 같은 게시글 목록을 공유합니다.
- 기존 브라우저에 남아 있는 이전 `localStorage` 게시글은 자동으로 데이터베이스로 옮겨지지 않습니다.
- 게시글 삭제는 현재 별도 로그인 없이 가능한 단순 게시판 동작입니다. 공개 운영 전에는 관리자 인증을 추가하는 것을 권장합니다.

## Cloudflare D1 연결

1. `npx wrangler@latest login`으로 Cloudflare에 로그인합니다.
2. `my-board-db` D1 데이터베이스를 만들고 `wrangler.toml`에 `DB` 바인딩을 설정합니다.
3. `npx wrangler@latest d1 migrations apply my-board-db --remote`로 `posts` 테이블을 만듭니다.
4. Cloudflare Pages 프로젝트의 Functions에 `DB`라는 이름으로 해당 D1 데이터베이스를 바인딩합니다.
5. Pages 프로젝트를 다시 배포합니다.

Cloudflare Pages Functions는 `/functions` 폴더의 API를 실행하고, D1 바인딩은 `context.env.DB`로 사용합니다.

## GitHub에 저장할 때

- 비밀번호, API 키, 토큰, 개인키와 같은 민감 정보를 저장하지 않습니다.
- `.gitignore`가 환경변수 파일과 인증서 파일을 제외합니다.
- 게시글 내용은 이 프로젝트 파일에 저장되지 않고 브라우저에만 있으므로 GitHub에 포함되지 않습니다.
