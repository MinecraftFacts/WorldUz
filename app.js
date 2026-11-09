
// Minecraft Facts UZ — V0.5
// Faqat publishable key. Secret key ishlatilmaydi.
(() => {
'use strict';

const SUPABASE_URL =
  'https://swbnidsmwnqwjzfrlorr.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_-yjtMQSDiq7_L1ZiNfBcSQ_GiXEDPka';

const $ = id => document.getElementById(id);

const esc = s => String(s ?? '').replace(
  /[&<>"']/g,
  c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[c])
);

const empty = text => `<p class="muted">${esc(text)}</p>`;

const avatarFallback = 'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
    '<rect width="100" height="100" fill="#245344"/>' +
    '<circle cx="50" cy="35" r="20" fill="#b7f5d0"/>' +
    '<path d="M12 96a38 38 0 0 1 76 0" fill="#b7f5d0"/>' +
    '</svg>'
  );

let db;
let me = null;
let myProfile = null;
let mods = [];
let people = [];
let stats = new Map();
let likes = new Set();
let saved = new Set();
let friendships = [];
let notifications = [];
let blocked = new Set();
let activeChat = null;
let signup = false;
let detailMod = null;
let channel = null;
let toastTimer;
let validationToken = 0;

const userName = p =>
  p?.nickname || p?.username || 'O‘yinchi';

const prof = id =>
  people.find(p => p.id === id);

const fileUrl = (bucket,path) =>
  path && db
    ? db.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : '';

const avatar = p =>
  fileUrl('mc-avatars',p?.avatar_path) || avatarFallback;

const formatDate = s =>
  new Date(s).toLocaleString('uz-UZ',{
    month:'short',
    day:'numeric',
    hour:'2-digit',
    minute:'2-digit'
  });

const stat = id => stats.get(id) || {
  views:0,likes:0,downloads:0,comments:0
};

function toast(msg) {
  $('toast').textContent = msg;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => $('toast').hidden = true,
    4700
  );
}

function fail(err) {
  console.error(err);
  toast('Xato: ' + (err?.message || String(err)));
}

function check(response) {
  if (response.error) throw response.error;
  return response.data;
}

function page(id) {
  document.querySelectorAll('.page').forEach(el =>
    el.classList.toggle('active',el.id===id)
  );
  document.querySelectorAll('.nav-btn').forEach(el =>
    el.classList.toggle('active',el.dataset.page===id)
  );

  window.scrollTo({top:0,behavior:'smooth'});
  if (id==='chats') renderChatFriends();
  if (id==='profile') renderRequests();
}

function modal(html) {
  $('modal-body').innerHTML = html;
  $('modal').hidden = false;
}

function closeModal() {
  $('modal').hidden = true;
  detailMod = null;
}

function card(m) {
  const x = stat(m.id);

  return `
    <article class="card" data-mod="${esc(m.id)}"
      role="button" tabindex="0">
      <img loading="lazy"
        src="${esc(fileUrl('mcmod-images',m.images?.[0]))}"
        alt="${esc(m.title)}">
      <div class="card-body">
        <h3>${esc(m.title)}</h3>
        <span class="sub">✦ ${esc(userName(m.mc_profiles))}</span>
        <div class="stats">
          <span>👁 ${x.views}</span>
          <span>♥ ${x.likes}</span>
          <span>⬇ ${x.downloads}</span>
          <span>💬 ${x.comments}</span>
        </div>
      </div>
    </article>`;
}

function renderMods() {
  const q = $('mod-search').value.trim().toLowerCase();

  const found = mods.filter(x =>
    `${x.title} ${x.description}`.toLowerCase().includes(q)
  );

  $('mod-count').textContent = found.length + ' ta';
  $('mod-list').innerHTML =
    found.map(card).join('') || empty('Hozircha mod topilmadi.');

  renderMyMods();
}

function renderMyMods() {
  if (!me) return;

  $('my-mods').innerHTML =
    mods.filter(m => m.user_id===me.id).map(card).join('')
    || empty('Mod qo‘shilmagan.');

  $('saved-list').innerHTML =
    mods.filter(m => saved.has(m.id)).map(card).join('')
    || empty('Saqlangan modlar yo‘q.');
}

function avatarHTML(p,small=false) {
  return `
    <img class="avatar ${small?'sm':''}"
      src="${esc(avatar(p))}" alt="Avatar">`;
}

function relation(id) {
  return friendships.find(
    f => f.user_low===id || f.user_high===id
  );
}

function isFriend(id) {
  return relation(id)?.status==='accepted' && !blocked.has(id);
}

function friendIds() {
  return friendships
    .filter(f => f.status==='accepted')
    .map(f => f.user_low===me.id ? f.user_high : f.user_low)
    .filter(id => !blocked.has(id));
}

