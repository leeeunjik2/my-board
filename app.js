(() => {
  "use strict";

  const API_URL = "/api/posts";
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

  async function requestPosts() {
    const result = await request(API_URL);
    return Array.isArray(result.posts) ? result.posts : [];
  }

  async function request(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
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

      heading.append(title, deleteButton);
      meta.append(time);
      article.append(heading, content, meta);
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
