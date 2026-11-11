
(() => {
'use strict';

const PROJECT_URL =
  'https://swbnidsmwnqwjzfrlorr.supabase.co';

const KEY =
  'sb_publishable_-yjtMQSDiq7_L1ZiNfBcSQ_GiXEDPka';

const $ = id => document.getElementById(id);

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

const ico = name =>
  `<i data-lucide="${name}" class="icon"></i>`;

const iconize = () => {
  if (window.lucide?.createIcons) window.lucide.createIcons();
};

const state = {
  db:null, me:null, profile:null,
  people:[], mods:[], stats:new Map(),
  friend:[], notes:[], messages:[],
  liked:new Set(), saved:new Set(),
  role:'user', ban:null,
  activeChat:null, activeMod:null, editId:null,
  sort:'new', category:'all', register:false,
  lang:localStorage.getItem('mw_lang')||'uz',

  timer:null
};

window.MW_ORIGINAL = state;
window.MW_NAVIGATE = navigate;
window.MW_MOD_ACTION = modAction;
window.MW_OPEN_MOD = openMod;
window.MW_SHOW_PERSON = showPerson;
window.MW_OPEN_CHAT = openChat;
window.MW_READCHAT = readChat;

const categories = [

  'addon','skin','world','map',
  'texture','shader','settings','resource','other'
];

const dict = {
uz:{
  community:'MINECRAFT HAMJAMIYATI',
  hero:'Yangi dunyolar, yangi imkoniyatlar',
  heroSub:'Modlar ulashing, do‘stlar toping va yaratganlaringizni boshqalarga ko‘rsating.',
  mods:'Modlar',
  accounts:'Akkauntlar',
  upload:'Mod qo‘shish',
  chats:'Chatlar',
  profile:'Profil',
  searchMods:'Mod qidirish...',
  searchUsers:'Username, nik yoki ID qidirish...',
  new:'Yangilari',
  popular:'Mashhur',
  best:'Eng yaxshi',
  all:'Hammasi',
  addon:'Addon',
  skin:'Skin',
  world:'World',
  map:'Map',
  texture:'Tekstura',
  shader:'Shader',
  settingsCat:'Sozlamalar',
  resource:'Resurs',
  other:'Boshqa',
  category:'Kategoriya',
  modName:'Mod nomi',
  description:'Tavsif',
  images:'Rasmlar',
  addImages:'1–5 ta rasm tanlang',
  imagesHint:'JPG / PNG / WEBP, har biri 5 MB gacha',
  modFile:'Mod fayli',
  addFile:'Faylni tanlang',
  fileHint:'.mcpack / .mcaddon / .zip / .jar, 50 MB gacha',
  submitReview:'Tasdiqlashga yuborish',
  cancel:'Bekor qilish',
  newMod:'Yangi mod',
  editMod:'Modni tahrirlash',
  save:'Saqlash',
  login:'Kirish',
  register:'Akkaunt ochish',
  loginFirst:'Davom etish uchun akkauntga kiring.',
  username:'Username',
  password:'Parol',
  repeatPassword:'Parolni takrorlang',
  noRecovery:'Email talab qilinmaydigan sinov tizimi: parolni tiklash mavjud emas.',
  nickname:'Nik',
  bio:'Bio',
  avatar:'Avatar',
  changeAvatar:'Yangi avatar tanlash',
  friendRequests:'Do‘stlik so‘rovlari',
  savedMods:'Saqlangan modlar',
  myMods:'Mening modlarim',
  adminPanel:'Admin panel',
  reviewQueue:'Tasdiqlash kutilayotgan modlar',
  logout:'Chiqish',
  conversations:'Yozishmalar',
  writeMessage:'Xabar yozish...',
  settings:'Sozlamalar',
  language:'Til',
  archive:'Arxiv',
  trash:'O‘chirilganlar',
  restore:'Tiklash',
  deleteForever:'Butunlay o‘chirish',
  archive30:'Arxiv va o‘chirilganlar 30 kun saqlanadi.',
  noResults:'Hech narsa topilmadi.',
  noChats:'Hozircha suhbat yo‘q. + orqali do‘stni tanlang.',
  chooseFriend:'Do‘stni tanlang',
  noFriends:'Avval do‘st qo‘shing.',
  friendAdd:'Do‘stlik so‘rovi',
  friendSent:'So‘rov yuborilgan',
  accept:'Qabul qilish',
  decline:'Rad etish',
  friend:'Do‘st',
  write:'Xabar yozish',
  block:'Bloklash',
  unblock:'Blokdan chiqarish',
  like:'Like',
  download:'Yuklab olish',
  comments:'Izohlar',
  comment:'Izoh yozish...',
  commentSend:'Yuborish',
  owner:'Muallif',
  views:'Ko‘rish',
  likes:'Like',
  saves:'Saqlashlar',
  downloads:'Yuklanish',
  approve:'Tasdiqlash',
  reject:'Rad etish',
  ban:'Ban berish',
  unban:'Bandan chiqarish',
  makeAdmin:'Admin qilish',
  removeAdmin:'Adminlikni olish',
  days:'Muddat',
  oneDay:'1 kun',
  sevenDays:'7 kun',
  thirtyDays:'30 kun',
  forever:'Doimiy',
  role:'Maqom',
  review:'Tekshiruvda',
  approved:'Tasdiqlangan',
  archived:'Arxivda',
  trashed:'O‘chirilgan',
  rejected:'Rad etilgan',
  notifications:'Bildirishnomalar',
  markRead:'Hammasini o‘qildi qilish',
  empty:'Hozircha yo‘q.',
  success:'Muvaffaqiyatli',
  usernameTaken:'Username band',
  usernameFree:'Username bo‘sh',
  usernameFound:'Username topildi',
  usernameMissing:'Username topilmadi',
  passwordShort:'Kamida 8 ta belgi',
  passwordOK:'Parol uzunligi yetarli',
  passwordWrong:'Parol yoki username noto‘g‘ri',
  repeatWrong:'Parollar mos emas',
  repeatOK:'Parollar mos',
  loginToAct:'Avval akkauntga kiring',
  confirmedDelete:'Butunlay o‘chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo‘lmaydi.',
  banned:'Akkauntingizga cheklov qo‘yilgan. Joylash va yozish vaqtincha mumkin emas.',
  reqNotif:'Do‘stlik so‘rovi',
  acceptNotif:'Do‘stlik qabul qilindi',
  messageNotif:'Yangi xabar',
  commentNotif:'Modingizga izoh',
  moderationNotif:'Mod holati yangilandi',
  sending:'Yuborilmoqda...',
  loading:'Yuklanmoqda...',
  noRecoveryAlt:'Eski username faqat autentifikatsiya ichki manzili bo‘lib qoladi, login yangi username bilan ishlaydi.'
},
en:{
  community:'MINECRAFT COMMUNITY',
  hero:'New worlds, new possibilities',
  heroSub:'Share mods, find friends and show the world what you create.',
  mods:'Mods',
  accounts:'Accounts',
  upload:'Upload mod',
  chats:'Chats',
  profile:'Profile',
  searchMods:'Search mods...',
  searchUsers:'Search username, nickname or ID...',
  new:'Newest',
  popular:'Popular',
  best:'Top rated',
  all:'All',
  addon:'Addon',
  skin:'Skin',
  world:'World',
  map:'Map',
  texture:'Texture',
  shader:'Shader',
  settingsCat:'Settings',
  resource:'Resource',
  other:'Other',
  category:'Category',
  modName:'Mod name',
  description:'Description',
  images:'Images',
  addImages:'Choose 1–5 images',
  imagesHint:'JPG / PNG / WEBP, 5 MB each',
  modFile:'Mod file',
  addFile:'Choose a file',
  fileHint:'.mcpack / .mcaddon / .zip / .jar, 50 MB max',
  submitReview:'Submit for approval',
  cancel:'Cancel',
  newMod:'New mod',
  editMod:'Edit mod',
  save:'Save',
  login:'Log in',
  register:'Sign up',
  loginFirst:'Log in to continue.',
  username:'Username',
  password:'Password',
  repeatPassword:'Repeat password',
  noRecovery:'Prototype without email: password recovery is unavailable.',
  nickname:'Display name',
  bio:'Bio',
  avatar:'Avatar',
  changeAvatar:'Choose new avatar',
  friendRequests:'Friend requests',
  savedMods:'Saved mods',
  myMods:'My mods',
  adminPanel:'Admin dashboard',
  reviewQueue:'Mods awaiting approval',
  logout:'Log out',
  conversations:'Conversations',
  writeMessage:'Write a message...',
  settings:'Settings',
  language:'Language',
  archive:'Archive',
  trash:'Trash',
  restore:'Restore',
  deleteForever:'Delete permanently',
  archive30:'Archive and trash are retained for 30 days.',
  noResults:'Nothing found.',
  noChats:'No chats yet. Tap + to select a friend.',
  chooseFriend:'Choose a friend',
  noFriends:'Add a friend first.',
  friendAdd:'Add friend',
  friendSent:'Request sent',
  accept:'Accept',
  decline:'Decline',
  friend:'Friend',
  write:'Message',
  block:'Block',
  unblock:'Unblock',
  like:'Like',
  download:'Download',
  comments:'Comments',
  comment:'Write a comment...',
  commentSend:'Send',
  owner:'Creator',
  views:'Views',
  likes:'Likes',
  saves:'Saves',
  downloads:'Downloads',
  approve:'Approve',
  reject:'Reject',
  ban:'Ban',
  unban:'Unban',
  makeAdmin:'Make admin',
  removeAdmin:'Remove admin',
  days:'Duration',
  oneDay:'1 day',
  sevenDays:'7 days',
  thirtyDays:'30 days',
  forever:'Permanent',
  role:'Role',
  review:'Pending',
  approved:'Approved',
  archived:'Archived',
  trashed:'Deleted',
  rejected:'Rejected',
  notifications:'Notifications',
  markRead:'Mark all as read',
  empty:'Nothing yet.',
  success:'Success',
  usernameTaken:'Username taken',
  usernameFree:'Username available',
  usernameFound:'Username found',
  usernameMissing:'Username not found',
  passwordShort:'At least 8 characters',
  passwordOK:'Password length OK',
  passwordWrong:'Wrong username or password',
  repeatWrong:'Passwords do not match',
  repeatOK:'Passwords match',
  loginToAct:'Log in first',
  confirmedDelete:'Delete permanently? This cannot be undone.',
  banned:'Your account is restricted. Posting and messaging are disabled.',
  reqNotif:'Friend request',
  acceptNotif:'Friend accepted',
  messageNotif:'New message',
  commentNotif:'Comment on your mod',
  moderationNotif:'Mod status changed',
  sending:'Sending...',
  loading:'Loading...',
  noRecoveryAlt:'The original sign-in alias is kept internally; your new username works to log in.'
},
ru:{
  community:'СООБЩЕСТВО MINECRAFT',
  hero:'Новые миры, новые возможности',
  heroSub:'Делитесь модами, находите друзей и показывайте свои творения.',
  mods:'Моды',
  accounts:'Аккаунты',
  upload:'Добавить мод',
  chats:'Чаты',
  profile:'Профиль',
  searchMods:'Поиск модов...',
  searchUsers:'Поиск по имени или ID...',
  new:'Новые',
  popular:'Популярные',
  best:'Лучшие',
  all:'Все',
  addon:'Аддон',
  skin:'Скин',
  world:'Мир',
  map:'Карта',
  texture:'Текстуры',
  shader:'Шейдеры',
  settingsCat:'Настройки',
  resource:'Ресурсы',
  other:'Другое',
  category:'Категория',
  modName:'Название мода',
  description:'Описание',
  images:'Изображения',
  addImages:'Выберите 1–5 изображений',
  imagesHint:'JPG / PNG / WEBP, до 5 МБ',
  modFile:'Файл мода',
  addFile:'Выберите файл',
  fileHint:'.mcpack / .mcaddon / .zip / .jar, до 50 МБ',
  submitReview:'Отправить на проверку',
  cancel:'Отмена',
  newMod:'Новый мод',
  editMod:'Изменить мод',
  save:'Сохранить',
  login:'Войти',
  register:'Регистрация',
  loginFirst:'Войдите, чтобы продолжить.',
  username:'Имя пользователя',
  password:'Пароль',
  repeatPassword:'Повторите пароль',
  noRecovery:'Тестовая система без email: восстановление пароля недоступно.',
  nickname:'Ник',
  bio:'О себе',
  avatar:'Аватар',
  changeAvatar:'Выбрать новый аватар',
  friendRequests:'Заявки в друзья',
  savedMods:'Сохранённые моды',
  myMods:'Мои моды',
  adminPanel:'Панель администратора',
  reviewQueue:'Моды на проверке',
  logout:'Выйти',
  conversations:'Переписки',
  writeMessage:'Напишите сообщение...',
  settings:'Настройки',
  language:'Язык',
  archive:'Архив',
  trash:'Корзина',
  restore:'Восстановить',
  deleteForever:'Удалить навсегда',
  archive30:'Архив и корзина хранятся 30 дней.',
  noResults:'Ничего не найдено.',
  noChats:'Пока нет чатов. Нажмите +, чтобы выбрать друга.',
  chooseFriend:'Выберите друга',
  noFriends:'Сначала добавьте друга.',
  friendAdd:'Добавить в друзья',
  friendSent:'Заявка отправлена',
  accept:'Принять',
  decline:'Отклонить',
  friend:'Друг',
  write:'Написать',
  block:'Заблокировать',
  unblock:'Разблокировать',
  like:'Нравится',
  download:'Скачать',
  comments:'Комментарии',
  comment:'Написать комментарий...',
  commentSend:'Отправить',
  owner:'Автор',
  views:'Просмотры',
  likes:'Лайки',
  saves:'Сохранения',
  downloads:'Скачивания',
  approve:'Одобрить',
  reject:'Отклонить',
  ban:'Бан',
  unban:'Снять бан',
  makeAdmin:'Назначить админом',
  removeAdmin:'Снять админа',
  days:'Срок',
  oneDay:'1 день',
  sevenDays:'7 дней',
  thirtyDays:'30 дней',
  forever:'Навсегда',
  role:'Роль',
  review:'На проверке',
  approved:'Одобрено',
  archived:'В архиве',
  trashed:'Удалено',
  rejected:'Отклонено',
  notifications:'Уведомления',
  markRead:'Прочитать всё',
  empty:'Пока пусто.',
  success:'Готово',
  usernameTaken:'Имя занято',
  usernameFree:'Имя свободно',
  usernameFound:'Имя найдено',
  usernameMissing:'Имя не найдено',
  passwordShort:'Минимум 8 символов',
  passwordOK:'Длина пароля подходит',
  passwordWrong:'Неверное имя или пароль',
  repeatWrong:'Пароли не совпадают',
  repeatOK:'Пароли совпадают',
  loginToAct:'Сначала войдите',
  confirmedDelete:'Удалить навсегда? Отменить действие нельзя.',
  banned:'Аккаунт ограничен. Публикации и сообщения недоступны.',
  reqNotif:'Заявка в друзья',
  acceptNotif:'Заявка принята',
  messageNotif:'Новое сообщение',
  commentNotif:'Комментарий к вашему моду',
  moderationNotif:'Статус мода изменён',
  sending:'Отправка...',
  loading:'Загрузка...',
  noRecoveryAlt:'Старый внутренний адрес входа сохранён; вход работает с новым именем.'
}
};

const t = k =>
  dict[state.lang]?.[k] || dict.uz[k] || k;

const loc = () =>
  state.lang==='ru'?'ru-RU':
  state.lang==='en'?'en-US':'uz-UZ';

const fmt = x => new Date(x).toLocaleString(loc(),{
  day:'2-digit',
  month:'short',
  hour:'2-digit',
  minute:'2-digit'
});

const toast = msg => {
  $('toast').textContent=msg;
  $('toast').hidden=false;
  clearTimeout(state.timer);
  state.timer=setTimeout(()=>$('toast').hidden=true,5000);
};

const err = e => {
  console.error(e);
  toast('Error: '+(e?.message || e));
};

const ok = r => {
  if(r?.error) throw r.error;
  return r?.data;
};

const named = p => p?.nickname || p?.username || '?';

const person = uid =>
  state.people.find(x=>x.id===uid);

const asset = (bucket,path) =>
  state.db && path
    ? state.db.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : '';

const genericAvatar = 'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" rx="50" fill="#658a7e"/>' +
    '<circle cx="50" cy="36" r="19" fill="#d8ead7"/>' +
    '<path d="M14 95c0-50 72-50 72 0" fill="#d8ead7"/></svg>'
  );

const ava = p =>
  asset('mc-avatars',p?.avatar_path)||genericAvatar;

const avatarHTML = (p,small=false) =>
  `<img class="avatar ${small?'sm':''}"
    src="${safe(ava(p))}" alt="">`;

const st = id => state.stats.get(id)||{
  views:0,likes:0,downloads:0,comments:0,saves:0
};

const authNeeded = () => {
  if(!state.me){
    toast(t('loginToAct'));
    return false;
  }
  if(state.ban){
    toast(t('banned'));
    return false;
  }
  return true;
};

function translate(){
  document.documentElement.lang=state.lang;
  document.querySelectorAll('[data-i]').forEach(e=>
    e.textContent=t(e.dataset.i)
  );
  document.querySelectorAll('[data-ph]').forEach(e=>
    e.placeholder=t(e.dataset.ph)
  );
  drawCategoryOptions();
  renderSorts();
  renderCategories();
  drawMods();
  drawPeople();
  drawChats();
  drawRequests();
  drawAdmin();
  iconize();
}

function navigate(id){
  document.querySelectorAll('.page').forEach(x=>
    x.classList.toggle('active',x.id===id)
  );
  document.querySelectorAll('.nav').forEach(x=>
    x.classList.toggle('active',x.dataset.page===id)
  );
  window.scrollTo(0,0);

  if(id==='chats') loadChats().catch(err);
  if(id==='profile') viewRequests().catch(err);
}

function modal(html){
  $('modal-body').innerHTML=html;
  $('modal').hidden=false;
  iconize();
}

function closeModal(){
  $('modal').hidden=true;
  state.activeMod=null;
}

function drawCategoryOptions(){
  const sel=$('mod-category'),old=sel.value;
  sel.innerHTML=categories.map(c=>
    `<option value="${c}">${safe(t(c==='settings'?'settingsCat':c))}</option>`
  ).join('');
  if(old)sel.value=old;
}

function renderSorts(){
  $('sort-list').innerHTML=['new','popular','best'].map(x=>
    `<button class="chip ${state.sort===x?'on':''}"
      data-sort="${x}">${safe(t(x))}</button>`
  ).join('');
}

function renderCategories(){
  $('category-list').innerHTML=['all',...categories].map(x=>
    `<button class="chip ${state.category===x?'on':''}"
      data-category="${x}">${safe(t(x==='settings'?'settingsCat':x))}</button>`
  ).join('');
}

function modCard(m){
  const a=person(m.user_id),s=st(m.id);
  return `
    <article data-mod="${safe(m.id)}"
      class="card" role="button" tabindex="0">
      <img class="modcover" loading="lazy"
        src="${safe(asset('mcmod-images',m.images?.[0]))}"
        alt="${safe(m.title)}">
      <div class="cardmain">
        <h3>${safe(m.title)}</h3>
        <small style="color:var(--blue)">${safe(named(a))}</small>
        <div class="stats">
          <span>${ico('eye')} ${s.views}</span>
          <span>${ico('heart')} ${s.likes}</span>
          <span>${ico('download')} ${s.downloads}</span>
          <span>${ico('message-square')} ${s.comments}</span>
        </div>
        ${m.status!=='approved'
          ? `<small>${safe(t(m.status==='pending'?'review':m.status))}</small>`
          : ''}
      </div>
    </article>`;
}

function drawMods(){
  const input=$('mod-search').value.toLowerCase().trim();

  let list=state.mods.filter(m=>
    m.status==='approved' &&
    m.title.toLowerCase().includes(input) &&
    (state.category==='all'||m.category===state.category)
  );

  list.sort((a,b)=>{
    if(state.sort==='new')
      return new Date(b.created_at)-new Date(a.created_at);

    const x=st(a.id),y=st(b.id);

    return state.sort==='popular'
      ? (y.views+y.downloads*2)-(x.views+x.downloads*2)
      : (y.likes+y.saves*2)-(x.likes+x.saves*2);
  });

  $('mod-num').textContent=list.length;
  $('mod-grid').innerHTML=
    list.map(modCard).join('') ||
    `<p class="muted">${safe(t('noResults'))}</p>`;

  if(state.me){
    $('mine-grid').innerHTML=state.mods.filter(m=>
      m.user_id===state.me.id &&
      m.status!=='trashed' &&
      m.status!=='archived'
    ).map(modCard).join('') ||
      `<p class="muted">${safe(t('empty'))}</p>`;

    $('saved-grid').innerHTML=state.mods.filter(m=>
      state.saved.has(m.id) &&
      m.status==='approved'
    ).map(modCard).join('') ||
      `<p class="muted">${safe(t('empty'))}</p>`;
  }
  iconize();
}

function drawPeople(){
  const q=$('people-search').value.toLowerCase().trim();

  const users=state.people.filter(p=>
    `${p.username} ${p.nickname} ${p.public_id}`
      .toLowerCase().includes(q)
  );

  $('user-num').textContent=users.length;

  $('people-grid').innerHTML=users.map(p=>`
    <article class="panel userrow"
      data-person="${safe(p.id)}"
      tabindex="0" role="button" style="padding:13px">
      ${avatarHTML(p,true)}
      <div class="flexfill">
        <h3>${safe(named(p))}</h3>
        <small>@${safe(p.username)} · ID #${safe(p.public_id)}</small>
      </div>
    </article>
  `).join('') || `<p class="muted">${safe(t('noResults'))}</p>`;
}

function myFriend(id){
  return state.friend.find(f=>
    f.status==='accepted' &&
    (f.user_low===id||f.user_high===id)
  );
}

function friendIds(){
  return state.me
    ? state.friend.filter(f=>f.status==='accepted')
      .map(f=>f.user_low===state.me.id?f.user_high:f.user_low)
    : [];
}

function drawRequests(){
  if(!state.me)return;

  const reqs=state.friend.filter(f=>
    f.status==='pending' && f.requester!==state.me.id
  );

  $('request-list').innerHTML=reqs.map(f=>{
    const uid=f.user_low===state.me.id?f.user_high:f.user_low;
    return `
      <div class="row wrap between" style="margin:9px 0">
        ${avatarHTML(person(uid),true)}
        <b>${safe(named(person(uid)))}</b>
        <button class="btn small"
          data-answer="${uid}" data-agree="true">${t('accept')}</button>
        <button class="btn secondary small"
          data-answer="${uid}" data-agree="false">${t('decline')}</button>
      </div>`;
  }).join('') || `<p class="muted">${t('empty')}</p>`;

  iconize();
}

function drawProfile(){
  const signed=!!state.me;

  $('auth-box').hidden=signed;
  $('profile-box').hidden=!signed;
  $('upload-gate').hidden=signed;
  $('mod-form').hidden=!signed;
  $('chat-gate').hidden=signed;
  $('chat-wrap').hidden=!signed;

  if(!signed)return;

  const p=state.profile;

  $('profile-avatar').src=ava(p);
  $('profile-name').textContent=named(p);
  $('profile-handle').textContent=
    '@'+p.username+' · ID #'+p.public_id;

  $('my-role').textContent=
    state.role!=='user'?state.role:'';

  $('profile-username').value=p.username;
  $('profile-nickname').value=p.nickname;
  $('profile-bio').value=p.bio||'';

  $('admin-panel').hidden=state.role==='user';

  drawRequests();
  drawMods();
  drawAdmin();
}

async function reloadPeople(){
  state.people=ok(
    await state.db.from('mc_profiles')
      .select('id,username,nickname,bio,avatar_path,public_id,created_at')
      .order('created_at',{ascending:true})
      .limit(1500)
  )||[];

  drawPeople();
}

async function reloadMods(){
  state.mods=ok(
    await state.db.from('mc_mods')
      .select(
        'id,user_id,title,description,category,images,file_path,'+
        'status,archived_at,trashed_at,created_at'
      )
      .order('created_at',{ascending:false})
      .limit(600)
  )||[];

  await reloadStats();
}

async function reloadStats(){
  const all=ok(await state.db.rpc('mc_stats'))||[];

  state.stats=new Map(
    all.map(x=>[x.mod_id,x])
  );

  drawMods();
}

async function reloadPrivate(){
  if(!state.me)return;

  const id=state.me.id;

  const r=await Promise.all([
    state.db.from('mc_friendships')
      .select('*')
      .or(`user_low.eq.${id},user_high.eq.${id}`),

    state.db.from('mc_notifications')
      .select('*')
      .eq('recipient_id',id)
      .order('created_at',{ascending:false})
      .limit(150),

    state.db.from('mc_mod_likes')
      .select('mod_id')
      .eq('user_id',id),

    state.db.from('mc_mod_saved')
      .select('mod_id')
      .eq('user_id',id)
  ]);

  r.forEach(ok);

  state.friend=r[0].data||[];
  state.notes=r[1].data||[];
  state.liked=new Set((r[2].data||[]).map(x=>x.mod_id));
  state.saved=new Set((r[3].data||[]).map(x=>x.mod_id));

  renderBadges();
  drawRequests();
  drawMods();
}

async function refreshMe(){
  if(!state.me){
    state.profile=null;
    state.role='user';
    state.ban=null;
    drawProfile();
    return;
  }

  state.profile=ok(
    await state.db.from('mc_profiles')
      .select('*')
      .eq('id',state.me.id)
      .single()
  );

  state.role=ok(await state.db.rpc('mc_my_role'))||'user';

  const b=ok(await state.db.rpc('mc_my_ban'))||{};
  state.ban=Object.keys(b).length?b:null;

  drawProfile();

  if(state.ban)toast(t('banned'));
}

async function reloadEverything(){
  await reloadPeople();
  await reloadMods();

  if(state.me){
    await refreshMe();
    await reloadPrivate();
    await loadChats();
  } else {
    drawProfile();
  }
}

async function markNotifs(predicate){
  if(!state.me)return;

  const ids=state.notes.filter(n=>
    !n.seen && predicate(n)
  ).map(n=>n.id);

  if(ids.length){
    ok(
      await state.db.from('mc_notifications')
        .update({seen:true})
        .in('id',ids)
    );

    state.notes.forEach(n=>{
      if(ids.includes(n.id))n.seen=true;
    });

    renderBadges();
  }
}

function renderBadges(){
  const n=state.notes.filter(x=>!x.seen);

  $('notif-num').hidden=!n.length;
  $('notif-num').textContent=n.length>99?'99+':n.length;
  $('chat-dot').hidden=!n.some(x=>x.kind==='message');
}

async function viewRequests(){
  if(state.me)
    await markNotifs(x=>
      x.kind==='request'||x.kind==='accepted'
    );

  drawRequests();
}

async function showPerson(uid){
  const p=person(uid);
  if(!p)return;

  const f=state.friend.find(x=>
    x.user_low===uid||x.user_high===uid
  );

  let buttons='';

  if(state.me&&uid!==state.me.id){
    if(f?.status==='accepted'){
      buttons+=`
        <button class="btn" data-chat="${uid}">
          ${ico('message-circle')} ${t('write')}
        </button>`;
    } else if(f?.status==='pending'&&f.requester===uid){
      buttons+=`
        <button class="btn" data-answer="${uid}"
          data-agree="true">${t('accept')}</button>
        <button class="btn secondary" data-answer="${uid}"
          data-agree="false">${t('decline')}</button>`;
    } else if(f?.status==='pending'){
      buttons+=`<span class="muted">${t('friendSent')}</span>`;
    } else {
      buttons+=`
        <button class="btn" data-friend="${uid}">
          ${ico('user-plus')} ${t('friendAdd')}
        </button>`;
    }

    buttons+=`
      <button class="btn danger" data-block="${uid}">
        ${ico('shield-off')} ${t('block')}
      </button>`;
  }

  if(state.role!=='user' && state.me && uid!==state.me.id){
    buttons+=`
      <div class="panel" style="width:100%;margin-top:10px">
        <h3>${t('adminPanel')}</h3>
        <label>${t('days')}
          <select id="ban-days" class="field">
            <option value="1">${t('oneDay')}</option>
            <option value="7">${t('sevenDays')}</option>
            <option value="30">${t('thirtyDays')}</option>
            <option value="">${t('forever')}</option>
          </select>
        </label>
        <div class="row wrap" style="margin-top:9px">
          <button class="btn danger" data-ban="${uid}">
            ${t('ban')}
          </button>
          <button class="btn secondary" data-unban="${uid}">
            ${t('unban')}
          </button>
          ${state.role==='owner'?`
            <button class="btn secondary" data-admin="${uid}"
              data-set="true">${t('makeAdmin')}</button>
            <button class="btn secondary" data-admin="${uid}"
              data-set="false">${t('removeAdmin')}</button>
          `:''}
        </div>
      </div>`;
  }

  modal(`
    <div class="row">
      ${avatarHTML(p)}
      <div>
        <h2 style="margin:0">${safe(named(p))}</h2>
        <small>@${safe(p.username)} · ID #${safe(p.public_id)}</small>
      </div>
    </div>
    <p style="white-space:pre-wrap;margin:16px 0">
      ${safe(p.bio||'')}
    </p>
    <div class="row wrap">${buttons}</div>
    <h3 style="margin-top:20px">${t('mods')}</h3>
    <div class="grid">
      ${state.mods.filter(m=>
        m.user_id===uid && m.status==='approved'
      ).map(modCard).join('') ||
      `<p class="muted">${t('empty')}</p>`}
    </div>
  `);
}

async function addFriend(uid){
  if(!authNeeded())return;

  ok(
    await state.db.rpc('mc_request_friend',{target:uid})
  );

  closeModal();
  await reloadPrivate();
  toast(t('friendSent'));
}

async function answerFriend(uid,agree){
  if(!authNeeded())return;

  ok(
    await state.db.rpc('mc_answer_friend',{
      sender:uid,agree
    })
  );

  await markNotifs(n=>
    n.kind==='request'&&n.actor_id===uid
  );

  closeModal();
  await reloadPrivate();
  toast(t('success'));
}

async function blockUser(uid){
  if(!authNeeded())return;
  if(!confirm(t('block')+'?'))return;

  ok(
    await state.db.rpc('mc_block_person',{target:uid})
  );

  closeModal();
  await reloadPrivate();
}

function chooseFriend(){
  const ids=friendIds();

  modal(`
    <h2>${t('chooseFriend')}</h2>
    ${ids.map(uid=>`
      <button class="conversation" data-chat="${uid}">
        ${avatarHTML(person(uid),true)}
        <strong>${safe(named(person(uid)))}</strong>
      </button>
    `).join('')||`<p class="muted">${t('noFriends')}</p>`}
  `);
}

async function loadChats(){
  if(!state.me)return;
  const id=state.me.id;

  const r=await state.db.from('mc_messages')
    .select('id,sender_id,recipient_id,body,read_at,created_at')
    .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
    .order('created_at',{ascending:false})
    .limit(400);

  state.messages=ok(r)||[];
  drawChats();
}

function drawChats(){
  if(!state.me)return;

  const recent=new Map();
  const allFriends=new Set(friendIds());

  for(const m of state.messages){
    const uid=m.sender_id===state.me.id
      ?m.recipient_id:m.sender_id;

    if(allFriends.has(uid)&&!recent.has(uid))
      recent.set(uid,m);
  }

  const entries=[...recent.entries()];
  $('conversation-num').textContent=entries.length;

  $('conversation-list').innerHTML=entries.map(([uid,msg])=>{
    const p=person(uid);
    const unread=state.messages.filter(m=>
      m.sender_id===uid &&
      m.recipient_id===state.me.id &&
      !m.read_at
    ).length;

    return `
      <button class="conversation" data-chat="${uid}">
        ${avatarHTML(p,true)}
        <span class="convoinfo">
          <strong style="font-size:17px">${safe(named(p))}</strong>
          <small>${safe(msg.body)}</small>
        </span>
        <div style="text-align:right">
          <small>${fmt(msg.created_at)}</small>
          ${unread?`<span class="unread">${unread}</span>`:''}
        </div>
      </button>`;
  }).join('')||`<p class="muted">${t('noChats')}</p>`;

  iconize();
}

async function openChat(uid){
  if(!state.me||!myFriend(uid)){
    return toast(t('noFriends'));
  }

  closeModal();
  navigate('chats');

  state.activeChat=uid;
  $('chat-list').hidden=true;
  $('chat-detail').hidden=false;
  $('chat-name').textContent=named(person(uid));
  $('chat-avatar').src=ava(person(uid));
  $('chat-person').dataset.person=uid;

  await readChat();
}

async function readChat(){
  const uid=state.activeChat;
  if(!state.me||!uid)return;

  const r=await state.db.from('mc_messages')
    .select('id,sender_id,recipient_id,body,read_at,created_at')
    .or(
      `and(sender_id.eq.${state.me.id},recipient_id.eq.${uid}),`+
      `and(sender_id.eq.${uid},recipient_id.eq.${state.me.id})`
    )
    .order('created_at',{ascending:true})
    .limit(200);

  const messages=ok(r)||[];

  $('messages').innerHTML=messages.map(m=>`
    <div class="bubble ${m.sender_id===state.me.id?'mine':''}">
      ${safe(m.body)}
      <small>${fmt(m.created_at)}</small>
    </div>
  `).join('')||`<p class="muted">${t('empty')}</p>`;

  $('messages').scrollTop=$('messages').scrollHeight;

  ok(
    await state.db.from('mc_messages')
      .update({read_at:new Date().toISOString()})
      .eq('recipient_id',state.me.id)
      .eq('sender_id',uid)
      .is('read_at',null)
  );

  await markNotifs(n=>
    n.kind==='message'&&n.actor_id===uid
  );

  await loadChats();
}

async function sendChat(ev){
  ev.preventDefault();
  if(!authNeeded()||!state.activeChat)return;

  const body=$('message-text').value.trim();
  if(!body)return;

  ok(
    await state.db.from('mc_messages').insert({
      sender_id:state.me.id,
      recipient_id:state.activeChat,
      body
    })
  );

  $('message-text').value='';
  await readChat();
}

function showNotif(){
  if(!state.me)return toast(t('loginToAct'));

  const typeNames={
    request:'reqNotif',
    accepted:'acceptNotif',
    message:'messageNotif',
    comment:'commentNotif',
    moderation:'moderationNotif'
  };

  modal(`
    <h2>${t('notifications')}</h2>
    <button class="btn secondary small" data-markall>
      ${t('markRead')}
    </button>
    <div style="margin-top:15px">
      ${state.notes.map(n=>`
        <button class="notice ${n.seen?'':'new'}"
          data-notice="${n.id}">
          <strong>${safe(t(typeNames[n.kind]))}</strong>
          <small style="display:block">
            ${safe(named(person(n.actor_id)))} · ${fmt(n.created_at)}
          </small>
        </button>
      `).join('')||`<p>${t('empty')}</p>`}
    </div>
  `);
}

async function openNotice(id){
  const n=state.notes.find(x=>String(x.id)===String(id));
  if(!n)return;

  await markNotifs(x=>x.id===n.id);
  closeModal();

  if(n.kind==='message')return openChat(n.actor_id);

  if(n.kind==='request'){
    navigate('profile');
    return drawRequests();
  }

  if(n.kind==='accepted')return showPerson(n.actor_id);

  if((n.kind==='comment'||n.kind==='moderation')&&n.ref)
    return openMod(n.ref);
}

async function showSettings(){
  const own=state.mods.filter(m=>
    state.me&&m.user_id===state.me.id
  );

  const list=kind=>own.filter(m=>
    m.status===kind
  ).map(m=>`
    <div class="row between wrap"
      style="padding:9px 0;border-bottom:1px solid #ffffff21">
      <span>${safe(m.title)}</span>
      <button class="btn small secondary"
        data-action="restore" data-mid="${m.id}">
        ${t('restore')}
      </button>
      <button class="btn small danger"
        data-action="purge" data-mid="${m.id}">
        ${t('deleteForever')}
      </button>
    </div>
  `).join('')||`<p class="muted">${t('empty')}</p>`;

  modal(`
    <h2>${t('settings')}</h2>
    <label>${t('language')}
      <select class="field" id="lang-choice">
        <option value="uz">O‘zbekcha</option>
        <option value="ru">Русский</option>
        <option value="en">English</option>
      </select>
    </label>
    <p class="muted" style="margin-top:13px">
      ${t('archive30')}
    </p>
    <h3>${t('archive')}</h3>
    ${list('archived')}
    <h3 style="margin-top:18px">${t('trash')}</h3>
    ${list('trashed')}
  `);

  $('lang-choice').value=state.lang;
  $('lang-choice').onchange=e=>{
    state.lang=e.target.value;
    localStorage.setItem('mw_lang',state.lang);
    translate();
    showSettings();
  };
}

async function openMod(id){
  const m=state.mods.find(x=>x.id===id);
  if(!m)return;

  state.activeMod=id;

  const s=st(id);
  const images=(m.images||[]).map(x=>
    asset('mcmod-images',x)
  );
  const author=person(m.user_id);

  const owner=state.me&&(
    state.me.id===m.user_id||state.role!=='user'
  );

  const actions=owner?`
    <div class="row wrap" style="margin:15px 0">
      <button class="btn secondary small" data-edit="${id}">
        ${ico('pencil')} ${t('editMod')}
      </button>
      <button class="btn secondary small"
        data-action="archive" data-mid="${id}">
        ${ico('archive')} ${t('archive')}
      </button>
      <button class="btn danger small"
        data-action="trash" data-mid="${id}">
        ${ico('trash-2')} ${t('trash')}
      </button>
      ${state.role!=='user'?`
        <button class="btn small"
          data-review="approve" data-mid="${id}">
          ${t('approve')}
        </button>
        <button class="btn danger small"
          data-review="reject" data-mid="${id}">
          ${t('reject')}
        </button>
      `:''}
    </div>
  `:'';

  modal(`
    <img class="bigimage" id="bigpic"
      src="${safe(images[0]||'')}" alt="${safe(m.title)}">
    <div class="thumbs">
      ${images.map(x=>`
        <img src="${safe(x)}" data-photo="${safe(x)}" alt="">
      `).join('')}
    </div>

    <h2>${safe(m.title)}</h2>

    <button class="author" data-person="${safe(m.user_id)}">
      ${avatarHTML(author,true)}
      ${safe(named(author))} · ID #${safe(author?.public_id)}
    </button>

    <p style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:16px">
      ${safe(m.description)}
    </p>

    <div class="row wrap" style="margin:20px 0">
      <button class="actionicon like ${state.liked.has(id)?'on':''}"
        data-like="${id}">
        ${ico('heart')}
        <small>${s.likes}</small>
      </button>
      <button class="actionicon save ${state.saved.has(id)?'on':''}"
        data-save="${id}">
        ${ico('bookmark')}
        <small>${s.saves}</small>
      </button>
      <div class="actionicon">
        ${ico('eye')}
        <small>${s.views}</small>
      </div>
      <a class="btn" data-download="${id}"
        href="${safe(asset('mcmod-files',m.file_path)+'?download')}"
        target="_blank" rel="noopener">
        ${ico('download')} ${t('download')} · ${s.downloads}
      </a>
      
${/\.(mcaddon|mcpack)$/i.test(m.file_path||'') ? `
  <button type="button" class="btn secondary"
    data-install="${id}">
    ${ico('package-open')} Minecraftda ochish
  </button>
` : ''}

    </div>

    ${actions}

    <h3>${t('comments')} (${s.comments})</h3>
    <div id="comments"></div>

    ${state.me?`
      <form id="comment-form" class="row" style="margin-top:15px">
        <input id="comment-input" class="field"
          maxlength="500" required
          placeholder="${safe(t('comment'))}">
        <button class="btn">${t('commentSend')}</button>
      </form>
    `:''}
  `);

  if(state.me&&m.status==='approved'){
    state.db.rpc('mc_track_mod',{
      the_mod:id,action:'view'
    })
    .then(()=>reloadStats())
    .catch(console.warn);
  }

  await loadComments(id);
}

async function loadComments(id){
  const rows=ok(
    await state.db.from('mc_mod_comments')
      .select('id,body,user_id,created_at')
      .eq('mod_id',id)
      .order('created_at',{ascending:false})
      .limit(80)
  )||[];

  if(!$('comments')||state.activeMod!==id)return;

  $('comments').innerHTML=rows.map(c=>`
    <div class="comment">
      <button class="author" data-person="${c.user_id}">
        ${safe(named(person(c.user_id)))}
      </button>
      <small style="display:block">${fmt(c.created_at)}</small>
      <p>${safe(c.body)}</p>
    </div>
  `).join('')||`<p class="muted">${t('empty')}</p>`;
}

async function toggleReaction(kind,id){
  if(!authNeeded())return;

  const table=kind==='like'
    ?'mc_mod_likes':'mc_mod_saved';
  const set=kind==='like'?state.liked:state.saved;

  if(set.has(id)){
    ok(
      await state.db.from(table).delete()
        .eq('mod_id',id)
        .eq('user_id',state.me.id)
    );
    set.delete(id);
  } else {
    ok(
      await state.db.from(table).insert({
        mod_id:id,user_id:state.me.id
      })
    );
    set.add(id);
  }

  await reloadStats();
  await openMod(id);
}

async function addComment(ev){
  ev.preventDefault();
  if(!authNeeded()||!state.activeMod)return;

  const text=$('comment-input').value.trim();
  const id=state.activeMod;

  if(!text)return;

  ok(
    await state.db.from('mc_mod_comments').insert({
      mod_id:id,user_id:state.me.id,body:text
    })
  );

  $('comment-input').value='';
  await loadComments(id);
  await reloadStats();
}
  
async function installMinecraft(id) {
  const m = state.mods.find(x => x.id === id);
  if (!m) return;

  const ext = (m.file_path || '').split('.').pop().toLowerCase();

  if (!['mcaddon', 'mcpack'].includes(ext)) {
    toast('Bu fayl Minecraft Bedrock uchun emas');
    return;
  }

  toast('Mod fayli tayyorlanmoqda...');

  const response = await fetch(asset('mcmod-files', m.file_path));
  if (!response.ok) {
    throw Error('Mod faylini olib bo‘lmadi');
  }

  const blob = await response.blob();
  const file = new File([blob], 'Minecraft-Mod.' + ext, {
    type: 'application/octet-stream'
  });

  if (navigator.canShare?.({ files: [file] })) {
    modal(`
      <h3>Mod tayyor</h3>
      <p>Minecraftga yuborish tugmasini bosing va
      ochilgan ro‘yxatdan Minecraftni tanlang.</p>
      <button type="button" class="btn" id="share-mc">
        ${ico('package-open')} Minecraftga yuborish
      </button>
    `);


$('share-mc').onclick = () => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');

  a.href = url;
  a.download = file.name;

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);

  toast('Mod yuklandi. Downloads papkasidan Minecraft bilan oching.');
  trackDownload(id).catch(console.warn);
};


  } else {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 60000);

    toast('Fayl yuklandi. Downloads papkasidan oching.');
    await trackDownload(id);
  }
}

