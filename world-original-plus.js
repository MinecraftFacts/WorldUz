
/* Minecraft World — original sayt uchun qo'shimcha modul */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const S = () => window.MW_ORIGINAL;
  const db = () => S()?.db;
  const uid = () => S()?.me?.id || null;

  const check = r => {
    if (r.error) throw r.error;
    return r.data;
  };

  const safe = v => String(v ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );

  const who = id => S()?.people?.find(p => p.id === id);

  const username = id => {
    const p = who(id);
    return p?.nickname || p?.username || 'O‘yinchi';
  };

  const avatar = id => {
    const p = who(id);
    return p?.avatar_path
      ? db().storage.from('mc-avatars')
          .getPublicUrl(p.avatar_path).data.publicUrl
      : '';
  };

  const date = v => new Date(v).toLocaleString('uz-UZ');

  const icon = (name, size = 20) => {
    const paths = {
      users: `<circle cx="9" cy="7" r="3"/>
        <path d="M3 21v-2a6 6 0 0 1 12 0v2
        M17 5a3 3 0 0 1 0 6
        M18 15a5 5 0 0 1 3 5"/>`,

      image: `<rect x="3" y="3" width="18"
        height="18" rx="2"/>
        <circle cx="8" cy="8" r="2"/>
        <path d="m4 18 6-6 4 4 3-3 4 4"/>`,

      send: `<path d="m22 2-7 20-4-9-9-4 20-7Z
        M22 2 11 13"/>`,

      back: `<path d="m15 18-6-6 6-6"/>`,

      check: `<path d="m4 12 5 5L20 6"/>`,

      settings: `<circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3
        M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>`
    };

    return `<svg width="${size}" height="${size}"
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">
      ${paths[name] || ''}
    </svg>`;
  };

  let badges = [];
  let follows = [];
  let meta = [];
  let groupOpen = false;
  let groupMember = false;
  let groupBusy = false;
  let groupTimer = null;
  let decorateTimer = null;

  function warn(e) {
    console.error('[Minecraft World Plus]', e);
    alert(e?.message || String(e));
  }

  function verified(id) {
    const b = badges.find(x => x.user_id === id);

    return b && (
      !b.expires_at ||
      new Date(b.expires_at) > new Date()
    )
      ? `<span class="mwplus-blue"
          title="Tasdiqlangan">
          ${icon('check', 13)}
        </span>`
      : '';
  }

  function popup(html) {
    let x = $('mwplus-popup');

    if (!x) {
      x = document.createElement('div');
      x.id = 'mwplus-popup';
      document.body.append(x);
    }

    x.hidden = false;

    x.innerHTML = `
      <div class="mwplus-dialog">
        <button class="btn secondary small"
          data-mw-close style="float:right">
          Yopish
        </button>
        ${html}
      </div>
    `;
  }

  function close() {
    if ($('mwplus-popup')) {
      $('mwplus-popup').hidden = true;
    }
  }

  const style = `
    .mwplus-blue {
      display:inline-grid;
      place-items:center;
      background:#168cf4;
      color:white;
      border-radius:50%;
      width:19px;
      height:19px;
      vertical-align:middle;
    }

    #mwplus-popup {
      position:fixed;
      inset:0;
      z-index:100;
      background:#000b;
      display:grid;
      place-items:center;
      padding:13px;
    }

    #mwplus-popup[hidden] {
      display:none;
    }

    .mwplus-dialog {
      width:min(690px,100%);
      max-height:90dvh;
      overflow:auto;
      background:#172d3b;
      border:1px solid #648b8a;
      border-radius:20px;
      padding:18px;
      color:#eef5f2;
    }

    .mwplus-stats {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:7px;
      margin:15px 0;
    }

    .mwplus-stats button {
      display:grid;
      gap:3px;
      border:0;
      border-radius:12px;
      padding:12px 3px;
      background:#2d4855;
      color:inherit;
    }

    .mwplus-person {
      display:flex;
      align-items:center;
      gap:10px;
      width:100%;
      padding:9px;
      background:none;
      border:0;
      border-bottom:1px solid #486071;
      color:inherit;
      text-align:left;
    }

    .mwplus-person img,
    .mwplus-author img,
    .mwplus-chat-avatar {
      width:37px;
      height:37px;
      border-radius:50%;
      object-fit:cover;
      background:#345b59;
    }

    .mwplus-author {
      display:flex;
      align-items:center;
      gap:7px;
      border:0;
      background:none;
      color:#c5e6f5;
      padding:5px 0;
      cursor:pointer;
    }

    .mwplus-author img {
      width:26px;
      height:26px;
    }

    .mwplus-tag {
      display:inline-block;
      border:1px solid #638b88;
      color:#c8e8da;
      border-radius:20px;
      padding:2px 8px;
      font-size:11px;
      margin-top:6px;
    }

    .mwplus-group-open {
      width:100%;
      display:flex;
      gap:12px;
      align-items:center;
      padding:13px;
      background:#28504a;
      color:white;
      border:1px solid #568b76;
      border-radius:15px;
      text-align:left;
      margin:10px 0;
    }

    #mwplus-group-view {
      max-width:760px;
      margin:12px auto;
      padding:12px;
      border:1px solid #527582;
      border-radius:17px;
      background:#182d3b;
    }

    .mwplus-feed {
      display:flex;
      flex-direction:column;
      gap:10px;
      background:#0d1e2d;
      min-height:270px;
      max-height:56vh;
      overflow:auto;
      padding:12px;
      border-radius:13px;
    }

    .mwplus-line {
      display:flex;
      gap:7px;
      align-items:end;
    }

    .mwplus-line.mine {
      justify-content:end;
    }

    .mwplus-bubble {
      width:fit-content;
      max-width:min(79%,470px);
      background:#31495d;
      border-radius:14px;
      padding:9px 12px;
      overflow-wrap:anywhere;
      white-space:pre-wrap;
    }

    .mwplus-line.mine .mwplus-bubble {
      background:#516344;
    }

    .mwplus-bubble small {
      display:block;
      text-align:right;
      font-size:10px;
      opacity:.75;
    }

    .mwplus-bubble img {
      max-width:100%;
      max-height:270px;
      display:block;
      object-fit:contain;
      border-radius:9px;
    }

    .mwplus-compose {
      display:flex;
      gap:8px;
      align-items:center;
      margin-top:12px;
    }

    .mwplus-compose input[type=text] {
      flex:1;
      min-width:0;
    }

    .mwplus-leaves {
      pointer-events:none;
      position:fixed;
      inset:0;
      overflow:hidden;
      z-index:0;
      opacity:.22;
    }

    .mwplus-leaf {
      position:absolute;
      top:-10%;
      left:var(--x);
      color:#cf925d;
      animation:mwplus-fall var(--t) linear infinite;
      animation-delay:var(--d);
    }

    @keyframes mwplus-fall {
      to {
        transform:translate(90px,115vh)
          rotate(550deg);
      }
    }

    @media(prefers-reduced-motion:reduce) {
      .mwplus-leaves { display:none; }
    }
  `;

  async function reload() {
    if (!db()) return;

    const r = await Promise.allSettled([
      db().from('v2_badges')
        .select('user_id,expires_at'),

      db().from('v2_follows')
        .select('follower_id,following_id'),

      db().from('v2_mod_meta')
        .select('mod_id,edition,game_version')
    ]);

    if (r[0].status === 'fulfilled' &&
        !r[0].value.error) {
      badges = r[0].value.data || [];
    }

    if (r[1].status === 'fulfilled' &&
        !r[1].value.error) {
      follows = r[1].value.data || [];
    }

    if (r[2].status === 'fulfilled' &&
        !r[2].value.error) {
      meta = r[2].value.data || [];
    }

    decorate();
  }

  function decorate() {
    const cards = document.querySelectorAll(
      '#mod-grid [data-mod],' +
      '#mine-grid [data-mod],' +
      '#saved-grid [data-mod]'
    );

    for (const card of cards) {
      const m = S().mods.find(
        x => x.id === card.dataset.mod
      );

      if (!m) continue;

      const root = card.querySelector('.cardmain');
      if (!root) continue;

      let button = root.querySelector('.mwplus-author');

      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'mwplus-author';
        button.dataset.mwProfile = m.user_id;

        const old = root.querySelector('small');

        if (old) old.replaceWith(button);
        else root.prepend(button);
      }

      const purl = avatar(m.user_id);

      const html = `
        ${purl ? `
          <img src="${safe(purl)}" alt="">
        ` : ''}
        <span>${safe(username(m.user_id))}</span>
        ${verified(m.user_id)}
      `;

      if (button.innerHTML !== html) {
        button.innerHTML = html;
      }

      const z = meta.find(x => x.mod_id === m.id);

      if (z) {
        let tag = root.querySelector('.mwplus-tag');

        if (!tag) {
          tag = document.createElement('span');
          tag.className = 'mwplus-tag';
          root.append(tag);
        }

        tag.textContent =
          `${z.edition} · ${z.game_version}`;
      }

      const q = $('mwplus-version')
        ?.value.trim().toLowerCase();

      if (card.closest('#mod-grid')) {
        card.hidden = !!q &&
          !(z?.game_version || '')
            .toLowerCase().includes(q);
      }
    }

    if (uid() && $('profile-box') &&
        !$('mwplus-stats')) {

      const top = $('profile-box')
        .querySelector('.panel.row');

      if (top) {
        const box = document.createElement('div');
        box.id = 'mwplus-stats';
        box.className = 'mwplus-stats';
        top.after(box);
      }
    }

    const x = $('mwplus-stats');

    if (x && uid()) {
      const id = uid();

      const n = S().mods.filter(
        m => m.user_id === id &&
             m.status === 'approved'
      ).length;

      const html = `
        <button data-mw-profile="${id}">
          <b>${n}</b>
          Postlar
        </button>

        <button data-mw-list="followers"
          data-uid="${id}">
          <b>${follows.filter(
            f => f.following_id === id
          ).length}</b>
          Obunachilar
        </button>

        <button data-mw-list="following"
          data-uid="${id}">
          <b>${follows.filter(
            f => f.follower_id === id
          ).length}</b>
          Obunalar
        </button>
      `;

      if (x.innerHTML !== html) {
        x.innerHTML = html;
      }
    }
  }

  function userRow(id) {
    return `
      <button class="mwplus-person"
        data-mw-profile="${safe(id)}">

        ${avatar(id) ? `
          <img src="${safe(avatar(id))}" alt="">
        ` : ''}

        <span>
          ${safe(username(id))} ${verified(id)}
          <br>
          <small>@${safe(who(id)?.username || '')}</small>
        </span>
      </button>
    `;
  }

  function listFollowers(id, kind) {
    const ids = follows
      .filter(f =>
        kind === 'followers'
          ? f.following_id === id
          : f.follower_id === id
      )
      .map(f =>
        kind === 'followers'
          ? f.follower_id
          : f.following_id
      );

    popup(`
      <h2>
        ${kind === 'followers'
          ? 'Obunachilar'
          : 'Obunalar'}
      </h2>

      ${ids.map(userRow).join('') ||
        '<p>Hali hech kim yo‘q</p>'}
    `);
  }

  function userProfile(id) {
    const p = who(id);
    if (!p) return;

    const posts = S().mods.filter(
      m => m.user_id === id &&
           m.status === 'approved'
    );

    const f = follows.some(
      x => x.follower_id === uid() &&
           x.following_id === id
    );

    popup(`
      <div class="row">
        <img class="avatar"
          src="${safe(avatar(id))}" alt="">

        <div>
          <h2>
            ${safe(username(id))}
            ${verified(id)}
          </h2>

          <small>
            @${safe(p.username)}
            · ID #${safe(p.public_id)}
          </small>
        </div>
      </div>

      <div class="mwplus-stats">
        <button data-mw-posts="${id}">
          <b>${posts.length}</b>
          Postlar
        </button>

        <button data-mw-list="followers"
          data-uid="${id}">
          <b>${follows.filter(
            x => x.following_id === id
          ).length}</b>
          Obunachilar
        </button>

        <button data-mw-list="following"
          data-uid="${id}">
          <b>${follows.filter(
            x => x.follower_id === id
          ).length}</b>
          Obunalar
        </button>
      </div>

      <p style="white-space:pre-wrap;
        overflow-wrap:anywhere">
        ${safe(p.bio || '')}
      </p>

      ${uid() && uid() !== id ? `
        <div class="row wrap">
          <button class="btn"
            data-mw-follow="${id}">
            ${f
              ? 'Obunani bekor qilish'
              : 'Obuna bo‘lish'}
          </button>

          <button class="btn secondary"
            data-mw-original-person="${id}">
            Do‘stlik va xabar
          </button>
        </div>
      ` : ''}

      <h3 id="mwplus-posts"
        style="margin-top:16px">
        Modlari
      </h3>

      <div class="grid">
        ${posts.map(m => `
          <article class="card"
            data-mw-mod="${m.id}"
            style="padding:10px">
            <b>${safe(m.title)}</b>
          </article>
        `).join('') || '<p>Mod yo‘q</p>'}
      </div>
    `);
  }

  async function follow(id) {
    if (!uid()) {
      throw Error('Avval akkauntga kiring');
    }

    const exists = follows.some(
      f => f.follower_id === uid() &&
           f.following_id === id
    );

    if (exists) {
      check(
        await db().from('v2_follows')
          .delete()
          .eq('follower_id', uid())
          .eq('following_id', id)
      );
    } else {
      check(
        await db().from('v2_follows')
          .insert({
            follower_id: uid(),
            following_id: id
          })
      );
    }

    await reload();
    userProfile(id);
  }

  async function settings() {
    if (!uid()) {
      return alert('Avval akkauntga kiring');
    }

    const b = badges.find(
      x => x.user_id === uid()
    );

    const valid = b && (
      !b.expires_at ||
      new Date(b.expires_at) > new Date()
    );

    const req = check(
      await db().from('v2_badge_requests')
        .select('status,created_at')
        .eq('user_id', uid())
        .order('created_at', {
          ascending: false
        })
        .limit(3)
    );

    const pending = req.some(
      x => x.status === 'pending'
    );

    const deleted = S().mods.filter(
      m => m.user_id === uid() &&
           m.status === 'trashed'
    );

    popup(`
      <h2>Sozlamalar</h2>

      <div class="panel">
        <h3>Ko‘k tasdiq belgisi</h3>

        ${valid ? `
          <p>
            Tasdiqlangan.
            Muddat:
            ${b.expires_at
              ? date(b.expires_at)
              : 'Muddatsiz'}
          </p>
        ` : pending ? `
          <p>So‘rovingiz tekshiruvda.</p>
        ` : `
          <form id="mwplus-badge-form">
            <textarea class="field"
              minlength="10"
              maxlength="700"
              required
              placeholder="Tasdiqlash uchun sabab">
            </textarea>

            <button class="btn">
              So‘rov yuborish
            </button>
          </form>
        `}
      </div>

      <div class="panel">
        <h3>O‘chirilgan modlar</h3>

        <p class="muted">
          Tiklash yoki butunlay o‘chirish mumkin.
          7 kundan keyingi avtomatik tozalash
          serverda alohida sozlanadi.
        </p>

        ${deleted.map(m => `
          <div class="row wrap"
            style="padding:8px 0">

            <b>${safe(m.title)}</b>

            <button class="btn small"
              data-mw-restore="${m.id}">
              Tiklash
            </button>

            <button class="btn danger small"
              data-mw-delete="${m.id}">
              Butunlay o‘chirish
            </button>
          </div>
        `).join('') || 'O‘chirilgan mod yo‘q'}
      </div>
    `);
  }

  function mount() {
    if ($('mod-grid') && !$('mwplus-version')) {
      const input = document.createElement('input');

      input.id = 'mwplus-version';
      input.className = 'field search';
      input.placeholder =
        'Minecraft versiyasini qidirish';

      $('category-list')?.after(input);

      input.addEventListener('input', decorate);
    }

    if ($('chat-list') &&
        !$('mwplus-group-button')) {

      const b = document.createElement('button');
      b.type = 'button';
      b.id = 'mwplus-group-button';
      b.className = 'mwplus-group-open';

      b.innerHTML = `
        ${icon('users', 27)}
        <span>
          <b>Minecraft World | Umumiy guruh</b>
          <br>
          <small>Hamma uchun chat</small>
        </span>
      `;

      $('conversation-list')?.before(b);

      const room = document.createElement('section');

      room.id = 'mwplus-group-view';
      room.hidden = true;

      $('chat-wrap')?.append(room);
    }
  }

  async function membership() {
    let r = check(
      await db().from('v2_group_members')
        .select('active')
        .eq('user_id', uid())
        .maybeSingle()
    );

    if (!r) {
      check(
        await db().from('v2_group_members')
          .insert({ user_id: uid() })
      );

      r = { active: true };
    }

    return !!r.active;
  }

  async function openGroup() {
    if (!uid()) {
      return alert('Avval akkauntga kiring');
    }

    groupMember = await membership();
    groupOpen = true;

    $('chat-list').hidden = true;
    $('chat-detail').hidden = true;
    $('mwplus-group-view').hidden = false;

    $('mwplus-group-view').innerHTML = `
      <div class="row between wrap">
        <h3>
          ${icon('users')}
          Umumiy guruh
        </h3>

        <div class="row">
          <button class="btn secondary small"
            data-mw-group-leave>
            Chiqish
          </button>

          <button class="btn secondary small"
            data-mw-group-back>
            Orqaga
          </button>
        </div>
      </div>

      <div id="mwplus-group-join"
        ${groupMember ? 'hidden' : ''}>

        <p>Guruhga a’zo emassiz.</p>

        <button class="btn"
          data-mw-group-join>
          Qayta qo‘shilish
        </button>
      </div>

      <div id="mwplus-group-content"
        ${groupMember ? '' : 'hidden'}>

        <div class="mwplus-feed"
          id="mwplus-group-feed">
        </div>

        <form id="mwplus-group-form"
          class="mwplus-compose">

          <label class="btn secondary"
            title="Rasm">
            ${icon('image')}
            <input type="file"
              id="mwplus-group-image"
              accept="image/jpeg,image/png,image/webp"
              hidden>
          </label>

          <input class="field"
            type="text"
            maxlength="1000"
            id="mwplus-group-text"
            style="margin:0"
            placeholder="Xabar yozish...">

          <button class="btn"
            aria-label="Yuborish">
            ${icon('send')}
          </button>
        </form>
      </div>
    `;

    if (groupMember) {
      await renderGroup();
    }
  }

  function closeGroup() {
    groupOpen = false;
    $('mwplus-group-view').hidden = true;
    $('chat-list').hidden = false;
  }

  async function renderGroup() {
    if (!groupOpen || !groupMember) return;

    const rows = check(
      await db().from('v2_group_messages')
        .select(
          'id,sender_id,body,image_path,created_at'
        )
        .order('created_at', {
          ascending: false
        })
        .limit(100)
    ).reverse();

    const images = new Map();

    await Promise.all(
      rows.filter(m => m.image_path)
        .map(async m => {
          const r = await db().storage
            .from('v2-group-images')
            .createSignedUrl(m.image_path, 100);

          if (!r.error) {
            images.set(m.id, r.data.signedUrl);
          }
        })
    );

    const feed = $('mwplus-group-feed');
    if (!feed) return;

    const scroll =
      feed.scrollHeight -
      feed.scrollTop -
      feed.clientHeight < 100;

    feed.innerHTML = rows.map(m => {
      const mine = m.sender_id === uid();
      const src = avatar(m.sender_id);

      return `
        <div class="mwplus-line ${mine ? 'mine' : ''}">

          ${!mine && src ? `
            <img class="mwplus-chat-avatar"
              src="${safe(src)}" alt="">
          ` : ''}

          <div class="mwplus-bubble">

            ${!mine ? `
              <b>
                ${safe(username(m.sender_id))}
                ${verified(m.sender_id)}
              </b>
            ` : ''}

            ${m.body ? `
              <div>${safe(m.body)}</div>
            ` : ''}

            ${images.has(m.id) ? `
              <img src="${safe(images.get(m.id))}"
                alt="Chat rasmi">
            ` : ''}

            <small>${date(m.created_at)}</small>
          </div>
        </div>
      `;
    }).join('') || '<p>Hali xabar yo‘q</p>';

    if (scroll) {
      feed.scrollTop = feed.scrollHeight;
    }
  }

  async function sendGroup(form) {
    if (groupBusy || !groupMember || !uid()) return;

    const body =
      $('mwplus-group-text').value.trim();

    const file =
      $('mwplus-group-image').files[0];

    if (!body && !file) return;

    if (
      file &&
      (
        ![
          'image/jpeg',
          'image/png',
          'image/webp'
        ].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
    ) {
      throw Error(
        '5 MB gacha JPG/PNG/WEBP rasm tanlang'
      );
    }

    groupBusy = true;
    let path = null;

    try {
      if (file) {
        const ext =
          file.type === 'image/jpeg' ? 'jpg' :
          file.type === 'image/png' ? 'png' :
          'webp';

        path = `${uid()}/${crypto.randomUUID()}.${ext}`;

        check(
          await db().storage
            .from('v2-group-images')
            .upload(path, file, {
              contentType: file.type
            })
        );
      }

      check(
        await db().from('v2_group_messages')
          .insert({
            sender_id: uid(),
            body,
            image_path: path
          })
      );

      form.reset();
      await renderGroup();

    } catch (e) {
      if (path) {
        db().storage
          .from('v2-group-images')
          .remove([path])
          .catch(console.warn);
      }

      throw e;
    } finally {
      groupBusy = false;
    }
  }

  async function toggleGroup(active) {
    check(
      await db().from('v2_group_members')
        .update({ active })
        .eq('user_id', uid())
    );

    groupMember = active;
    await openGroup();
  }

  function bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest(
        '#settings-btn,' +
        '[data-mw-profile],' +
        '[data-mw-list],' +
        '[data-mw-posts],' +
        '[data-mw-follow],' +
        '[data-mw-mod],' +
        '[data-mw-original-person],' +
        '[data-mw-close],' +
        '[data-mw-restore],' +
        '[data-mw-delete],' +
        '#mwplus-group-button,' +
        '[data-mw-group-back],' +
        '[data-mw-group-leave],' +
        '[data-mw-group-join]'
      );

      if (!b) return;

      if (b.matches('#settings-btn')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        settings().catch(warn);
        return;
      }

      if (b.dataset.mwProfile) {
        e.preventDefault();
        e.stopImmediatePropagation();
        userProfile(b.dataset.mwProfile);
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      (async () => {
        if (b.dataset.mwList) {
          listFollowers(
            b.dataset.uid,
            b.dataset.mwList
          );

        } else if (b.dataset.mwPosts) {
          userProfile(b.dataset.mwPosts);

        } else if (b.dataset.mwFollow) {
          await follow(b.dataset.mwFollow);

        } else if (b.dataset.mwMod) {
          close();
          await window.MW_OPEN_MOD(b.dataset.mwMod);

        } else if (b.dataset.mwOriginalPerson) {
          close();
          await window.MW_SHOW_PERSON(
            b.dataset.mwOriginalPerson
          );

        } else if (
          b.hasAttribute('data-mw-close')
        ) {
          close();

        } else if (
          b.dataset.mwRestore ||
          b.dataset.mwDelete
        ) {
          close();

          await window.MW_MOD_ACTION(
            b.dataset.mwRestore ||
            b.dataset.mwDelete,
            b.dataset.mwRestore
              ? 'restore'
              : 'purge'
          );

        } else if (
          b.id === 'mwplus-group-button'
        ) {
          await openGroup();

        } else if (
          b.hasAttribute('data-mw-group-back')
        ) {
          closeGroup();

        } else if (
          b.hasAttribute('data-mw-group-leave')
        ) {
          if (confirm('Guruhdan chiqasizmi?')) {
            await toggleGroup(false);
          }

        } else if (
          b.hasAttribute('data-mw-group-join')
        ) {
          await toggleGroup(true);
        }
      })().catch(warn);

    }, true);

    document.addEventListener('submit', e => {
      if (e.target.id === 'mwplus-badge-form') {
        e.preventDefault();
        e.stopImmediatePropagation();

        const reason = e.target
          .querySelector('textarea').value.trim();

        db().from('v2_badge_requests')
          .insert({
            user_id: uid(),
            reason
          })
          .then(check)
          .then(() => settings())
          .catch(warn);
      }

      if (e.target.id === 'mwplus-group-form') {
        e.preventDefault();
        e.stopImmediatePropagation();

        sendGroup(e.target).catch(warn);
      }
    }, true);

    document.addEventListener('click', e => {
      if (e.target === $('mwplus-popup')) {
        close();
      }
    });
  }

  function leaves() {
    if (
      matchMedia(
        '(prefers-reduced-motion:reduce)'
      ).matches
    ) return;

    const layer = document.createElement('div');
    layer.className = 'mwplus-leaves';

    for (let i = 0; i < 10; i++) {
      const x = document.createElement('span');

      x.className = 'mwplus-leaf';

      x.style.cssText = `
        --x:${i * 31 % 99}%;
        --t:${17 + i * 3}s;
        --d:-${i * 2}s
      `;

      x.innerHTML = `
        <svg width="23" height="23"
          viewBox="0 0 24 24"
          fill="currentColor">
          <path d="m12 23-2-8-6 3 2-6-5-3
          7-1-1-7 6 6 5-5 1 6 4 1-4 5
          2 5-7-4Z"/>
        </svg>
      `;

      layer.append(x);
    }

    document.body.prepend(layer);
  }

  async function start() {
    if (!S()?.db) {
      setTimeout(start, 250);
      return;
    }

    const css = document.createElement('style');
    css.textContent = style;
    document.head.append(css);

    bind();
    mount();
    leaves();
    await reload();

    const grids = [
      'mod-grid',
      'mine-grid',
      'saved-grid'
    ].map($).filter(Boolean);

    for (const x of grids) {
      new MutationObserver(() => {
        clearTimeout(decorateTimer);

        decorateTimer = setTimeout(
          decorate, 60
        );
      }).observe(x, {
        childList: true
      });
    }

    setInterval(() => {
      mount();
      decorate();

      if (
        groupOpen &&
        groupMember &&
        !document.hidden
      ) {
        renderGroup().catch(console.warn);
      }
    }, 12000);

    db().auth.onAuthStateChange(() => {
      setTimeout(
        () => reload().catch(console.warn),
        350
      );
    });
  }

  document.addEventListener(
    'DOMContentLoaded',
    () => start().catch(warn)
  );
})();
