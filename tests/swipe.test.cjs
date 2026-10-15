const test = require('node:test');
const assert = require('node:assert/strict');
const bindBookSwipe = require('../swipe.js');

function setup(width = 350) {
  const handlers = new Map(), captures = new Set(), classes = new Set(), turns = [];
  let time = 1000;
  const stage = {
    clientWidth: width,
    classList: {add:v=>classes.add(v),remove:v=>classes.delete(v)},
    addEventListener(type,fn) { const list=handlers.get(type)||[]; list.push(fn); handlers.set(type,list); },
    setPointerCapture:id=>captures.add(id),
    hasPointerCapture:id=>captures.has(id),
    releasePointerCapture:id=>captures.delete(id)
  };
  bindBookSwipe(stage,direction=>turns.push(direction),()=>time);
  const emit = (type,props={}) => {
    const event={target:stage,pointerId:1,isPrimary:true,button:0,clientX:200,clientY:200,cancelable:true,detail:1,
      defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;},...props};
    for(const fn of handlers.get(type)||[]) { fn(event); if(event.stopped)break; }
    return event;
  };
  const swipe = (from,to,dy=0) => {
    emit('pointerdown',{clientX:from});
    emit('pointermove',{clientX:to,clientY:200+dy});
    return emit('pointerup',{clientX:to,clientY:200+dy});
  };
  return {emit,swipe,turns,classes,captures,advance:ms=>time+=ms};
}

test('left then right swipe works repeatedly, including slow gestures',()=>{
  const s=setup();
  s.swipe(280,70);s.advance(2000);s.swipe(70,280);s.swipe(280,70);s.swipe(70,280);
  assert.deepEqual(s.turns,['next','previous','next','previous']);
  assert.equal(s.captures.size,0);assert.equal(s.classes.size,0);
});
test('vertical scroll and small movements do not turn a page',()=>{
  const s=setup();
  s.swipe(200,205,100);s.swipe(200,219);s.swipe(200,180,-90);
  assert.deepEqual(s.turns,[]);
});
test('swipe over media suppresses accidental click; next tap and keyboard click still work',()=>{
  const s=setup();s.swipe(280,70);
  assert.equal(s.emit('click').stopped,true);
  assert.equal(s.emit('click',{detail:0}).stopped,false);
  s.emit('pointerdown');s.emit('pointerup');
  assert.equal(s.emit('click').stopped,false);
});
test('canceled touch and multitouch do not flip or leave capture stuck',()=>{
  const s=setup();s.emit('pointerdown');s.emit('pointermove',{clientX:70});
  s.emit('pointercancel');s.emit('pointerup',{clientX:70});
  s.emit('pointerdown');s.emit('pointermove',{clientX:70});
  s.emit('pointerdown',{pointerId:2,isPrimary:false});s.emit('pointerup',{clientX:70});
  assert.deepEqual(s.turns,[]);assert.equal(s.captures.size,0);assert.equal(s.classes.size,0);
  s.swipe(70,280);assert.deepEqual(s.turns,['previous']);
});
test('vertical scroll keeps its direction even when the finger drifts sideways',()=>{
  const s=setup();s.emit('pointerdown');s.emit('pointermove',{clientY:250});
  s.emit('pointerup',{clientX:60,clientY:250});assert.deepEqual(s.turns,[]);
});
test('right clicks are ignored and narrow screens accept a comfortable swipe',()=>{
  const s=setup(280);s.emit('pointerdown',{button:2});s.emit('pointerup',{clientX:50});
  assert.deepEqual(s.turns,[]);s.swipe(160,125);assert.deepEqual(s.turns,['next']);
});

test('touch capture transferred from a photo to the stage does not cancel the swipe',()=>{
  const s=setup(),photo={tagName:'BUTTON'};
  // Touch browsers implicitly capture on the initial child. Transferring that
  // capture to stage emits a bubbling lostpointercapture from the child.
  for(const [from,to] of [[280,70],[70,280]]){
    s.emit('pointerdown',{pointerType:'touch',target:photo,clientX:from});
    s.emit('pointermove',{pointerType:'touch',target:photo,clientX:to});
    s.emit('lostpointercapture',{pointerType:'touch',target:photo});
    s.emit('pointerup',{pointerType:'touch',clientX:to});
  }
  assert.deepEqual(s.turns,['next','previous']);
  assert.equal(s.captures.size,0);assert.equal(s.classes.size,0);
});

test('losing capture on the stage itself still cancels safely',()=>{
  const s=setup();
  s.emit('pointerdown',{pointerType:'touch'});
  s.emit('pointermove',{pointerType:'touch',clientX:70});
  s.emit('lostpointercapture',{pointerType:'touch'});
  s.emit('pointerup',{pointerType:'touch',clientX:70});
  assert.deepEqual(s.turns,[]);
  s.swipe(70,280);assert.deepEqual(s.turns,['previous']);
});