function renderPeople() {
  const q = $('account-search').value.trim().toLowerCase();

  const filtered = people.filter(p =>
    `${p.username} ${p.nickname} ${p.public_id}`
      .toLowerCase().includes(q)
  );

  $('account-count').textContent = filtered.length + ' ta';

  $('account-list').innerHTML = filtered.map(p => `
    <article class="panel user-card"
      data-person="${esc(p.id)}"
      role="button" tabindex="0" style="margin:0">
      ${avatarHTML(p,true)}
      <div class="grow">
        <h3>${esc(userName(p))}</h3>
        <small>@${esc(p.username)} · ID #${esc(p.public_id)}</small>
      </div>
      ${me && p.id!==me.id && isFriend(p.id)
        ? '<span class="pills">✓ Do‘st</span>' : ''}
    </article>
  `).join('') || empty('Akkaunt topilmadi.');
}

function renderRequests() {
  if (!me) return;

  const incoming = friendships.filter(
    f => f.status==='pending' && f.requester!==me.id
  );

  $('requests').innerHTML = incoming.map(f => {
    const id = f.user_low===me.id ? f.user_high : f.user_low;
    const p = prof(id);

    return `
      <div class="row between"
        style="padding:8px 0;flex-wrap:wrap">
        <div class="row">
          ${avatarHTML(p,true)}
          <div>
            <b>${esc(userName(p))}</b>
            <small style="display:block">
              ID #${esc(p?.public_id)}
            </small>
          </div>
        </div>
        <div class="wrap">
          <button class="btn sm"
            data-answer="${esc(id)}" data-accept="yes">
            Qabul qilish
          </button>
          <button class="btn sm secondary"
            data-answer="${esc(id)}" data-accept="no">
            Rad etish
          </button>
        </div>
      </div>`;
  }).join('') || empty('Yangi do‘stlik so‘rovi yo‘q.');
}

function renderBlocked() {
  if (!me) return;

  $('blocked-list').innerHTML = [...blocked].map(id => `
    <div class="row between" style="margin:10px 0">
      <span>${esc(userName(prof(id)))}</span>
      <button class="btn secondary sm"
        data-unblock="${esc(id)}">
        Blokdan chiqarish
      </button>
    </div>
  `).join('') || empty('Bloklangan foydalanuvchi yo‘q.');
}

function renderChatFriends() {
  if (!me) return;

  const ids = friendIds();
  $('friend-count').textContent = ids.length;

  const unread = notifications.filter(
    n => !n.seen && n.kind==='message'
  );

  $('friend-list').innerHTML = ids.map(id => {
    const p = prof(id);
    const n = unread.filter(x => x.actor_id===id).length;

    return `
      <button class="friend-row ${id===activeChat?'active':''}"
        data-chat="${esc(id)}">
        ${avatarHTML(p,true)}
        <span class="grow">
          <b>${esc(userName(p))}</b>
          <small>ID #${esc(p?.public_id)}
            ${n ? '· '+n+' yangi xabar' : ''}
          </small>
        </span>
        ${n ? '<span class="counter" style="position:static">'+n+'</span>' : ''}
      </button>`;
  }).join('') ||
  empty('Hozircha do‘stlaring yo‘q. Accountlardan do‘st qo‘sh.');
}

function renderNotifications() {
  const num = notifications.filter(x => !x.seen).length;

  $('notif-badge').hidden = num===0;
  $('notif-badge').textContent = num>99 ? '99+' : num;

  $('chat-dot').hidden = !notifications.some(
    x => !x.seen && x.kind==='message'
  );

  renderChatFriends();
}

async function loadMods() {
  mods = check(
    await db.from('mc_mods')
      .select(
        'id,user_id,title,description,images,file_path,created_at,'+
        'mc_profiles(username,nickname)'
      )
      .order('created_at',{ascending:false})
      .limit(100)
  ) || [];

  const rows = check(await db.rpc('mc_stats')) || [];
  stats = new Map(rows.map(x => [x.mod_id,x]));

  renderMods();
}

async function loadPeople() {
  people = check(
    await db.from('mc_profiles')
      .select(
        'id,username,nickname,bio,avatar_path,created_at,public_id'
      )
      .order('public_id')
      .limit(1000)
  ) || [];

  renderPeople();
}

