"use strict";
// ---------- хранилище ----------
const K = {st:"go-roadmap-v1", days:"go-roadmap-days", notes:"go-roadmap-notes", pace:"go-roadmap-pace", open:"go-roadmap-open",
  quiz:"go-roadmap-quiz", ck:"go-roadmap-ck", theme:"go-roadmap-theme", view:"go-roadmap-view"};
const ls = {
  get(k, def){ try{ const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v) }catch(e){ return def } },
  raw(k){ try{ return localStorage.getItem(k) }catch(e){ return null } },
  set(k, v){ try{ localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)) }catch(e){} }
};
let S = ls.get(K.st, {}), DY = ls.get(K.days, []), NT = ls.get(K.notes, {}), QZ = ls.get(K.quiz, {}), CK = ls.get(K.ck, {}), OPEN = ls.get(K.open, {});
let PW = parseInt(ls.raw(K.pace) || "8", 10); if(!(PW > 0)) PW = 8;
if(!S || typeof S !== "object") S = {}; if(!Array.isArray(DY)) DY = []; if(!NT || typeof NT !== "object") NT = {};
const save = {
  st(){ ls.set(K.st, S) }, days(){ ls.set(K.days, DY) }, notes(){ ls.set(K.notes, NT) }, quiz(){ ls.set(K.quiz, QZ) },
  ck(){ ls.set(K.ck, CK) }, open(){ ls.set(K.open, OPEN) }, pace(){ ls.set(K.pace, String(PW)) }
};

// Перенос прогресса со старой карты: "узел:индекс" → "узел.подтема"
const RANK = {todo:0, learning:1, done:2};
function migrate(){
  let changed = false;
  for(const k of Object.keys(S)){
    let v = S[k]; if(v === 1 || v === true) v = "done";
    if(!k.includes(":")){ if(v !== S[k]){ S[k] = v; changed = true } continue }
    const nk = MIGRATE[k];
    if(nk && RANK[v] > (RANK[S[nk]] || 0)) S[nk] = v;
    delete S[k]; changed = true;
  }
  for(const k of Object.keys(NT)){
    if(!k.includes(":")) continue;
    const nk = MIGRATE[k];
    if(nk && NT[k]) NT[nk] = NT[nk] ? NT[nk] + "\n\n" + NT[k] : NT[k];
    delete NT[k]; changed = true;
  }
  if(changed){ save.st(); save.notes() }
}
migrate();

// ---------- модель ----------
const SUBS = [], BYKEY = {};
D.forEach((sg, si) => sg.n.forEach(nd => nd.sub.forEach(sb => {
  const k = nd.id + "." + sb.id, rec = {k, sg, si, nd, sb};
  SUBS.push(rec); BYKEY[k] = rec;
})));
const st = k => (S[k] === "done" || S[k] === "learning") ? S[k] : "todo";
const today = () => ymd(new Date());
function ymd(d){ return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") }
function markDay(){ const t = today(); if(!DY.includes(t)){ DY.push(t); DY.sort(); save.days() } }

// ---------- утилиты ----------
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rich = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c) };
const P = {
  doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  play:'<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
  book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  code:'<path d="m4 17 6-6-6-6M12 19h8"/>',
  quiz:'<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  chev:'<path d="m9 18 6-6-6-6"/>',
  ext:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  graph:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  theme:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  down:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  up:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  expand:'<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
  collapse:'<path d="m7 20 5-5 5 5M7 4l5 5 5-5"/>',
  trash:'<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>'
};
const I = (n, cls = "") => '<svg class="i ' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + P[n] + "</svg>";
const SRC = {"habr.com":"Хабр","metanit.com":"Metanit","postgrespro.ru":"Postgres Pro","developer.mozilla.org":"MDN","go.dev":"go.dev",
  "pkg.go.dev":"pkg.go.dev","gobyexample.com":"Go by Example","github.com":"GitHub","selectel.ru":"Selectel","learn.microsoft.com":"Microsoft",
  "12factor.net":"12factor","refactoring.guru":"Refactoring.Guru","git-scm.com":"git-scm","docs.docker.com":"Docker Docs","redis.io":"Redis",
  "grpc.io":"gRPC","protobuf.dev":"Protobuf","sql-academy.org":"SQL Academy","cheatsheetseries.owasp.org":"OWASP","owasp.org":"OWASP",
  "www.alexedwards.net":"Alex Edwards","dave.cheney.net":"Dave Cheney","quii.gitbook.io":"Learn Go with Tests","www.cloudflare.com":"Cloudflare",
  "docs.github.com":"GitHub Docs","gin-gonic.com":"Gin","sre.google":"Google SRE","martinfowler.com":"Fowler","research.swtch.com":"Russ Cox",
  "www.ardanlabs.com":"Ardan Labs","neetcode.io":"NeetCode","leetcode.com":"LeetCode","exercism.org":"Exercism"};
