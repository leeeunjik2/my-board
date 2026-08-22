const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;
const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

export async function onRequestGet({ env }) {
  const postsResult = await env.DB.prepare(
    `SELECT id, title, content, created_at AS createdAt
     FROM posts
     ORDER BY created_at DESC`,
  ).all();

  const reactionsResult = await env.DB.prepare(
    `SELECT post_id AS postId, emoji, reaction_count AS count
     FROM post_reactions
     ORDER BY post_id, emoji`,
  ).all();

  const reactionsByPost = new Map();
  for (const reaction of reactionsResult.results ?? []) {
    const reactions = reactionsByPost.get(reaction.postId) ?? [];
    reactions.push({ emoji: reaction.emoji, count: reaction.count });
    reactionsByPost.set(reaction.postId, reactions);
  }

  const posts = (postsResult.results ?? []).map((post) => ({
    ...post,
    reactions: reactionsByPost.get(post.id) ?? [],
  }));

  return json({ posts });
}

export async function onRequestPost({ request, env }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "올바른 JSON 요청이 필요합니다." }, 400);
  }

  if (body?.action === "react") {
    return addReaction(body, env);
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

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

async function addReaction(body, env) {
  const postId = typeof body.postId === "string" ? body.postId : "";
  const emoji = typeof body.emoji === "string" ? body.emoji : "";

  if (!postId || !ALLOWED_EMOJIS.includes(emoji)) {
    return json({ error: "지원하지 않는 이모지 반응입니다." }, 400);
  }

  const post = await env.DB.prepare("SELECT id FROM posts WHERE id = ?1")
    .bind(postId)
    .first();

  if (!post) {
    return json({ error: "게시글을 찾을 수 없습니다." }, 404);
  }

  await env.DB.prepare(
    `INSERT INTO post_reactions (post_id, emoji, reaction_count)
     VALUES (?1, ?2, 1)
     ON CONFLICT (post_id, emoji)
     DO UPDATE SET reaction_count = reaction_count + 1`,
  )
    .bind(postId, emoji)
    .run();

  const reaction = await env.DB.prepare(
    `SELECT reaction_count AS count
     FROM post_reactions
     WHERE post_id = ?1 AND emoji = ?2`,
  )
    .bind(postId, emoji)
    .first();

  return json({ postId, emoji, count: reaction?.count ?? 0 });
}

export async function onRequestDelete({ request, env }) {
  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return json({ error: "삭제할 게시글 ID가 필요합니다." }, 400);
  }

  const result = await env.DB.batch([
    env.DB.prepare("DELETE FROM post_reactions WHERE post_id = ?1").bind(id),
    env.DB.prepare("DELETE FROM posts WHERE id = ?1").bind(id),
  ]);

  if (!result[1].meta.changes) {
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