async function loadPrivate() {
  if (!me) {
    friendships = [];
    notifications = [];
    blocked.clear();
    likes.clear();
    saved.clear();
    renderNotifications();
    return;
  }

  const id = me.id;

  const results = await Promise.all([
    db.from('mc_friendships')
      .select('*')
      .or(`user_low.eq.${id},user_high.eq.${id}`),

    db.from('mc_notifications')
      .select('*')
      .eq('recipient_id',id)
      .order('created_at',{ascending:false})
      .limit(100),

    db.from('mc_mod_likes')
      .select('mod_id')
      .eq('user_id',id),

    db.from('mc_mod_saved')
      .select('mod_id')
      .eq('user_id',id),

    db.from('mc_blocks')
      .select('blocked')
      .eq('blocker',id)
  ]);

  results.forEach(check);

  friendships = results[0].data || [];
  notifications = results[1].data || [];
  likes = new Set((results[2].data||[]).map(x=>x.mod_id));
  saved = new Set((results[3].data||[]).map(x=>x.mod_id));
  blocked = new Set((results[4].data||[]).map(x=>x.blocked));

  renderBlocked();
  renderPeople();
  renderRequests();
  renderNotifications();
  renderMyMods();
}

async function refreshProfile() {
  const signed = !!me;

  $('auth-box').hidden = signed;
  $('profile-box').hidden = !signed;
  $('upload-gate').hidden = signed;
  $('upload-form').hidden = !signed;
  $('chat-gate').hidden = signed;
  $('chat-layout').hidden = !signed;

  if (!signed) return;

  myProfile = check(
    await db.from('mc_profiles')
      .select('*')
      .eq('id',me.id)
      .single()
  );

  $('my-name').textContent = userName(myProfile);

  $('my-handle').textContent =
    '@'+myProfile.username+' · ID #'+myProfile.public_id;

  $('my-avatar').src = avatar(myProfile);
  $('nickname').value = myProfile.nickname || myProfile.username;
  $('bio').value = myProfile.bio || '';
}

function validateHint(id,msg,good=false) {
  const el = $(id);
  el.textContent = msg;
  el.className = 'hint ' + (
    msg ? (good?'good':'bad') : ''
  );
}

function switchAuth(value) {
  signup = value;

  $('auth-title').textContent =
    value ? 'Yangi akkaunt ochish' : 'Akkauntga kirish';

  $('auth-submit').textContent =
    value ? 'Ro‘yxatdan o‘tish' : 'Kirish';

  $('toggle-auth').textContent =
    value ? 'Kirishga qaytish' : 'Yangi akkaunt ochish';

  $('confirm-wrap').hidden = !value;
  $('confirm').required = value;

  $('password').autocomplete =
    value ? 'new-password' : 'current-password';

  ['user-hint','pass-hint','confirm-hint'].forEach(
    x => validateHint(x,'')
  );
}

const normalizedUsername = () =>
  $('username').value.trim().toLowerCase();

async function validateUser() {
  const name = normalizedUsername();
  const token = ++validationToken;

  if (!/^[a-z0-9_]{3,20}$/.test(name)) {
    validateHint(
      'user-hint',
      '3–20 ta lotin harfi, raqam yoki _ kerak'
    );
    return false;
  }

  validateHint('user-hint','Tekshirilmoqda...',true);

  try {
    const {data,error} = await db.from('mc_profiles')
      .select('id')
      .eq('username',name)
      .maybeSingle();

    if (error) throw error;
    if (token!==validationToken) return false;

    const ok = signup ? !data : !!data;

    validateHint(
      'user-hint',
      signup
        ? (data ? '❌ Username band' : '✓ Username bo‘sh')
        : (data ? '✓ Username topildi' : '❌ Bunday username yo‘q'),
      ok
    );

    return ok;
  } catch(e) {
    if (token===validationToken)
      validateHint('user-hint','Tekshirib bo‘lmadi');
    return false;
  }
}

function validatePassword() {
  const pw = $('password').value;

  if (!pw) {
    validateHint('pass-hint','Parolni kiriting');
    return false;
  }

  if (pw.length<8) {
    validateHint('pass-hint','Kamida 8 belgi kerak');
    return false;
  }

  validateHint('pass-hint','✓ Parol uzunligi yetarli',true);
  return true;
}

function validateConfirm() {
  if (!signup) return true;

  const okay = !!$('confirm').value &&
    $('confirm').value===$('password').value;

  validateHint(
    'confirm-hint',
    okay ? '✓ Parollar mos' : '❌ Parollar bir xil emas',
    okay
  );
  return okay;
}

async function signInOrUp(e) {
  e.preventDefault();

  const username = normalizedUsername();
  const password = $('password').value;

  if (!await validateUser() ||
      !validatePassword() ||
      !validateConfirm()) return;

  const b = $('auth-submit');
  b.disabled = true;

  try {
    const r = signup
      ? await db.auth.signUp({
          email:username+'@members.example.com',
          password,
          options:{data:{username}}
        })
      : await db.auth.signInWithPassword({
          email:username+'@members.example.com',
          password
        });

    if (r.error) {
      validateHint(
        'pass-hint',
        '❌ '+(signup
          ? r.error.message
          : 'Username yoki parol noto‘g‘ri')
      );
      throw r.error;
    }

    if (!r.data.session) {
      throw Error('Email tasdiqlashni tekshiring');
    }

    me = r.data.user;
    $('auth-form').reset();

    await onAuthChange();

    toast(signup ? 'Akkaunt ochildi!' : 'Xush kelibsiz!');
  } catch(err) {
    fail(err);
  } finally {
    b.disabled = false;
  }
}

