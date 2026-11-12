
/* Minecraft World — original sayt uchun menyu va profil tuzatishlari */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const S = () => window.MW_ORIGINAL;
  const db = () => S()?.db;
  const uid = () => S()?.me?.id || null;

  const esc = v => String(v ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );

  const ok = r => {
    if (r.error) throw r.error;
    return r.data;
  };

  const icons = {
    game: `<rect x="2" y="7" width="20" height="12" rx="5"/>
      <path d="M8 10v6m-3-3h6m6-1h.01M19 15h.01"/>`,
    people: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87
      M16 3.13a4 4 0 0 1 0 7.75"/>`,
    check: `<path d="m8 12 3 3 5-6"/>
      <path d="M12 2 15 4l4-.2.7 4L22 11l-2.3 3.2-.7 4-4-.2L12 20l-3-2-4 .2-.7-4L2 11l2.3-3.2.7-4 4 .2z"/>`
  };

  function ico(type, size = 22) {
    return `<svg viewBox="0 0 24 24"
      width="${size}" height="${size}" fill="none"
      stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true">${icons[type]}</svg>`;
  }

  let badgeIds = new Set();
  let ready = false;

  const css = `
    nav.bottom {
      display:flex;
      overflow-x:auto;
      overflow-y:hidden;
      scrollbar-width:none;
      justify-content:flex-start;
    }

    nav.bottom::-webkit-scrollbar {
      display:none;
    }

    nav.bottom .nav {
      flex:0 0 67px;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      gap:2px;
      height:59px;
    }

    nav.bottom .nav span {
      font-size:10px;
      line-height:1.1;
    }

#mw-t-create-button {
  display: none !important;
}

    .mw-menu-actions {
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      margin-top:16px;
    }

    .mw-menu-actions button {
      display:inline-flex;
      align-items:center;
      gap:8px;
    }

    .mw-menu-badge {
      display:inline-flex;
      color:#33a4ff;
      vertical-align:middle;
      margin-left:5px;
    }

    .mw-menu-row {
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      align-items:center;
    }

    .mw-menu-box {
      background:#1b3442;
      border:1px solid #496d75;
      border-radius:16px;
      padding:15px;
      margin:12px 0;
    }

    .mw-menu-field {
      width:100%;
      background:#102633;
      color:#f7f7ef;
      border:1px solid #56747b;
      border-radius:10px;
      padding:10px;
      margin:6px 0 12px;
    }

    .mw-menu-grid {
      display:grid;
      grid-template-columns:
        repeat(auto-fit,minmax(230px,1fr));
      gap:12px;
    }

    .mw-menu-pill {
      display:inline-block;
      font-size:12px;
      border:1px solid #5b8181;
      border-radius:99px;
      padding:3px 8px;
      margin:3px;
    }

    .mw-menu-hint {
      color:#b5cad1;
      font-size:13px;
    }

    .mw-menu-avatar {
      width:30px;
      height:30px;
      border-radius:50%;
      object-fit:cover;
      vertical-align:middle;
    }

    @media(max-width:440px) {
      nav.bottom .nav { flex-basis:63px; }
      .mw-menu-grid { grid-template-columns:1fr; }
    }
  `;

  function person(id) {
    return S()?.people?.find(p => p.id === id);
  }

  function name(id) {
    const p = person(id);
    return p?.nickname || p?.username || 'O‘yinchi';
  }

  function avatar(id) {
    const p = person(id);

    if (!p?.avatar_path) return '';

    return db().storage.from('mc-avatars')
      .getPublicUrl(p.avatar_path).data.publicUrl;
  }

  function badge(id) {
    return badgeIds.has(id)
      ? `<span class="mw-menu-badge"
          title="Tasdiqlangan">${ico('check',18)}</span>`
      : '';
  }

  function fail(e) {
    console.error(e);
    alert('Xato: ' + (e?.message || String(e)));
  }

  function authNeeded() {
    if (uid()) return true;

    alert('Avval akkauntingizga kiring');
    window.MW_NAVIGATE('profile');
    return false;
  }

  function date(iso) {
    return new Date(iso).toLocaleString('uz-UZ', {
      dateStyle:'medium',
      timeStyle:'short'
    });
  }

  // KO'K BELGI

  async function loadBadges() {
    const rows = ok(
      await db().from('v2_badges')
        .select('user_id,expires_at')
    ) || [];

    badgeIds = new Set(
      rows.filter(b =>
        !b.expires_at ||
        Date.parse(b.expires_at) > Date.now()
      ).map(b => b.user_id)
    );

    showProfileBadge();
  }

  function showProfileBadge() {
    const title = $('profile-name');
    if (!title) return;

    const old = title.querySelector('.mw-menu-badge');
    const id = uid();

    if (!id || !badgeIds.has(id)) {
      old?.remove();
      return;
    }

    if (!old) {
      title.insertAdjacentHTML('beforeend', badge(id));
    }
  }

  // MENYU

  function go(id) {
    window.MW_NAVIGATE(id);

    if (id === 'mw-games') {
      loadGames().catch(fail);
    }

    if (id === 'mw-community') {
      loadCommunity().catch(fail);
    }
  }

  function setupUI() {
    const nav = document.querySelector('nav.bottom');
    const hero = $('home')?.querySelector('.hero');
    const main = document.querySelector('main');

    if (!nav || !hero || !main) {
      throw Error('Asosiy menyu topilmadi');
    }

    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);

    const labels = {
      home:'Asosiy',
      accounts:'Akkauntlar',
      upload:'Mod',
      chats:'Chat',
      profile:'Profil'
    };

    nav.querySelectorAll('.nav[data-page]')
      .forEach(b => {
        if (!b.querySelector('span:not(.navdot)')) {
          b.insertAdjacentHTML(
            'beforeend',
            `<span>${labels[b.dataset.page] || ''}</span>`
          );
        }
      });

    const anchor = nav.querySelector(
      '[data-page="upload"]'
    );

    anchor.insertAdjacentHTML('afterend', `
      <button type="button" class="nav"
        data-page="mw-games" title="O‘yinlar">
        ${ico('game')}
        <span>O‘yinlar</span>
      </button>

      <button type="button" class="nav"
        data-page="mw-community" title="Hamjamiyat">
        ${ico('people')}
        <span>Hamjamiyat</span>
      </button>
    `);

    nav.querySelector('[data-page="mw-games"]')
      .onclick = () => go('mw-games');

    nav.querySelector('[data-page="mw-community"]')
      .onclick = () => go('mw-community');

    hero.insertAdjacentHTML('beforeend', `
      <div class="mw-menu-actions">
        <button class="btn" id="mw-play-home">
          ${ico('game')} Birga o‘ynaymiz
        </button>

        <button class="btn secondary"
          id="mw-community-home">
          ${ico('people')} Hamjamiyat
        </button>
      </div>
    `);

    $('mw-play-home').onclick =
      () => go('mw-games');

    $('mw-community-home').onclick =
      () => go('mw-community');

    // O'YINLAR VA HAMJAMIYAT SAHIFALARI

    main.insertAdjacentHTML('beforeend', `
      <section id="mw-games" class="page">
        <h2>Birga o‘ynaymiz</h2>

        <div class="mw-menu-row">
          <button class="btn" id="mw-game-create">
            Taklif yaratish
          </button>
        </div>

        <div id="mw-game-form-wrap"
          class="mw-menu-box" hidden>

          <form id="mw-game-form">
            <label>Taklif nomi
              <input name="title"
                class="mw-menu-field"
                maxlength="100" minlength="5" required
                placeholder="Survivalga sherik kerak">
            </label>

            <div class="mw-menu-grid">
              <label>Minecraft turi
                <select name="edition"
                  class="mw-menu-field">
                  <option value="bedrock">Bedrock</option>
                  <option value="java">Java</option>
                </select>
              </label>

              <label>Minecraft versiyasi
                <input name="game_version"
                  class="mw-menu-field"
                  maxlength="35"
                  placeholder="1.21.100" required>
              </label>

              <label>Rejim
                <select name="game_mode"
                  class="mw-menu-field">
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="minigames">Minigames</option>
                  <option value="other">Boshqa</option>
                </select>
              </label>

              <label>O‘yinchilar soni
                <input name="max_players"
                  type="number" min="2" max="40"
                  value="4" class="mw-menu-field"
                  required>
              </label>
            </div>

            <label>O‘yin vaqti
              <input name="starts_at"
                type="datetime-local"
                class="mw-menu-field" required>
            </label>

            <label>Izoh
              <textarea name="description"
                maxlength="1000"
                class="mw-menu-field"
                rows="3"></textarea>
            </label>

            <button class="btn" type="submit">
              Taklifni joylash
            </button>

            <button class="btn secondary"
              type="button" id="mw-game-cancel">
              Bekor qilish
            </button>
          </form>
        </div>

        <div id="mw-game-list"></div>
      </section>


<section id="mw-community" class="page">
  <h2>Hamjamiyat</h2>

  <div class="community-grid">

    <div class="community-col">
      <div class="community-head">
        <div>
          <h3>Turnirlar</h3>
          <p class="community-sub">
            Minecraft turnirlari va ishtirokchilar
          </p>
        </div>
      </div>

      <div id="mw-tournament-list"
           class="turnir-list"></div>
    </div>

    <div class="community-side">
      <div class="clan-box">
        <h3>Minecraft klanlari</h3>

        <div class="coming-soon">
          <strong>Coming soon</strong>
          <p>Tez orada qo‘shiladi.</p>
        </div>
      </div>
    </div>

  </div>
</section>

    `);

    // HAMJAMIYAT: TURNIRLAR VA KLANLAR
    const community = $('mw-community');
    const tournamentPanel =
      community?.querySelector('.community-col');
    const clanPanel =
      community?.querySelector('.community-side');
    const communityGrid =
      community?.querySelector('.community-grid');

    if (tournamentPanel && clanPanel && communityGrid) {
      const tabs = document.createElement('div');

      tabs.className = 'mw-menu-row';
      tabs.style.cssText = `
        display:flex;
        flex-wrap:nowrap;
        gap:8px;
        margin:12px 0;
        overflow-x:auto;
      `;

      tabs.innerHTML = `
        <button type="button" class="btn small"
          id="mw-tab-tournaments">
          Turnirlar
        </button>
        <button type="button" class="btn secondary small"
          id="mw-tab-clans">
          Klanlar
        </button>
      `;

      communityGrid.before(tabs);
      communityGrid.style.display = 'block';

      function selectCommunityTab(type) {
        const isTournament = type === 'tournaments';

        tournamentPanel.style.display =
          isTournament ? 'block' : 'none';

        clanPanel.style.display =
          isTournament ? 'none' : 'block';

        tabs.querySelectorAll('button').forEach(button => {
          const selected = button.id ===
            (isTournament
              ? 'mw-tab-tournaments'
              : 'mw-tab-clans');

          button.classList.toggle('secondary', !selected);
          button.setAttribute('aria-selected', String(selected));
        });
      }

      $('mw-tab-tournaments').onclick =
        () => selectCommunityTab('tournaments');

      $('mw-tab-clans').onclick =
        () => selectCommunityTab('clans');

      selectCommunityTab('tournaments');
    }

    $('mw-game-create').onclick = () => {
      if (authNeeded()) {
        $('mw-game-form-wrap').hidden = false;
      }
    };

    $('mw-game-cancel').onclick = () => {
      $('mw-game-form-wrap').hidden = true;
    };

    $('mw-game-form').onsubmit = e => {
      e.preventDefault();
      createInvite(e.target).catch(fail);
    };

    main.addEventListener('click', e => {
      const b = e.target.closest(
        '[data-mw-join],[data-mw-reply],' +
        '[data-mw-tjoin],[data-mw-tview]'
      );

      if (!b) return;

      if (b.dataset.mwJoin) {
        joinInvite(b.dataset.mwJoin).catch(fail);
      }

      if (b.dataset.mwReply) {
        answerInvite(
          b.dataset.mwReply,
          b.dataset.accept === 'yes'
        ).catch(fail);
      }

      if (b.dataset.mwTjoin) {
        joinTournament(b.dataset.mwTjoin).catch(fail);
      }

      if (b.dataset.mwTview) {
        viewTournament(b.dataset.mwTview).catch(fail);
      }
    });

    // Profil qayta chizilganda belgini tiklash
    const title = $('profile-name');

    if (title) {
      new MutationObserver(showProfileBadge)
        .observe(title, { childList:true });
    }
  }

  // O'YIN TAKLIFLARI

  async function loadGames() {
    const list = $('mw-game-list');
    list.textContent = 'Yuklanmoqda...';

    const rows = ok(
      await db().from('v2_game_invites')
        .select('*')
        .order('starts_at', { ascending:true })
        .limit(100)
    ) || [];

    let requests = [];

    if (uid()) {
      requests = ok(
        await db().from('v2_invite_requests')
          .select('*')
      ) || [];
    }

    const now = Date.now();

    list.innerHTML = rows.map(x => {
      const own = uid() === x.creator_id;

      const ownRequest = requests.find(r =>
        r.invite_id === x.id &&
        r.user_id === uid()
      );

      const incoming = own
        ? requests.filter(r =>
            r.invite_id === x.id &&
            r.status === 'pending')
        : [];

      const open =
        x.status === 'open' &&
        Date.parse(x.starts_at) > now;

      return `
        <article class="mw-menu-box">
          <h3>${esc(x.title)}</h3>

          <p>
            <b>${esc(name(x.creator_id))}</b>
            ${badge(x.creator_id)}
          </p>

          <div>
            <span class="mw-menu-pill">
              ${esc(x.edition)}
            </span>
            <span class="mw-menu-pill">
              ${esc(x.game_version)}
            </span>
            <span class="mw-menu-pill">
              ${esc(x.game_mode)}
            </span>
            <span class="mw-menu-pill">
              ${esc(date(x.starts_at))}
            </span>
            <span class="mw-menu-pill">
              ${Number(x.max_players)} kishigacha
            </span>
          </div>

          <p>${esc(x.description)}</p>

          ${open && !own ? `
            <button class="btn small"
              data-mw-join="${x.id}"
              ${ownRequest ? 'disabled' : ''}>
              ${ownRequest
                ? 'So‘rov: ' + esc(ownRequest.status)
                : 'Qo‘shilish'}
            </button>
          ` : ''}

          ${incoming.map(r => `
            <div class="mw-menu-row">
              <b>${esc(name(r.user_id))}</b>

              <button class="btn small"
                data-mw-reply="${r.id}"
                data-accept="yes">Qabul</button>

              <button class="btn secondary small"
                data-mw-reply="${r.id}"
                data-accept="no">Rad</button>
            </div>
          `).join('')}
        </article>
      `;
    }).join('') ||
      '<p class="mw-menu-hint">Hali o‘yin takliflari yo‘q.</p>';
  }

  async function createInvite(form) {
    if (!authNeeded()) return;

    const f = new FormData(form);
    const starts = new Date(f.get('starts_at'));

    if (
      !Number.isFinite(+starts) ||
      +starts <= Date.now()
    ) {
      throw Error('Kelajakdagi sanani tanlang');
    }

    ok(
      await db().from('v2_game_invites').insert({
        creator_id:uid(),
        title:String(f.get('title')).trim(),
        edition:f.get('edition'),
        game_version:
          String(f.get('game_version')).trim(),
        game_mode:f.get('game_mode'),
        starts_at:starts.toISOString(),
        max_players:Number(f.get('max_players')),
        description:
          String(f.get('description') || '').trim()
      })
    );

    form.reset();
    $('mw-game-form-wrap').hidden = true;

    await loadGames();
  }

  async function joinInvite(id) {
    if (!authNeeded()) return;

    ok(
      await db().from('v2_invite_requests')
        .insert({
          invite_id:id,
          user_id:uid()
        })
    );

    await loadGames();
  }

  async function answerInvite(id, accept) {
    if (!authNeeded()) return;

    ok(
      await db().rpc('v2_answer_invite', {
        req_id:id,
        accept_request:accept
      })
    );

    await loadGames();
  }

  // HAMJAMIYAT — TURNIRLAR

  async function loadCommunity() {
    const box = $('mw-tournament-list');
    box.innerHTML = `
  <div class="coming-soon"
    style="text-align:center;padding:45px 15px;">
    <h2>Coming soon</h2>
    <p>Turnirlar tez orada ishga tushadi.</p>
  </div>
`;
return;


    const tournaments = ok(
      await db().from('v2_tournaments')
        .select('*')
        .order('starts_at', { ascending:false })
        .limit(80)
    ) || [];

    const result = await db()
      .from('v2_tournament_players')
      .select('tournament_id,user_id');

    const players = result.error
      ? []
      : (result.data || []);

    box.innerHTML = tournaments.map(t => {
      const people = players.filter(p =>
        p.tournament_id === t.id
      );

      const joined = people.some(p =>
        p.user_id === uid()
      );

      return `
        <div class="mw-menu-box">
          <h3>${esc(t.title)}</h3>

          <p>
            ${esc(t.edition)} ·
            ${esc(t.game_version)} ·
            ${esc(date(t.starts_at))}
          </p>

          <p>
            ${people.length}/${Number(t.bracket_size)}
            ishtirokchi
          </p>

          <div class="mw-menu-row">

<button class="btn small"
  data-mw-tview="${t.id}">
  Ishtirokchilar
</button>

<button class="btn secondary small"
  type="button"
  disabled
  title="Turnir setkasi tez orada qo‘shiladi">
  Setka — Coming soon
</button>

              uid() &&
              !joined &&
              people.length < t.bracket_size &&
              Date.parse(t.starts_at) > Date.now()
              ? `
                <button class="btn secondary small"
                  data-mw-tjoin="${t.id}">
                  Qatnashish
                </button>
              ` : ''
            }
          </div>
        </div>
      `;
    }).join('') || '<p>Hali turnirlar yo‘q.</p>';
  }

  async function joinTournament(id) {
    if (!authNeeded()) return;

    ok(
      await db().from('v2_tournament_players')
        .insert({
          tournament_id:id,
          user_id:uid()
        })
    );

    await loadCommunity();
  }


