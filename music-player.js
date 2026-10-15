(() => {
  'use strict';
  const config=window.SCRAPBOOK_MUSIC;
  if(!config)return;
  const player=document.querySelector('#music-player'),audio=document.querySelector('#background-music');
  const opening=document.querySelector('#gift-opening');
  let giftOpened=!opening;
  const toggle=document.querySelector('#music-toggle'),status=document.querySelector('#music-status');
  const elapsed=document.querySelector('#music-elapsed'),duration=document.querySelector('#music-duration'),progress=document.querySelector('#music-fill');
  document.querySelector('#music-title').textContent=config.title;
  document.querySelector('#music-artist').textContent=config.artist;
  audio.preload='metadata';audio.loop=Boolean(config.loop);audio.volume=Math.max(0,Math.min(1,config.volume??.45));
  let attempting=false,failed=false,autoplayBlocked=false,automaticStartPending=!opening&&Boolean(config.autoplay);
  const time=seconds=>Number.isFinite(seconds)?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`:'—:—';
  function updateProgress(){elapsed.textContent=time(audio.currentTime);duration.textContent=time(audio.duration);progress.style.transform=`scaleX(${audio.duration?audio.currentTime/audio.duration:0})`;}
  function updateState(){
    const playing=!audio.paused&&!audio.ended;
    player.classList.toggle('music-playing',playing);
    toggle.setAttribute('aria-label',playing?'Pause lagu':'Putar lagu');
    if(!failed)status.textContent=playing?'nemenin baca, pelan-pelan ♡':autoplayBlocked&&automaticStartPending?'ketuk atau swipe bukunya, lagu ikut mulai ♡':autoplayBlocked?'ketuk play buat mulai lagunya ♡':'lagunya lagi dijeda';
  }
  function unavailable(){failed=true;attempting=false;player.classList.remove('music-playing');status.textContent='lagunya belum kebuka, coba lagi yaa';toggle.setAttribute('aria-label','Coba putar lagu lagi');}
  async function play(){
    if(attempting)return;attempting=true;
    try{
      if(failed){failed=false;audio.load();}
      await audio.play();automaticStartPending=false;autoplayBlocked=false;updateState();
    }catch(error){
      if(error.name==='NotAllowedError'){autoplayBlocked=true;updateState();}
      else if(error.name!=='AbortError')unavailable();
    }finally{attempting=false;}
  }
  toggle.addEventListener('click',()=>{
    automaticStartPending=false;
    resumeAfterVideo=false;
    if(!audio.getAttribute('src'))audio.src=config.src;
    if(audio.paused)play();else audio.pause();
  });
  audio.addEventListener('play',()=>{automaticStartPending=false;autoplayBlocked=false;failed=false;updateState();});
  audio.addEventListener('pause',updateState);audio.addEventListener('ended',updateState);
  audio.addEventListener('timeupdate',updateProgress);audio.addEventListener('loadedmetadata',updateProgress);
  audio.addEventListener('error',unavailable);
  // Videos with sound temporarily pause the music; a user's own pause stays paused.
  let resumeAfterVideo=false;
  document.addEventListener('play',event=>{
    if(event.target.tagName!=='VIDEO'||event.target.muted)return;
    if(!audio.paused){resumeAfterVideo=true;audio.pause();}
  },true);
  function maybeResume(){if(!resumeAfterVideo||Array.from(document.querySelectorAll('video')).some(v=>!v.paused&&!v.muted))return;resumeAfterVideo=false;play();}
  document.addEventListener('pause',event=>{if(event.target.tagName==='VIDEO')maybeResume();},true);
  document.addEventListener('ended',event=>{if(event.target.tagName==='VIDEO')maybeResume();},true);
  // Call play directly inside the trusted gesture, without awaiting a fetch first.
  // This is Safari/mobile's supported fallback when opening autoplay is denied.
  function startOnGesture(event){
    if(!event.isTrusted||!automaticStartPending||failed||attempting)return;
    if(event.target.closest?.('#music-toggle')||event.target.tagName==='VIDEO')return;
    if(event.type==='keydown'&&(event.ctrlKey||event.metaKey||event.altKey||!['Enter',' ','ArrowLeft','ArrowRight'].includes(event.key)))return;
    if(Array.from(document.querySelectorAll('video')).some(v=>!v.paused&&!v.muted))return;
    if(!audio.getAttribute('src'))audio.src=config.src;
    play();
  }
  for(const type of ['pointerup','touchend','click','keydown'])document.addEventListener(type,startOnGesture,true);
  // No file yet: render the player without requesting a nonexistent MP3.
  // HEAD keeps the missing-file state friendly and avoids an audio decode error.
  async function initialize(){
    if(location.protocol!=='file:'){
      try{const response=await fetch(config.src,{method:'HEAD'});if(audio.getAttribute('src'))return;if(!response.ok){failed=true;status.textContent='lagunya menyusul yaa ♡';return;}}
      catch{if(audio.getAttribute('src'))return;failed=true;status.textContent='lagunya menyusul yaa ♡';return;}
    }
    audio.src=config.src;audio.load();
    if(config.autoplay&&giftOpened)play();else{autoplayBlocked=true;updateState();}
  }
  if(opening){
    const text=window.NAILONG_THEME?.opening||{eyebrow:'DARI PUZUKUZUW',title:'helow mizukuzuw ♡',text:'ada sesuatu buat mizukuzuw, dibuka dulu yaa.',button:'buka duluw ♡'};
    for(const [id,key] of [['gift-eyebrow','eyebrow'],['gift-title','title'],['gift-description','text'],['open-gift','button']])document.getElementById(id).textContent=text[key];
    opening.addEventListener('cancel',event=>event.preventDefault());
    document.getElementById('open-gift').addEventListener('click',()=>{
      if(giftOpened)return;giftOpened=true;automaticStartPending=false;
      if(!audio.getAttribute('src'))audio.src=config.src;
      // Same direct click -> play pattern as hbd-miskasw's handleOpenGift.
      // Do not await loading, an animation, or any network request before play().
      play();
      opening.close();document.body.classList.remove('gift-pending');
      document.getElementById('home').focus({preventScroll:true});
      // Unlocking page scroll may change the usable width on desktop browsers.
      window.dispatchEvent?.(new Event('resize'));
    });
    opening.showModal();
  }
  initialize();
})();
