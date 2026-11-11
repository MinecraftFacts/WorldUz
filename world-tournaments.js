
/* Minecraft World — Turnir yaratish */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const S = () => window.MW_ORIGINAL;
  const db = () => S()?.db;
  const uid = () => S()?.me?.id;

  const check = result => {
    if (result.error) throw result.error;
    return result.data;
  };

  let busy = false;
  let previewUrl = null;

  const css = document.createElement('style');
  css.textContent = `
    .mw-t-create {
      position:fixed;
      inset:0;
      background:#02080bd9;
      z-index:110;
      display:grid;
      place-items:center;
      padding:15px;
    }

    .mw-t-create[hidden] {
      display:none;
    }

    .mw-t-create-box {
      width:min(570px,100%);
      max-height:90dvh;
      overflow-y:auto;
      background:linear-gradient(145deg,#203c4b,#132a38);
      border:1px solid #719397;
      border-radius:20px;
      padding:20px;
      color:#f6f4e8;
    }

    .mw-t-create-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      margin-bottom:15px;
    }

    .mw-t-create-head h2 {
      margin:0;
    }

    .mw-t-banner {
      width:100%;
      aspect-ratio:16/9;
      border:2px dashed #819d8b;
      border-radius:14px;
      display:grid;
      place-items:center;
      overflow:hidden;
      background:#102431;
      cursor:pointer;
      margin:8px 0 17px;
      text-align:center;
    }

    .mw-t-banner img {
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .mw-t-create-form label {
      display:block;
      font-weight:650;
      margin-bottom:13px;
    }

    .mw-t-create-form input,
    .mw-t-create-form select {
      width:100%;
      border:1px solid #577783;
      border-radius:11px;
      background:#0e2330;
      color:white;
      padding:11px;
      margin-top:6px;
    }

    .mw-t-fields {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }

    .mw-t-buttons {
      display:flex;
      flex-wrap:wrap;
      gap:9px;
      margin-top:15px;
    }

    @media(max-width:480px) {
      .mw-t-fields {
        grid-template-columns:1fr;
      }
    }
  `;
  document.head.append(css);

  function showError(error) {
    console.error('Turnir:', error);
    alert('Xato: ' + (error.message || error));
  }

  function close() {
    if (busy) return;

    $('mw-t-create-modal')?.remove();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function open() {
    if (!uid()) {
      alert('Avval akkauntga kiring');
      return;
    }

    if ($('mw-t-create-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'mw-t-create-modal';
    modal.className = 'mw-t-create';

    modal.innerHTML = `
      <div class="mw-t-create-box">
        <div class="mw-t-create-head">
          <h2>Yangi turnir</h2>
          <button class="btn secondary small"
            type="button" id="mw-t-create-close">
            Yopish
          </button>
        </div>

        <form id="mw-t-form" class="mw-t-create-form">
          <label for="mw-t-image">
            Turnir rasmi (16:9)
          </label>

          <label class="mw-t-banner"
            for="mw-t-image">
            <span id="mw-t-preview-text">
              Rasm tanlash
              <small style="display:block">
                JPG, PNG, WEBP — 5 MB gacha
              </small>
            </span>
            <img id="mw-t-preview"
              alt="Turnir rasmi" hidden>
          </label>

          <input type="file" id="mw-t-image"
            accept="image/jpeg,image/png,image/webp"
            hidden>

          <label>
            Turnir nomi
            <input name="title" required
              minlength="4" maxlength="100"
              placeholder="Minecraft BedWars turniri">
          </label>

          <div class="mw-t-fields">
            <label>
              Minecraft turi
              <select name="edition">
                <option value="bedrock">Bedrock</option>
                <option value="java">Java</option>
              </select>
            </label>

            <label>
              Versiya
              <input name="game_version"
                placeholder="1.21.100"
                maxlength="35" required>
            </label>

            <label>
              Turnir hajmi
              <select name="bracket_size">
                <option value="8">8 o‘yinchi</option>
                <option value="16">16 o‘yinchi</option>
                <option value="32">32 o‘yinchi (16 juftlik)</option>
              </select>
            </label>

            <label>
              Boshlanish vaqti
              <input type="datetime-local"
                name="starts_at" required>
            </label>
          </div>

          <div class="mw-t-buttons">
            <button class="btn" id="mw-t-submit"
              type="submit">
              Turnir yaratish
            </button>

            <button class="btn secondary"
              id="mw-t-cancel" type="button">
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.append(modal);

    $('mw-t-create-close').onclick = close;
    $('mw-t-cancel').onclick = close;

    modal.onclick = e => {
      if (e.target === modal) close();
    };

    $('mw-t-image').onchange = e => {
      const file = e.target.files[0];
      if (!file) return;

      if (
        !['image/jpeg','image/png','image/webp']
          .includes(file.type) ||
        file.size > 5 * 1024 * 1024
      ) {
        alert('5 MB gacha JPG/PNG/WEBP rasm tanlang');
        e.target.value = '';
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      previewUrl = URL.createObjectURL(file);

      $('mw-t-preview').src = previewUrl;
      $('mw-t-preview').hidden = false;
      $('mw-t-preview-text').hidden = true;
    };

    $('mw-t-form').onsubmit = async e => {
      e.preventDefault();
      await create(e.target);
    };
  }

  async function create(form) {
    if (busy || !uid()) return;

    const data = new FormData(form);
    const file = $('mw-t-image').files[0];
    const start = new Date(data.get('starts_at'));

    if (
      !Number.isFinite(start.getTime()) ||
      start.getTime() <= Date.now()
    ) {
      alert('Kelajakdagi sanani tanlang');
      return;
    }

    busy = true;
    const button = $('mw-t-submit');
    button.disabled = true;
    button.textContent = 'Saqlanmoqda...';

    let createdId = null;

    try {
      const tournament = check(
        await db().from('v2_tournaments')
          .insert({
            owner_id: uid(),
            title: String(data.get('title')).trim(),
            edition: data.get('edition'),
            game_version:
              String(data.get('game_version')).trim(),
            bracket_size:
              Number(data.get('bracket_size')),
            starts_at: start.toISOString()
          })
          .select('id')
          .single()
      );

      createdId = tournament.id;

      if (file) {
        const ext = {
          'image/jpeg':'jpg',
          'image/png':'png',
          'image/webp':'webp'
        }[file.type];

        const path =
          `${uid()}/${createdId}/${crypto.randomUUID()}.${ext}`;

        check(
          await db().storage
            .from('mw-tournaments')
            .upload(path, file, {
              upsert:false,
              contentType:file.type
            })
        );

        check(
          await db().from('v2_tournaments')
            .update({image_path:path})
            .eq('id',createdId)
            .eq('owner_id',uid())
        );
      }

      alert('Turnir yaratildi!');
      closeAfterSave();

      // Ro'yxatni yangilash
      const community = document.querySelector(
        '[data-page="mw-community"]'
      );

      community?.click();

    } catch(error) {
      if (createdId) {
        alert(
          'Turnir yaratildi, ammo rasmni saqlashda ' +
          'muammo bo‘lishi mumkin. ' +
          'Yangi turnirni qayta yaratishdan oldin ' +
          'ro‘yxatni tekshiring.'
        );
      }

      showError(error);
    } finally {
      busy = false;
      if (button.isConnected) {
        button.disabled = false;
        button.textContent = 'Turnir yaratish';
      }
    }
  }

  function closeAfterSave() {
    busy = false;
    close();
  }

  function mount() {
    const section = $('mw-community');
    if (!section) return;

    if ($('mw-t-create-button')) return;

    const button = document.createElement('button');
    button.id = 'mw-t-create-button';
    button.className = 'btn';
    button.type = 'button';
    button.textContent = 'Turnir yaratish';

    const head =
      section.querySelector('.community-head') ||
      section.querySelector('.community-col') ||
      section;

    head.append(button);
    button.onclick = open;
  }

  function start() {
    mount();

    const observer = new MutationObserver(() => {
      if (!$('mw-t-create-button')) mount();
    });

    observer.observe(document.body, {
      childList:true,
      subtree:true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',start);
  } else {
    start();
  }
})();