async function onAuthChange() {
  await refreshProfile();
  await Promise.all([loadPrivate(),loadMods()]);
  subscribe();

  if (!me) {
    activeChat = null;
    $('chat-title').innerHTML = '<h3>Suhbatni tanlang</h3>';
    $('messages').replaceChildren();
    $('chat-text').disabled = true;
    $('chat-send').disabled = true;
  }
}

async function uploadFile(bucket,file,uid) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = uid+'/'+crypto.randomUUID()+'.'+ext;

  check(
    await db.storage.from(bucket)
      .upload(path,file,{upsert:false})
  );

  return path;
}

function isImg(file) {
  return file &&
    ['image/png','image/jpeg','image/webp'].includes(file.type)
    && file.size<=5*1024*1024;
}

async function saveProfile(e) {
  e.preventDefault();
  if (!me) return;

  const changes = {
    nickname:$('nickname').value.trim(),
    bio:$('bio').value.trim()
  };

  if (!changes.nickname) {
    toast('Nikni kiriting');
    return;
  }

  const f = $('avatar-file').files[0];

  try {
    if (f) {
      if (!isImg(f)) {
        throw Error(
          'Avatar JPG, PNG yoki WEBP; 5 MB gacha'
        );
      }
      changes.avatar_path =
        await uploadFile('mc-avatars',f,me.id);
    }

    check(
      await db.from('mc_profiles')
        .update(changes)
        .eq('id',me.id)
    );

    await loadPeople();
    await refreshProfile();
    toast('Profil saqlandi');
  } catch(e) {
    fail(e);
  }
}

async function submitMod(e) {
  e.preventDefault();

  if (!me) return toast('Akkauntga kiring');

  const title = $('mod-title').value.trim();
  const description = $('mod-description').value.trim();
  const images = [...$('mod-images').files];
  const file = $('mod-file').files[0];

  if (title.length<3 || description.length<10) {
    return toast('Nom va tavsifni to‘ldiring');
  }

  if (
    images.length<1 ||
    images.length>5 ||
    images.some(f=>!isImg(f))
  ) {
    return toast(
      '1–5 ta JPG, PNG yoki WEBP rasm (5 MB gacha) kerak'
    );
  }

  const ext = file?.name.split('.').pop().toLowerCase();

  if (
    !file ||
    !['mcpack','mcaddon','zip','jar'].includes(ext) ||
    file.size>50*1024*1024
  ) {
    return toast(
      'Mod fayli .mcpack, .mcaddon, .zip yoki .jar, 50 MB gacha'
    );
  }

  const b = $('publish');
  b.disabled = true;
  b.textContent = 'Joylanmoqda...';

  try {
    const file_path =
      await uploadFile('mcmod-files',file,me.id);

    const paths = [];

    for (const img of images) {
      paths.push(
        await uploadFile('mcmod-images',img,me.id)
      );
    }

    check(
      await db.from('mc_mods').insert({
        user_id:me.id,
        title,
        description,
        images:paths,
        file_path
      })
    );

    $('upload-form').reset();
    $('image-previews').replaceChildren();
    $('file-name').textContent = '';

    await loadMods();
    page('home');
    toast('Mod joylandi!');
  } catch(err) {
    fail(err);
  } finally {
    b.disabled = false;
    b.textContent = '✦ Modni joylash';
  }
}

function fileSelect(input,zone,handler) {
  const el = $(input);
  const area = $(zone);

  area.addEventListener('dragover',e=>{
    e.preventDefault();
    area.classList.add('drag');
  });

  area.addEventListener('dragleave',()=>{
    area.classList.remove('drag');
  });

  area.addEventListener('drop',e=>{
    e.preventDefault();
    area.classList.remove('drag');

    if (e.dataTransfer.files.length) {
      el.files = e.dataTransfer.files;
      handler();
    }
  });

  el.addEventListener('change',handler);
}

function drawPreviews() {
  const box = $('image-previews');
  box.replaceChildren();

  [...$('mod-images').files].slice(0,5).forEach(f=>{
    const img = document.createElement('img');
    const src = URL.createObjectURL(f);

    img.src = src;
    img.onload = ()=>URL.revokeObjectURL(src);

    box.append(img);
  });
}

