/* ============================================================
   掲示板エンジン（展示情報 / 譲り合い / 講評の日程 / 公募・奨学金）

   4つとも「一覧 ＋ 絞り込み ＋ 投稿フォーム」で構造が同じなので、
   欄の定義だけ差し替えて同じ仕組みで動かす。個別に4回書かない。

   守っていること
     - 譲り合いに金額の欄を作らない。無償のやりとりだけを扱う。
       売買の場にすると、運営側に別の責任が生じるため。
     - 公募は「事実（名称・主催・締切・URL）」だけを持つ欄構成にし、
       募集要項の本文を貼る場所を作らない。転載を避けるため。
     - 連絡先は自由記述にせず「学内で会える場所・時間」を書く欄にした。
       電話番号やメールをそのまま晒す作りにしない。
   ============================================================ */
(function(){
"use strict";
/* 数値や真偽値が来ても落ちないように、必ず文字列にしてから置換する */
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const LSg=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch(e){return d;}};
const SSg=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}
                  catch(e){alert('保存できませんでした。');return false;}};
const TODAY=new Date().toISOString().slice(0,10);
const bldName=n=>{ const b=(typeof B!=='undefined')?B.find(x=>x.n===Number(n)):null;
                   return b?b.jp:''; };
const bldOpts=()=>{ const L=(typeof B!=='undefined')?B:[];
  return '<option value="">選ぶ</option>'+L.map(b=>`<option value="${b.n}">${esc(b.jp)}</option>`).join(''); };
const DEPTLIST=["デザイン","油画","日本画","彫刻","工芸","建築","先端芸術表現",
                "芸術学","文化財保存学","美術教育","グローバルアートプラクティス"];

