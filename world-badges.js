
/* Minecraft World — yagona ko'k tasdiq belgisi */
(() => {
  'use strict';

  const S = () => window.MW_ORIGINAL;
  const $ = id => document.getElementById(id);

  let verified = new Set();
  let started = false;
  let scheduled = false;

  const badgeSVG = `
    <svg viewBox="0 0 24 24"
      width="19" height="19"
      aria-hidden="true">
      <path
        d="M12 1.8 15.1 3.5 18.6 3.5
        20 6.8 22.2 9.5 21.2 12.8
        21.6 16.4 18.6 18.3 16.8 21.4
        13.2 21.1 10 22.2 7.3 20
        3.8 19.6 3.3 16 1.7 12.9
        3.3 9.9 3.4 6.4 6.8 5.4
        9.2 2.6Z"
        fill="#168dff"/>
      <path d="m7.3 12 3.1 3.1 6.4-6.5"
        fill="none"
        stroke="white"
        stroke-width="2.7"
        stroke-linecap="round"
        stroke-linejoin="round"/>
    </svg>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .mw-verified-badge {
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:19px;
      height:19px;
      flex:0 0 19px;
      margin-left:5px;
      vertical-align:-4px;
      line-height:1;
    }

    .mw-verified-badge svg {
      width:100%;
      height:100%;
      display:block;
    }

    /* Eski turli shakldagi belgilarni yashirish */
    .mwplus-blue,
    .mw-menu-badge {
      display:none !important;
    }

    #profile-name .mw-verified-badge,
    #chat-name .mw-verified-badge {
      vertical-align:middle;
    }
  `;
  document.head.append(style);

  function people() {
    return S()?.people || [];
  }

  function username(p) {
    return p?.nickname || p?.username || '';
  }

  function findByName(text) {
    const normalized = String(text || '')
      .replace(/✓/g, '')
      .trim()
      .toLowerCase();

    const matches = people().filter(p =>
      username(p).toLowerCase() === normalized ||
      p.username?.toLowerCase() === normalized
    );

    // Bir xil nikli ikki odam bo'lsa, taxmin qilmaymiz.
    return matches.length === 1 ? matches[0].id : null;
  }

  function applyBadge(element, userId) {
    if (!element) return;

    const id = String(userId || '');
    const allowed = verified.has(id);

    let badge = Array.from(element.children)
      .find(x =>
        x.classList?.contains('mw-verified-badge')
      );

    if (!allowed) {
      badge?.remove();
      return;
    }

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'mw-verified-badge';
      badge.title = 'Tasdiqlangan akkaunt';
      badge.setAttribute(
        'aria-label',
        'Tasdiqlangan akkaunt'
      );
      badge.innerHTML = badgeSVG;
      element.append(badge);
    }
  }

  function paint() {
    const state = S();
    if (!state) return;

    // 1. O'z profilidagi ism
    applyBadge(
      $('profile-name'),
      state.me?.id
    );

    // 2. Akkauntlar bo'limi
    document.querySelectorAll(
      '#people-grid [data-person]'
    ).forEach(card => {
      applyBadge(
        card.querySelector('h3'),
        card.dataset.person
      );
    });

    // 3. Modlar muallifi
    document.querySelectorAll(
      '[data-mod]'
    ).forEach(card => {
      const mod = state.mods?.find(
        m => m.id === card.dataset.mod
      );

      if (!mod) return;

      const author = card.querySelector(
        '.mwplus-author'
      ) || card.querySelector(
        '.cardmain > small'
      );

      applyBadge(author, mod.user_id);
    });

    // 4. Shaxsiy chat nomi
    applyBadge(
      $('chat-name'),
      state.activeChat
    );

    // 5. Chatlar ro'yxati
    document.querySelectorAll(
      '#conversation-list [data-chat]'
    ).forEach(row => {
      applyBadge(
        row.querySelector('.convoinfo strong'),
        row.dataset.chat
      );
    });

    // 6. Do'stlik so'rovlari
    document.querySelectorAll(
      '#request-list [data-answer]'
    ).forEach(row => {
      applyBadge(
        row.querySelector('b'),
        row.dataset.answer
      );
    });

    // 7. Boshqa akkaunt profili
    const modal = $('modal-body');

    if (modal) {
      const action = modal.querySelector(
        '[data-friend],[data-chat],[data-block]'
      );

      const id =
        action?.dataset.friend ||
        action?.dataset.chat ||
        action?.dataset.block;

      if (id) {
        applyBadge(
          modal.querySelector('h2'),
          id
        );
      }
    }

    // 8. Obunachilar va obunalar
    document.querySelectorAll(
      '.mwplus-person[data-mw-profile]'
    ).forEach(row => {
      const text = row.querySelector('span');
      if (!text) return;

      applyBadge(
        text,
        row.dataset.mwProfile
      );
    });

    // 9. Instagram uslubidagi profil
    const profileDialog = document.querySelector(
      '#mwplus-popup .mwplus-dialog'
    );

    if (profileDialog) {
      const title = profileDialog.querySelector('h2');

      if (title) {
        const id = findByName(
          title.childNodes[0]?.textContent
        );

        if (id) applyBadge(title, id);
      }
    }

    // 10. Umumiy guruhdagi xabar mualliflari
    document.querySelectorAll(
      '.mwplus-line .mwplus-bubble > b'
    ).forEach(title => {
      const name = Array.from(title.childNodes)
        .filter(node => node.nodeType === 3)
        .map(node => node.textContent)
        .join('')
        .trim();

      const id = findByName(name);

      if (id) applyBadge(title, id);
    });

    // 11. O'yin takliflari va turnirlar
    document.querySelectorAll(
      '#mw-game-list article,' +
      '#mw-tournament-list .mw-menu-row'
    ).forEach(row => {
      const title = row.querySelector('b');

      if (!title) return;

      const id = findByName(
        title.childNodes[0]?.textContent
      );

      if (id) applyBadge(title, id);
    });

    // 12. Bildirishnomalar
    document.querySelectorAll(
      '#modal-body .notice small'
    ).forEach(row => {
      const name = row.textContent.split('·')[0].trim();
      const id = findByName(name);

      if (id) applyBadge(row, id);
    });
  }

  function schedulePaint() {
    if (scheduled) return;

    scheduled = true;

    setTimeout(() => {
      scheduled = false;
      paint();
    }, 120);
  }

  async function reloadBadges() {
    const state = S();

    if (!state?.db) return;

    const {data, error} = await state.db
      .from('v2_badges')
      .select('user_id,expires_at');

    if (error) {
      console.warn('Ko‘k belgi:', error.message);
      return;
    }

    verified = new Set(
      (data || [])
        .filter(item =>
          !item.expires_at ||
          Date.parse(item.expires_at) > Date.now()
        )
        .map(item => String(item.user_id))
    );

    schedulePaint();
  }

  function init() {
    if (started) return;

    if (!S()?.db) {
      setTimeout(init, 300);
      return;
    }

    started = true;

    reloadBadges().catch(console.warn);

    const observer = new MutationObserver(
      changes => {
        // Faqat haqiqiy DOM o'zgarishida qayta chizamiz.
        const relevant = changes.some(c =>
          c.type === 'childList' &&
          Array.from(c.addedNodes).some(
            n => !(
              n.nodeType === 1 &&
              n.classList?.contains('mw-verified-badge')
            )
          )
        );

        if (relevant) schedulePaint();
      }
    );

    observer.observe(document.body, {
      subtree:true,
      childList:true
    });

    // Muddat tugashini va ma'lumot yangilanishini tekshirish
    setInterval(() => {
      if (!document.hidden) {
        reloadBadges().catch(console.warn);
      }
    }, 30000);

    S().db.auth.onAuthStateChange(() => {
      setTimeout(() => {
        reloadBadges().catch(console.warn);
      }, 500);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
