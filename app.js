(() => {
  'use strict';
  const data = window.SCRAPBOOK, ui = data.ui, pages = data.pages || [];
  const $ = id => document.getElementById(id);
  const node = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
  document.title = data.pageTitle;
  for (const [id,key] of [['home','brand'],['edition','edition'],['contents-toggle','contents'],['hint','hint'],['footer','footer'],['close-viewer','close']]) $(id).textContent = ui[key];
  $('book').setAttribute('aria-label',ui.bookLabel);
  const theme = document.body.dataset.theme === 'nailong' ? window.SCRAPBOOK_THEME : null;
  const small = matchMedia(theme ? '(max-width: 760px), (max-width: 1100px) and (orientation: portrait)' : '(max-width: 760px)'), reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let lastMediaTrigger, flip, rebuilding = false, closingViewer = false, endingOpen=false;
  const cameras=new Set();
  function updateCameras(){cameras.forEach(camera=>camera.sync());theme?.syncMotion?.();}
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
    if(media.orientation) button.style.aspectRatio=media.orientation==='portrait' ? '3 / 4' : '4 / 3';
    if(media.ratio) button.style.aspectRatio=media.ratio;
    button.setAttribute('aria-label',`${media.type === 'video' ? ui.video : ui.photo}: ${title || media.alt || ''}`);
    button.append(mediaElement(media));
    button.append(node('span','media-symbol',media.type === 'video' ? '▶' : '↗'));
    button.addEventListener('click', () => {
      lastMediaTrigger = button;
      $('viewer-media').replaceChildren(mediaElement(media,true));
      $('viewer-caption').textContent = media.note || media.alt || title || '';
      if (closingViewer) return;
      $('viewer').showModal();
      $('viewer').classList.remove('leaving');
    });
    figure.append(button);
    if (media.note) figure.append(node('figcaption','hand',media.note));
    return figure;
  }
  function filmReels(gallery,page,article){
    gallery.style.setProperty('--film-duration',`${Math.max(15,Number(page.filmDuration)||34)}s`);
    [0,1].forEach(column=>{
      const window=node('div','film-window film-window-'+column);
      const track=node('div','film-track');
      const photos=page.mediaItems.map((media,index)=>({media,index})).filter(({index})=>index%2===column);
      for(let copy=0;copy<2;copy++){
        const sequence=node('div','film-sequence');
        if(copy)sequence.setAttribute('aria-hidden','true');
        photos.forEach(({media,index})=>{
          const card=mediaCard(media,page.title);card.dataset.photoIndex=String(index);
          if(copy)card.querySelector('button').tabIndex=-1;
          sequence.append(card);
        });
        track.append(sequence);
      }
      window.append(track);gallery.append(window);
    });
    const pause=node('button','film-pause','Ⅱ');pause.type='button';pause.hidden=reduce.matches;
    pause.setAttribute('aria-label','Jeda foto berjalan');pause.setAttribute('aria-pressed','false');
    pause.addEventListener('click',()=>{
      const paused=article.classList.toggle('film-paused');
      pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Lanjutkan foto berjalan':'Jeda foto berjalan');pause.setAttribute('aria-pressed',String(paused));
    });gallery.append(pause);
  }
  function instantCamera(gallery,page){
    const photos=(page.cameraPhotos || page.mediaItems.slice(1,4)).slice(0,3);
    const preview=mediaCard(page.mediaItems[0],page.title);preview.classList.add('camera-preview');gallery.append(preview);
    const frames=photos.map((media,index)=>{
      const frame=mediaCard(media,page.title);frame.classList.add('camera-preview');frame.hidden=true;frame.dataset.photoIndex=String(index+1);gallery.append(frame);return frame;
    });
    const prints=photos.map((media,index)=>{
      const print=mediaCard(media,page.title);print.classList.add('camera-print');print.hidden=true;print.dataset.photoIndex=String(index+1);gallery.append(print);return print;
    });
    const flash=node('span','camera-flash');flash.setAttribute('aria-hidden','true');gallery.append(flash);
    const shutter=node('button','camera-shutter','●');shutter.type='button';shutter.setAttribute('aria-label',page.cameraText?.shutter || 'Jepret foto');
    const label=node('span','camera-shutter-label',page.cameraText?.button || 'jepretw');shutter.append(label);
    const status=node('span','camera-status',page.cameraText?.hint || 'pencet kameranyaw ♡');status.setAttribute('role','status');status.setAttribute('aria-live','polite');gallery.append(shutter,status);
    let selected=-1,interval=null,developTimer=null,unlockTimer=null;
    const shoot=(automatic=false)=>{
      if(shutter.disabled || !photos.length)return;
      status.setAttribute('aria-live',automatic?'off':'polite');
      shutter.disabled=true;gallery.classList.remove('camera-shoot');void gallery.offsetWidth;gallery.classList.add('camera-shoot');
      developTimer=setTimeout(()=>{
        if(!gallery.isConnected)return;
        selected=(selected+1)%photos.length;preview.hidden=true;
        frames.forEach((frame,i)=>frame.hidden=i!==selected);
        prints.forEach((print,i)=>{print.hidden=i!==selected;print.classList.remove('photo-developed');});
        void prints[selected].offsetWidth;prints[selected].classList.add('photo-developed');
        status.textContent=`${page.cameraText?.photo || 'foto'} ${selected+1} / ${photos.length}`;
      },reduce.matches?0:160);
      unlockTimer=setTimeout(()=>{gallery.classList.remove('camera-shoot');shutter.disabled=false;},reduce.matches?80:750);
    };
    const stop=()=>{clearInterval(interval);interval=null;clearTimeout(developTimer);clearTimeout(unlockTimer);gallery.classList.remove('camera-shoot');shutter.disabled=false;};
    const controller={
      sync(){
        const active=page.cameraAutoplay!==false && gallery.isConnected && !gallery.closest('.flip-page')?.inert && !$('book').inert && !document.hidden && !document.querySelector('dialog[open]') && !$('stage').classList.contains('turning');
        if(!active){stop();return;}
        if(interval!==null)return;
        if(selected<0)shoot(true);
        interval=setInterval(()=>shoot(true),Math.max(1000,Number(page.cameraInterval)||4000));
      },
      destroy:stop
    };
    cameras.add(controller);
    shutter.addEventListener('click',()=>shoot());
  }
  function sheet(page, index) {
    const article = node('article','sheet');
    if(index<4)article.classList.add('intro-copy');
    if(page.layout) article.classList.add('layout-'+page.layout);
    if(page.closing){article.classList.add('closing-page');article.dataset.density='hard';}
    article.append(node('div','page-running',page.label));
    const body = node('div','page-body');
    if(page.title) body.append(node('h2','page-title',page.title));
    if(page.mediaItems?.length){
      const gallery=node('div','media-grid');
      if(['hanging','film','postage','camera','ribbon'].includes(page.layout)){
        article.classList.add('album-page');gallery.classList.add('album-canvas');
        ['paper','cord','ribbon','spark'].forEach(kind=>{const decoration=node('span','album-'+kind,kind==='spark'?'♡':'' );decoration.setAttribute('aria-hidden','true');gallery.append(decoration);});
      }
      if(page.layout==='film')filmReels(gallery,page,article);
      else if(page.layout==='camera')instantCamera(gallery,page);
      else page.mediaItems.forEach(media=>gallery.append(mediaCard(media,page.title)));
      body.append(gallery);
    }
    if (page.media) body.append(mediaCard(page.media,page.title));
    (page.paragraphs || []).forEach(p => body.append(node('p','paragraph',p)));
    (page.entries || []).forEach(entry => { const section = node('section','entry'); section.append(node('span','eyebrow',entry.label),node('h3','',entry.title),node('p','paragraph',entry.text)); body.append(section); });
    if (page.note) body.append(node('p','hand page-note',page.note));
    body.setAttribute('tabindex','0');
    article.append(body,node('div','folio',String(index+1).padStart(2,'0')));
    if(page.swipeHint)article.append(node('p','hand page-swipe-hint',page.swipeHint));
    theme?.decoratePage(article,index);
    return article;
  }
  function cover(back = false) {
    const coverData = back ? (data.backCover || data.cover) : data.cover;
    const page = node('section','cover flip-page');
    page.dataset.density = 'hard';
    const inner = node('div','cover-inner');
    inner.append(node('p','eyebrow',coverData.eyebrow),node(back ? 'h2' : 'h1','',coverData.title));
    if (back) {
      inner.append(node('span','back-ornament','✳'),node('p','hand',ui.end));
    } else {
      inner.append(node('p','cover-subtitle',data.cover.subtitle));
      if(data.cover.media) inner.append(mediaCard(data.cover.media,data.cover.title));
      if(data.cover.note) inner.append(node('p','hand cover-note',data.cover.note));
    }
    inner.append(node('p','cover-signature',coverData.signature));
    inner.append(node('p','cover-swipe',back ? ui.backHint : ui.coverHint));
    page.append(inner); theme?.decoratePage(page,back ? pages.length : -1); return page;
  }
  function makePages() {
    const list = [cover()];
    pages.forEach((p,i)=>{const page=sheet(p,i);page.classList.add('flip-page');list.push(page);});
    // Pair all interior pages before adding a single hard back cover.
    if(pages.length % 2) {
      const blank=node('article','sheet flip-page end-sheet');blank.append(node('span','ornament','✳'),node('p','hand',ui.end));list.push(blank);
    }
    if(pages.at(-1)?.closing && window.SCRAPBOOK_ENDING)list.push(window.SCRAPBOOK_ENDING.createCover());
    else if(!pages.at(-1)?.closing)list.push(cover(true)); return list;
  }
  function sync() {
    if(!flip || rebuilding) return;
    const index=flip.getCurrentPageIndex(), portrait=flip.getOrientation()==='portrait', count=flip.getPageCount();
    const isFront=index===0,isBack=index===count-1;
    if(isBack && window.SCRAPBOOK_ENDING && !endingOpen && !$('stage').classList.contains('turning')){endingOpen=true;window.SCRAPBOOK_ENDING.open();}
    if(!isBack && endingOpen){endingOpen=false;window.SCRAPBOOK_ENDING?.close();$('hint').textContent=ui.hint;}
    $('stage').classList.toggle('front-cover',isFront); $('stage').classList.toggle('back-cover',isBack);
    $('stage').classList.toggle('portrait',portrait);
    const numberedEnd=pages.at(-1)?.closing;
    $('position').textContent=isFront ? ui.cover : isBack && window.SCRAPBOOK_ENDING ? ui.bookClosed : isBack && !numberedEnd ? (ui.backCover || ui.cover) : `${ui.page} ${index}${!portrait && index+1<=pages.length ? '–'+(index+1):''} ${ui.of} ${pages.length}`;
    $('desk-caption').textContent=isFront ? data.cover.subtitle : data.cover.title.replaceAll('\n',' ');
    const visible = new Set([index]); if(!portrait && !isFront && !isBack) visible.add(index+1);
    $('book').querySelectorAll('.flip-page').forEach((page,i)=>{
      page.inert=!visible.has(i);page.setAttribute('aria-hidden',String(!visible.has(i)));
      if(!visible.has(i)) stopVideos(page);
    });
    $('contents').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-current',visible.has(i)?'page':'false'));
    $('progress').style.transform=`scaleX(${visible.has(count-1)?1:index/(count-1)})`;
    $('book').inert=endingOpen;
    if(endingOpen){$('position').textContent=ui.bookClosed || 'bukunya udah ditutupw ♡';$('hint').textContent=ui.reopenHint || 'swipe kanan buat buka lagiw';}
    updateCameras();
  }
  function initialize(index=0) {
    rebuilding=true;
    theme?.resetPageMotion?.();
    $('stage').classList.remove('turning');
    cameras.forEach(camera=>camera.destroy());cameras.clear();
    const fitScreen=Boolean(theme && matchMedia('(min-width: 761px)').matches);
    document.body.classList.toggle('screen-fit',fitScreen);
    if(flip) flip.destroy();
    let book=$('book');
    if(!book){book=node('div','book');book.id='book';$('stage').append(book);}
    book.className='book flipbook';book.setAttribute('aria-label',ui.bookLabel);
    const main=document.querySelector('main'), mainStyle=getComputedStyle(main);
    const available=Math.max(220,Math.min(main.clientWidth-parseFloat(mainStyle.paddingLeft)-parseFloat(mainStyle.paddingRight),fitScreen?1800:1080));
    const deskMargins=fitScreen ? small.matches?220:window.innerWidth<=1150?96:Math.max(96,Math.min(280,available*.14)) : 0;
    // Keep the layout readable at a stable design width, then fit the whole
    // spread to BOTH viewport dimensions. Large screens may scale up, too.
    const width=Math.floor(small.matches ? Math.min(available,theme?510:420) : fitScreen?520:Math.min((available-deskMargins)/2,390));
    let height=Math.max(600,Math.round(width*(theme?1.35:1.55)));
    $('stage').style.setProperty('--page-width',width+'px');
    $('stage').style.width=(small.matches?width:width*2)+'px';
    const list=makePages();book.append(...list);
    // Measure the actual copy at this width before fixing the book's dimensions.
    // Reserve room for page numbers and stickers instead of scrolling inside a leaf.
    list.forEach(page=>{
      page.style.width=width+'px';
      const body=page.querySelector('.page-body');
      if(body){
        body.style.height='auto';
        const running=page.querySelector('.page-running');
        const style=getComputedStyle(page);
        const runningStyle=running&&getComputedStyle(running);
        const headingSpace=running?.offsetHeight ? running.offsetHeight+parseFloat(runningStyle.marginBottom) : 0;
        height=Math.max(height,Math.ceil(body.scrollHeight+headingSpace+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+70));
        body.style.height='';
      }
    });
    list.filter(page=>page.classList.contains('cover')).forEach(page=>{
      page.style.height=height+'px';
      const inner=page.querySelector('.cover-inner'),style=getComputedStyle(inner);
      height=Math.max(height,Math.ceil(inner.scrollHeight+parseFloat(style.top)+parseFloat(style.bottom)+8));
    });
    const stageTop=$('stage').getBoundingClientRect().top+window.scrollY;
    const bookWidth=small.matches?width:width*2;
    const screenRoom=Math.max(160,window.innerHeight-stageTop-30);
    const scale=fitScreen ? Math.min(screenRoom/height,(available-deskMargins)/bookWidth) : 1;
    book.style.width=bookWidth+'px';book.style.height=height+'px';
    book.style.transform=scale!==1 ? `scale(${scale})` : '';
    book.style.transformOrigin='top left';
    $('stage').style.setProperty('--page-width',width*scale+'px');
    $('stage').style.width=bookWidth*scale+'px';
    $('stage').style.height=height*scale+'px';
    // Own the gesture lifecycle; PageFlip handles only the animation.
    // Its corner-only gate also rejects programmatic flipPrev in portrait mode.
    // Mouse events are off, so disabling that gate does not enable tap-to-flip.
    flip=new St.PageFlip(book,{width:Math.round(width),height,size:'fixed',autoSize:false,usePortrait:true,showCover:true,drawShadow:true,maxShadowOpacity:.32,flippingTime:reduce.matches?1:850,showPageCorners:false,mobileScrollSupport:false,useMouseEvents:false,disableFlipByClick:false,startPage:Math.min(index,list.length-1)});
    flip.on('flip',sync);flip.on('changeOrientation',sync);
    flip.on('changeState',event=>{
      const busy=event.data!=='read';$('stage').classList.toggle('turning',busy);
      if(busy)updateCameras();
      if(!busy)sync();
    });
    flip.on('init',()=>{rebuilding=false;sync();});
    flip.loadFromHTML(list);rebuilding=false;sync();
  }
  function go(index) {
    if(!flip || flip.getState()!=='read')return;
    if(endingOpen){endingOpen=false;window.SCRAPBOOK_ENDING?.close();$('hint').textContent=ui.hint;$('book').inert=false;}
    if(reduce.matches) {flip.turnToPage(index);sync();} else flip.flip(index,'bottom');
  }
  function next(){
    if(!flip || endingOpen || flip.getState()!=='read')return;
    if(flip.getCurrentPageIndex()<flip.getPageCount()-1){if(reduce.matches){flip.turnToNextPage();sync();}else flip.flipNext('bottom');}
  }
  function previous(){
    if(endingOpen){endingOpen=false;window.SCRAPBOOK_ENDING?.close();$('hint').textContent=ui.hint;$('book').inert=false;}
    if(flip && flip.getCurrentPageIndex()>0 && flip.getState()==='read'){if(reduce.matches){flip.turnToPrevPage();sync();}else flip.flipPrev('bottom');}
  }
  window.bindBookSwipe($('stage'),direction=>direction==='next'?next():previous());
  $('home').addEventListener('click',()=>go(0));
  [ui.cover,...pages.map((p,i)=>(p.title || `${ui.page} ${i+1}`).replaceAll('\n',' '))].forEach((title,i)=>{
    const b=node('button','',`${i ? String(i).padStart(2,'0')+' / ' : ''}${title}`);
    b.addEventListener('click',()=>{go(i);$('contents').hidden=true;$('contents-toggle').setAttribute('aria-expanded','false');$('contents-toggle').focus();});$('contents').append(b);
  });
  $('contents-toggle').addEventListener('click',()=>{$('contents').hidden=!$('contents').hidden;$('contents-toggle').setAttribute('aria-expanded',String(!$('contents').hidden));});
  document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT|VIDEO/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();next();}if(e.key==='ArrowLeft'){e.preventDefault();previous();}if(e.key==='Escape'){$('contents').hidden=true;$('contents-toggle').setAttribute('aria-expanded','false');}});
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
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('document-hidden',document.hidden);updateCameras();});
  const cameraDialogs=new MutationObserver(updateCameras);
  document.querySelectorAll('dialog').forEach(dialog=>cameraDialogs.observe(dialog,{attributes:true,attributeFilter:['open']}));
  // Web fonts can change line breaks after the first layout.
  document.fonts?.ready.then(()=>initialize(flip?.getCurrentPageIndex() || 0));
})();