/* ── 4つの板の定義 ───────────────────────── */
const BOARDS={
  /* 展示と公募は、どちらも「日付までに動くもの」なので1つの板にまとめた。
     タブが増えすぎていたのと、展示を見に行く導線と公募に出す導線は
     同じ気分で開くところだから。並びは日付順で、両方が混ざって出る。 */
  ex:{
    key:'geidai_exhib_v1',
    dummy:()=> [
      ...((typeof DUMMY_EXHIB!=='undefined'?DUMMY_EXHIB:[]).map(x=>({...x,_t:'展示'}))),
      ...((typeof REAL_KOBO!=='undefined'?REAL_KOBO:[]).map(x=>({...x,_t:'公募'}))),
    ],
    title:'展示・公募',
    lead:'展示と、いま出せる公募。日付の近い順に並びます。',
    filters:[{k:'t',label:'種類',opts:['展示','公募']},
             {k:'when',label:'いつ',opts:['これから','開催中','終わった']}],
    /* 終わったものが上に来ても仕方がない。
       これから・開催中を先に、その中で日付の近い順。 */
    sort:(a,b)=>{
      const rank=x=>{
        if(x._t==='公募') return (x.due||'')>=TODAY?0:2;
        return (x.from||'')>TODAY?1 : ((x.to||'')>=TODAY?0:2);
      };
      const key=x=> x._t==='公募' ? (x.due||'') : (x.from||'');
      return rank(a)-rank(b) || key(a).localeCompare(key(b));
    },
    /* 出すときは、まず展示か公募かを選ぶ。選んだほうの項目だけ出す。 */
    kinds:['展示','公募'],
    fieldsFor(k){ return k==='公募' ? this.fieldsKobo : this.fieldsExhib; },
    fieldsExhib:[
      {k:'title',t:'展示の名前',type:'text',req:true,max:40},
      {k:'who',t:'誰の展示',type:'text',max:30,ph:'例）デザイン科 有志'},
      {k:'from',t:'はじまる日',type:'date',req:true},
      {k:'to',t:'おわる日',type:'date',req:true},
      {k:'bld',t:'会場（学内なら）',type:'bld'},
      {k:'place',t:'会場（学外なら）',type:'text',max:40},
      {k:'free',t:'誰でも入れる',type:'check'},
      {k:'body',t:'ひとこと',type:'area',max:140},
      {k:'url',t:'リンク',type:'url',ph:'https://'},
    ],
    fieldsKobo:[
      {k:'title',t:'名称',type:'text',req:true,max:50},
      {k:'kind',t:'種類',type:'sel',opts:['学内','学外','奨学金'],req:true},
      {k:'org',t:'主催',type:'text',max:40},
      {k:'due',t:'締切',type:'date',req:true},
      {k:'target',t:'対象',type:'text',max:30,ph:'例）学部・大学院'},
      {k:'amount',t:'金額（円・わかれば）',type:'num'},
      {k:'url',t:'公式ページ',type:'url',ph:'https://',req:true},
      {k:'body',t:'ひとこと（要項の転載はしないでください）',type:'area',max:120},
    ],
    get fields(){ return this.fieldsExhib; },   // 旧い呼び出しへの保険
    row(x){
      if(x._t==='公募'){
        const left=Math.ceil((new Date(x.due)-new Date(TODAY))/86400000);
        const st=left>=0?(left<=14?'あと'+left+'日':'公募'):'過ぎた';
        const amt = x.amountRaw ? x.amountRaw
                  : (x.amount ? Number(x.amount).toLocaleString()+'円' : '');
        return {tag:st, tagCls:left<0?'past':(left<=14?'soon':'live'),
          head:x.title, sub:[x.kind,x.org].filter(Boolean).join(' ／ '),
          meta:`締切 ${x.dueRaw||x.due}${amt?' ／ '+amt:''}`,
          body:[x.target?'応募資格：'+x.target:'', x.body].filter(Boolean).join('\n'),
          url:x.url};
      }
      const st=x.from>TODAY?'これから':(x.to>=TODAY?'開催中':'終わった');
      return {tag:st, tagCls:st==='開催中'?'live':(st==='これから'?'soon':'past'),
        head:x.title, sub:[x.who,x.bld?bldName(x.bld):x.place].filter(Boolean).join(' ／ '),
        meta:`${x.from} 〜 ${x.to}${x.free?' ／ 誰でも入れる':''}`, body:x.body, url:x.url};
    },
    match(x,f){
      if(f.t && f.t!==x._t) return false;
      if(!f.when) return true;
      if(x._t==='公募') return f.when==='終わった' ? (x.due||'')<TODAY : (x.due||'')>=TODAY;
      const st=x.from>TODAY?'これから':(x.to>=TODAY?'開催中':'終わった');
      return f.when===st;
    },
    note:'公募は応募の前に必ず公式ページで最新の要項を確認してください。要項の本文は貼らないでください。',
  },
  gv:{
    key:'geidai_give_v1', dummy:()=> (typeof DUMMY_GIVE!=='undefined'?DUMMY_GIVE:[]),
    title:'譲り合い',
    lead:'画材や道具を、学内で無償でゆずり合う場所です。売り買いはここではできません。',
    filters:[{k:'mode',label:'種類',opts:['ゆずる','ほしい']},
             {k:'cat',label:'分類',opts:['画材','道具','機材','本','その他']}],
    sort:(a,b)=> (b.at||0)-(a.at||0),
    fields:[
      {k:'mode',t:'どちら',type:'sel',opts:['ゆずる','ほしい'],req:true},
      {k:'title',t:'品物',type:'text',req:true,max:40},
      {k:'cat',t:'分類',type:'sel',opts:['画材','道具','機材','本','その他'],req:true},
      {k:'bld',t:'受け渡しの場所',type:'bld'},
      {k:'body',t:'状態・ひとこと',type:'area',max:140},
      {k:'meet',t:'いつ学内にいるか',type:'text',max:40,ph:'例）平日の昼、総合工房棟にいます'},
    ],
    row(x){
      return {tag:x.done?'終了':x.mode, tagCls:x.done?'past':(x.mode==='ゆずる'?'live':'soon'),
        head:x.title, sub:[x.cat,x.bld?bldName(x.bld):''].filter(Boolean).join(' ／ '),
        meta:[x.dept?x.dept+'科':'',x.meet].filter(Boolean).join(' ／ '), body:x.body};
    },
    match(x,f){ return (!f.mode||f.mode===x.mode)&&(!f.cat||f.cat===x.cat); },
    note:'無償のやりとりだけです。',
  },
  ko:{
    key:'geidai_kouhyo_v1', dummy:()=> (typeof DUMMY_KOUHYO!=='undefined'?DUMMY_KOUHYO:[]),
    title:'講評・展示の日程',
    lead:'講評や課題展示の日程を持ち寄る場所です。他の科の講評は、行くと一番勉強になります。',
    filters:[{k:'when',label:'いつ',opts:['これから','終わった']},
             {k:'dept',label:'科',opts:DEPTLIST}],
    sort:(a,b)=> (a.date||'').localeCompare(b.date||''),
    fields:[
      {k:'title',t:'なにの講評か',type:'text',req:true,max:40},
      {k:'dept',t:'科',type:'sel',opts:DEPTLIST,req:true},
      {k:'date',t:'日にち',type:'date',req:true},
      {k:'period',t:'時間',type:'text',max:20,ph:'例）2〜5限'},
      {k:'bld',t:'場所',type:'bld'},
      {k:'open',t:'他の科の人も見られる',type:'check'},
      {k:'body',t:'ひとこと',type:'area',max:140},
    ],
    row(x){
      /* 「これから」が全部オレンジだと一面オレンジになる。
         2週間以内だけオレンジ（急ぎ）、先のものは青にして配分を作る。 */
      const left=Math.ceil((new Date(x.date)-new Date(TODAY))/86400000);
      const st=left<0?'終わった':(left<=14?(left===0?'今日':'あと'+left+'日'):'これから');
      return {tag:st, tagCls:left<0?'past':(left<=14?'soon':'live'),
        head:x.title, sub:[x.dept?x.dept+'科':'',x.bld?bldName(x.bld):''].filter(Boolean).join(' ／ '),
        meta:`${x.date}${x.period?' '+x.period:''}${x.open?' ／ 見学できます':' ／ 学内向け'}`,
        body:x.body};
    },
    match(x,f){ const st=x.date>=TODAY?'これから':'終わった';
      return (!f.when||f.when===st)&&(!f.dept||f.dept===x.dept); },
  },
};