async function trackDownload(id){
  if(!state.me)return;

  await state.db.rpc('mc_track_mod',{
    the_mod:id,action:'download'
  });
  await reloadStats();
}

function hint(id,msg,positive=false){
  const el=$(id);
  el.textContent=msg;
  el.className='hint '+(positive?'good':'bad');
}

function switchAuth(){
  state.register=!state.register;

  $('auth-head').textContent=t(state.register?'register':'login');
  $('auth-submit').textContent=t(state.register?'register':'login');
  $('auth-toggle').textContent=t(state.register?'login':'register');

  $('repeat-wrap').hidden=!state.register;
  $('auth-repeat').required=state.register;
}

let userDelay=0;

async function validateUsername(){
  const name=$('auth-user').value.trim().toLowerCase();

  if(!/^[a-z0-9_]{3,20}$/.test(name)){
    hint('user-hint',t('username')+': 3–20 [a-z0-9_]');
    return false;
  }

  try{
    const isTaken=state.register
      ? !ok(await state.db.rpc('mc_handle_available',{handle:name}))
      : !!ok(await state.db.from('mc_profiles')
          .select('id')
          .eq('username',name)
          .maybeSingle());

    const valid=state.register?!isTaken:isTaken;

    hint(
      'user-hint',
      t(
        state.register
          ?(isTaken?'usernameTaken':'usernameFree')
          :(isTaken?'usernameFound':'usernameMissing')
      ),
      valid
    );

    return valid;
  } catch(e){
    err(e);
    return false;
  }
}