const src = u => { try{ const h = new URL(u).hostname; return SRC[h] || h.replace(/^www\./, "") }catch(e){ return "" } };
function rng(seed){ let h = 2166136261; for(let i = 0; i < seed.length; i++){ h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296 } }

// ---------- статистика ----------
function stats(){
  const r = {tot:0, dn:0, hrsLeft:0, hrsAll:0, stages:[], nodes:{}, learning:[]};
  D.forEach((sg, si) => {
    const s = {tot:0, dn:0, hrs:0};
    sg.n.forEach(nd => {
      const n = {tot:0, dn:0, lr:0};
      nd.sub.forEach(sb => {
        const k = nd.id + "." + sb.id, v = st(k);
        n.tot++; s.tot++; r.tot++; r.hrsAll += sb.h;
        if(v === "done"){ n.dn++; s.dn++; r.dn++ } else { s.hrs += sb.h; r.hrsLeft += sb.h }
        if(v === "learning"){ n.lr++; r.learning.push(BYKEY[k]) }
      });
      r.nodes[nd.id] = n;
    });
    r.stages[si] = s;
  });
  return r;
}
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
function forecast(h){
  if(!(PW > 0) || !(h > 0)) return null;
  const w = Math.ceil(h / PW), d = new Date(); d.setDate(d.getDate() + w * 7);
  return {w, date:d.toLocaleDateString("ru-RU", {day:"numeric", month:"long", year:"numeric"})};
}
function streak(){
  const set = new Set(DY); let s = 0; const d = new Date();
  if(!set.has(today())) d.setDate(d.getDate() - 1);
  while(set.has(ymd(d))){ s++; d.setDate(d.getDate() - 1) }
  return s;
}
function lastAct(){
  if(!DY.length) return "ещё не было";
  const diff = Math.round((new Date(today()) - new Date(DY[DY.length - 1])) / 864e5);
  return diff <= 0 ? "сегодня" : diff === 1 ? "вчера" : diff + " " + plural(diff, "день", "дня", "дней") + " назад";
}

