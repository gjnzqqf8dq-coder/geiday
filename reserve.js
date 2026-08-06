/* ============================================================
   予約状況タブ

   実際に確かめたこと（2026-08-05）
     ・amc.geidai.ac.jp は X-Frame-Options も CSP も返していない。
       別オリジンからの iframe 読み込みが実機で通ることを確認済み。
     ・AMCに独自の予約システムは無く、実体は
       「Googleカレンダー（空き状況）＋ Googleフォーム（申込）」の組み合わせ。
       機材ごとにこのペアを持つページが11件ある。
     ・www.geidai.ac.jp / 図書館OPAC / CampusPlan は
       X-Frame-Options: SAMEORIGIN または DENY を返す。**埋め込めない。**
       これらはリンクで開くしかない。

   正直に書いておくべきこと
     ・Googleカレンダーの公開設定は「予定あり/なし」のみ。
       全ての予定が Busy と表示され、誰の何の予約かは出ない。
       埋まっている時間は分かるが、内容は分からない。
     ・描画に5〜8秒かかることがある。読み込み中の表示を出す。
     ・AMC側があとからヘッダを付ける可能性はある。
       そのときのために、必ず直リンクを併置する。
   ============================================================ */
(function(){
"use strict";
/* 数値や真偽値が来ても落ちないように、必ず文字列にしてから置換する */
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

/* WP REST API で実在を確認したページだけを載せる（推測でURLを作らない） */
const AMC=[
  {t:'レーザーカッター',      u:'https://amc.geidai.ac.jp/lab/facilities/lasercutter',   tag:'切る'},
  {t:'3Dプリンター（FDM）',   u:'https://amc.geidai.ac.jp/lab/facilities/3dprinter',     tag:'出力'},
  {t:'3Dプリンター（SLA）',   u:'https://amc.geidai.ac.jp/lab/facilities/3dprinter_sla', tag:'出力'},
  {t:'大判プリンター',        u:'https://amc.geidai.ac.jp/lab/facilities/printer',       tag:'出力'},
  {t:'UVプリンター',          u:'https://amc.geidai.ac.jp/lab/facilities/uvprinter',     tag:'出力'},
  {t:'カッティングプロッター', u:'https://amc.geidai.ac.jp/lab/facilities/plotter',       tag:'切る'},
  {t:'NC切削機',              u:'https://amc.geidai.ac.jp/lab/facilities/cnc',           tag:'削る'},
  {t:'刺しゅうミシン',        u:'https://amc.geidai.ac.jp/lab/facilities/embroiderymachine', tag:'縫う'},
  {t:'サウンドスタジオ',      u:'https://amc.geidai.ac.jp/lab/facilities/recordingstudio', tag:'録る'},
  {t:'3Dスキャナー（Artec Micro II）', u:'https://amc.geidai.ac.jp/lab/facilities/3dscanner_micro', tag:'測る'},
  {t:'3Dスキャナー（Artec EVA）',      u:'https://amc.geidai.ac.jp/lab/facilities/3dscanner_eva',   tag:'測る'},
  {t:'Matterport',            u:'https://amc.geidai.ac.jp/lab/facilities/matterport',    tag:'測る'},
];
const ALLCAL={t:'大型機材カレンダー（まとめて見る）', u:'https://amc.geidai.ac.jp/lab/calendar'};
const HOURS ={t:'AMC 開室情報', u:'https://amc.geidai.ac.jp/lab/openinghours'};

/* 埋め込めないことをヘッダで確認済みのもの。リンクだけ置く。 */
const LINKONLY=[
  {t:'附属図書館 OPAC / MyLibrary', u:'https://opac.lib.geidai.ac.jp/',
   why:'X-Frame-Options: SAMEORIGIN'},
  {t:'CampusPlan 学生ポータル', u:'https://cplan-web.off.geidai.ac.jp/portal/',
   why:'X-Frame-Options: DENY・ログイン必須'},
  {t:'大学の貸出物品・共通工房のページ', u:'https://www.geidai.ac.jp/',
   why:'X-Frame-Options: SAMEORIGIN'},
];

/* まとめて見るページは Googleカレンダーを4本読むので5〜8秒かかる。
   最初は1本だけのレーザーカッターを出して、体感を軽くする。 */
let cur=AMC[0].u, curT=AMC[0].t;

function render(){
  const el=document.getElementById('p-rs');
  const item=(x,on)=>`<button class="rbtn${on?' on':''}" data-u="${esc(x.u)}" data-t="${esc(x.t)}">
      ${x.tag?`<span class="rtag">${esc(x.tag)}</span>`:''}${esc(x.t)}</button>`;
  el.innerHTML=`
    <div class="bhead">
      <div><h2>予約状況</h2>
        <p>芸術情報センター（AMC）の機材の空き状況です。AMCのページをそのまま表示しています。
          申し込みも同じページのフォームからできます。</p></div>
      <a class="btn" href="${esc(cur)}" target="_blank" rel="noopener noreferrer">別のタブで開く</a>
    </div>

    <div class="rpick">
      ${item(ALLCAL, cur===ALLCAL.u)}${item(HOURS, cur===HOURS.u)}
      <span class="rsep"></span>
      ${AMC.map(x=>item(x, cur===x.u)).join('')}
    </div>

    <div class="rframe">
      <div class="rload" id="rload"><span class="spin"></span>読み込んでいます…</div>
      <iframe id="rif" src="${esc(cur)}" title="${esc(curT)}"
        referrerpolicy="no-referrer-when-downgrade" loading="eager"></iframe>
    </div>

    

    <div class="rlink">
      <h4>大学のシステム</h4>
      ${LINKONLY.map(x=>`<div class="rl">
        <a href="${esc(x.u)}" target="_blank" rel="noopener noreferrer">${esc(x.t)} →</a>
</div>`).join('')}
    </div>

`;

  el.querySelectorAll('.rbtn').forEach(b=>b.onclick=()=>{
    cur=b.dataset.u; curT=b.dataset.t; render();
  });
  const f=document.getElementById('rif'), l=document.getElementById('rload');
  if(f){ f.onload=()=>{ l.style.display='none'; };
    /* 読み込めなかったとき用。10秒で案内に切り替える */
    setTimeout(()=>{ if(l && l.style.display!=='none')
      l.innerHTML='まだ表示されません。「別のタブで開く」から直接見てください。'; },12000);
  }
}
window.renderReserve=render;
})();