async function viewTournament(id) {
  try {
    const tournament = ok(
      await db().from('v2_tournaments')
        .select('*')
        .eq('id', id)
        .single()
    );

    const players = ok(
      await db().from('v2_tournament_players')
        .select('user_id')
        .eq('tournament_id', id)
    ) || [];

    // Eski ochilgan oynani yopamiz
    document.getElementById('mw-t-popup')?.remove();

    const empty = players.length === 0;

    const modal = document.createElement('div');
    modal.id = 'mw-t-popup';
    modal.className = 'turnir-modal show';

    modal.innerHTML = `
      <div class="turnir-modal-box ${empty ? 'small' : ''}">
        <div class="turnir-modal-head">
          <h4>Ishtirokchilar (${players.length})</h4>
          <button class="btn secondary small"
            id="mw-popup-close" type="button">
            Yopish
          </button>
        </div>

        <h3>${esc(tournament.title)}</h3>

        ${empty ? `
          <div class="turnir-empty">
            <h5>Hali ishtirokchi yo‘q</h5>
            <p>Turnirga birinchi bo‘lib qo‘shiling.</p>
          </div>
        ` : `
          <div class="turnir-users">
            ${players.map(x => `
              <div class="turnir-user">
                ${avatar(x.user_id) ? `
                  <img
                    src="${esc(avatar(x.user_id))}"
                    alt="Avatar">
                ` : `
                  <div class="avatar-fallback">
                    ${esc(name(x.user_id).charAt(0))}
                  </div>
                `}

                <div class="turnir-user-name">
                  <span>${esc(name(x.user_id))}</span>
                  ${badge(x.user_id)}
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <div style="margin-top:16px">
          <p>
            ${players.length}/${tournament.bracket_size}
            ishtirokchi
          </p>

          <div class="mw-menu-row">
            <button class="btn" id="mw-popup-join"
              type="button">
              Qatnashish
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.append(modal);

    const close = () => modal.remove();

    modal.querySelector('#mw-popup-close')
      .onclick = close;

    modal.addEventListener('click', e => {
      if (e.target === modal) close();
    });

    const join = modal.querySelector('#mw-popup-join');

    const already = players.some(
      x => x.user_id === uid()
    );

    const available =
      !already &&
      players.length < tournament.bracket_size &&
      Date.parse(tournament.starts_at) > Date.now();

    if (!available) {
      join.disabled = true;
      join.textContent = already
        ? 'Siz qatnashyapsiz'
        : 'Qabul yopilgan';
    }

    join.onclick = async () => {
      if (!authNeeded()) return;

      join.disabled = true;

      try {
        await joinTournament(id);
        close();
        await viewTournament(id);
      } catch (error) {
        join.disabled = false;
        fail(error);
      }
    };

  } catch (error) {
    fail(error);
  }
}


  async function start() {
    if (ready) return;

    if (!S()?.db) {
      setTimeout(start, 300);
      return;
    }

    ready = true;
    setupUI();

    try {
      await loadBadges();
    } catch (e) {
      console.warn('Ko‘k belgi:', e);
    }

    db().auth.onAuthStateChange(() => {
      setTimeout(() => {
        loadBadges().catch(console.warn);
        showProfileBadge();
      }, 400);
    });

    setInterval(() => {
      if (!document.hidden) {
        loadBadges().catch(console.warn);
      }
    }, 60000);
  }

  document.addEventListener(
    'DOMContentLoaded',
    () => start().catch(fail)
  );
})();
