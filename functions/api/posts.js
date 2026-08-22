const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;

export async function onRequestGet({ env }) {
  const result = await env.DB.prepare(
    `SELECT id, title, content, created_at AS createdAt
     FROM posts
     ORDER BY created_at DESC`,
  ).all();

  return json({ posts: result.results ?? [] });
}

export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "올바른 JSON 요청이 필요합니다." }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!title || !content) {
    return json({ error: "제목과 내용을 모두 입력해 주세요." }, 400);
  }

  if (title.length > MAX_TITLE_LENGTH || content.length > MAX_CONTENT_LENGTH) {
    return json({ error: "입력 가능한 글자 수를 초과했습니다." }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO posts (id, title, content, created_at)
     VALUES (?1, ?2, ?3, ?4)`,
  )
    .bind(id, title, content, createdAt)
    .run();

  return json({ id, title, content, createdAt }, 201);
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return json({ error: "삭제할 게시글 ID가 필요합니다." }, 400);
  }

  const result = await env.DB.prepare("DELETE FROM posts WHERE id = ?1")
    .bind(id)
    .run();

  if (!result.meta.changes) {
    return json({ error: "게시글을 찾을 수 없습니다." }, 404);
  }

  return new Response(null, { status: 204 });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
