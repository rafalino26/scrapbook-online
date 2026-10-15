(() => {
  'use strict';
  const config=window.NAILONG_THEME, make=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n;};
  function applyPose(img,index){
    const pose=config.poses[index%config.poses.length];img.src=pose.src;img.alt='';img.draggable=false;
    if(!img.dataset.fallbackBound){img.dataset.fallbackBound='true';img.addEventListener('error',()=>{img.src=config.fallback;},{once:true});}
  }
  function dinoImage(index=0){const img=make('img','');applyPose(img,index);img.width=70;img.height=76;return img;}
  document.querySelectorAll('.theme-heading img,.desk-decoration img,#desk-sticker img,.desk-dino>img').forEach((img,index)=>applyPose(img,[9,3,0,1,4,1][index]));
  document.querySelectorAll('.desk-buddy img').forEach((img,index)=>applyPose(img,[8,2][index]));
  document.querySelector('.desk-dino').dataset.pose='1';
  document.querySelectorAll('.desk-friend').forEach(button=>applyPose(button.querySelector('img'),Number(button.dataset.pose)));
  config.poses.forEach((pose,index)=>{
    const button=make('button','pose-picker');button.dataset.pose=String(index);button.setAttribute('aria-label',`Pilih ${pose.name}`);button.setAttribute('aria-pressed',String(index===1));button.append(dinoImage(index));
    const label=make('span','');label.textContent=pose.label;button.append(label);document.getElementById('pose-pickers').append(button);
  });
  window.SCRAPBOOK_THEME={
    decoratePage(page,index){
      const pose=((index+1)%config.poses.length+config.poses.length)%config.poses.length;
      const button=make('button','theme-dino page-dino');button.dataset.pose=String(pose);button.setAttribute('aria-label','Pencet nailongw di halaman untuk pesan kecil');button.append(dinoImage(pose));page.append(button);
      const doodle=make('span','page-doodle');doodle.setAttribute('aria-hidden','true');doodle.textContent=index%2 ? '✳ ♡' : '♡ ✳';page.append(doodle);
      if(!page.classList.contains('cover')){
        const friend=make('span','page-friend');friend.setAttribute('aria-hidden','true');friend.append(dinoImage((pose*3+3)%config.poses.length));page.append(friend);
        page.querySelectorAll('.polaroid').forEach((photo,photoIndex)=>{
          photoIndex=Number(photo.dataset.photoIndex??photoIndex);
          const corner=make('span','photo-friend');corner.setAttribute('aria-hidden','true');corner.append(dinoImage((pose*2+photoIndex*5+2)%config.poses.length));photo.append(corner);
          if(photoIndex%2===0){const mini=make('div','photo-dino-sticker');mini.setAttribute('aria-hidden','true');mini.append(dinoImage((pose*3+photoIndex+1)%config.poses.length));photo.append(mini);}
        });
        if(page.classList.contains('album-page')){const sticker=make('span','album-mascot');sticker.setAttribute('aria-hidden','true');sticker.append(dinoImage((index*4+9)%config.poses.length));page.querySelector('.album-canvas')?.append(sticker);}
        if(page.classList.contains('closing-page')){const ending=dinoImage(9);ending.className='closing-illustration';page.querySelector('.page-body')?.prepend(ending);}
      }
      if(config.pageAnimations!==false&&config.animatedFriends?.length){
        // Two moving stickers per leaf, mixed with the existing still artwork.
        // Album pages use the larger mascot instead of animating every photo.
        const footer=page.classList.contains('cover')||index%2===0?button.querySelector('img'):page.querySelector('.page-friend img');
        if(footer)animateImage(footer,page.classList.contains('cover')?0:(index*3+4)%config.animatedFriends.length,page);
        const accent=page.querySelector('.album-mascot img')||page.querySelector('.polaroid .photo-friend img');
        if(accent)animateImage(accent,(index*4+7)%config.animatedFriends.length,page);
      }
    },
    syncMotion(){refreshMotion();},
    resetPageMotion(){
      // PageFlip rebuilds leaves after resize. Release their old observers.
      for(let i=motions.length-1;i>=0;i--)if(motions[i].page){observer.unobserve(motions[i].img);motions.splice(i,1);}
    }
  };
  let messageIndex=0;
  const timers=new WeakMap();
  function celebrate(button,advance=true){
    const pose=(Number(button.dataset.pose||0)+(advance?1:0))%config.poses.length;
    if(!button.dataset.motion){button.dataset.pose=String(pose);applyPose(button.querySelector('img'),pose);}
    if(button.classList.contains('desk-dino'))document.querySelectorAll('.pose-picker').forEach(picker=>picker.setAttribute('aria-pressed',String(Number(picker.dataset.pose)===pose)));
    const output=document.getElementById('dino-message');
    output.textContent=config.messages[messageIndex++%config.messages.length];
    button.classList.remove('wiggle');void button.offsetWidth;button.classList.add('wiggle');
    let bubble=button.querySelector('.dino-bubble');
    if(!bubble){bubble=make('span','dino-bubble');button.append(bubble);}
    bubble.textContent=output.textContent;
    // A bounded burst, removed after each interaction. No idle animation or canvas.
    button.querySelector('.heart-burst')?.remove();
    const burst=make('span','heart-burst');burst.setAttribute('aria-hidden','true');
    for(let i=0;i<4;i++){const heart=make('i','');heart.textContent=i%2?'✦':'♡';heart.style.setProperty('--i',i);burst.append(heart);}
    button.append(burst);
    clearTimeout(timers.get(button));timers.set(button,setTimeout(()=>{button.classList.remove('wiggle');bubble.remove();burst.remove();timers.delete(button);},2400));
  }
  document.addEventListener('click',event=>{
    const picker=event.target.closest('.pose-picker');
    if(picker){const dino=document.querySelector('.desk-dino');dino.dataset.pose=picker.dataset.pose;celebrate(dino,false);return;}
    const button=event.target.closest('.theme-dino');if(button)celebrate(button);
  });
  const sticker=document.getElementById('desk-sticker');let drag=null,x=0,y=0;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const move=(nextX,nextY)=>{x=clamp(nextX,-10,20);y=clamp(nextY,-18,18);sticker.style.translate=`${x}px ${y}px`;};
  sticker.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0)return;drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x,y};sticker.setPointerCapture(e.pointerId);sticker.classList.add('dragging');
  });
  sticker.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id)move(drag.x+e.clientX-drag.startX,drag.y+e.clientY-drag.startY);});
  const end=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;sticker.classList.remove('dragging');if(sticker.hasPointerCapture(e.pointerId))sticker.releasePointerCapture(e.pointerId);};
  sticker.addEventListener('pointerup',end);sticker.addEventListener('pointercancel',end);sticker.addEventListener('lostpointercapture',end);
  sticker.addEventListener('keydown',e=>{const directions={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]};if(directions[e.key]){e.preventDefault();e.stopPropagation();const [dx,dy]=directions[e.key];move(x+dx,y+dy);}if(e.key==='Home'){e.preventDefault();e.stopPropagation();move(0,0);}});

  // Real animated stickers: only decode GIFs while visible and the gift is open.
  // Swapping to a still also respects reduced motion (CSS cannot pause a GIF).
  const friends=config.animatedFriends||[];
  if(!friends.length)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), motions=[];
  let motionPaused=false;
  const isOpen=()=>!document.hidden&&!document.body.classList.contains('gift-pending');
  function updateMotion(item){
    const pageActive=!item.page||(!item.page.inert&&!item.page.closest('.book')?.inert&&!document.getElementById('stage').classList.contains('turning')&&!document.querySelector('dialog[open]'));
    const playing=item.visible&&pageActive&&isOpen()&&!reduced.matches&&!motionPaused;
    const src=playing?item.gif:item.still;
    if(item.img.getAttribute('src')!==src)item.img.src=src;
  }
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){const item=motions.find(item=>item.img===entry.target);if(item){item.visible=entry.isIntersecting;updateMotion(item);}}
  });
  function animateImage(img,index,page=null){
    const friend=friends[index%friends.length],base=`public/nailong/animated/${friend.file}`;
    const item={img,gif:`${base}.gif`,still:`${base}-still.webp`,visible:false,page};
    motions.push(item);img.src=item.still;img.draggable=false;img.classList.add('live-nailong');
    img.closest('button')?.setAttribute('data-motion','true');
    img.addEventListener('error',()=>{item.gif=item.still;img.src=item.still;},{once:true});
    observer.observe(img);
  }
  const deskSlots=['.decoration-left img','.decoration-right img','.buddy-left img','.buddy-right img','.friend-left img','.friend-right img'];
  deskSlots.forEach((selector,index)=>{const img=document.querySelector(selector);if(img)animateImage(img,[7,4,10,3,0,8][index]);});

  const parade=make('div','nailong-parade');parade.setAttribute('aria-label','Nailongww nemenin baca');
  [6,5,0,7,9].forEach(index=>{
    const button=make('button','theme-dino animated-pal');button.type='button';button.setAttribute('aria-label',`Pencet Nailong ${friends[index%friends.length].name}`);
    const img=make('img','');img.alt='';img.width=86;img.height=86;button.append(img);parade.append(button);animateImage(img,index);
  });
  document.querySelector('.reader-controls').after(parade);

  const collection=make('section','animated-collection');collection.setAttribute('aria-label','Koleksi Nailong bergerak');
  const heading=make('p','');heading.textContent='nailongww juga mau ikutan hiheww ♡';
  const toggle=make('button','motion-toggle');toggle.type='button';toggle.setAttribute('aria-pressed','false');
  const grid=make('div','animated-grid');
  friends.forEach((friend,index)=>{
    const button=make('button','theme-dino animated-card');button.type='button';button.setAttribute('aria-label',`Pencet Nailong ${friend.name}`);
    const img=make('img','');img.alt='';img.width=90;img.height=90;button.append(img);
    const label=make('span','animated-label');label.textContent=friend.name;button.append(label);grid.append(button);animateImage(img,index);
  });
  function refreshMotion(){motions.forEach(updateMotion);toggle.textContent=reduced.matches?'gerakan dikurangi ♡':motionPaused?'gerakin lagiw ▷':'istirahat duluw Ⅱ';toggle.disabled=reduced.matches;toggle.setAttribute('aria-pressed',String(motionPaused||reduced.matches));}
  toggle.addEventListener('click',()=>{motionPaused=!motionPaused;refreshMotion();});
  collection.append(heading,toggle,grid);document.querySelector('.sticker-collection').before(collection);
  document.addEventListener('visibilitychange',refreshMotion);reduced.addEventListener('change',refreshMotion);
  new MutationObserver(refreshMotion).observe(document.body,{attributes:true,attributeFilter:['class']});
  refreshMotion();
})();
