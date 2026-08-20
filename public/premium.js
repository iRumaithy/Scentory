(() => {
  function repairImage(img){
    if(img.dataset.premiumChecked) return;
    img.dataset.premiumChecked='1';
    img.addEventListener('error',()=>{
      const thumb=img.closest('.note-thumb');
      if(thumb){ img.remove(); thumb.classList.add('note-fallback'); return; }
      if(img.closest('.card-image,.detail-product,.similar-card')){
        img.style.opacity='.22';
        img.style.filter='grayscale(1)';
      }
    });
  }
  function scan(){
    document.querySelectorAll('.card-image img,.detail-product img,.similar-card img,.note-thumb img').forEach(repairImage);
  }
  const obs=new MutationObserver(scan);
  document.addEventListener('DOMContentLoaded',()=>{scan();obs.observe(document.body,{childList:true,subtree:true});});
})();