function drawFileName() {
  $('file-name').textContent =
    $('mod-file').files[0]?.name || '';
}

async function showPerson(id) {
  const p = prof(id);
  if (!p) return;

  const f = me ? relation(id) : null;
  const incoming = f?.status==='pending' &&
    f.requester===id;

  const outgoing = f?.status==='pending' &&
    f.requester===me?.id;

  let controls = '';

  if (me && id!==me.id) {
    if (blocked.has(id)) {
      controls = `
        <button class="btn secondary" data-unblock="${esc(id)}">
          Blokdan chiqarish
        </button>`;
    } else if (f?.status==='accepted') {
      controls = `
        <button class="btn" data-chat="${esc(id)}">
          💬 Chatga o‘tish
        </button>`;
    } else if (incoming) {
      controls = `
        <button class="btn" data-answer="${esc(id)}"
          data-accept="yes">✓ Qabul qilish</button>
        <button class="btn secondary" data-answer="${esc(id)}"
          data-accept="no">Rad etish</button>`;
    } else if (outgoing) {
      controls = '<span class="pills">So‘rov yuborilgan</span>';
    } else {
      controls = `
        <button class="btn" data-request="${esc(id)}">
          + Do‘stga qo‘shish
        </button>`;
    }

    if (!blocked.has(id)) {
      controls += `
        <button class="btn danger sm" data-block="${esc(id)}">
          Bloklash
        </button>`;
    }
  } else if (!me) {
    controls = '<p class="muted">Do‘stlashish uchun akkauntga kiring.</p>';
  }

  const ownMods = mods.filter(m => m.user_id===id);

  modal(`
    <div class="row" style="padding-right:40px">
      ${avatarHTML(p)}
      <div>
        <h2 style="margin:0">${esc(userName(p))}</h2>
        <small>@${esc(p.username)} · ID #${esc(p.public_id)}</small>
      </div>
    </div>

    <p style="white-space:pre-wrap;margin:15px 0">
      ${esc(p.bio||'Bio yo‘q.')}
    </p>

    <div class="wrap">${controls}</div>

    <h3 style="margin-top:20px">📦 Modlari</h3>
    <div class="grid">
      ${ownMods.map(card).join('') || empty('Mod yo‘q.')}
    </div>
  `);
}

async function requestFriend(id) {
  try {
    const r = check(
      await db.rpc('mc_request_friend',{target:id})
    );

    toast(
      r==='pending' ? 'So‘rov yuborildi' :
      r==='accepted' ? 'Sizlar allaqachon do‘stsiz' :
      'So‘rov mavjud'
    );

    await loadPrivate();
    closeModal();
  } catch(err) {
    fail(err);
  }
}

async function answerFriend(id,accept) {
  try {
    check(
      await db.rpc('mc_answer_friend',{
        sender:id,
        agree:accept
      })
    );

    await loadPrivate();
    renderChatFriends();
    closeModal();

    toast(
      accept ? 'Do‘stlik qabul qilindi' :
      'So‘rov rad etildi'
    );
  } catch(err) {
    fail(err);
  }
}

async function blockPerson(id) {
  if (!me || !confirm(
    'Bu foydalanuvchini bloklaysizmi? U sizga xabar yoza olmaydi.'
  )) return;

  try {
    check(
      await db.rpc('mc_block_person',{target:id})
    );

    await loadPrivate();
    closeModal();
    toast('Foydalanuvchi bloklandi');
  } catch(err) {
    fail(err);
  }
}

async function unblockPerson(id) {
  if (!me) return;

  try {
    check(
      await db.from('mc_blocks').delete()
        .eq('blocker',me.id)
        .eq('blocked',id)
    );

    await loadPrivate();
    closeModal();
    toast('Blokdan chiqarildi');
  } catch(err) {
    fail(err);
  }
}

async function openChat(id) {
  if (!me || !isFriend(id)) {
    return toast('Avval do‘stlikni qabul qiling');
  }

  closeModal();
  activeChat = id;
  page('chats');
  renderChatFriends();

  const p = prof(id);

  $('chat-title').innerHTML = `
    <h3>${esc(userName(p))}
      <small>ID #${esc(p?.public_id)}</small>
    </h3>`;

  $('chat-text').disabled = false;
  $('chat-send').disabled = false;

  await readChat();
}