function validatePass(){
  const valid=$('auth-pass').value.length>=8;
  hint('pass-hint',t(valid?'passwordOK':'passwordShort'),valid);
  return valid;
}

function validateRepeat(){
  const valid=!state.register||(
    $('auth-repeat').value!=='' &&
    $('auth-repeat').value===$('auth-pass').value
  );

  if(state.register)
    hint('repeat-hint',t(valid?'repeatOK':'repeatWrong'),valid);

  return valid;
}

async function submitAuth(ev){
  ev.preventDefault();

  const user=$('auth-user').value.trim().toLowerCase();

  if(
    !validatePass() ||
    !validateRepeat() ||
    !await validateUsername()
  )return;

  const pass=$('auth-pass').value;
  const btn=$('auth-submit');
  btn.disabled=true;

  try{
    let result;

    if(state.register){
      result=await state.db.auth.signUp({
        email:user+'@members.example.com',
        password:pass,
        options:{data:{username:user}}
      });
    } else {
      const alias=ok(
        await state.db.rpc('mc_login_email',{handle:user})
      );
      if(!alias)throw Error(t('usernameMissing'));

      result=await state.db.auth.signInWithPassword({
        email:alias,password:pass
      });
    }

    if(result.error){
      hint('pass-hint',t('passwordWrong'));
      throw result.error;
    }

    if(!result.data.session)
      throw Error('Please check email authentication settings');

    state.me=result.data.user;
    $('auth-form').reset();

    await reloadEverything();
    subscribe();
    toast(t('success'));
  } catch(e){
    err(e);
  } finally {
    btn.disabled=false;
  }
}

