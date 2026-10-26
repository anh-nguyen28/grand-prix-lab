import { PARTS } from '../../shared/content.js';
import { partArt } from './part-art.js';

// Pointer-based dragging works with a mouse, stylus or touch. Click/tap + a
// fitting-point button is the equivalent keyboard-accessible interaction.
export function createAssemblyInteraction({ onPick, onFit, getArmed, canFit }) {
  let drag = null, ghost = null, suppressClick = false;
  function clean() { ghost?.remove(); ghost=null; drag=null; document.body.classList.remove('dragging-part'); }
  document.addEventListener('pointerdown', event => {
    const part = event.target.closest('[data-action="pick-part"]');
    if(!part || part.disabled || event.button!==0) return;
    drag={id:part.dataset.id,x:event.clientX,y:event.clientY,pointer:event.pointerId,moved:false,origin:part};
  });
  document.addEventListener('pointermove', event => {
    if(!drag || event.pointerId!==drag.pointer) return;
    if(!drag.moved && Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8) return;
    if(!drag.moved){
      drag.moved=true;onPick(drag.id);document.body.classList.add('dragging-part');
      ghost=document.createElement('div');ghost.className='part-drag-ghost';ghost.innerHTML=partArt(drag.id);ghost.setAttribute('aria-hidden','true');document.body.append(ghost);
      drag.origin.setPointerCapture?.(event.pointerId);
    }
    event.preventDefault();ghost.style.transform=`translate(${event.clientX-75}px,${event.clientY-55}px)`;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-fit-slot]');
    document.querySelectorAll('[data-fit-slot]').forEach(item=>item.classList.toggle('drop-hover',item===target&&item.dataset.fitSlot===PARTS[drag.id].slot));
  },{passive:false});
  document.addEventListener('pointerup', event => {
    if(!drag || drag.pointer!==event.pointerId) return;
    if(drag.moved){
      const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-fit-slot]');
      if(target?.dataset.fitSlot===PARTS[drag.id].slot && canFit(drag.id)) onFit(drag.id);
      suppressClick=true;setTimeout(()=>suppressClick=false,0);
    }
    clean();document.querySelectorAll('.drop-hover').forEach(item=>item.classList.remove('drop-hover'));
  });
  document.addEventListener('pointercancel', clean);
  document.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();}},true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&getArmed()){clean();onPick(null);}});
  return { cancel:clean };
}