async function readChat() {
  if (!me || !activeChat) return;

  const id = activeChat;

  try {
    const {data,error} = await db.from('mc_messages')
      .select('sender_id,recipient_id,body,created_at,read_at')
      .or(
        `and(sender_id.eq.${me.id},recipient_id.eq.${id}),` +
        `and(sender_id.eq.${id},recipient_id.eq.${me.id})`
      )
      .order('created_at',{ascending:true})
      .limit(150);

    if (error) throw error;
    if (id!==activeChat) return;

    $('messages').innerHTML = (data||[]).map(m=>`
      <div class="bubble ${m.sender_id===me.id?'mine':''}">
        ${esc(m.body)}
        <small>${formatDate(m.created_at)}</small>
      </div>
    `).join('') || empty('Birinchi xabarni yoz.');

    $('messages').scrollTop = $('messages').scrollHeight;

    check(
      await db.from('mc_messages')
        .update({read_at:new Date().toISOString()})
        .eq('recipient_id',me.id)
        .eq('sender_id',id)
        .is('read_at',null)
    );

    const unread = notifications.filter(
      n => n.kind==='message' &&
      n.actor_id===id &&
      !n.seen
    ).map(n=>n.id);

    if (unread.length) {
      await db.from('mc_notifications')
        .update({seen:true})
        .in('id',unread);
    }

    await readNotifs();
  } catch(err) {
    fail(err);
  }
}

async function sendChat(e) {
  e.preventDefault();

  const body = $('chat-text').value.trim();
  if (!body || !me || !activeChat) return;

  const btn = $('chat-send');
  btn.disabled = true;

  try {
    check(
      await db.from('mc_messages').insert({
        sender_id:me.id,
        recipient_id:activeChat,
        body
      })
    );

    $('chat-text').value = '';
    await readChat();
  } catch(err) {
    fail(err);
  } finally {
    btn.disabled = false;
  }
}

async function readNotifs() {
  if (!me) return;

  const {data,error} = await db.from('mc_notifications')
    .select('*')
    .eq('recipient_id',me.id)
    .order('created_at',{ascending:false})
    .limit(100);

  if (error) {
    console.warn(error);
    return;
  }

  notifications = data || [];
  renderNotifications();
}

function notifyText(n) {
  const name = userName(prof(n.actor_id));

  return ({
    request:`${name} do‘stlik so‘rovi yubordi`,
    accepted:`${name} so‘rovingizni qabul qildi`,
    message:`${name} yangi xabar yozdi`,
    comment:`${name} modingizga izoh yozdi`
  })[n.kind] || 'Yangi bildirishnoma';
}

function showNotifications() {
  if (!me) {
    return toast('Bildirishnomalar uchun akkauntga kiring');
  }

  modal(`
    <div class="row between" style="margin-right:45px">
      <h2>🔔 Bildirishnomalar</h2>
      <button class="btn secondary sm" data-mark-all>
        Hammasini o‘qildi qilish
      </button>
    </div>

    <div class="notices">
      ${notifications.map(n=>`
        <button class="notice ${n.seen?'':'unread'}"
          style="text-align:left;color:inherit;cursor:pointer"
          data-notif="${n.id}">
          <b>${esc(notifyText(n))}</b>
          <small style="display:block">
            ${formatDate(n.created_at)}
          </small>
        </button>
      `).join('') || empty('Yangi bildirishnoma yo‘q.')}
    </div>
  `);
}

async function clickNotice(id) {
  const n = notifications.find(x=>x.id===Number(id));
  if (!n) return;

  try {
    check(
      await db.from('mc_notifications')
        .update({seen:true})
        .eq('id',n.id)
    );

    await readNotifs();
    closeModal();

    if (n.kind==='request' || n.kind==='accepted') {
      page(n.kind==='request'?'profile':'accounts');

      if (n.kind==='request') {
        renderRequests();
      } else {
        await showPerson(n.actor_id);
      }
    } else if (n.kind==='message') {
      await openChat(n.actor_id);
    } else if (n.kind==='comment') {
      await openMod(n.ref);
    }
  } catch(e) {
    fail(e);
  }
}

async function markAll() {
  try {
    check(
      await db.from('mc_notifications')
        .update({seen:true})
        .eq('recipient_id',me.id)
        .eq('seen',false)
    );

    await readNotifs();
    showNotifications();
  } catch(e) {
    fail(e);
  }
}