function validateImage(f){
  return f &&
    ['image/png','image/jpeg','image/webp'].includes(f.type) &&
    f.size<=5*1024*1024;
}

async function uploadAsset(bucket,file,uid){
  const ext=file.name.split('.').pop().toLowerCase();
  const path=uid+'/'+crypto.randomUUID()+'.'+ext;

  ok(
    await state.db.storage.from(bucket)
      .upload(path,file,{upsert:false})
  );

  return path;
}

function drawImagePreview(){
  const box=$('mod-image-preview');
  box.innerHTML='';

  [...$('mod-images').files].slice(0,5).forEach(f=>{
    const img=document.createElement('img');
    const url=URL.createObjectURL(f);

    img.src=url;
    img.onload=()=>URL.revokeObjectURL(url);
    box.append(img);
  });
}

function startEdit(id){
  const m=state.mods.find(x=>x.id===id);
  if(!m)return;

  closeModal();
  state.editId=id;
  navigate('upload');

  $('mod-form-heading').textContent=t('editMod');
  $('mod-category').value=m.category||'addon';
  $('mod-name').value=m.title;
  $('mod-desc').value=m.description;
  $('mod-file-selected').textContent=
    m.file_path.split('/').pop();

  $('mod-image-preview').innerHTML=(m.images||[])
    .map(x=>`
      <img src="${safe(asset('mcmod-images',x))}" alt="">
    `).join('');

  $('cancel-edit').hidden=false;
}