// ---------- рендер ----------
const TXT = {todo:"Не начато", learning:"Изучаю", done:"Готово"};
function subHTML(r){
  const {k, sb} = r, v = st(k), q = QZ[k];
  let meta = '<span>' + I("clock") + "~" + sb.h + " ч</span>";
  if(sb.a) meta += "<span>" + I("doc") + sb.a.length + "</span>";
  if(sb.v) meta += "<span>" + I("play") + sb.v.length + "</span>";
  if(sb.q) meta += '<span class="qb' + (q ? (q.s === q.n ? " ok" : " part") : "") + '">' + I("quiz") + (q ? "тест " + q.s + "/" + q.n : "тест") + "</span>";
  if(sb.ck){ const c = (CK[k] || []).length; meta += '<span class="qb' + (c ? (c === sb.ck.length ? " ok" : " part") : "") + '">' + I("check") + c + "/" + sb.ck.length + "</span>" }
  if(NT[k]) meta += "<span>" + I("edit") + "заметка</span>";
  return '<div class="sub st-' + v + '" id="s-' + k + '" data-k="' + k + '"><div class="sub-h">' +
    '<button class="stt" data-act="cycle" title="' + TXT[v] + ' — нажми, чтобы сменить" aria-label="Статус: ' + TXT[v] + '"></button>' +
    '<div class="sub-main" data-act="toggle"><div class="sub-t">' + esc(sb.w) + '</div><div class="sub-m">' + meta + "</div></div>" +
    '<button class="chev" data-act="toggle" aria-label="Подробнее">' + I("chev") + '</button></div><div class="sub-b" hidden></div></div>';
}
function lnkList(arr){
  return "<ul>" + arr.map(x => '<li><a class="lnk" href="' + esc(x[1]) + '" target="_blank" rel="noopener"><span class="src">' + esc(src(x[1])) + '</span><span class="lt">' + esc(x[0]) + (x[2] === "en" ? '<span class="en">EN</span>' : "") + "</span></a></li>").join("") + "</ul>";
}
function subBody(r){
  const {k, sb} = r, v = st(k);
  let h = '<p class="why">' + rich(sb.y) + '</p><div class="task"><b>Задание</b>' + rich(sb.t) + "</div>";
  h += '<div class="st-seg">' + ["todo", "learning", "done"].map(x => '<button data-act="set" data-v="' + x + '" class="' + (v === x ? "on" : "") + '"><span class="stt ' + x + '" style="width:14px;height:14px;border-width:2px;pointer-events:none"></span>' + TXT[x] + "</button>").join("") + "</div>";
  h += '<div class="res">';
  if(sb.a) h += '<div class="res-g"><h5>' + I("doc") + "Статьи</h5>" + lnkList(sb.a) + "</div>";
  if(sb.d) h += '<div class="res-g"><h5>' + I("book") + "Документация</h5>" + lnkList(sb.d) + "</div>";
  if(sb.p) h += '<div class="res-g"><h5>' + I("code") + "Практика</h5>" + lnkList(sb.p) + "</div>";
  if(sb.v) h += '<div class="res-g vids"><h5>' + I("play") + 'Видео</h5><div class="vgrid">' + sb.v.map(x =>
    '<div><button class="vid" data-act="video" data-yt="' + esc(x[0]) + '"><span class="thumb"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + esc(x[0]) + '/mqdefault.jpg"><span class="play">' + I("play") + '</span><span class="dur">' + esc(x[3]) + '</span></span><span><span class="vt">' + esc(x[1]) + (x[4] === "en" ? '<span class="en">EN</span>' : "") + '</span><span class="vc">' + esc(x[2]) + "</span></span></button></div>").join("") + "</div></div>";
  h += "</div>";
  if(sb.q) h += quizHTML(r);
  if(sb.ck){
    const done = CK[k] || [];
    h += '<div class="ck"><div class="quiz-h">' + I("check") + "Чек-лист проекта</div>" + sb.ck.map((c, i) => '<label><input type="checkbox" data-act="ck" data-i="' + i + '"' + (done.includes(i) ? " checked" : "") + "><span>" + esc(c) + "</span></label>").join("") + "</div>";
  }
  const nv = NT[k] || "";
  h += '<button class="note-btn' + (nv ? " has" : "") + '" data-act="note">' + I("edit") + (nv ? "Заметка" : "Добавить заметку") + '</button><textarea class="note" placeholder="Свои заметки, ссылки, выводы…"' + (nv ? "" : " hidden") + ">" + esc(nv) + "</textarea>";
  return h;
}
function quizHTML(r){
  const {k, sb} = r, best = QZ[k];
  let h = '<div class="quiz"><div class="quiz-h">' + I("quiz") + "Проверь себя" + (best ? '<span class="mut">лучший результат: ' + best.s + " из " + best.n + "</span>" : "") + '</div><ol class="qs">';
  sb.q.forEach((q, i) => {
    const opts = [[q[1], 1], ...q[2].map(x => [x, 0])], rnd = rng(k + i);
    for(let j = opts.length - 1; j > 0; j--){ const t = Math.floor(rnd() * (j + 1)); [opts[j], opts[t]] = [opts[t], opts[j]] }
    h += '<li class="q"><div class="q-t">' + rich(q[0]) + '</div><div class="opts">' + opts.map(o => '<label class="opt"><input type="radio" name="q-' + k + "-" + i + '" data-ok="' + o[1] + '"><span>' + rich(o[0]) + "</span></label>").join("") + '</div><div class="q-ex" hidden>' + rich(q[3]) + "</div></li>";
  });
  return h + '</ol><div class="quiz-f"><button class="btn primary" data-act="qcheck">Проверить</button><button class="btn ghost" data-act="qreset">Сбросить ответы</button><span class="quiz-res"></span></div></div>';
}
function renderApp(){
  const r = stats();
  let h = "";
  D.forEach((sg, si) => {
    const s = r.stages[si];
    h += '<section class="stage" id="stage-' + si + '" data-si="' + si + '"><div class="stage-h"><div class="stage-num">' + String(si + 1).padStart(2, "0") + '</div><div style="flex:1;min-width:0"><h2>' + esc(sg.s) + "</h2><p>" + esc(sg.d) + '</p><div class="stage-prog"><div class="bar"><i data-sbar="' + si + '"></i></div><span data-stxt="' + si + '"></span></div></div></div><div class="nodes">';
    sg.n.forEach(nd => {
      h += '<div class="node' + (OPEN["n-" + nd.id] ? " op" : "") + '" id="n-' + nd.id + '" data-nid="' + nd.id + '"><div class="node-h" data-act="node"><div class="node-main"><span class="tag ' + nd.m + '">' + (nd.m === "seq" ? "по порядку" : "можно параллельно") + '</span><div class="node-t">' + esc(nd.t) + '</div><div class="node-d">' + esc(nd.ds) + '</div></div><span class="pill" data-npill="' + nd.id + '"></span><button class="chev" aria-label="Развернуть">' + I("chev") + '</button></div><div class="node-b">';
      nd.sub.forEach(sb => { h += subHTML(BYKEY[nd.id + "." + sb.id]) });
      h += "</div></div>";
    });
    if(sg.mi) h += '<div class="mile"><h3>' + I("flag") + esc(sg.mi.t) + "</h3><ul>" + sg.mi.c.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></div>";
    h += "</div></section>";
  });
  h += '<div class="nores" id="nores" hidden>Ничего не найдено. Попробуй другой запрос или сбрось фильтр.</div>';
  $("#app").innerHTML = h;
  let nav = "", chips = "";
  D.forEach((sg, si) => {
    nav += '<a href="#stage-' + si + '" data-nav="' + si + '"><div class="sn-t"><span class="sn-n">' + String(si + 1).padStart(2, "0") + "</span>" + esc(sg.s) + '</div><div class="sn-p"><div class="bar"><i data-nbar="' + si + '"></i></div><span data-ntxt="' + si + '"></span></div></a>';
    chips += '<a href="#stage-' + si + '">' + (si + 1) + ". " + esc(sg.s) + '<small data-ctxt="' + si + '"></small></a>';
  });
  $("#snav").innerHTML = nav; $("#stageChips").innerHTML = chips;
  updateStats();
}
function updateStats(){
  const r = stats(), p = pct(r.dn, r.tot);
  $("#gBar").style.width = p + "%"; $("#gPct").textContent = p + "%";
  $("#gCnt").textContent = r.dn + "/" + r.tot + " · осталось ~" + r.hrsLeft + " ч";
  r.stages.forEach((s, si) => {
    const sp = pct(s.dn, s.tot);
    $$('[data-sbar="' + si + '"],[data-nbar="' + si + '"]').forEach(e => e.style.width = sp + "%");
    const t = $('[data-stxt="' + si + '"]'); if(t) t.textContent = s.dn + " из " + s.tot + " · " + sp + "%" + (s.hrs ? " · осталось ~" + s.hrs + " ч" : " · пройдено");
    const n = $('[data-ntxt="' + si + '"]'); if(n) n.textContent = sp + "%";
    const c = $('[data-ctxt="' + si + '"]'); if(c) c.textContent = sp + "%";
  });
  for(const id in r.nodes){
    const n = r.nodes[id], el = $('[data-npill="' + id + '"]'); if(!el) continue;
    el.textContent = n.dn + "/" + n.tot; el.classList.toggle("full", n.dn === n.tot);
    const node = el.closest(".node");
    node.classList.toggle("n-done", n.dn === n.tot); node.classList.toggle("n-learning", n.dn < n.tot && (n.lr > 0 || n.dn > 0));
  }
  // дашборд
  $("#nowList").innerHTML = r.learning.length ? r.learning.slice(0, 4).map(x => '<button class="now-item" data-goto="' + x.k + '"><span class="stt learning" style="pointer-events:none"></span><span><b>' + esc(x.sb.w) + "</b><small>" + esc(x.nd.t) + " · " + esc(x.sg.s) + "</small></span></button>").join("") + (r.learning.length > 4 ? '<div class="mut">и ещё ' + (r.learning.length - 4) + "</div>" : "")
    : '<div class="empty">Нажми на кружок у подтемы: один раз — «изучаю», второй — «готово». Здесь появится то, что ты учишь сейчас.</div>';
  const sk = streak();
  $("#streak").innerHTML = sk + ' <small>' + plural(sk, "день", "дня", "дней") + " подряд</small>";
  $("#lastAct").textContent = "Последняя активность: " + lastAct();
  let heat = ""; const set = new Set(DY), d = new Date(); d.setDate(d.getDate() - 20);
  for(let i = 0; i < 21; i++){ const k = ymd(d); heat += '<i class="' + (set.has(k) ? "on" : "") + (i === 20 ? " today" : "") + '" title="' + k + '"></i>'; d.setDate(d.getDate() + 1) }
  $("#heat").innerHTML = heat;
  const f = forecast(r.hrsLeft);
  $("#fcAll").innerHTML = f ? "Финиш карты: <b>" + f.date + "</b> <span class=mut>(~" + f.w + " нед.)</span>" : "Карта пройдена 🎉";
  let mi = "Все milestone закрыты";
  for(let si = 0; si < D.length; si++){
    const s = r.stages[si];
    if(s.dn < s.tot){ const ff = forecast(s.hrs); mi = esc(D[si].mi.t) + ": осталось " + (s.tot - s.dn) + " " + plural(s.tot - s.dn, "подтема", "подтемы", "подтем") + " (~" + s.hrs + " ч)" + (ff ? " → <b>" + ff.date + "</b>" : ""); break }
  }
  $("#fcMile").innerHTML = mi;
  const pw = $("#pw"); if(document.activeElement !== pw) pw.value = PW;
  if(window.gRefresh) window.gRefresh();
}

// ---------- действия ----------
function setStatus(k, v){
  if(v === "todo") delete S[k]; else S[k] = v;
  if(v === "done") markDay();
  save.st();
  const el = document.getElementById("s-" + k);
  if(el){
    el.className = el.className.replace(/st-\w+/, "st-" + v);
    const b = $(".stt", el); b.title = TXT[v] + " — нажми, чтобы сменить"; b.setAttribute("aria-label", "Статус: " + TXT[v]);
    $$(".st-seg button", el).forEach(x => x.classList.toggle("on", x.dataset.v === v));
    const hint = $(".done-hint", el); if(hint && v === "done") hint.remove();
  }
  updateStats();
}
function refreshMeta(k){
  const el = document.getElementById("s-" + k); if(!el) return;
  const tmp = document.createElement("div"); tmp.innerHTML = subHTML(BYKEY[k]);
  $(".sub-m", el).replaceWith($(".sub-m", tmp));
}
function openSub(el, force){
  const k = el.dataset.k, body = $(".sub-b", el), on = force === undefined ? body.hidden : force;
  if(on && !body.dataset.ready){ body.innerHTML = subBody(BYKEY[k]); body.dataset.ready = "1" }
  body.hidden = !on; el.classList.toggle("op", on);
}
function goto(k){
  const r = BYKEY[k]; if(!r) return;
  if(document.body.classList.contains("gmode")) setView("l");
  const node = document.getElementById("n-" + r.nd.id), el = document.getElementById("s-" + k);
  node.classList.add("op"); OPEN["n-" + r.nd.id] = 1; save.open();
  el.hidden = false; node.hidden = false; node.closest(".stage").hidden = false;
  openSub(el, true);
  el.scrollIntoView({behavior:"smooth", block:"start"});
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
}
function checkQuiz(el, k){
  const quiz = $(".quiz", el), qs = $$(".q", quiz); let ok = 0, answered = 0;
  qs.forEach(q => {
    const sel = $("input:checked", q); q.classList.toggle("skip", !sel);
    $$(".opt", q).forEach(o => o.classList.remove("ok", "bad"));
    if(!sel) return;
    answered++;
    const lab = sel.closest(".opt");
    if(sel.dataset.ok === "1"){ ok++; lab.classList.add("ok") } else { lab.classList.add("bad"); $('input[data-ok="1"]', q).closest(".opt").classList.add("ok") }
    $(".q-ex", q).hidden = false;
  });
  const n = qs.length, res = $(".quiz-res", quiz);
  if(!answered){ res.className = "quiz-res part"; res.textContent = "Выбери ответы"; return }
  res.className = "quiz-res " + (ok === n ? "ok" : "part");
  res.textContent = ok === n ? "Все " + n + " верно!" : "Верно " + ok + " из " + n;
  if(answered === n && (!QZ[k] || ok >= QZ[k].s)){ QZ[k] = {s:ok, n}; save.quiz(); markDay(); refreshMeta(k); updateStats() }
  if(ok === n && st(k) !== "done" && !$(".done-hint", quiz)){
    quiz.insertAdjacentHTML("beforeend", '<div class="done-hint">' + I("check") + 'Тема усвоена. Отметить как пройденную?<button class="btn sm" data-act="set" data-v="done">Да, готово</button></div>');
  }
}
function resetQuiz(el){
  const quiz = $(".quiz", el);
  $$("input", quiz).forEach(i => i.checked = false);
  $$(".opt", quiz).forEach(o => o.classList.remove("ok", "bad"));
  $$(".q", quiz).forEach(q => q.classList.remove("skip"));
  $$(".q-ex", quiz).forEach(x => x.hidden = true);
  $(".quiz-res", quiz).textContent = ""; const hint = $(".done-hint", quiz); if(hint) hint.remove();
}

document.addEventListener("click", e => {
  const g = e.target.closest("[data-goto]"); if(g){ goto(g.dataset.goto); return }
  const a = e.target.closest("[data-act]"); if(!a) return;
  const act = a.dataset.act, el = a.closest(".sub"), k = el && el.dataset.k;
  if(act === "node"){ if(e.target.closest("a")) return; const n = a.closest(".node"); n.classList.toggle("op"); if(n.classList.contains("op")) OPEN[n.id] = 1; else delete OPEN[n.id]; save.open(); return }
  if(act === "toggle"){ openSub(el); return }
  if(act === "cycle"){ const c = st(k); setStatus(k, c === "todo" ? "learning" : c === "learning" ? "done" : "todo"); return }
  if(act === "set"){ setStatus(k, a.dataset.v); return }
  if(act === "qcheck"){ checkQuiz(el, k); return }
  if(act === "qreset"){ resetQuiz(el); return }
  if(act === "note"){ const t = $(".note", el); t.hidden = !t.hidden; if(!t.hidden) t.focus(); return }
  if(act === "video"){
    const yt = a.dataset.yt, box = a.parentElement, ex = $(".player", box);
    if(ex){ ex.remove(); return }
    $$(".player", el).forEach(p => p.remove());
    box.insertAdjacentHTML("beforeend", '<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(yt) + '?autoplay=1&rel=0" title="Видео" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><div class="player-f"><a href="https://www.youtube.com/watch?v=' + encodeURIComponent(yt) + '" target="_blank" rel="noopener">Открыть на YouTube ' + I("ext") + '</a><button class="btn sm ghost" data-act="video" data-yt="' + esc(yt) + '">Закрыть</button></div></div>');
    return;
  }
});
document.addEventListener("change", e => {
  const c = e.target.closest('[data-act="ck"]'); if(!c) return;
  const el = c.closest(".sub"), k = el.dataset.k, i = +c.dataset.i;
  const arr = (CK[k] || []).filter(x => x !== i); if(c.checked) arr.push(i);
  CK[k] = arr.sort(); if(!arr.length) delete CK[k]; save.ck(); markDay(); refreshMeta(k);
  const box = c.closest(".ck"), total = BYKEY[k].sb.ck.length;
  if(arr.length === total && st(k) !== "done" && !$(".done-hint", box)) box.insertAdjacentHTML("beforeend", '<div class="done-hint">' + I("check") + 'Всё сделано. Отметить проект как готовый?<button class="btn sm" data-act="set" data-v="done">Да, готово</button></div>');
  updateStats();
});
let noteT = null;
document.addEventListener("input", e => {
  const t = e.target.closest(".note"); if(!t) return;
  const el = t.closest(".sub"), k = el.dataset.k;
  if(t.value) NT[k] = t.value; else delete NT[k];
  clearTimeout(noteT); noteT = setTimeout(() => { save.notes(); refreshMeta(k); const b = $(".note-btn", el); b.classList.toggle("has", !!t.value) }, 300);
});

// ---------- поиск и фильтр ----------
let FILTER = "all", QUERY = "";
function applyFilter(){
  const q = QUERY.trim().toLowerCase(), active = q || FILTER !== "all";
  let any = false;
  D.forEach((sg, si) => {
    let stageVis = 0;
    sg.n.forEach(nd => {
      let vis = 0;
      nd.sub.forEach(sb => {
        const k = nd.id + "." + sb.id, el = document.getElementById("s-" + k);
        let ok = FILTER === "all" || st(k) === FILTER;
        if(ok && q){
          const hay = [sb.w, sb.y, sb.t, nd.t, sg.s, ...(sb.a || []).map(x => x[0]), ...(sb.v || []).map(x => x[1] + " " + x[2]), ...(sb.d || []).map(x => x[0])].join(" ").toLowerCase();
          ok = q.split(/\s+/).every(w => hay.includes(w));
        }
        el.hidden = !ok; if(ok) vis++;
      });
      const node = document.getElementById("n-" + nd.id);
      node.hidden = !vis;
      if(active) node.classList.toggle("op", vis > 0); else node.classList.toggle("op", !!OPEN["n-" + nd.id]);
      stageVis += vis;
    });
    const sec = document.getElementById("stage-" + si); sec.hidden = !stageVis;
    const mile = $(".mile", sec); if(mile) mile.hidden = active;
    if(stageVis) any = true;
  });
  $("#nores").hidden = any;
}
let qT = null;
$("#q").addEventListener("input", e => { clearTimeout(qT); qT = setTimeout(() => { QUERY = e.target.value; applyFilter() }, 120) });
$("#chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if(!b) return;
  FILTER = b.dataset.f; $$(".chip", $("#chips")).forEach(x => x.classList.toggle("on", x === b)); applyFilter();
});
document.addEventListener("keydown", e => {
  if(e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)){ e.preventDefault(); if(!document.body.classList.contains("gmode")) $("#q").focus() }
  if(e.key === "Escape"){ $("#menuPop").hidden = true; if(document.activeElement === $("#q")){ $("#q").value = ""; QUERY = ""; applyFilter(); $("#q").blur() } }
});