async function openMod(id) {
  const m = mods.find(x=>x.id===id);
  if (!m) return;

  detailMod = id;

  if (me) {
    db.rpc('mc_track_mod',{
      the_mod:id,
      action:'view'
    })
    .then(()=>db.rpc('mc_stats'))
    .then(r=>{
      if (!r.error) {
        stats = new Map(r.data.map(x=>[x.mod_id,x]));
        renderMods();
      }
    })
    .catch(console.warn);
  }

  const imgs = (m.images||[]).map(
    x=>fileUrl('mcmod-images',x)
  );

  const x = stat(id);

  modal(`
    <img id="big-image" class="cover"
      src="${esc(imgs[0]||'')}" alt="Mod">

    <div class="thumbs">
      ${imgs.map(i=>`
        <img data-pic="${esc(i)}"
          src="${esc(i)}" alt="Rasm">
      `).join('')}
    </div>

    <h2>${esc(m.title)}</h2>

    <p class="muted">
      ✦ ${esc(userName(m.mc_profiles))}
    </p>

    <p style="white-space:pre-wrap;overflow-wrap:anywhere">
      ${esc(m.description)}
    </p>

    <div class="stats" style="margin-bottom:14px">
      <span>👁 ${x.views}</span>
      <span>♥ ${x.likes}</span>
      <span>⬇ ${x.downloads}</span>
      <span>💬 ${x.comments}</span>
    </div>

    <div class="wrap">
      <button class="btn secondary" data-like="${esc(id)}">
        ${likes.has(id)?'♥ Like bosilgan':'♡ Like'}
      </button>
      <button class="btn secondary" data-save="${esc(id)}">
        ${saved.has(id)?'✓ Saqlangan':'🔖 Saqlash'}
      </button>
      <a class="btn" data-download="${esc(id)}"
        href="${esc(fileUrl('mcmod-files',m.file_path)+'?download')}"
        target="_blank" rel="noopener">
        ⬇ Yuklab olish
      </a>
    </div>

    <h3 style="margin-top:22px">💬 Izohlar</h3>

    <div id="comments">
      ${empty('Yuklanmoqda...')}
    </div>

    ${me ? `
      <form id="comment-form" class="compose"
        style="margin-top:14px">
        <input id="comment-text" class="field"
          maxlength="500" required
          placeholder="Izoh yozish...">
        <button class="btn" type="submit">Yuborish</button>
      </form>
    ` : empty('Izoh uchun akkauntga kirish kerak.')}
  `);

  await loadComments(id);
}

async function loadComments(id) {
  try {
    const rows = check(
      await db.from('mc_mod_comments')
        .select(
          'id,body,created_at,user_id,'+
          'mc_profiles(username,nickname,public_id)'
        )
        .eq('mod_id',id)
        .order('created_at',{ascending:false})
        .limit(80)
    );

    if (detailMod!==id || !$('comments')) return;

    $('comments').innerHTML = rows.map(x=>`
      <div class="comment">
        <b>${esc(userName(x.mc_profiles))}</b>
        <small>
          ID #${esc(x.mc_profiles?.public_id)}
          · ${formatDate(x.created_at)}
        </small>
        <p>${esc(x.body)}</p>
      </div>
    `).join('') || empty('Hali izoh yo‘q.');
  } catch(e) {
    fail(e);
  }
}

async function toggleMod(kind,id) {
  if (!me) return toast('Avval akkauntga kir');

  const table = kind==='like'
    ? 'mc_mod_likes' : 'mc_mod_saved';

  const set = kind==='like' ? likes : saved;

  try {
    if (set.has(id)) {
      check(
        await db.from(table).delete()
          .eq('mod_id',id)
          .eq('user_id',me.id)
      );
    } else {
      check(
        await db.from(table).insert({
          mod_id:id,
          user_id:me.id
        })
      );
    }

    if (set.has(id)) set.delete(id);
    else set.add(id);

    stats = new Map(
      (check(await db.rpc('mc_stats'))||[])
        .map(x=>[x.mod_id,x])
    );

    renderMods();
    await openMod(id);
  } catch(err) {
    fail(err);
  }
}

async function sendComment(e) {
  e.preventDefault();

  if (!me || !detailMod) return;

  const id = detailMod;
  const body = $('comment-text').value.trim();

  if (!body) return;

  try {
    check(
      await db.from('mc_mod_comments').insert({
        mod_id:id,
        user_id:me.id,
        body
      })
    );

    $('comment-text').value = '';

    await loadComments(id);

    stats = new Map(
      (check(await db.rpc('mc_stats'))||[])
        .map(x=>[x.mod_id,x])
    );

    renderMods();
  } catch(err) {
    fail(err);
  }
}

async function trackDownload(id) {
  if (me) {
    db.rpc('mc_track_mod',{
      the_mod:id,
      action:'download'
    }).then(r=>{
      if (r.error) console.warn(r.error);
    });
  } else {
    toast(
      'Yuklab olish sanog‘i akkauntga kirganlar uchun hisoblanadi.'
    );
  }
}

function subscribe() {
  if (channel) {
    db.removeChannel(channel);
    channel = null;
  }

  if (!me) return;

  channel = db.channel('mc-v05-'+me.id)
    .on(
      'postgres_changes',
      {
        event:'*',
        schema:'public',
        table:'mc_friendships'
      },
      async()=>{
        try { await loadPrivate(); }
        catch(e) { console.warn(e); }
      }
    )
    .on(
      'postgres_changes',
      {
        event:'INSERT',
        schema:'public',
        table:'mc_messages'
      },
      async payload=>{
        if (
          activeChat &&
          (
            payload.new.sender_id===activeChat ||
            payload.new.recipient_id===activeChat
          )
        ) await readChat();

        await readNotifs();
      }
    )
    .on(
      'postgres_changes',
      {
        event:'INSERT',
        schema:'public',
        table:'mc_notifications'
      },
      async()=>{
        await readNotifs();
        toast('🔔 Yangi bildirishnoma');
      }
    )
    .subscribe();
}

