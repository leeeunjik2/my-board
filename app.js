(() => {
  "use strict";

  const API_URL = "/api/posts";
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];
  const form = document.querySelector("#post-form");
  const titleInput = document.querySelector("#post-title");
  const contentInput = document.querySelector("#post-content");
  const formMessage = document.querySelector("#form-message");
  const postList = document.querySelector("#post-list");
  const emptyState = document.querySelector("#empty-state");
  const postCount = document.querySelector("#post-count");

  let posts = [];

  initialize();

  async function initialize() {
    try {
      posts = await requestPosts();
      renderPosts();
    } catch (error) {
      renderPosts();
      showMessage(error.message || "게시글을 불러오지 못했습니다.");
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
      showMessage("제목과 내용을 모두 입력해 주세요.");
      if (!title) {
        titleInput.focus();
      } else {
        contentInput.focus();
      }
      return;
    }

    setFormDisabled(true);

    try {
      const newPost = await request(API_URL, {
        method: "POST",
        body: JSON.stringify({ title, content }),
      });

      posts = [newPost, ...posts];
      renderPosts();
      form.reset();
      showMessage("새 게시글이 저장되었습니다.", true);
      titleInput.focus();
    } catch (error) {
      showMessage(error.message || "게시글을 저장하지 못했습니다.");
    } finally {
      setFormDisabled(false);
    }
  });

  postList.addEventListener("click", async (event) => {
    const reactionButton = event.target.closest("[data-react-post-id]");

    if (reactionButton) {
      await addReaction(reactionButton);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-id]");

    if (!deleteButton) {
      return;
    }

    const postId = deleteButton.dataset.deleteId;
    const post = posts.find((item) => item.id === postId);

    if (!post || !window.confirm("이 기록을 삭제할까요?")) {
      return;
    }

    deleteButton.disabled = true;

    try {
      await request(`${API_URL}?id=${encodeURIComponent(postId)}`, {
        method: "DELETE",
      });

      posts = posts.filter((item) => item.id !== postId);
      renderPosts();
      showMessage("게시글이 삭제되었습니다.", true);
    } catch (error) {
      deleteButton.disabled = false;
      showMessage(error.message || "게시글을 삭제하지 못했습니다.");
    }
  });

  async function addReaction(reactionButton) {
    const postId = reactionButton.dataset.reactPostId;
    const emoji = reactionButton.dataset.emoji;
    const post = posts.find((item) => item.id === postId);

    if (!post || !REACTION_EMOJIS.includes(emoji)) {
      return;
    }

    reactionButton.disabled = true;

    try {
      const result = await request(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "react", postId, emoji }),
      });

      const currentReaction = (post.reactions || []).find(
        (reaction) => reaction.emoji === emoji,
      );

      if (currentReaction) {
        currentReaction.count = result.count;
      } else {
        post.reactions = [...(post.reactions || []), { emoji, count: result.count }];
      }

      renderPosts();
    } catch (error) {
      reactionButton.disabled = false;
      showMessage(error.message || "이모지 반응을 저장하지 못했습니다.");
    }
  }

  async function requestPosts() {
    const result = await request(API_URL);
    return Array.isArray(result.posts) ? result.posts : [];
  }

  async function request(url, options = {}) {
    let response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });
    } catch {
      throw new Error(
        "서버에 연결할 수 없습니다. 로컬에서는 `npx wrangler pages dev .`로 실행해 주세요.",
      );
    }

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          "게시판 API를 찾을 수 없습니다. 로컬에서는 `npx wrangler pages dev .`로 실행해 주세요.",
        );
      }

      throw new Error(result.error || "요청을 처리하지 못했습니다.");
    }

    return result;
  }

  function renderPosts() {
    const hasPosts = posts.length > 0;
    emptyState.hidden = hasPosts;
    postList.hidden = !hasPosts;
    postCount.textContent = `${posts.length}개의 기록`;

    if (!hasPosts) {
      postList.replaceChildren();
      return;
    }

    const fragment = document.createDocumentFragment();

    posts.forEach((post) => {
      const article = document.createElement("article");
      article.className = "post-card";

      const heading = document.createElement("div");
      heading.className = "post-card-heading";

      const title = document.createElement("h3");
      title.textContent = post.title;

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.type = "button";
      deleteButton.dataset.deleteId = post.id;
      deleteButton.textContent = "삭제";
      deleteButton.setAttribute("aria-label", `“${post.title}” 기록 삭제`);

      const content = document.createElement("p");
      content.className = "post-content";
      content.textContent = post.content;

      const meta = document.createElement("div");
      meta.className = "post-meta";

      const time = document.createElement("time");
      time.dateTime = post.createdAt;
      time.textContent = formatDate(post.createdAt);

      const reactions = document.createElement("div");
      reactions.className = "post-reactions";
      reactions.setAttribute("aria-label", "이모지 반응");

      REACTION_EMOJIS.forEach((emoji) => {
        const reaction = (post.reactions || []).find(
          (item) => item.emoji === emoji,
        );
        const reactionButton = document.createElement("button");
        reactionButton.className = "reaction-button";
        reactionButton.type = "button";
        reactionButton.dataset.reactPostId = post.id;
        reactionButton.dataset.emoji = emoji;
        reactionButton.setAttribute("aria-label", `${emoji} 반응 추가`);

        const emojiLabel = document.createElement("span");
        emojiLabel.className = "reaction-emoji";
        emojiLabel.textContent = emoji;

        const reactionCount = document.createElement("span");
        reactionCount.className = "reaction-count";
        reactionCount.textContent = String(reaction?.count || 0);

        reactionButton.append(emojiLabel, reactionCount);
        reactions.append(reactionButton);
      });

      heading.append(title, deleteButton);
      meta.append(time);
      article.append(heading, content, reactions, meta);
      fragment.append(article);
    });

    postList.replaceChildren(fragment);
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  function setFormDisabled(disabled) {
    form.querySelectorAll("input, textarea, button").forEach((element) => {
      element.disabled = disabled;
    });
  }

  function showMessage(message, isSuccess = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("success", isSuccess);
  }
})();
