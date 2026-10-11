// Horizontal swipes work anywhere on the book, including photo/video thumbnails.
// Pointer Events cover touch, mouse and pen; pan-y keeps vertical scrolling native.
function bindBookSwipe(stage, turn, now = () => Date.now()) {
  let gesture = null, suppressClickUntil = 0;
  const release = id => { if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id); };
  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary) {
      if (gesture) { const id = gesture.id; gesture = null; stage.classList.remove('swiping'); release(id); }
      return;
    }
    if (event.button !== 0) return;
    suppressClickUntil = 0;
    gesture = {id:event.pointerId, x:event.clientX, y:event.clientY, axis:null};
  });
  stage.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.axis && Math.max(Math.abs(dx),Math.abs(dy)) > 12) {
      if (Math.abs(dx) > Math.abs(dy)*1.25) {
        gesture.axis = 'horizontal';
        stage.setPointerCapture(event.pointerId);
        stage.classList.add('swiping');
      } else if (Math.abs(dy) > Math.abs(dx)*1.25) gesture.axis = 'vertical';
    }
    if (gesture.axis === 'horizontal' && event.cancelable) event.preventDefault();
  });
  stage.addEventListener('pointerup', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const current = gesture; gesture = null;
    stage.classList.remove('swiping'); release(event.pointerId);
    const dx = event.clientX-current.x, dy = event.clientY-current.y;
    const horizontal = current.axis !== 'vertical' && Math.abs(dx)>Math.abs(dy)*1.25;
    if (horizontal && Math.abs(dx)>12) suppressClickUntil = now()+450;
    const threshold = Math.min(40,Math.max(25,stage.clientWidth*.12));
    if (horizontal && Math.abs(dx)>=threshold) turn(dx<0?'next':'previous');
  });
  const cancel = event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    gesture = null; stage.classList.remove('swiping');
    release(event.pointerId);
  };
  stage.addEventListener('pointercancel',cancel);
  stage.addEventListener('lostpointercapture',cancel);
  stage.addEventListener('dragstart',event=>event.preventDefault());
  stage.addEventListener('click',event=>{
    if (event.detail !== 0 && now()<suppressClickUntil) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  },true);
}
if (typeof module !== 'undefined') module.exports = bindBookSwipe;
else window.bindBookSwipe = bindBookSwipe;