function cancelEdit(){
  state.editId=null;
  $('mod-form').reset();
  $('mod-form-heading').textContent=t('newMod');
  $('mod-image-preview').innerHTML='';
  $('mod-file-selected').textContent='';
  $('cancel-edit').hidden=true;
}

async function saveMod(ev){
  ev.preventDefault();
  if(!authNeeded())return;

  const m=state.editId
    ?state.mods.find(x=>x.id===state.editId):null;

  const images=[...$('mod-images').files];
  const file=$('mod-file').files[0];
  const name=$('mod-name').value.trim();
  const description=$('mod-desc').value.trim();
  const category=$('mod-category').value;

  if(
    !categories.includes(category) ||
    name.length<3 ||
    description.length<10
  )return toast('Invalid values');

  if(
    (!m&&!file) ||
    (!m&&!images.length) ||
    images.length>5 ||
    images.some(x=>!validateImage(x))
  )return toast(t('imagesHint'));

  if(
    file &&
    !['mcpack','mcaddon','zip','jar']
      .includes(file.name.split('.').pop().toLowerCase())
  )return toast(t('fileHint'));

  if(file&&file.size>50*1024*1024)
    return toast(t('fileHint'));

  const btn=$('mod-save-btn');
  btn.disabled=true;
  btn.textContent=t('sending');

  try{
    const owner=m?.user_id||state.me.id;
    const fields={title:name,description,category};

    if(file)
      fields.file_path=await uploadAsset(
        'mcmod-files',file,owner
      );

    if(images.length){
      fields.images=[];

      for(const img of images)
        fields.images.push(
          await uploadAsset('mcmod-images',img,owner)
        );
    }

    if(m){
      ok(
        await state.db.from('mc_mods')
          .update(fields)
          .eq('id',m.id)
      );

      if(file&&m.file_path)
        state.db.storage.from('mcmod-files')
          .remove([m.file_path])
          .then(x=>{if(x.error)console.warn(x.error);});

      if(images.length&&m.images?.length)
        state.db.storage.from('mcmod-images')
          .remove(m.images)
          .then(x=>{if(x.error)console.warn(x.error);});
    } else {
      ok(
        await state.db.from('mc_mods').insert({
          ...fields,user_id:state.me.id
        })
      );
    }

    cancelEdit();
    await reloadMods();
    navigate('home');
    toast(t('review'));
  } catch(e){
    err(e);
  } finally {
    btn.disabled=false;
    btn.textContent=t('submitReview');
  }
}

