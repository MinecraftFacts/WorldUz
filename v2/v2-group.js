
/*
  MINECRAFT WORLD V2.0
  Umumiy guruh chat
*/

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const esc = v => String(v ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c])
  );

  const check = r => {
    if (r.error) throw r.error;
    return r.data;
  };

  const state = {
    db: null,
    uid: null,
    member: false,
    open: false,
    subscription: null,
    busy: false,
    refreshTimer: null,
    noticeTimer: null
  };

  const icons = {
    group: `<circle cx="9" cy="8" r="3"/>
      <path d="M2 20v-2a7 7 0 0 1 14 0v2
      M17 5a3 3 0 0 1 0 6
      M18 14a6 6 0 0 1 4 6"/>`,
    send: `<path d="m22 2-7 20-4-9-9-4Z"/>
      <path d="M22 2 11 13"/>`,
    image: `<rect x="3" y="3" width="18"
      height="18" rx="2"/>
      <circle cx="8" cy="8" r="2"/>
      <path d="m21 16-5-5-11 10"/>`,
    back: `<path d="m15 18-6-6 6-6"/>`,
    leave: `<path d="M10 17l5-5-5-5
      M15 12H3M12 3h7a2 2 0 0 1 2 2v14
      a2 2 0 0 1-2 2h-7"/>`,
    trash: `<path d="M3 6h18M8 6V4h8v2
      M6 6l1 15h10l1-15"/>`
  };

  function icon(name, size = 20) {
    return `
      <svg width="${size}" height="${size}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true">
        ${icons[name] || ""}
      </svg>
    `;
  }

  function notice(message) {
    let n = $("mwGroupNotice");

    if (!n) {
      n = document.createElement("div");
      n.id = "mwGroupNotice";

      n.style.cssText = `
        position:fixed;
        bottom:95px;
        left:50%;
        transform:translateX(-50%);
        z-index:100;
        background:#294d43;
        color:white;
        padding:11px 15px;
        border-radius:12px;
        max-width:92vw;
      `;

      document.body.append(n);
    }

    n.textContent = message;
    n.hidden = false;

    clearTimeout(state.noticeTimer);

    state.noticeTimer = setTimeout(() => {
      n.hidden = true;
    }, 3800);
  }

  function fail(e) {
    console.error("Group chat:", e);
    notice("Guruh xatosi: " + (e.message || e));
  }

  function installStyles() {
    const style = document.createElement("style");

    style.textContent = `
      .mw-group-entry {
        width:100%;
        padding:14px;
        display:flex;
        align-items:center;
        gap:12px;
        margin-bottom:14px;
        text-align:left;
        border:1px solid #5c8b7e;
        border-radius:15px;
        background:linear-gradient(
          110deg,#234b48,#1b3746
        );
        color:#edf7f1;
        cursor:pointer;
      }

      .mw-group-entry b {
        display:block;
        font-size:16px;
      }

      .mw-group-entry small {
        color:#bad4ce;
      }

      .mw-group-room {
        padding:12px;
        margin-bottom:15px;
        border:1px solid #547a73;
        border-radius:17px;
        background:#182e3b;
      }

      .mw-group-top {
        display:flex;
        justify-content:space-between;
        align-items:center;
        flex-wrap:wrap;
        gap:8px;
        margin-bottom:13px;
      }

      .mw-group-feed {
        height:min(52vh,480px);
        min-height:280px;
        overflow-y:auto;
        background:#0b202b;
        border-radius:13px;
        padding:12px;
        display:flex;
        flex-direction:column;
        gap:10px;
      }

      .mw-group-line {
        display:flex;
        align-items:flex-end;
        gap:7px;
        max-width:100%;
      }

      .mw-group-line.mine {
        justify-content:flex-end;
      }

      .mw-group-avatar {
        width:32px;
        height:32px;
        flex:none;
        border-radius:50%;
        object-fit:cover;
        background:#346253;
      }

      .mw-group-bubble {
        width:fit-content;
        max-width:min(82%,480px);
        padding:8px 11px;
        border-radius:13px;
        background:#2d4c5c;
        overflow-wrap:anywhere;
        white-space:pre-wrap;
      }

      .mw-group-line.mine .mw-group-bubble {
        background:#486748;
      }

      .mw-group-bubble p {
        margin:4px 0;
      }

      .mw-group-bubble small {
        display:block;
        color:#c5d4d7;
        font-size:10px;
        text-align:right;
        margin-top:4px;
      }

      .mw-group-bubble img {
        max-width:100%;
        max-height:260px;
        object-fit:contain;
        border-radius:10px;
        display:block;
        margin:5px 0;
      }

      .mw-group-author {
        font-size:12px;
        color:#acd9e5;
        font-weight:800;
      }

      .mw-group-verified {
        color:#5eafff;
        margin-left:4px;
      }

      .mw-group-form {
        display:flex;
        align-items:center;
        gap:8px;
        margin-top:10px;
      }

      .mw-group-text {
        flex:1;
        min-width:0;
        border:1px solid #4e6c75;
        background:#0e2430;
        color:white;
        border-radius:12px;
        padding:11px 12px;
      }

      .mw-group-btn {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:6px;
        padding:9px 12px;
        border:1px solid #63967c;
        border-radius:10px;
        background:#a7e2ac;
        color:#13222c;
        font-weight:750;
        cursor:pointer;
      }

      .mw-group-btn.secondary {
        background:#294652;
        border-color:#527880;
        color:#f0f7f1;
      }

      .mw-group-btn:disabled {
        opacity:.5;
      }

      .mw-group-note {
        margin:7px 0;
        font-size:12px;
        color:#bad0d2;
      }

      @media(max-width:440px) {
        .mw-group-room {
          padding:9px;
        }

        .mw-group-bubble {
          max-width:80%;
        }

        .mw-group-btn {
          padding:8px;
        }
      }
    `;

    document.head.append(style);
  }

  function createUI() {
    if (!$("chatWrap") || $("mwGroupEntry")) return;

    installStyles();

    $("chatWrap").insertAdjacentHTML(
      "afterbegin",
      `
      <button id="mwGroupEntry"
        class="mw-group-entry"
        type="button">
        ${icon("group", 30)}
        <span style="flex:1">
          <b>Minecraft World | Umumiy chat</b>
          <small id="mwGroupStatus">
            Barcha o‘yinchilar uchun
          </small>
        </span>
        ${icon("back")}
      </button>

      <section id="mwGroupRoom"
        class="mw-group-room" hidden>

        <div class="mw-group-top">
          <b>
            ${icon("group")}
            Minecraft World | Umumiy chat
          </b>

          <div style="display:flex;gap:7px">
            <button id="mwGroupLeave"
              class="mw-group-btn secondary"
              type="button">
              ${icon("leave", 17)}
              Chiqish
            </button>

            <button id="mwGroupBack"
              class="mw-group-btn secondary"
              type="button">
              ${icon("back", 17)}
              Orqaga
            </button>
          </div>
        </div>

        <div id="mwGroupFeed"
          class="mw-group-feed"
          role="log">
        </div>

        <form id="mwGroupForm"
          class="mw-group-form">

          <label class="mw-group-btn secondary"
            title="Rasm yuborish">
            ${icon("image")}

            <input id="mwGroupImage"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden>
          </label>

          <input id="mwGroupText"
            class="mw-group-text"
            maxlength="1000"
            placeholder="Xabar yozish..."
            autocomplete="off">

          <button id="mwGroupSend"
            class="mw-group-btn"
            type="submit">
            ${icon("send")}
          </button>
        </form>

        <div id="mwGroupFilename"
          class="mw-group-note">
        </div>
      </section>

      <section id="mwGroupJoin"
        class="mw-group-room" hidden>

        <p>
          Guruhdan chiqib ketgansiz.
          Istalgan payt qayta qo‘shilishingiz mumkin.
        </p>

        <button id="mwGroupRejoin"
          class="mw-group-btn"
          type="button">
          Guruhga qayta qo‘shilish
        </button>

        <button id="mwGroupJoinBack"
          class="mw-group-btn secondary"
          type="button">
          Orqaga
        </button>
      </section>
      `
    );

    $("mwGroupEntry").onclick = () =>
      openGroup().catch(fail);

    $("mwGroupBack").onclick = back;
    $("mwGroupJoinBack").onclick = back;

    $("mwGroupRejoin").onclick = () =>
      setMembership(true).catch(fail);

    $("mwGroupLeave").onclick = () => {
      if (confirm(
        "Umumiy chatdan chiqasizmi? Keyin qayta qo‘shila olasiz."
      )) {
        setMembership(false).catch(fail);
      }
    };

    $("mwGroupImage").onchange = () => {
      $("mwGroupFilename").textContent =
        $("mwGroupImage").files[0]?.name || "";
    };

    $("mwGroupForm").onsubmit = e => {
      e.preventDefault();
      sendMessage().catch(fail);
    };

    $("chatBack")?.addEventListener("click", () => {
      state.open = false;
      $("mwGroupEntry").hidden = false;
    });

    const detail = $("chatDetail");

    new MutationObserver(() => {
      if (!detail.hidden) {
        state.open = false;
        $("mwGroupRoom").hidden = true;
        $("mwGroupJoin").hidden = true;
        $("mwGroupEntry").hidden = false;
      }
    }).observe(detail, {
      attributes: true,
      attributeFilter: ["hidden"]
    });
  }

  async function syncAuth() {
    if (!state.db) return;

    const result = check(
      await state.db.auth.getUser()
    );

    const uid = result.user?.id || null;

    if (uid === state.uid) return;

    state.uid = uid;
    state.member = false;
    state.open = false;

    if (state.subscription) {
      await state.db.removeChannel(state.subscription);
      state.subscription = null;
    }

    back();

    if (uid) await loadMembership();
  }

  async function loadMembership() {
    if (!state.uid) return;

    let row = check(
      await state.db
        .from("v2_group_members")
        .select("active")
        .eq("user_id", state.uid)
        .maybeSingle()
    );

    if (!row) {
      check(
        await state.db
          .from("v2_group_members")
          .insert({ user_id: state.uid })
      );

      row = { active: true };
    }

    state.member = !!row.active;

    $("mwGroupStatus").textContent =
      state.member
        ? "Guruhga a’zosiz"
        : "Qayta qo‘shilish mumkin";
  }

  async function setMembership(active) {
    if (!state.uid) {
      notice("Akkauntga kiring");
      return;
    }

    check(
      await state.db
        .from("v2_group_members")
        .update({
          active,
          changed_at: new Date().toISOString()
        })
        .eq("user_id", state.uid)
    );

    state.member = active;

    $("mwGroupStatus").textContent =
      active
        ? "Guruhga a’zosiz"
        : "Guruhdan chiqdingiz";

    if (!active) {
      if (state.subscription) {
        await state.db.removeChannel(state.subscription);
        state.subscription = null;
      }

      $("mwGroupRoom").hidden = true;
      $("mwGroupJoin").hidden = false;

      notice("Guruhdan chiqdingiz");
    } else {
      $("mwGroupJoin").hidden = true;
      $("mwGroupRoom").hidden = false;

      state.open = true;

      await loadMessages();
      subscribe();

      notice("Guruhga qayta qo‘shildingiz");
    }
  }

  async function openGroup() {
    await syncAuth();

    if (!state.uid) {
      notice("Avval akkauntga kiring");
      return;
    }

    await loadMembership();

    state.open = true;

    $("chatDetail").hidden = true;
    $("conversationList").hidden = true;
    $("mwGroupEntry").hidden = true;

    $("mwGroupJoin").hidden = state.member;
    $("mwGroupRoom").hidden = !state.member;

    if (state.member) {
      await loadMessages();
      subscribe();
    }
  }

  function back() {
    state.open = false;

    if ($("mwGroupEntry"))
      $("mwGroupEntry").hidden = false;

    if ($("mwGroupRoom"))
      $("mwGroupRoom").hidden = true;

    if ($("mwGroupJoin"))
      $("mwGroupJoin").hidden = true;

    if ($("conversationList"))
      $("conversationList").hidden = false;
  }

  function getAvatar(user) {
    if (!user?.avatar_path) {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg"
          width="80" height="80">
          <circle cx="40" cy="40" r="40"
            fill="#356b58"/>
          <circle cx="40" cy="28" r="15"
            fill="#b6e6b6"/>
          <path d="M10 78Q10 47 40 47T70 78"
            fill="#b6e6b6"/>
        </svg>
      `;

      return "data:image/svg+xml," +
        encodeURIComponent(svg);
    }

    return state.db.storage
      .from("mc-avatars")
      .getPublicUrl(user.avatar_path)
      .data.publicUrl;
  }

  async function loadMessages() {
    if (
      !state.open ||
      !state.member ||
      !state.uid
    ) return;

    const messages = check(
      await state.db
        .from("v2_group_messages")
        .select(
          "id,sender_id,body,image_path,created_at"
        )
        .order("created_at", {
          ascending: false
        })
        .limit(100)
    ).reverse();

    const ids = [
      ...new Set(messages.map(x => x.sender_id))
    ];

    let people = [];
    let badges = [];

    if (ids.length) {
      [people, badges] = await Promise.all([
        state.db
          .from("mc_profiles")
          .select(
            "id,username,nickname,avatar_path"
          )
          .in("id", ids)
          .then(check),

        state.db
          .from("v2_badges")
          .select("user_id,expires_at")
          .in("user_id", ids)
          .then(check)
      ]);
    }

    const users = new Map(
      people.map(x => [x.id, x])
    );

    const verified = new Set(
      badges
        .filter(x =>
          !x.expires_at ||
          Date.parse(x.expires_at) > Date.now()
        )
        .map(x => x.user_id)
    );

    const images = new Map();

    await Promise.all(
      messages
        .filter(x => x.image_path)
        .map(async message => {
          try {
            const r = check(
              await state.db.storage
                .from("v2-group-images")
                .createSignedUrl(
                  message.image_path,
                  120
                )
            );

            images.set(message.id, r.signedUrl);
          } catch (e) {
            console.warn(e);
          }
        })
    );

    const feed = $("mwGroupFeed");

    const nearBottom =
      feed.scrollHeight -
      feed.scrollTop -
      feed.clientHeight < 110;

    feed.innerHTML = messages.map(message => {
      const user =
        users.get(message.sender_id) || {};

      const mine =
        message.sender_id === state.uid;

      const name =
        user.nickname ||
        user.username ||
        "O‘yinchi";

      const time = new Date(
        message.created_at
      ).toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const imageUrl = images.get(message.id);

      return `
        <div class="mw-group-line ${mine ? "mine" : ""}">
          ${mine ? "" : `
            <img class="mw-group-avatar"
              src="${esc(getAvatar(user))}"
              alt="Avatar">
          `}

          <div class="mw-group-bubble">
            ${mine ? "" : `
              <div class="mw-group-author">
                ${esc(name)}
                ${verified.has(message.sender_id)
                  ? '<span class="mw-group-verified">✓</span>'
                  : ""}
              </div>
            `}

            ${message.body
              ? `<p>${esc(message.body)}</p>`
              : ""}

            ${imageUrl
              ? `<img src="${esc(imageUrl)}"
                   alt="Guruh rasmi"
                   loading="lazy">`
              : message.image_path
                ? "<p>Rasm ochilmadi</p>"
                : ""}

            <small>
              ${esc(time)}

              ${mine ? `
                <button type="button"
                  data-group-delete="${esc(message.id)}"
                  title="O‘chirish"
                  style="border:0;background:none;
                  color:inherit;cursor:pointer">
                  ${icon("trash", 13)}
                </button>
              ` : ""}
            </small>
          </div>
        </div>
      `;
    }).join("") ||
      "<p>Hali xabar yo‘q. Birinchi bo‘lib yozing.</p>";

    if (nearBottom || messages.length < 4) {
      feed.scrollTop = feed.scrollHeight;
    }

    feed.querySelectorAll(
      "[data-group-delete]"
    ).forEach(button => {
      button.onclick = async () => {
        if (!confirm("Xabar o‘chirilsinmi?"))
          return;

        try {
          check(
            await state.db
              .from("v2_group_messages")
              .delete()
              .eq(
                "id",
                button.dataset.groupDelete
              )
          );

          await loadMessages();
        } catch (e) {
          fail(e);
        }
      };
    });
  }

  async function sendMessage() {
    if (
      state.busy ||
      !state.member ||
      !state.uid
    ) return;

    const body =
      $("mwGroupText").value.trim();

    const file =
      $("mwGroupImage").files[0];

    if (!body && !file) return;

    if (
      file &&
      (
        ![
          "image/jpeg",
          "image/png",
          "image/webp"
        ].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
    ) {
      throw Error(
        "Rasm JPG, PNG yoki WEBP bo‘lsin. 5 MB gacha."
      );
    }

    state.busy = true;
    $("mwGroupSend").disabled = true;

    let imagePath = null;

    try {
      if (file) {
        const extensions = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp"
        };

        const ext = extensions[file.type];

        imagePath =
          state.uid + "/" +
          crypto.randomUUID() + "." + ext;

        check(
          await state.db.storage
            .from("v2-group-images")
            .upload(imagePath, file, {
              upsert: false,
              contentType: file.type
            })
        );
      }

      check(
        await state.db
          .from("v2_group_messages")
          .insert({
            sender_id: state.uid,
            body,
            image_path: imagePath
          })
      );

      $("mwGroupText").value = "";
      $("mwGroupImage").value = "";
      $("mwGroupFilename").textContent = "";

      await loadMessages();

    } catch (e) {
      if (imagePath) {
        state.db.storage
          .from("v2-group-images")
          .remove([imagePath])
          .catch(console.warn);
      }

      throw e;
    } finally {
      state.busy = false;
      $("mwGroupSend").disabled = false;
    }
  }

  function subscribe() {
    if (state.subscription || !state.db)
      return;

    state.subscription = state.db
      .channel("v2-group-chat-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "v2_group_messages"
        },
        () => {
          clearTimeout(state.refreshTimer);

          state.refreshTimer = setTimeout(
            () => loadMessages().catch(fail),
            400
          );
        }
      )
      .subscribe();
  }

  async function start() {
    createUI();

    state.db = window.MW_DB;

    if (!state.db) {
      notice(
        "Supabase ulanmagan. index.html dagi MW_DB qatorini tekshiring."
      );
      return;
    }

    await syncAuth();

    state.db.auth.onAuthStateChange(() => {
      setTimeout(() => {
        syncAuth().catch(fail);
      }, 150);
    });

    setInterval(() => {
      if (
        state.open &&
        state.member &&
        !document.hidden
      ) {
        loadMessages().catch(console.warn);
      }
    }, 15000);
  }

  window.addEventListener(
    "DOMContentLoaded",
    () => start().catch(fail)
  );
})();