const state={};
Object.keys(BOARDS).forEach(k=>state[k]={f:{},open:false,kind:(BOARDS[k].kinds||[''])[0]});
const mineOf=id=>LSg(BOARDS[id].key,[]);
/* 展示・公募の板には、1件ずつ公式ページで確かめた公募の実データが混ざっている。
   サーバに投稿が付いても、これは引っ込めない。 */
const REALDATA = new Set(['ex']);
const allOf=id=>{
  /* サーバに本物が入っている板では、ダミーを出さない。
     本物と作り物が混ざると、どれが本当か分からなくなる。 */
  const srv=(typeof SRVDATA!=='undefined')?SRVDATA.posts(id):[];
  /* その板にサーバの投稿が入っていれば、その板のダミーだけを引っ込める。
     他の板は関係ない。 */
  const hideSeed = !REALDATA.has(id) && srv.length > 0;
  const d = hideSeed ? [] : BOARDS[id].dummy();
  /* 手元にあってサーバにも上がっているものは重ねない */
  const up=new Set(srv.map(p=>p.at));
  const mine=mineOf(id).filter(x=>!up.has(x.at));
  return d.concat(srv.map(p=>({...p,mine:!!p.mine}))).concat(mine)
          .slice().sort(BOARDS[id].sort);
};