async function saveProfile(ev){
  ev.preventDefault();
  if(!authNeeded())return;

  try{
    const changes={
      nickname:$('profile-nickname').value.trim(),
      bio:$('profile-bio').value.trim()
    };

    const newUser=$('profile-username').value.trim().toLowerCase();
    const f=$('avatar-file').files[0];
    const oldPath=state.profile.avatar_path;

    if(!changes.nickname)throw Error(t('nickname'));

    if(f){
      if(!validateImage(f))throw Error(t('imagesHint'));

      changes.avatar_path=await uploadAsset(
        'mc-avatars',f,state.me.id
      );
    }

    ok(
      await state.db.from('mc_profiles')
        .update(changes)
        .eq('id',state.me.id)
    );

    if(newUser!==state.profile.username)
      ok(
        await state.db.rpc('mc_change_username',{
          new_name:newUser
        })
      );

    if(f&&oldPath){
      const del=await state.db.storage
        .from('mc-avatars')
        .remove([oldPath]);

      if(del.error)console.warn('old avatar cleanup:',del.error);
    }

    await reloadPeople();
    await refreshMe();
    toast(t('success'));
  } catch(e){
    err(e);
  }
}

async function modAction(mid,act){
  if(!authNeeded())return;

  const m=state.mods.find(x=>x.id===mid);
  if(!m)return;

  if(act==='purge'){
    if(!confirm(t('confirmedDelete')))return;

    const imgs=await state.db.storage
      .from('mcmod-images')
      .remove(m.images||[]);

    if(imgs.error)throw imgs.error;

    const file=await state.db.storage
      .from('mcmod-files')
      .remove([m.file_path]);

    if(file.error)throw file.error;
  }

  ok(
    await state.db.rpc('mc_mod_action',{mid,act})
  );

  closeModal();
  await reloadMods();

  if(act==='restore'||act==='purge')
    showSettings();

  toast(t('success'));
}