// MENYU TUGMALARI
for (const b of document.querySelectorAll('[data-page]')) {
  b.onclick = ()=>page(b.dataset.page);
}

$('mod-search').oninput = renderMods;
$('account-search').oninput = renderPeople;

$('notifications-button').onclick = showNotifications;
$('close-modal').onclick = closeModal;

$('modal').onclick = e=>{
  if (e.target===$('modal')) closeModal();
};

document.addEventListener('keydown',e=>{
  if (e.key==='Escape') closeModal();

  if (
    e.key==='Enter' &&
    e.target.matches('[data-mod],[data-person]')
  ) e.target.click();
});

document.addEventListener('click',async e=>{
  const btn = e.target.closest(
    '[data-mod],[data-person],[data-request],' +
    '[data-answer],[data-chat],[data-block],' +
    '[data-unblock],[data-notif],[data-mark-all],' +
    '[data-like],[data-save],[data-download],[data-pic]'
  );

  if (!btn) return;

  if (btn.dataset.mod) {
    await openMod(btn.dataset.mod);
  } else if (btn.dataset.person) {
    await showPerson(btn.dataset.person);
  } else if (btn.dataset.request) {
    await requestFriend(btn.dataset.request);
  } else if (btn.dataset.answer) {
    await answerFriend(
      btn.dataset.answer,
      btn.dataset.accept==='yes'
    );
  } else if (btn.dataset.chat) {
    await openChat(btn.dataset.chat);
  } else if (btn.dataset.block) {
    await blockPerson(btn.dataset.block);
  } else if (btn.dataset.unblock) {
    await unblockPerson(btn.dataset.unblock);
  } else if (btn.dataset.notif) {
    await clickNotice(btn.dataset.notif);
  } else if (btn.hasAttribute('data-mark-all')) {
    await markAll();
  } else if (btn.dataset.like) {
    await toggleMod('like',btn.dataset.like);
  } else if (btn.dataset.save) {
    await toggleMod('save',btn.dataset.save);
  } else if (btn.dataset.download) {
    await trackDownload(btn.dataset.download);
  } else if (btn.dataset.pic && $('big-image')) {
    $('big-image').src = btn.dataset.pic;
  }
});

document.addEventListener('submit',e=>{
  if (e.target.id==='comment-form') sendComment(e);
});

$('toggle-auth').onclick = ()=>switchAuth(!signup);

let usernameTimer;

$('username').oninput = ()=>{
  clearTimeout(usernameTimer);
  usernameTimer = setTimeout(validateUser,420);
};

$('password').oninput = ()=>{
  validatePassword();
  validateConfirm();
};

$('confirm').oninput = validateConfirm;
$('auth-form').onsubmit = signInOrUp;

$('logout').onclick = async()=>{
  try {
    check(await db.auth.signOut());
    me = null;
    await onAuthChange();
    page('home');
    toast('Chiqildi');
  } catch(e) {
    fail(e);
  }
};

$('profile-form').onsubmit = saveProfile;
$('upload-form').onsubmit = submitMod;
$('chat-form').onsubmit = sendChat;

fileSelect('mod-images','image-zone',drawPreviews);
fileSelect('mod-file','file-zone',drawFileName);
fileSelect(
  'avatar-file',
  'avatar-zone',
  ()=>$('avatar-name').textContent =
    $('avatar-file').files[0]?.name || ''
);

// SAYTNI ISHGA TUSHIRISH
async function boot() {
  try {
    if (!window.supabase?.createClient) {
      throw Error('Supabase kutubxonasi yuklanmagan');
    }

    db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );

    const session = check(
      await db.auth.getSession()
    );

    me = session.session?.user || null;

    await Promise.all([
      loadPeople(),
      loadMods()
    ]);

    await onAuthChange();

    db.auth.onAuthStateChange((event,session)=>{
      const id = session?.user?.id || null;

      if (id!==me?.id) {
        me = session?.user || null;
        setTimeout(
          ()=>onAuthChange().catch(fail),
          0
        );
      }
    });

    document.addEventListener('visibilitychange',()=>{
      if (!document.hidden && me) {
        loadPrivate().catch(console.warn);
      }
    });
  } catch(e) {
    fail(e);
  }
}

window.addEventListener('load',boot);

})();
