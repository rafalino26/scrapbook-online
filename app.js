(() => {
  'use strict';
  const data = window.SCRAPBOOK, ui = data.ui, pages = data.pages || [];
  const $ = id => document.getElementById(id);
  const node = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
  document.title = data.pageTitle;
  for (const [id,key] of [['home','brand'],['edition','edition'],['contents-toggle','contents'],['previous-label','previous'],['next-label','next'],['hint','hint'],['footer','footer'],['close-viewer','close']]) $(id).textContent = ui[key];
  $('book').setAttribute('aria-label',ui.bookLabel);
  $('previous').setAttribute('aria-label',ui.previous); $('next').setAttribute('aria-label',ui.next);
  const small = matchMedia('(max-width: 760px)'), reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let lastMediaTrigger, flip, rebuilding = false, closingViewer = false;
  function stopVideos(root) { root.querySelectorAll('video').forEach(v => v.pause()); }
  function mediaElement(media, full = false) {
    const video = media.type === 'video';
    const element = node(video && (full || !media.poster) ? 'video' : 'img');
    if (element.tagName === 'VIDEO') {
      element.src = media.src; element.preload = 'metadata'; element.playsInline = true; element.controls = full; element.muted = !full;
      if (media.poster) element.poster = media.poster;
      element.setAttribute('aria-label',media.alt || ui.video);
    } else { element.src = video ? media.poster : media.src; element.alt = media.alt || ''; }
    element.style.objectFit = media.fit || 'cover'; element.style.objectPosition = media.position || 'center';
    element.addEventListener('error', () => { const fallback = node('span','media-error',ui.mediaError); element.replaceWith(fallback); }, {once:true});
    return element;
  }
  function mediaCard(media, title) {
    const figure = node('figure','polaroid');
    const button = node('button','media-button');
    button.setAttribute('aria-label',`${media.type === 'video' ? ui.video : ui.photo}: ${title || media.alt || ''}`);
    button.append(mediaElement(media));
    button.append(node('span','media-symbol',media.type === 'video' ? '▶' : '↗'));
    button.addEventListener('click', () => {
      lastMediaTrigger = button;
      $('viewer-media').replaceChildren(mediaElement(media,true));
      $('viewer-caption').textContent = media.note || title || media.alt || '';
      if (closingViewer) return;
      $('viewer').showModal();
      $('viewer').classList.remove('leaving');
    });
    figure.append(button);
    if (media.note) figure.append(node('figcaption','hand',media.note));
    return figure;
  }
  function sheet(page, index) {
    const article = node('article','sheet');
    article.append(node('div','page-running',page.label));
    const body = node('div','page-body');
    body.append(node('h2','page-title',page.title));
    if (page.media) body.append(mediaCard(page.media,page.title));
    (page.paragraphs || []).forEach(p => body.append(node('p','paragraph',p)));
    (page.entries || []).forEach(entry => { const section = node('section','entry'); section.append(node('span','eyebrow',entry.label),node('h3','',entry.title),node('p','paragraph',entry.text)); body.append(section); });
    if (page.note) body.append(node('p','hand page-note',page.note));
    body.setAttribute('tabindex','0');
    article.append(body,node('div','folio',String(index+1).padStart(2,'0')));
    return article;
  }
  function cover(back = false) {
    const page = node('section','cover flip-page');
    page.dataset.density = 'hard';
    const inner = node('div','cover-inner');
    inner.append(node('p','eyebrow',data.cover.eyebrow),node(back ? 'h2' : 'h1','',data.cover.title));
    if (back) {
      inner.append(node('span','back-ornament','✳'),node('p','hand',ui.end));
    } else {
      inner.append(node('p','cover-subtitle',data.cover.subtitle));
      if(data.cover.media) inner.append(mediaCard(data.cover.media,data.cover.title));
      if(data.cover.note) inner.append(node('p','hand cover-note',data.cover.note));
    }
    inner.append(node('p','cover-signature',data.cover.signature));
    const button = node('button','open-book',back ? ui.cover+' ↶' : ui.open+' ↗');
    button.addEventListener('click',()=>go(back ? 0 : 1));
    inner.append(button); page.append(inner); return page;
  }
  function makePages() {
    const list = [cover()];
    pages.forEach((p,i)=>{const page=sheet(p,i);page.classList.add('flip-page');list.push(page);});
    // Pair all interior pages before adding a single hard back cover.
    if(pages.length % 2) {
      const blank=node('article','sheet flip-page end-sheet');blank.append(node('span','ornament','✳'),node('p','hand',ui.end));list.push(blank);
    }
    list.push(cover(true)); return list;
  }
  function sync() {
    if(!flip || rebuilding) return;
    const index=flip.getCurrentPageIndex(), portrait=flip.getOrientation()==='portrait', count=flip.getPageCount();
    const isFront=index===0,isBack=index===count-1;
    $('stage').classList.toggle('front-cover',isFront); $('stage').classList.toggle('back-cover',isBack);
    $('stage').classList.toggle('portrait',portrait);
    $('previous').disabled=isFront; $('next').disabled=isBack;
    $('next-label').textContent=isFront ? ui.open : ui.next;
    $('position').textContent=isFront ? ui.cover : isBack ? (ui.backCover || ui.cover) : `${ui.page} ${index}${!portrait && index+1<=pages.length ? '–'+(index+1):''} ${ui.of} ${pages.length}`;
    $('desk-caption').textContent=isFront ? data.cover.subtitle : data.cover.title.replaceAll('\n',' ');
    const visible = new Set([index]); if(!portrait && !isFront && !isBack) visible.add(index+1);
    $('book').querySelectorAll('.flip-page').forEach((page,i)=>{
      page.inert=!visible.has(i);page.setAttribute('aria-hidden',String(!visible.has(i)));
      if(!visible.has(i)) stopVideos(page);
    });
    $('contents').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',visible.has(i)?'page':'false'));
    $('progress').style.transform=`scaleX(${index/(count-1)})`;
  }
  function initialize(index=0) {
    rebuilding=true;
    if(flip) flip.destroy();
    let book=$('book');
    if(!book){book=node('div','book');book.id='book';$('stage').append(book);}
    book.className='book flipbook';book.setAttribute('aria-label',ui.bookLabel);
    const main=document.querySelector('main'), mainStyle=getComputedStyle(main);
    const available=Math.max(220,Math.min(main.clientWidth-parseFloat(mainStyle.paddingLeft)-parseFloat(mainStyle.paddingRight),1080));
    const width=Math.floor(small.matches ? Math.min(available,420) : Math.min(available/2,390));
    const height=Math.max(600,Math.round(width*1.55));
    $('stage').style.setProperty('--page-width',width+'px');
    $('stage').style.width=(small.matches?width:width*2)+'px';
    $('stage').style.height=height+'px';
    const list=makePages();book.append(...list);
    flip=new St.PageFlip(book,{width:Math.round(width),height,size:'fixed',autoSize:false,usePortrait:true,showCover:true,drawShadow:true,maxShadowOpacity:.32,flippingTime:reduce.matches?1:1050,showPageCorners:!reduce.matches,mobileScrollSupport:true,clickEventForward:true,useMouseEvents:!reduce.matches,disableFlipByClick:true,swipeDistance:35,startPage:Math.min(index,list.length-1)});
    flip.on('flip',sync);flip.on('changeOrientation',sync);
    flip.on('changeState',event=>{
      const busy=event.data!=='read';$('stage').classList.toggle('turning',busy);
      if(!busy)sync();
    });
    flip.on('init',()=>{rebuilding=false;sync();});
    flip.loadFromHTML(list);rebuilding=false;sync();
  }
  function go(index) {
    if(!flip || flip.getState()!=='read')return;
    if(reduce.matches) {flip.turnToPage(index);sync();} else flip.flip(index,'bottom');
  }
  function next(){if(!$('next').disabled && flip.getState()==='read'){if(reduce.matches){flip.turnToNextPage();sync();}else flip.flipNext('bottom');}}
  function previous(){if(!$('previous').disabled && flip.getState()==='read'){if(reduce.matches){flip.turnToPrevPage();sync();}else flip.flipPrev('bottom');}}
  $('next').addEventListener('click',next);$('previous').addEventListener('click',previous);$('home').addEventListener('click',()=>go(0));
  [ui.cover,...pages.map(p=>p.title.replaceAll('\n',' '))].forEach((title,i)=>{
    const b=node('button','',`${i ? String(i).padStart(2,'0')+' / ' : ''}${title}`);
    b.addEventListener('click',()=>{go(i);$('contents').hidden=true;$('contents-toggle').setAttribute('aria-expanded','false');$('contents-toggle').focus();});$('contents').append(b);
  });
  $('contents-toggle').addEventListener('click',()=>{$('contents').hidden=!$('contents').hidden;$('contents-toggle').setAttribute('aria-expanded',String(!$('contents').hidden));});
  document.addEventListener('keydown',e=>{if($('viewer').open || /INPUT|TEXTAREA|SELECT|VIDEO/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();next();}if(e.key==='ArrowLeft'){e.preventDefault();previous();}if(e.key==='Escape'){$('contents').hidden=true;$('contents-toggle').setAttribute('aria-expanded','false');}});
  // PageFlip ignores button targets: keep image descendants from starting a page drag.
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>initialize(flip?.getCurrentPageIndex() || 0),180);});
  reduce.addEventListener('change',()=>initialize(flip?.getCurrentPageIndex() || 0));
  function closeViewer(){
    if(closingViewer)return;closingViewer=true;stopVideos($('viewer'));
    $('viewer').classList.add('leaving');
    setTimeout(()=>{$('viewer').close();closingViewer=false;},reduce.matches?0:180);
  }
  $('close-viewer').addEventListener('click',closeViewer);
  $('viewer').addEventListener('cancel',e=>{e.preventDefault();closeViewer();});
  $('viewer').addEventListener('click',e=>{if(e.target!==$('viewer'))return;const r=$('viewer').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeViewer();});
  $('viewer').addEventListener('close',()=>{stopVideos($('viewer'));$('viewer-media').replaceChildren();lastMediaTrigger?.focus({preventScroll:true});});
  const progress=node('div','reading-progress');progress.setAttribute('aria-hidden','true');const fill=node('span');fill.id='progress';progress.append(fill);document.querySelector('.reader-controls').after(progress);
  initialize();
})();