function render(id){
  const B0=BOARDS[id], st=state[id];
  const list=allOf(id).filter(x=>B0.match(x,st.f));
  const el=document.getElementById('p-'+id);
  el.innerHTML=`
    <div class="bhead">
      <div><h2>${B0.title}</h2><p>${B0.lead}</p></div>
      <button class="btn o" id="${id}-new">${st.open?'やめる':'書く'}</button>
    </div>
    ${st.open?formHTML(id):''}
    <div class="bfilt">
      ${B0.filters.map(f=>`<span class="fl">${f.label}</span>
        <button class="tbtn ${!st.f[f.k]?'on':''}" data-f="${f.k}" data-v="">すべて</button>
        ${f.opts.map(o=>`<button class="tbtn ${st.f[f.k]===o?'on':''}" data-f="${f.k}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}`).join('')}
      <span class="bcnt">${list.length}件</span>
    </div>
    <div class="blist">${list.length?list.map(x=>itemHTML(id,x)).join(''):
      '<div class="empty">まだありません。最初の1件を書いてみてください。</div>'}</div>
    ${B0.note?`<div class="bnote">${B0.note}</div>`:''}
`;

  document.getElementById(id+'-new').onclick=()=>{st.open=!st.open;render(id);};
  el.querySelectorAll('.bfilt .tbtn').forEach(b=>b.onclick=()=>{
    st.f[b.dataset.f]=b.dataset.v; render(id);});
  el.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(!confirm('消しますか？')) return;
    if(typeof GAPI!=='undefined') GAPI.delPost(b.dataset.del).catch(()=>{});
    SSg(B0.key, mineOf(id).filter(x=>x.id!==b.dataset.del)); render(id);});
  el.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{
    const m=mineOf(id); const t=m.find(x=>x.id===b.dataset.done);
    if(t){ t.done=!t.done; SSg(B0.key,m);
      if(typeof GAPI!=='undefined') GAPI.donePost(t.id, t.done).catch(()=>{});
      render(id); }});
  /* 本文をクリックで開閉。ボタン類の上では反応させない。 */
  el.querySelectorAll('.bitem[data-open]').forEach(b=>b.onclick=e=>{
    if(e.target.closest('button,a')) return;
    openId[id] = openId[id]===b.dataset.open ? null : b.dataset.open;
    render(id);
  });
  el.querySelectorAll('[data-map]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    if(typeof window.__gotoBuilding==='function') window.__gotoBuilding(Number(b.dataset.map));
  });

  el.querySelectorAll('.bkind [data-kind]').forEach(b=>b.onclick=()=>{
    st.kind=b.dataset.kind; render(id);});
  const go=document.getElementById(id+'-save');
  if(go) go.onclick=()=>submit(id);
  if(st.open) bindPic(id);
}

/* 写真を出すのは展示と譲り合いだけ。
   講評の日程と公募は文字だけで足りるし、写真があると逆に読みにくい。 */
const WITHPIC=['ex','gv'];

/* 開いている投稿。板ごとに1つだけ開く。 */
const openId = {};

/* 一覧に出していない項目まで見せる。ここが「詳細」。 */
function detailHTML(id,x){
  const rows=[];
  const add=(k,v)=>{ if(v) rows.push([k,v]); };
  if(id==='ex' && x._t==='公募'){
    add('締切', x.dueRaw||x.due);
    add('主催', x.org);
    add('対象', x.target);
    add('金額', x.amountRaw||(x.amount?Number(x.amount).toLocaleString()+'円':''));
  } else if(id==='ex'){
    add('会期', [x.from,x.to].filter(Boolean).join(' 〜 '));
    add('会場', x.bld?bldName(x.bld):x.place);
    add('だれの', x.who);
    add('入場', x.free?'誰でも入れます':'—');
  } else if(id==='gv'){
    add('分類', x.cat);
    add('受け渡し', x.bld?bldName(x.bld):'');
    add('会える時間', x.meet);
    add('出した人', x.dept?x.dept+'科':'');
  } else if(id==='ko'){
    add('日時', [x.date,x.period].filter(Boolean).join(' '));
    add('場所', x.bld?bldName(x.bld):'');
    add('科', x.dept);
    add('見学', x.open?'他の科の人も見られます':'学内向け');
  }
  return `<div class="bdet">
    ${x.img?`<img class="bdpic" src="${esc(x.img)}" alt="">`:''}
    <div class="bdbody">
      <dl>${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      ${x.body?`<p class="bdtxt">${esc(x.body)}</p>`:''}
      <div class="bdacts">
        ${x.bld?`<button class="btn" data-map="${esc(x.bld)}">地図で見る</button>`:''}
        ${x.url?`<a class="btn o" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">公式ページ →</a>`:''}
      </div>
    </div>
  </div>`;
}

/* 公募には写真が無い。展示と混ざったときに行の背が揃わないので、
   種類（学内／学外／奨学金）が分かる図をその場で描く。写真の代わり。
   使う色は青と薄い青とオレンジだけ。 */
function koboThumb(x){
  const K={'学内':0,'学外':1,'奨学金':2}[x.kind] ?? 1;
  const body=[
    `<rect x="14" y="20" width="36" height="30" fill="#093FB4"/>
     <rect x="22" y="28" width="20" height="4" fill="#EAF0FB"/>
     <rect x="22" y="36" width="14" height="4" fill="#EAF0FB"/>`,
    `<circle cx="32" cy="28" r="11" fill="#093FB4"/>
     <path d="M18 52c0-8 6-13 14-13s14 5 14 13z" fill="#093FB4"/>
     <circle cx="44" cy="18" r="6" fill="#FF5035"/>`,
    `<circle cx="32" cy="34" r="15" fill="#FF5035"/>
     <path d="M28 30h8M28 38h8M32 24v20" stroke="#1A1A1A" stroke-width="2.4" fill="none"/>`,
  ][K];
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96">`+
    `<rect width="64" height="64" fill="#DCE5F7"/>${body}</svg>`);
}