// ---------- шапка, меню, тема, вид ----------
function setView(v){
  const g = v === "g";
  document.body.classList.toggle("gmode", g);
  $("#vG").classList.toggle("on", g); $("#vL").classList.toggle("on", !g);
  ls.set(K.view, v);
  if(window.gShow) window.gShow(g);
}
$("#vL").onclick = () => setView("l");
$("#vG").onclick = () => setView("g");
$("#themeBtn").onclick = () => {
  const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const nx = cur === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nx; ls.set(K.theme, nx);
  window.dispatchEvent(new Event("rm-theme"));
};
$("#menuBtn").onclick = e => { e.stopPropagation(); $("#menuPop").hidden = !$("#menuPop").hidden };
document.addEventListener("click", e => { if(!e.target.closest(".menu")) $("#menuPop").hidden = true });
function expandAll(on){
  $$(".node").forEach(n => { n.classList.toggle("op", on); if(on) OPEN[n.id] = 1 });
  if(!on) OPEN = {}; save.open(); $("#menuPop").hidden = true;
}
$("#mExpand").onclick = $("#tExpand").onclick = () => expandAll(true);
$("#mCollapse").onclick = $("#tCollapse").onclick = () => expandAll(false);
$("#mExport").onclick = () => {
  const data = {v:3, status:S, days:DY, notes:NT, pace:PW, quiz:QZ, checks:CK};
  const b = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"}), a = document.createElement("a");
  a.href = URL.createObjectURL(b); a.download = "go-roadmap-progress-" + today() + ".json"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000); $("#menuPop").hidden = true;
};
$("#mImport").onclick = () => { $("#fi").click(); $("#menuPop").hidden = true };
$("#fi").onchange = e => {
  const f = e.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try{
      const d = JSON.parse(rd.result);
      if(d.status && typeof d.status === "object") S = d.status;
      if(Array.isArray(d.days)) DY = d.days;
      if(d.notes && typeof d.notes === "object") NT = d.notes;
      if(d.quiz && typeof d.quiz === "object") QZ = d.quiz;
      if(d.checks && typeof d.checks === "object") CK = d.checks;
      if(parseInt(d.pace, 10) > 0) PW = parseInt(d.pace, 10);
      migrate(); save.st(); save.days(); save.notes(); save.quiz(); save.ck(); save.pace();
      renderApp(); applyFilter();
    }catch(err){ alert("Не удалось прочитать файл: " + err) }
  };
  rd.readAsText(f); e.target.value = "";
};
$("#mReset").onclick = () => {
  $("#menuPop").hidden = true;
  if(!confirm("Сбросить весь прогресс: статусы, тесты, чек-листы, заметки и активность? Сначала можно скачать копию через меню.")) return;
  S = {}; DY = []; NT = {}; QZ = {}; CK = {}; save.st(); save.days(); save.notes(); save.quiz(); save.ck();
  renderApp(); applyFilter();
};
$("#pw").onchange = e => { PW = parseInt(e.target.value, 10); if(!(PW > 0)) PW = 8; save.pace(); updateStats() };