async function adminReview(mid,act){
  if(!authNeeded())return;

  ok(
    await state.db.rpc('mc_admin_review',{mid,act})
  );

  closeModal();
  await reloadMods();
  drawAdmin();
  toast(t('success'));
}

async function adminRole(uid,enable){
  if(state.role!=='owner')return;

  ok(
    await state.db.rpc('mc_admin_set_role',{
      target:uid,make_admin:enable
    })
  );

  toast(t('success'));
  closeModal();
}

async function adminBan(uid,unban=false){
  if(state.role==='user')return;

  const days=unban
    ?0
    :$('ban-days').value===''
      ?null
      :Number($('ban-days').value);

  ok(
    await state.db.rpc('mc_admin_ban',{
      target:uid,days,explanation:''
    })
  );

  toast(t('success'));
  closeModal();
}

function drawAdmin(){
  if(state.role==='user')return;

  const pending=state.mods.filter(x=>x.status==='pending');

  $('review-list').innerHTML=pending.map(m=>`
    <div class="row wrap between"
      style="padding:9px 0;border-bottom:1px solid #ffffff1b">
      <div>
        <strong>${safe(m.title)}</strong>
        <small style="display:block">
          ${safe(named(person(m.user_id)))}
        </small>
      </div>

      <div class="row wrap">
        <button class="btn secondary small" data-mod="${m.id}">
          ${ico('eye')}
        </button>
        <button class="btn secondary small" data-edit="${m.id}">
          ${ico('pencil')}
        </button>
        <button class="btn small"
          data-review="approve" data-mid="${m.id}">
          ${t('approve')}
        </button>
        <button class="btn danger small"
          data-review="reject" data-mid="${m.id}">
          ${t('reject')}
        </button>
      </div>
    </div>
  `).join('')||`<p class="muted">${t('empty')}</p>`;

  iconize();
}

