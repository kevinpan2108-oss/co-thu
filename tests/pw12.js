const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch(); const errs=[];
  const ctx=await b.newContext({viewport:{width:390,height:800}}); const p=await ctx.newPage();
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+require('path').join(__dirname,'..','dist','game_local.html')); await p.waitForTimeout(500); await p.click('#menu-single'); await p.waitForTimeout(300);
  await p.click('#draft-go'); await p.waitForTimeout(700);
  const ev=(fn,arg)=>p.evaluate(([src,a])=>window.__E('('+src+')')(a),[fn.toString(),arg]);
  // mobile overflow
  console.log('overflowX',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  // random bot plays human side through real UI functions
  let moves=0, bonuses=0;
  for(let g=0;g<3;g++){
    await ev(()=>{newGame&&0;});
    for(let i=0;i<260;i++){
      const r=await ev(()=>{
        if(over) return 'over';
        if(thinking) return 'wait';
        if(!humanTurn()) return 'wait';
        if(bonus){ const ms=bonus.steps; if(ms.length&&Math.random()<.6){const m=ms[(Math.random()*ms.length)|0]; applyBonusStep(m&127,(m>>7)&127); return 'bonus';} else if(bonus.skipOK){skipBonus();return 'skip';} else {const m=ms[0];applyBonusStep(m&127,(m>>7)&127);return 'bonus';} }
        const ms=genMoves(cells,1).filter(m=>!repBannedM(m,1)); if(!ms.length) return 'wait';
        const m=ms[(Math.random()*ms.length)|0]; applyMove(m&127,(m>>7)&127,(m>>14)&15,null); return 'mv';
      });
      if(r==='over')break; if(r==='mv')moves++; if(r==='bonus')bonuses++;
      await p.waitForTimeout(r==='wait'?400:60);
    }
    console.log('game',g,'moves',moves,'bonuses',bonuses,'over',await ev(()=>over), await ev(()=>resultEl.hidden?'':$('res-title').textContent));
    await p.click('#btn-new').catch(()=>{}); await p.waitForTimeout(400);
    await p.click('#draft-go').catch(()=>{}); await p.waitForTimeout(600);
  }
  // reload keeps stats
  const w=await ev(()=>[wins,losses]); await p.reload(); await p.waitForTimeout(600);
  const ls=await p.evaluate(()=>[localStorage.getItem('cothu:w'),localStorage.getItem('cothu:l')]);
  console.log('stats before',w,'ls',ls);
  await p.click('#draft-go').catch(()=>{}); await p.waitForTimeout(600);
  await p.screenshot({path:'mobile.png'});
  console.log('errors',errs);
  await b.close();
})();