function itemHTML(id,x){
  const r=BOARDS[id].row(x);
  if(id==='ex' && x._t==='公募' && !x.img) x={...x, img:koboThumb(x)};
  const on = openId[id]===x.id;
  return `<div class="bitem${x.img?' haspic':''}${on?' open':''}" data-open="${esc(x.id)}">
    <span class="btag ${r.tagCls}">${esc(r.tag)}</span>
    ${x.img?`<img class="bpic" src="${esc(x.img)}" alt="" loading="lazy">`:''}
    <div class="bmain">
      <div class="bh">${esc(r.head)}${x.dummy?'<span class="adum">ダミー</span>':''}</div>
      ${r.sub?`<div class="bs">${esc(r.sub)}</div>`:''}
      <div class="bm">${esc(r.meta)}</div>
      ${r.body?`<div class="bb">${esc(r.body)}</div>`:''}
      ${r.url?`<a class="bu" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">公式ページを開く →</a>`:''}
    </div>
    ${x.mine?`<div class="bact">
      ${id==='gv'?`<button data-done="${esc(x.id)}">${x.done?'まだある':'終わった'}</button>`:''}
      <button data-del="${esc(x.id)}">消す</button></div>`:''}
    ${on?detailHTML(id,x):''}
  </div>`;
}
function formHTML(id){
  const B0=BOARDS[id], st=state[id];
  /* 展示と公募は聞くことが違う。先に「どちらを出すか」を選ばせて、
     選んだほうの項目だけ出す。両方並べると長くて手が止まる。 */
  const F = B0.fieldsFor ? B0.fieldsFor(st.kind) : B0.fields;
  const head = B0.kinds ? `<div class="bkind">${B0.kinds.map(k=>
      `<button class="tbtn ${st.kind===k?'on':''}" data-kind="${esc(k)}">${esc(k)}を出す</button>`
    ).join('')}</div>` : '';
  return `<div class="bform">${head}${F.map(f=>{
    const n=id+'-'+f.k;
    if(f.type==='check') return `<label class="bcheck"><input type="checkbox" id="${n}">${f.t}</label>`;
    if(f.type==='area')  return `<label class="bfull">${f.t}${f.req?' <i>必須</i>':''}
      <textarea id="${n}" maxlength="${f.max||140}" placeholder="${esc(f.ph||'')}"></textarea></label>`;
    if(f.type==='sel')   return `<label>${f.t}${f.req?' <i>必須</i>':''}
      <select id="${n}"><option value="">選ぶ</option>${f.opts.map(o=>`<option>${esc(o)}</option>`).join('')}</select></label>`;
    if(f.type==='bld')   return `<label>${f.t}<select id="${n}">${bldOpts()}</select></label>`;
    const t=f.type==='date'?'date':f.type==='num'?'number':f.type==='url'?'url':'text';
    return `<label>${f.t}${f.req?' <i>必須</i>':''}
      <input type="${t}" id="${n}" ${f.max?`maxlength="${f.max}"`:''} placeholder="${esc(f.ph||'')}"></label>`;
  }).join('')}
  ${WITHPIC.includes(id)?`
    <div class="bpicwrap">
      <img id="${id}-prev" class="bprev" alt="" style="display:none">
      <label class="pbtn" id="${id}-picbtn">写真を選ぶ（1枚・任意）
        <input type="file" id="${id}-pic" accept="image/*" hidden></label>
      <button class="plink" id="${id}-picclr" style="display:none">消す</button>
      <span class="bpicnote">${id==='gv'?'ゆずる物が分かる写真を1枚。':(state[id].kind==='公募'?'案内の画像があれば1枚。':'展示風景か案内の写真を1枚。')}
        8MBまで。長辺640pxに縮めて保存します。</span>
    </div>`:''}
  <div class="bsave"><button class="btn o" id="${id}-save">出す</button></div></div>`;
}

/* 選んだ写真は「出す」まで持っておく。フォームを開き直したら捨てる。 */
let draftPic={};
function bindPic(id){
  if(!WITHPIC.includes(id)) return;
  const inp=document.getElementById(id+'-pic');
  if(!inp) return;
  const prev=document.getElementById(id+'-prev'),
        clr=document.getElementById(id+'-picclr'),
        lab=document.getElementById(id+'-picbtn');
  const GX=window.GX||{};
  const show=d=>{ prev.src=d; prev.style.display=d?'block':'none';
                  clr.style.display=d?'':'none'; };
  if(draftPic[id]) show(draftPic[id]);
  inp.addEventListener('change', async e=>{
    const f=e.target.files[0]; e.target.value=''; if(!f) return;
    if(GX.busy) GX.busy(lab,true,'読み込み中…');
    try{
      draftPic[id]= GX.shrink ? await GX.shrink(f) : '';
      show(draftPic[id]);
      if(GX.toast) GX.toast('写真を読み込みました');
    }catch(err){ if(GX.toast) GX.toast(err.message,'err'); else alert(err.message); }
    finally{ if(GX.busy) GX.busy(lab,false); }
  });
  clr.addEventListener('click',()=>{ draftPic[id]=''; show(''); });
}
function submit(id){
  const B0=BOARDS[id], v={};
  /* いま画面に出ている項目だけを拾う。展示のフォームで公募の項目を
     読みに行くと、要る項目が空だと言われて出せなくなる。 */
  const FS = B0.fieldsFor ? B0.fieldsFor(state[id].kind) : B0.fields;
  for(const f of FS){
    const el=document.getElementById(id+'-'+f.k);
    if(!el) continue;
    v[f.k]= f.type==='check' ? el.checked : el.value.trim();
    if(f.req && !v[f.k]){ alert(f.t+'を入れてください。'); el.focus(); return; }
  }
  if(B0.kinds) v._t = state[id].kind;
  if(v.url && !/^https?:\/\//i.test(v.url)){ alert('リンクは http:// か https:// から始めてください。'); return; }
  if(v.from && v.to && v.from>v.to){ alert('おわる日が、はじまる日より前になっています。'); return; }
  const m=mineOf(id);
  m.push({...v, img:draftPic[id]||'', id:'m'+Date.now(), at:Date.now(), mine:true,
          dept:(typeof ME!=='undefined'?ME.dept:''), grade:(typeof ME!=='undefined'?ME.grade:'')});
  if(SSg(B0.key,m)){
    const posted=m[m.length-1];
    if(typeof GAPI!=='undefined')
      GAPI.putPost({...posted, board:id, ref:posted.bld||''}).catch(()=>{});
    draftPic[id]='';
    state[id].open=false; render(id);
    if(window.GX&&window.GX.toast) window.GX.toast('出しました');
  } else if(window.GX&&window.GX.toast){
    m.pop();
    window.GX.toast('保存できませんでした。写真を外すか、古い投稿を消してください。','err');
  }
}

window.renderBoard=render;
window.boardStats=()=>Object.fromEntries(Object.keys(BOARDS).map(k=>[BOARDS[k].title,allOf(k).length]));
})();
