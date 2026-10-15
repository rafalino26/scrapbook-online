(() => {
  'use strict';
  const stage=document.getElementById('stage'),config=window.NAILONG_THEME.ending || {};
  const make=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
  const scene=make('section','ending-scene');scene.setAttribute('aria-label',config.label || 'Nailong bawa love');scene.setAttribute('aria-hidden','true');scene.inert=true;
  const walker=make('div','ending-walker');walker.setAttribute('aria-hidden','true');
  const shadow=make('span','ending-walker-shadow'),body=make('div','ending-walker-body'),image=make('img','ending-walker-image');
  const poster=config.useGif!==false && config.walkingStill ? config.walkingStill : (config.asset || 'public/nailong/sticker-hati.webp');
  image.src=poster;image.alt='';image.width=140;image.height=180;image.draggable=false;
  image.addEventListener('error',()=>{image.src=config.asset || 'public/nailong/sticker-hati.webp';stage.classList.remove('ending-gif');},{once:true});
  body.append(image);walker.append(shadow,body);scene.append(walker);
  const hearts=make('div','ending-hearts');hearts.setAttribute('aria-hidden','true');
  for(let i=0;i<5;i++){const h=make('span','','♡');h.style.setProperty('--i',i);hearts.append(h);}scene.append(hearts);
  const message=make('p','ending-message',config.message || 'sayang mizukuzuw ♡');message.setAttribute('role','status');scene.append(message);
  scene.append(make('p','ending-reopen',window.SCRAPBOOK.ui.reopenHint || 'swipe kanan buat buka lagiw'));
  stage.append(scene);
  let launchTimer,arrivalTimer,playCount=0;
  const reset=()=>{clearTimeout(launchTimer);clearTimeout(arrivalTimer);stage.classList.remove('ending-walking','ending-gif');image.src=poster;};
  window.SCRAPBOOK_ENDING={
    createCover(){const page=make('section','cover flip-page ending-native-cover');page.dataset.density='hard';const inner=make('div','cover-inner');inner.append(make('span','ending-cover-heart','♡'),make('span','ending-cover-title',config.title || 'puzukuzuw & mizukuzuw'));page.append(inner);return page;},
    open(){
      reset();scene.inert=false;scene.setAttribute('aria-hidden','false');stage.classList.remove('ending-open');void scene.offsetWidth;stage.classList.add('ending-open');
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      const delay=Math.max(0,Number(config.startDelay) || 500),duration=Math.max(500,Number(config.walkDuration) || 2800);
      stage.style.setProperty('--ending-delay',delay+'ms');stage.style.setProperty('--ending-walk-duration',duration+'ms');
      if(reduced)stage.classList.add('ending-walking');
      else launchTimer=setTimeout(()=>{
        const gif=config.useGif!==false && config.walkingAsset;
        if(gif){stage.classList.add('ending-gif');image.src=config.walkingAsset+'?play='+ ++playCount;}
        stage.classList.add('ending-walking');
        if(gif)arrivalTimer=setTimeout(()=>{image.src=poster;},duration);
      },delay);
      if(matchMedia('(max-width: 760px)').matches)stage.scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'});
    },
    close(){reset();stage.classList.remove('ending-open');scene.inert=true;scene.setAttribute('aria-hidden','true');}
  };
})();
