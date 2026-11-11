
(() => {
'use strict';

const $ = id => document.getElementById(id);
const S = () => window.MW_ORIGINAL;
const db = () => S()?.db;
const uid = () => S()?.me?.id;

const safe = x => String(x ?? '').replace(
  /[&<>"']/g,
  c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c])
);

const get = r => {
  if (r.error) throw r.error;
  return r.data;
};

let busy = false;
let current = null;
let profiles = new Map();
let badgeIds = new Set();

const style = document.createElement('style');

style.textContent = `
.mwbr-overlay {
  position:fixed;
  inset:0;
  z-index:9999;
  padding:12px;
  background:#050c10df;
  display:flex;
  align-items:center;
  justify-content:center;
}
.mwbr-window {
  width:min(1100px,100%);
  max-height:94dvh;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:#183241;
  color:#f1f7f3;
  border:1px solid #62888c;
  border-radius:18px;
}
.mwbr-head {
  padding:14px;
  display:flex;
  gap:12px;
  justify-content:space-between;
  align-items:center;
  border-bottom:1px solid #476875;
}
.mwbr-head h2 {
  font-size:19px;
  margin:0;
  overflow-wrap:anywhere;
}
.mwbr-body {
  overflow:auto;
  padding:14px;
}
.mwbr-small {
  font-size:13px;
  color:#bad3d8;
  margin-bottom:12px;
}
.mwbr-rounds {
  display:flex;
  gap:12px;
  overflow-x:auto;
  padding-bottom:14px;
}
.mwbr-round {
  width:225px;
  flex:0 0 225px;
}
.mwbr-round h3 {
  font-size:15px;
  margin:0 0 10px;
}
.mwbr-match {
  border:1px solid #52717d;
  background:#0f2735;
  border-radius:12px;
  padding:8px;
  margin-bottom:10px;
}
.mwbr-match small {
  color:#a9c4c8;
}
.mwbr-player {
  display:flex;
  align-items:center;
  gap:7px;
  padding:7px 3px;
  min-height:40px;
  border-radius:8px;
}
.mwbr-player.win {
  background:#3c624b;
}
.mwbr-player img,
.mwbr-avatar {
  width:29px;
  height:29px;
  flex:0 0 29px;
  border-radius:50%;
  object-fit:cover;
  background:#426658;
}
.mwbr-name {
  flex:1;
  min-width:0;
  font-size:12px;
  overflow-wrap:anywhere;
}
.mwbr-mark {
  display:inline-block;
  color:#42a5ff;
  margin-left:3px;
}
.mwbr-choose {
  font-size:11px;
  padding:5px;
  border:1px solid #82bc9c;
  background:#315b49;
  color:white;
  border-radius:7px;
  cursor:pointer;
}
.mwbr-empty {
  padding:20px;
  border:1px dashed #698790;
  border-radius:13px;
}
.mwbr-champion {
  margin:10px 0;
  color:#b5eaa8;
  font-weight:800;
}
`;

document.head.append(style);

function person(id) {
  return profiles.get(id) ||
    S()?.people?.find(x => x.id === id) || {};
}

function portrait(id) {
  const p = person(id);

  return p.avatar_path
    ? db().storage.from('mc-avatars')
        .getPublicUrl(p.avatar_path).data.publicUrl
    : '';
}

function name(id) {
  const p = person(id);
  return p.nickname || p.username || 'Ishtirokchi';
}

const badgeSVG = `<svg width="17" height="17"
  viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#168dff"
    d="M12 1 15 3 19 3 21 7 23 10
       21 14 21 18 17 20 13 23 9 21
       5 21 3 17 1 13 3 9 3 5 7 4Z"/>
  <path d="m7 12 3 3 7-7"
    fill="none" stroke="white"
    stroke-width="3"/>
</svg>`;

function row(id, winner, owner, available, round, num) {
  const photo = id ? portrait(id) : '';

  return `
    <div class="mwbr-player ${id && id === winner ? 'win' : ''}">
      ${photo
        ? `<img src="${safe(photo)}" alt="">`
        : '<span class="mwbr-avatar"></span>'
      }

      <span class="mwbr-name">
        ${id ? safe(name(id)) : 'Kutilmoqda'}
        ${id && badgeIds.has(id)
          ? `<span class="mwbr-mark"
               title="Tasdiqlangan">${badgeSVG}</span>`
          : ''
        }
      </span>

      ${owner && available && id ? `
        <button type="button"
          class="mwbr-choose"
          data-p="${safe(id)}"
          data-r="${round}"
          data-n="${num}">
          G‘olib
        </button>
      ` : ''}
    </div>
  `;
}

function dismiss() {
  $('mwbr-popup')?.remove();
  current = null;
}

async function data(tid) {
  const [t, p, m, b] = await Promise.all([
    db().from('v2_tournaments')
      .select('id,title,owner_id,bracket_size')
      .eq('id', tid)
      .single(),

    db().from('v2_tournament_players')
      .select('user_id')
      .eq('tournament_id', tid),

    db().from('mw_tournament_matches')
      .select('round_no,match_no,player1,player2,winner')
      .eq('tournament_id', tid)
      .order('round_no')
      .order('match_no'),

    db().from('v2_badges')
      .select('user_id,expires_at')
  ]);

  const tour = get(t);
  const players = get(p) || [];
  const matches = get(m) || [];

  badgeIds = new Set(
    (b.error ? [] : b.data || [])
      .filter(x =>
        !x.expires_at ||
        Date.parse(x.expires_at) > Date.now()
      )
      .map(x => x.user_id)
  );

  const ids = [...new Set([
    ...players.map(x => x.user_id),
    ...matches.flatMap(x =>
      [x.player1,x.player2].filter(Boolean)
    )
  ])];

  profiles = new Map();

  if (ids.length) {
    const res = await db().from('mc_profiles')
      .select('id,username,nickname,avatar_path')
      .in('id', ids);

    if (!res.error) {
      profiles = new Map(
        res.data.map(x => [x.id,x])
      );
    }
  }

  return {tour,players,matches};
}

async function render(tid) {
  const {tour:t,players,matches} = await data(tid);

  if (current !== tid || !$('mwbr-body')) return;

  const size = Number(t.bracket_size);
  const owner = uid() === t.owner_id;

  if (![8,16,32].includes(size)) {
    throw Error('8, 16 yoki 32 kishilik turnir bo‘lishi kerak');
  }

  const last = Math.log2(size);

  const map = new Map(
    matches.map(x => [
      `${x.round_no}-${x.match_no}`,x
    ])
  );

  $('mwbr-title').textContent = t.title + ' — Setka';

  let html = `
    <div class="mwbr-small">
      ${players.length}/${size} ishtirokchi ·
      ${matches.length
        ? 'Turnir boshlangan'
        : 'Ro‘yxatdan o‘tish'}
    </div>
  `;

  if (owner && !matches.length) {
    html += `
      <button type="button"
        class="btn"
        id="mwbr-start"
        ${players.length !== size ? 'disabled' : ''}>
        Setkani boshlash
      </button>
    `;
  }

  if (!matches.length) {
    html += `
      <div class="mwbr-empty">
        Setka hali boshlanmagan.
        ${size} ta o‘rin to‘lgach
        turnir egasi boshlaydi.
      </div>
    `;
  } else {
    const final = map.get(`${last}-1`);

    if (final?.winner) {
      html += `
        <div class="mwbr-champion">
          Chempion: ${safe(name(final.winner))}
        </div>
      `;
    }

    html += '<div class="mwbr-rounds">';

    for (let r=1; r<=last; r++) {
      const count = size / (2 ** r);

      const title =
        r === last ? 'Final' :
        r === last-1 ? 'Yarim final' :
        r === last-2 ? 'Chorak final' :
        `${r}-bosqich`;

      html += `
        <section class="mwbr-round">
          <h3>${title} (${count} juftlik)</h3>
      `;

      for (let n=1; n<=count; n++) {
        const m = map.get(`${r}-${n}`) || {};

        const allow = !!(
          m.player1 &&
          m.player2 &&
          !m.winner
        );

        html += `
          <div class="mwbr-match">
            <small>
              Juftlik ${n}
              ${m.winner ? ' · Yakunlangan' : ''}
            </small>

            ${row(
              m.player1,m.winner,owner,allow,r,n
            )}

            ${row(
              m.player2,m.winner,owner,allow,r,n
            )}
          </div>
        `;
      }

      html += '</section>';
    }

    html += '</div>';
  }

  $('mwbr-body').innerHTML = html;

  $('mwbr-start')?.addEventListener('click', async e => {
    if (!confirm(
      'Setka boshlansinmi? Keyin yangi o‘yinchi qo‘shilmaydi.'
    )) return;

    await change(
      e.currentTarget,
      () => db().rpc('mw_start_bracket',{tid}),
      tid
    );
  });

  $('mwbr-body')
    .querySelectorAll('[data-p]')
    .forEach(b => {
      b.onclick = async () => {
        if (!confirm(
          `${name(b.dataset.p)} g‘olib deb tasdiqlansinmi?`
        )) return;

        await change(
          b,
          () => db().rpc('mw_choose_winner',{
            tid,
            rno:Number(b.dataset.r),
            mno:Number(b.dataset.n),
            chosen:b.dataset.p
          }),
          tid
        );
      };
    });
}

async function change(b,doIt,tid) {
  if (busy) return;

  busy = true;
  b.disabled = true;

  try {
    get(await doIt());
    await render(tid);
  } catch(e) {
    console.error(e);
    alert('Setka xatosi: ' + (e.message || e));
  } finally {
    busy = false;
    if (b.isConnected) b.disabled = false;
  }
}

async function open(tid) {
  dismiss();
  current = tid;

  const m = document.createElement('div');
  m.id = 'mwbr-popup';
  m.className = 'mwbr-overlay';

  m.innerHTML = `
    <div class="mwbr-window"
      role="dialog"
      aria-modal="true"
      aria-label="Turnir setkasi">

      <div class="mwbr-head">
        <h2 id="mwbr-title">Setka</h2>

        <button type="button"
          class="btn secondary small"
          id="mwbr-close">
          Yopish
        </button>
      </div>

      <div class="mwbr-body" id="mwbr-body">
        Yuklanmoqda...
      </div>
    </div>
  `;

  document.body.append(m);

  $('mwbr-close').onclick = dismiss;

  m.onclick = e => {
    if (e.target === m) dismiss();
  };

  try {
    await render(tid);
  } catch(e) {
    console.error(e);
    if ($('mwbr-body')) {
      $('mwbr-body').textContent =
        'Xato: ' + (e.message || e);
    }
  }
}

function buttons() {
  const list = $('mw-tournament-list');
  if (!list) return;

  list.querySelectorAll('[data-mw-tview]')
    .forEach(b => {
      if (
        b.parentElement?.querySelector('[data-mw-bracket]')
      ) return;

      const n = document.createElement('button');
      n.type = 'button';
      n.className = 'btn secondary small';
      n.textContent = 'Setka';
      n.dataset.mwBracket = b.dataset.mwTview;

      b.insertAdjacentElement('afterend', n);
    });
}

function init() {
  const list = $('mw-tournament-list');
  if (!list) return;

  buttons();

  let pending = false;

  new MutationObserver(() => {
    if (pending) return;
    pending = true;

    requestAnimationFrame(() => {
      pending = false;
      buttons();
    });
  }).observe(list,{
    subtree:true,
    childList:true
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mw-bracket]');
    if (!b) return;

    e.preventDefault();
    open(b.dataset.mwBracket);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('mwbr-popup')) {
      dismiss();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded',init);
} else {
  init();
}
})();
