/* ============================================================
   記事一覧

   GEIDAY 公式サイト（geide1111.studio.site）に載っている記事へ送る。
   本文はこちらに持たない。持つと、向こうが直したときに食い違う。
   ここは入口だけを置いて、読むのは向こうで。

   一覧は 2026-08-06 時点。記事が増えたら ARTICLES に足す。
   ============================================================ */
(function(){
"use strict";
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const BASE='https://geide1111.studio.site';

const ARTICLES=[
  {date:'2026-07-24', path:'/posts/3WRZartT',
   title:'【現役合格】藝大デザイン科一次試験の記録',
   who:'デザイン科 1年生', tag:'受験'},
  {date:'2026-07-24', path:'/posts/Eh0ZyiJU',
   title:'質問&回答まとめ【臨時更新！】',
   who:'ゲーデイ', tag:'まとめ'},
  {date:'2026-07-24', path:'/posts/0BP61AFO',
   title:'大手ゲーム会社3DCGデザイナーに内定、藝大生のポートフォリオ【内定者インタビュー】',
   who:'デザイン科 修士2年生', tag:'就活'},
  {date:'2026-07-06', path:'/posts/aEAzfGgc',
   title:'【藝大生に聞く】制作と青春が交差する「共同アトリエ」のつくり方とリアル',
   who:'映像科 修士2年生', tag:'学生生活'},
];

/* 一番左に置く見出しの図。写真は無いので、種類が分かる形を描く。
   1色（青）で組んで、記事の性格だけ伝える。 */
const THUMB={
  '受験':`<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="8" width="30" height="40" rx="2"/><path d="M20 20h18M20 28h18M20 36h11"/><circle cx="45" cy="45" r="10" class="o"/><path d="M41 45l3 3 6-6" class="w"/></svg>`,
  'まとめ':`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="24" cy="24" r="13"/><path d="M20 21a4 4 0 1 1 5 4v3" class="w"/><circle cx="24.5" cy="33" r="1.4" class="wf"/><circle cx="41" cy="41" r="13" class="o"/><path d="M37 41h8M41 37v8" class="w"/></svg>`,
  '就活':`<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="22" width="44" height="28" rx="2"/><path d="M24 22v-5h16v5"/><path d="M10 33h44" /><rect x="28" y="30" width="8" height="6" rx="1" class="of"/></svg>`,
  '学生生活':`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 50V22l12-8 12 8v28"/><path d="M34 50V30l10-6 10 6v20" class="o"/><path d="M6 50h52"/><rect x="17" y="34" width="8" height="16" class="of"/></svg>`,
  _:`<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="10" width="34" height="44" rx="2"/><path d="M19 22h20M19 31h20M19 40h12"/></svg>`,
};

const SNS={ x:'https://x.com/geiday_',
            instagram:'https://www.instagram.com/geiday_/' };

const QA='https://marshmallow-qa.com/iwk167hhzk9pfhl?t=gimhwG&utm_medium=url_text&utm_source=promotion';

function render(){
  const el=document.getElementById('p-ar');
  if(!el) return;
  const jp=d=>{const [y,m,dd]=d.split('-'); return `${y}.${Number(m)}.${Number(dd)}`;};
  el.innerHTML=`
    <div class="bhead">
      <div><h2>記事</h2>
        <p>GEIDAY が書いている記事です。押すと本文が開きます。</p></div>
      <a class="btn" href="${BASE}" target="_blank" rel="noopener noreferrer">記事をぜんぶ見る</a>
    </div>

    <!-- X と Instagram はヘッダから外した。GEIDAY 本体の話はこのタブに集めている。 -->
    <div class="arsns">
      <a href="${SNS.x}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-7 8 8.2 12h-6.4l-5-7.3L5.9 22H2.8l7.5-8.6L2.4 2h6.6l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z"/>
        </svg>X</a>
      <a href="${SNS.instagram}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="1.9" aria-hidden="true">
          <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2"/>
          <circle cx="12" cy="12" r="4.1"/>
          <circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none"/>
        </svg>Instagram</a>
    </div>

    <div class="arlist">
      ${ARTICLES.map(a=>`
        <a class="arrow2" href="${BASE}${esc(a.path)}" target="_blank" rel="noopener noreferrer">
          <span class="arthumb">${THUMB[a.tag]||THUMB._}</span>
          <span class="arbody">
            <span class="arttl">${esc(a.title)}</span>
            <span class="armeta">${jp(a.date)}　${esc(a.who)}</span>
          </span>
          <span class="artag">${esc(a.tag)}</span>
          <span class="argo" aria-hidden="true">→</span>
        </a>`).join('')}
    </div>

    <div class="arask">
      <div>
        <h3>聞きたいことがあれば</h3>
        <p>匿名で質問を送れます。記事にして答えることがあります。</p>
      </div>
      <a class="btn o" href="${esc(QA)}" target="_blank" rel="noopener noreferrer">質問する</a>
    </div>`;
}
window.renderArticles=render;
window.GEIDAY_SNS={...SNS, site:BASE};
})();
