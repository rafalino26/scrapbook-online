const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

async function setup({exists=true,blocked=false,autoplay=true,hasOpening=false}={}){
  const elements=new Map(),documentHandlers=new Map();
  function element(id){
    if(!elements.has(id)){
      const handlers=new Map(),attrs=new Map(),classes=new Set();
      elements.set(id,{textContent:'',style:{},tagName:id==='#background-music'?'AUDIO':'DIV',
        classList:{toggle(c,on){on?classes.add(c):classes.delete(c);},contains:c=>classes.has(c),remove:c=>classes.delete(c)},
        addEventListener(type,fn){const list=handlers.get(type)||[];list.push(fn);handlers.set(type,list);},
        emit(type){for(const fn of handlers.get(type)||[])fn({target:this});},
        setAttribute:(k,v)=>attrs.set(k,v),getAttribute:k=>attrs.get(k)||null,
        set src(v){attrs.set('src',v)},get src(){return attrs.get('src')},
        paused:true,ended:false,currentTime:0,duration:NaN,loads:0,calls:0,
        load(){this.loads++;},
        async play(){this.calls++;if(blocked)throw Object.assign(new Error('blocked'),{name:'NotAllowedError'});this.paused=false;this.emit('play');},
        pause(){this.paused=true;this.emit('pause');}
        ,showModal(){this.open=true;},close(){this.open=false;},focus(){}
      });
    }return elements.get(id);
  }
  const document={querySelector:id=>id==='#gift-opening'&&!hasOpening?null:element(id),getElementById:id=>element('#'+id),body:element('body'),querySelectorAll:()=>[],addEventListener(type,fn){const list=documentHandlers.get(type)||[];list.push(fn);documentHandlers.set(type,list);}};
  const context={window:{SCRAPBOOK_MUSIC:{title:'BEAUTiFUL',artist:'Paul Partohap',src:'public/music/beautiful.mp3',autoplay,loop:true,volume:.45}},document,location:{protocol:'http:'},fetch:async()=>({ok:exists})};
  vm.runInNewContext(fs.readFileSync('music-player.js','utf8'),context);
  await new Promise(resolve=>setImmediate(resolve));
  return {element,documentHandlers,unblock:()=>{blocked=false;}};
}
test('successful autoplay shows pause; pause/resume works and retains position',async()=>{
  const s=await setup(),audio=s.element('#background-music'),button=s.element('#music-toggle');
  assert.equal(audio.paused,false);assert.equal(audio.volume,.45);assert.equal(audio.loop,true);assert.equal(button.getAttribute('aria-label'),'Pause lagu');
  audio.currentTime=27;button.emit('click');assert.equal(audio.paused,true);button.emit('click');await new Promise(resolve=>setImmediate(resolve));assert.equal(audio.paused,false);assert.equal(audio.currentTime,27);
});
test('blocked autoplay stays paused and requests a book gesture',async()=>{
  const s=await setup({blocked:true});assert.equal(s.element('#background-music').paused,true);assert.match(s.element('#music-status').textContent,/ketuk atau swipe/);assert.equal(s.element('#music-toggle').getAttribute('aria-label'),'Putar lagu');
});
test('first trusted swipe starts blocked music without using the play button',async()=>{
  const s=await setup({blocked:true});s.unblock();
  for(const fn of s.documentHandlers.get('pointerup'))fn({type:'pointerup',isTrusted:true,target:{tagName:'DIV'}});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(s.element('#background-music').paused,false);
});
test('a later tap does not restart a user-paused song',async()=>{
  const s=await setup();s.element('#music-toggle').emit('click');
  for(const fn of s.documentHandlers.get('click'))fn({type:'click',isTrusted:true,target:{tagName:'DIV'}});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(s.element('#background-music').paused,true);
});
test('play button is skipped by gesture fallback to avoid toggling twice',async()=>{
  const s=await setup({blocked:true});s.unblock();const audio=s.element('#background-music');
  for(const fn of s.documentHandlers.get('click'))fn({type:'click',isTrusted:true,target:{tagName:'BUTTON',closest:()=>true}});
  assert.equal(audio.calls,1);s.element('#music-toggle').emit('click');await new Promise(resolve=>setImmediate(resolve));assert.equal(audio.paused,false);
});
test('missing file is friendly and can be retried after the file is added',async()=>{
  const s=await setup({exists:false}),audio=s.element('#background-music');assert.equal(audio.getAttribute('src'),null);assert.equal(audio.calls,0);assert.match(s.element('#music-status').textContent,/menyusul/);
  s.element('#music-toggle').emit('click');await new Promise(resolve=>setImmediate(resolve));assert.equal(audio.src,'public/music/beautiful.mp3');assert.equal(audio.calls,1);assert.equal(audio.paused,false);
});
test('time and progress come from audio metadata',async()=>{
  const s=await setup(),audio=s.element('#background-music');audio.duration=212;audio.currentTime=106;audio.emit('loadedmetadata');audio.emit('timeupdate');
  assert.equal(s.element('#music-duration').textContent,'3:32');assert.equal(s.element('#music-elapsed').textContent,'1:46');assert.equal(s.element('#music-fill').style.transform,'scaleX(0.5)');
});
test('audio errors reset play state without leaving a fake pause button',async()=>{
  const s=await setup(),audio=s.element('#background-music');audio.emit('error');assert.equal(s.element('#music-player').classList.contains('music-playing'),false);assert.match(s.element('#music-toggle').getAttribute('aria-label'),/Coba/);
});
test('video temporarily pauses music and resumes it afterwards',async()=>{
  const s=await setup(),audio=s.element('#background-music'),video={tagName:'VIDEO',muted:false};
  for(const fn of s.documentHandlers.get('play'))fn({target:video});assert.equal(audio.paused,true);
  for(const fn of s.documentHandlers.get('pause'))fn({target:video});await new Promise(resolve=>setImmediate(resolve));assert.equal(audio.paused,false);
});
test('a user pause is preserved when a video ends',async()=>{
  const s=await setup(),audio=s.element('#background-music'),video={tagName:'VIDEO',muted:false};s.element('#music-toggle').emit('click');
  for(const fn of s.documentHandlers.get('play'))fn({target:video});for(const fn of s.documentHandlers.get('ended'))fn({target:video});await new Promise(resolve=>setImmediate(resolve));assert.equal(audio.paused,true);
});
test('opening gift calls play only from the open button and closes the introduction',async()=>{
  const s=await setup({hasOpening:true}),audio=s.element('#background-music'),opening=s.element('#gift-opening');
  assert.equal(audio.calls,0);assert.equal(opening.open,true);
  for(const fn of s.documentHandlers.get('click'))fn({type:'click',isTrusted:true,target:{tagName:'DIV'}});
  assert.equal(audio.calls,0);
  s.element('#open-gift').emit('click');
  assert.equal(audio.calls,1);assert.equal(opening.open,false);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(audio.paused,false);
});
