(() => {
  "use strict";

  const STORAGE_KEY = "simple-board-posts";
  const form = document.querySelector("#post-form");
  const titleInput = document.querySelector("#post-title");
  const contentInput = document.querySelector("#post-content");
  const formMessage = document.querySelector("#form-message");
  const postList = document.querySelector("#post-list");
  const emptyState = document.querySelector("#empty-state");
  const postCount = document.querySelector("#post-count");

  let posts = loadPosts();

  renderPosts();

  form.addEventListener("submit", (event) => {
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

    const newPost = {
      id: createId(),
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    posts = [newPost, ...posts];
    savePosts();
    renderPosts();
    form.reset();
    showMessage("새 기록이 저장되었습니다.", true);
    titleInput.focus();
  });

  postList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-id]");

    if (!deleteButton) {
      return;
    }

    const postId = deleteButton.dataset.deleteId;
    const post = posts.find((item) => item.id === postId);

    if (!post || !window.confirm("이 기록을 삭제할까요?")) {
      return;
    }

    posts = posts.filter((item) => item.id !== postId);
    savePosts();
    renderPosts();
    showMessage("기록이 삭제되었습니다.", true);
  });

  function loadPosts() {
    try {
      const storedPosts = window.localStorage.getItem(STORAGE_KEY);
      const parsedPosts = storedPosts ? JSON.parse(storedPosts) : [];

      if (!Array.isArray(parsedPosts)) {
        return [];
      }

      return parsedPosts
        .filter(isValidPost)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.warn("저장된 기록을 불러오지 못했습니다.", error);
      return [];
    }
  }

  function isValidPost(post) {
    return Boolean(
      post &&
        typeof post.id === "string" &&
        typeof post.title === "string" &&
        typeof post.content === "string" &&
        typeof post.createdAt === "string" &&
        !Number.isNaN(new Date(post.createdAt).getTime()),
    );
  }

  function savePosts() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
      showMessage("저장 공간에 접근할 수 없습니다. 브라우저 설정을 확인해 주세요.");
      console.warn("기록을 저장하지 못했습니다.", error);
    }
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

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showMessage(message, isSuccess = false) {
    formMessage.textContent = message;
    formMessage.classList.toggle("success", isSuccess);
  }
})();
