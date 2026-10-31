/* Kiem thu tinh theo nhom quan tren ban do bui E4/E6 (va doi chieu ban cu I4/I6, co/khong lach cheo).
   1 quan cua ta trong o bui + 1 quan dich o moi o co the; chi xet cac the quan ta DANG BI DOA (dich co nuoc an ngay).
   node bush_groups.js [json]  -> in bang theo nhom; exit 1 neu mot kiem tra bat bien that bai. */
const fs=require('fs'),path=require('path');
const SRC=fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8');
const BASE=process.env.BASE_ENGINE?fs.readFileSync(process.env.BASE_ENGINE,'utf8'):null;
const mk=(code,noslip)=>new Function((noslip?code.replace("if(!CLASSIC&&!lock&&BUSH[i]){","if(false&&BUSH[i]){"):code)+';return makeEngine();')();
const GROUPS={
 'Voi':[['ele',8,0]], 'Cao':[['fox',2,1]], 'Meo':[['cat',2,0]], 'Khi':[['mon',9,1]],
 'Quan thap (Chuot,Soi,Lon,Cho,Gau)':[['rat',1,0],['wolf',3,0],['boar',3,1],['dog',4,0],['bear',4,1]]};
const ENEMY=[['rat',1,0],['cat',2,0],['fox',2,1],['wolf',3,0],['boar',3,1],['dog',4,0],['bear',4,1],['leo',5,0],['croc',5,1],['tig',6,0],['eagle',6,1],['lio',7,0],['bison',7,1],['ele',8,0],['mon',9,1],['tur',9,2]];
let hardFail=0;const inv=(n,c)=>{if(!c){hardFail++;console.log('FAIL',n);}};
function run(code,noslip){
  const E=mk(code,noslip);const {N,ST,COLS,ROWS,BUSH,WATER,ROCK,DEN}=E;E.setClassic(false);
  const bush=[];for(let i=0;i<N;i++)if(BUSH[i])bush.push(i);
  const setSq=(sgn,mine,en)=>{const a=Array(10).fill(0),b=Array(10).fill(0);const m=sgn>0?a:b,e=sgn>0?b:a;m[mine[1]]=mine[2];e[en[1]]=en[2];E.SQ[0]=a;E.SQ[1]=b;E.setKeys();};
  const kills=(c,es,tr,val)=>E.genMoves(c,es).some(m=>{const cc=Int8Array.from(c);E.commitM(cc,m);return cc[tr]!==val;});
  const find=(c,val)=>{for(let i=0;i<N;i++)if(c[i]===val)return i;return -1;};
  // song duoc k luot dich: ta di truoc
  function surv(c,my,tr,val,k){
    if(k===0)return true;
    const es=-my, mv=E.genMoves(c,my).filter(m=>(m&127)===tr);
    const opts=mv.length?mv:[null];
    return opts.some(m=>{const a=Int8Array.from(c);let t=tr;if(m!==null){E.commitM(a,m);t=find(a,val);if(t<0)return false;}
      const em=E.genMoves(a,es);
      return em.every(x=>{const b=Int8Array.from(a);E.commitM(b,x);if(b[t]!==val)return false; if(E.DEN[(x>>7)&127]===my&&((x>>14)&15)===0)return true; return surv(b,my,t,val,k-1);});});
  }
  const R={};
  for(const mode of ['mo','ke'])for(const g in GROUPS){
    const S={cases:0,escAny:0,escSlipOnly:0,surv1:0,surv2:0,rethreatPairs:0,escPairs:0,rethreatPos:0,escPos:0,enterOK:0,enterTot:0,slipTargets:0,slipCap:0,posSlipHas:0};
    for(const mine of GROUPS[g])for(const sgn of [1,-1]){
      const val=sgn*mine[1];
      for(const b of bush)for(const en of ENEMY){
        setSq(sgn,mine,en);
        for(let e=0;e<N;e++){
          if(e===b||ROCK[e]||DEN[e])continue;
          const c=new Int8Array(N+ST);c[b]=val;
          if(mode==='ke'){for(const x of [b-COLS,b+COLS,b-1,b+1]){if(x<0||x>=N||Math.abs((x%COLS)-(b%COLS))+Math.abs((x/COLS|0)-(b/COLS|0))!==1||WATER[x]||ROCK[x]||DEN[x])continue;c[x]=sgn;}}
          if(c[e]!==0)continue; const eval_=-sgn*en[1];c[e]=eval_;
          if(!kills(c,-sgn,b,val))continue; // chi the dang bi doa
          S.cases++;
          const mv=E.genMoves(c,sgn).filter(m=>(m&127)===b);
          const slips=mv.filter(m=>((m>>14)&15)===10);S.slipTargets+=slips.length;
          if(slips.length)S.posSlipHas++;
          slips.forEach(m=>{const a=Int8Array.from(c);E.commitM(a,m);if(find(a,val)<0||c[(m>>7)&127]!==0){S.slipCap++;}});
          const escapes=mv.filter(m=>{const a=Int8Array.from(c);E.commitM(a,m);const t=find(a,val);return t>=0&&!kills(a,-sgn,t,val);});
          if(escapes.length)S.escAny++;
          if(escapes.some(m=>((m>>14)&15)===10)&&!escapes.some(m=>((m>>14)&15)!==10))S.escSlipOnly++;
          if(surv(c,sgn,b,val,1))S.surv1++; if(surv(c,sgn,b,val,2))S.surv2++;
          // bi doa lai: voi tung nuoc thoat bang lach (hoac nuoc bat ky neu khong co lach), dich co the dua quan ta vao the bi doa lai?
          const esc=escapes;
          if(esc.length){S.escPos++;let allRe=true;
            esc.forEach(m=>{const a=Int8Array.from(c);E.commitM(a,m);const t=find(a,val);
              const re=E.genMoves(a,-sgn).some(x=>{const bb=Int8Array.from(a);E.commitM(bb,x);const tt=find(bb,val);return tt>=0&&kills(bb,-sgn,tt,val);});
              S.escPairs++;if(re)S.rethreatPairs++;else allRe=false;});
            if(allRe)S.rethreatPos++;}
        }
      }
      if(mode==='mo'){
      // kha nang vao bui: quan dung ke o bui (di thang) co nuoc buoc vao khong
      setSq(sgn,mine,ENEMY[0]);
      for(const b of bush){for(let d=0;d<4;d++){const n=E.genMoves(new Int8Array(N+ST).fill(0),sgn);} 
        const nb=[b-COLS,b+COLS,b-1,b+1].filter(x=>x>=0&&x<N&&!WATER[x]&&!ROCK[x]&&!DEN[x]&&Math.abs(((x%COLS)-(b%COLS)))+Math.abs(((x/COLS|0)-(b/COLS|0)))===1);
        for(const x of nb){const c=new Int8Array(N+ST);c[x]=val;S.enterTot++;if(E.genMoves(c,sgn).some(m=>(m&127)===x&&((m>>7)&127)===b))S.enterOK++;}}
      }
    }
    R[(mode==='ke'?'[ke] ':'')+g]=S;
  }
  // bat bien luat
  R._bush=bush.length;
  return R;
}
const out={};
const configs=[['new_slip',SRC,false],['new_noslip',SRC,true]];
if(BASE){configs.push(['old_slip',BASE,false],['old_noslip',BASE,true]);}
const t0=Date.now();
for(const [n,code,ns] of configs){out[n]=run(code,ns);}
for(const n in out){const R=out[n];console.log('\n== '+n+' ('+R._bush+' o bui)');
  for(const g in R){if(g[0]==='_')continue;const S=R[g];const p=(a,b)=>b?Math.round(100*a/b)+'%':'-';
    console.log(g.padEnd(36),'ca bi doa',S.cases,'| vao bui',p(S.enterOK,S.enterTot),'| co lach',p(S.posSlipHas,S.cases),'| thoat duoc',p(S.escAny,S.cases),'(chi nho lach '+p(S.escSlipOnly,S.cases)+')','| song 1 luot',p(S.surv1,S.cases),'| song 2 luot',p(S.surv2,S.cases),'| bi doa lai',p(S.rethreatPairs,S.escPairs),'(moi nuoc thoat deu bi doa lai '+p(S.rethreatPos,S.escPos)+')','| lach an quan/vao o co quan',S.slipCap);}}
for(const g in out.new_slip){if(g[0]==='_')continue;inv('lach khong an quan: '+g,out.new_slip[g].slipCap===0);inv('khong lach khi tat: '+g,out.new_noslip[g].posSlipHas===0);inv('luon co the vao bui: '+g,g.startsWith('[ke]')||out.new_slip[g].enterOK===out.new_slip[g].enterTot);}
console.log('\nthoi gian',((Date.now()-t0)/1000|0)+'s','loi bat bien:',hardFail);
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));
process.exit(hardFail?1:0);