let chan=null;

function subscribe(){
  if(chan){
    state.db.removeChannel(chan);
    chan=null;
  }

  if(!state.me)return;

  chan=state.db.channel('mw-v1-'+state.me.id)
    .on('postgres_changes',{
      event:'*',
      schema:'public',
      table:'mc_notifications'
    },async()=>{
      try{await reloadPrivate();}
      catch(e){console.warn(e);}
    })
    .on('postgres_changes',{
      event:'*',
      schema:'public',
      table:'mc_messages'
    },async()=>{
      try{
        await loadChats();
        if(state.activeChat)await readChat();
      }catch(e){console.warn(e);}
    })
    .on('postgres_changes',{
      event:'*',
      schema:'public',
      table:'mc_friendships'
    },async()=>{
      try{await reloadPrivate();}
      catch(e){console.warn(e);}
    })
    .subscribe();
}

async function logout(){
  ok(await state.db.auth.signOut());

  state.me=null;
  state.activeChat=null;
  state.friend=[];
  state.notes=[];
  state.messages=[];
  state.saved.clear();
  state.liked.clear();

  await reloadMods();
  await refreshMe();
  subscribe();
  navigate('home');
}

function bind(){
  document.querySelectorAll('[data-page]').forEach(b=>
    b.addEventListener('click',()=>navigate(b.dataset.page))
  );

  $('brand-btn').onclick=()=>navigate('home');
  $('settings-btn').onclick=()=>showSettings();
  $('notif-btn').onclick=showNotif;
  $('modal-close').onclick=closeModal;

  $('modal').onclick=e=>{
    if(e.target===$('modal'))closeModal();
  };

  $('mod-search').oninput=drawMods;
  $('people-search').oninput=drawPeople;

  $('auth-toggle').onclick=switchAuth;

  $('auth-user').oninput=()=>{
    clearTimeout(userDelay);
    userDelay=setTimeout(
      ()=>validateUsername().catch(console.warn),
      350
    );
  };

  $('auth-pass').oninput=()=>{
    validatePass();
    validateRepeat();
  };

  $('auth-repeat').oninput=validateRepeat;

  $('auth-form').onsubmit=e=>
    submitAuth(e).catch(err);

  $('profile-form').onsubmit=e=>
    saveProfile(e).catch(err);

  $('mod-form').onsubmit=e=>
    saveMod(e).catch(err);

  $('message-form').onsubmit=e=>
    sendChat(e).catch(err);

  $('new-chat').onclick=chooseFriend;

  $('back-chat').onclick=()=>{
    $('chat-detail').hidden=true;
    $('chat-list').hidden=false;
    state.activeChat=null;
    loadChats().catch(err);
  };

  $('mod-images').onchange=drawImagePreview;

  $('mod-file').onchange=()=>{
    $('mod-file-selected').textContent=
      $('mod-file').files[0]?.name||'';
  };

  $('avatar-file').onchange=()=>{
    $('avatar-selected').textContent=
      $('avatar-file').files[0]?.name||'';
  };

  $('cancel-edit').onclick=cancelEdit;

  $('logout').onclick=()=>logout().catch(err);

  document.addEventListener('submit',e=>{
    if(e.target.id==='comment-form')
      addComment(e).catch(err);
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeModal();

    if(
      e.key==='Enter' &&
      e.target.matches('[data-mod],[data-person]')
    )e.target.click();
  });

  document.addEventListener('click',async e=>{
    const el=e.target.closest(
      '[data-sort],[data-category],[data-person],' +
      '[data-chat],[data-friend],[data-answer],' +
      '[data-block],[data-mod],[data-photo],' +
      
'[data-like],[data-save],[data-download],[data-install],' +

      '[data-notice],[data-markall],[data-action],' +
      '[data-edit],[data-review],[data-admin],' +
      '[data-ban],[data-unban]'
    );

    if(!el)return;

    try{
      const d=el.dataset;

      if(d.sort){
        state.sort=d.sort;
        renderSorts();
        drawMods();

      }else if(d.category){
        state.category=d.category;
        renderCategories();
        drawMods();

      }else if(d.chat){
        await openChat(d.chat);

      }else if(d.person){
        await showPerson(d.person);

      }else if(d.friend){
        await addFriend(d.friend);

      }else if(d.answer){
        await answerFriend(d.answer,d.agree==='true');

      }else if(d.block){
        await blockUser(d.block);

      }else if(d.photo&&$('bigpic')){
        $('bigpic').src=d.photo;

      }else if(d.like){
        await toggleReaction('like',d.like);

      }else if(d.save){
        await toggleReaction('save',d.save);

      }else if(d.download){
        await trackDownload(d.download);
        
}else if(d.install){
  await installMinecraft(d.install);


      }else if(d.notice){
        await openNotice(d.notice);

      }else if(el.hasAttribute('data-markall')){
        await markNotifs(()=>true);
        showNotif();

      }else if(d.action){
        await modAction(d.mid,d.action);

      }else if(d.edit){
        startEdit(d.edit);

      }else if(d.review){
        await adminReview(d.mid,d.review);

      }else if(d.admin){
        await adminRole(d.admin,d.set==='true');

      }else if(d.ban){
        await adminBan(d.ban);

      }else if(d.unban){
        await adminBan(d.unban,true);

      }else if(d.mod){
        await openMod(d.mod);
      }
    }catch(ex){
      err(ex);
    }
  });
}

async function boot(){
  bind();
  translate();

  if(!window.supabase?.createClient)
    return toast('Supabase SDK did not load');

  try{
    state.db=window.supabase.createClient(
      PROJECT_URL,KEY
    );

    const r=ok(
      await state.db.auth.getSession()
    );

    state.me=r.session?.user||null;

    await reloadEverything();
    subscribe();

    state.db.auth.onAuthStateChange((event,s)=>{
      const uid=s?.user?.id;

      if(uid!==state.me?.id){
        state.me=s?.user||null;

        setTimeout(
          ()=>reloadEverything()
            .then(subscribe)
            .catch(err),
          0
        );
      }
    });
  }catch(e){
    err(e);
  }
}

document.addEventListener('DOMContentLoaded',boot);
})();