// подсветка текущего этапа в навигации и тень у тулбара
const obs = new IntersectionObserver(es => {
  es.forEach(en => { if(en.isIntersecting){ const si = en.target.dataset.si; $$("[data-nav]").forEach(a => a.classList.toggle("cur", a.dataset.nav === si)) } });
}, {rootMargin:"-45% 0px -50% 0px"});
window.addEventListener("scroll", () => { const tb = $(".toolbar"); tb.classList.toggle("stuck", tb.getBoundingClientRect().top <= 61) }, {passive:true});

// ---------- старт ----------
$("#heroStats").textContent = SUBS.length + " подтем в " + D.length + " этапах · ~" + SUBS.reduce((a, r) => a + r.sb.h, 0) + " ч, включая pet-проекты";
renderApp();
$$(".stage").forEach(s => obs.observe(s));
if(!Object.keys(OPEN).length){ const f = $(".node"); if(f){ f.classList.add("op"); OPEN[f.id] = 1 } }

window.RM = {D, BYKEY, st, setStatus, goto, esc, rich, I, src, QZ:() => QZ, NT:() => NT, saveNote(k, v){ if(v) NT[k] = v; else delete NT[k]; save.notes(); refreshMeta(k) }, pct, stats, TXT};
if(ls.raw(K.view) === '"g"' || ls.raw(K.view) === "g") setTimeout(() => setView("g"), 0);
