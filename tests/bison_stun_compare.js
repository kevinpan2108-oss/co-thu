/* Paired-seed experiment: Bison Huc stuns target only vs target + Bison.
   The production engine is read-only. This test builds an in-memory experimental engine
   with identical Huc/cooldown rules for both variants, changing only stun duration/recipient.
   Usage: node tests/bison_stun_compare.js [seedPairs=20] [ms=20] [seed=2026102907] [plyCap=120]
*/
const fs = require('fs');
const path = require('path');
const originalSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
const originalRandom = Math.random;

function replaceOnce(source, from, to, label) {
  const first = source.indexOf(from);
  if (first < 0 || source.indexOf(from, first + from.length) >= 0) {
    throw new Error('Expected exactly one source match for: ' + label);
  }
  return source.slice(0, first) + to + source.slice(first + from.length);
}
function replaceRegexOnce(source, pattern, to, label) {
  const matches = source.match(new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g'));
  if (!matches || matches.length !== 1) {
    throw new Error('Expected exactly one regex match for: ' + label + '; found ' + (matches ? matches.length : 0));
  }
  return source.replace(pattern, to);
}
function makeExperimentalEngine() {
  let source = originalSource;
  source = replaceRegexOnce(source, /var SL=N, ST=\d+, OUTCD=2, BONUS=true;/,
    'var SL=N, ST=14, OUTCD=2, BONUS=true;', 'state slots');
  source = replaceOnce(source, 'var CLASSIC=false, TERR=true;',
    'var BISON_STUN_MODE=[0,0];\nvar CLASSIC=false, TERR=true;', 'stun-mode configuration');

  const hucHelper = [
    '/* Experimental Huc legality, matching the Bison independent-cooldown branch. */',
    'function pushOK(cells,s,t2,b){',
    '  var v=cells[t2], k;',
    '  if(v*s>=0||isTur(v)||WATER[t2]||DEN[t2]||inW(cells,t2)) return false;',
    '  if(b<0||cells[b]!==0||WATER[b]||DEN[b]) return false;',
    '  k=HK[v+9];',
    "  if(TERR&&MARSH[b]&&(k===\'rat\'||k===\'croc\')) return false;",
    '  return stepOK(cells,t2,b,0);',
    '}',
    ''
  ].join('\n');
  const kindMarker = '/* kind: 0 buoc, 1 nhay ho';
  if (source.indexOf(kindMarker) < 0 || source.indexOf(kindMarker, source.indexOf(kindMarker) + 1) >= 0) {
    throw new Error('Could not uniquely find move-kind marker');
  }
  source = source.replace(kindMarker, hucHelper + kindMarker);

  const bisonStart = source.indexOf("    }else if(K==='bison'){");
  const monkeyStart = source.indexOf("    }else if(K==='mon'){", bisonStart);
  if (bisonStart < 0 || monkeyStart < 0) throw new Error('Could not find Bison move-generation block');
  const bisonBlock = [
    "    }else if(K==='bison'){",
    '      /* Lao captures normally; Huc is only for a target Bison cannot eat. */',
    '      if(cells[t]===0&&!DEN[t]&&!BUSH[t]&&!MARSH[t]){',
    '        t2=ADJ[t*4+d];',
    '        if(t2>=0&&!WATER[t2]&&!DEN[t2]){',
    '          if(cells[SL+4+a]===0&&stepOK(cells,i,t2,0)) out.push(i|(t2<<7)|(8<<14));',
    '          if(cells[SL+10+a]===0&&!stepOK(cells,i,t2,0)&&pushOK(cells,s,t2,ADJ[t2*4+d])) out.push(i|(t2<<7)|(9<<14));',
    '        }',
    '      }'
  ].join('\n');
  source = source.slice(0, bisonStart) + bisonBlock + source.slice(monkeyStart);

  source = replaceOnce(source,
    'function movesFrom(cells,i,out){\n  var code=cells[i]; if(code===0) return out;',
    'function movesFrom(cells,i,out){\n  var code=cells[i]; if(code===0 || cells[SL+12+(code>0?0:1)]===i+1) return out;',
    'stunned pieces cannot move');

  source = replaceOnce(source,
    '  if(cells[SL+6+a]>0) cells[SL+6+a]--;',
    '  if(cells[SL+6+a]>0) cells[SL+6+a]--;\n  if(cells[SL+10+a]>0) cells[SL+10+a]--;',
    'independent Huc cooldown tick');

  const bonusBlock = [
    '  if(bonus){',
    "    /* Buoc thuong van la mot nuoc di cua chinh quan di them; neu la Ho thi ket thuc hieu ung cu nhay. */",
    "    if(!CLASSIC&&HK[c+9]==='tig') cells[SL+a]=0;",
    '    cells[t]=c; cells[f]=0; return 0;',
    '  }'
  ].join('\n');
  source = replaceOnce(source, bonusBlock, bonusBlock, 'defer stun expiry until the entire move, including bonus step, completes');

  const makeStart = source.indexOf('function make(cells,f,t,k,bonus){');
  const makeEnd = source.indexOf('function unmake(cells,f,t,k,cap){', makeStart);
  if (makeStart < 0 || makeEnd < 0) throw new Error('Could not isolate make()');
  let makeBody = source.slice(makeStart, makeEnd);
  makeBody = replaceOnce(makeBody,
    'if(k===5){ cap=cells[t]; cells[t]=c; cells[f]=cap; }',
    'if(k===5){ cap=cells[t]; cells[t]=c; cells[f]=cap; if(cap!==0){var swapSide=cap>0?0:1;if(cells[SL+12+swapSide]===t+1) cells[SL+12+swapSide]=f+1;} }',
    'stun marker follows monkey-swapped piece');
  makeBody = replaceRegexOnce(makeBody, /else if\(k===9\)\{[^}]*\}/,
    'else if(k===9){ e=(f+t)>>1; d=dirOf(f,e); b=ADJ[t*4+d]; cells[b]=cells[t]; cells[t]=0; cells[e]=c; cells[f]=0; cells[SL+10+a]=2; var targetSide=cells[b]>0?0:1; if(BISON_STUN_MODE[a]>=1) cells[SL+12+targetSide]=b+1; if(BISON_STUN_MODE[a]>=2) cells[SL+12+a]=e+1; }',
    'Huc sets variant-specific stuns');
  makeBody = replaceOnce(makeBody,
    '  return cap;\n}\n',
    '  if(k!==5&&k!==9&&cap!==0){ var capturedSide=cap>0?0:1; if(cells[SL+12+capturedSide]===t+1) cells[SL+12+capturedSide]=0; }\n  return cap;\n}\n',
    'clear stun marker when stunned piece is captured');
  source = source.slice(0, makeStart) + makeBody + source.slice(makeEnd);

  /* Expire a prior stun after the whole compound move, not before its optional bonus step. */
  const originalMakeM = [
    'function makeM(cells,m){',
    '  var f=m&127,t=(m>>7)&127,k=(m>>14)&15,bf=(m>>18)&127,bt=(m>>25)&127,cap=make(cells,f,t,k),a;',
    '  if(bf!==bt){ a=cells[bf]>0?0:1; if(OUTCD>0) cells[SL+8+a]=OUTCD; make(cells,bf,bt,0,true); }',
    '  return cap;',
    '}'
  ].join('\n');
  const correctedMakeM = [
    'function makeM(cells,m){',
    '  var f=m&127,t=(m>>7)&127,k=(m>>14)&15,bf=(m>>18)&127,bt=(m>>25)&127,actor=cells[f],sideSlot=SL+12+(actor>0?0:1),oldStun=cells[sideSlot],cap=make(cells,f,t,k),a;',
    '  if(bf!==bt){ a=cells[bf]>0?0:1; if(OUTCD>0) cells[SL+8+a]=OUTCD; make(cells,bf,bt,0,true); }',
    '  if(oldStun) cells[sideSlot]=0;',
    '  if(k!==5&&k!==9&&cap!==0){ var capturedSide=cap>0?0:1; if(cells[SL+12+capturedSide]===t+1) cells[SL+12+capturedSide]=0; }',
    '  return cap;',
    '}'
  ].join('\n');
  source = replaceOnce(source, originalMakeM, correctedMakeM, 'expire stun only after completed move');


  source = source.replace(/new Int32Array\(ST\*4\)/g, 'new Int32Array(ST*(N+1))');
  if ((source.match(/new Int32Array\(ST\*\(N\+1\)\)/g) || []).length !== 2) {
    throw new Error('Could not expand state hash arrays');
  }
  source = replaceOnce(source,
    'for(i=0;i<ST*4;i++){ZS1[i]=rnd();ZS2[i]=rnd();}',
    'for(i=0;i<ST*(N+1);i++){ZS1[i]=rnd();ZS2[i]=rnd();}',
    'initialize full state hashes');
  source = replaceRegexOnce(source,
    /for\(j=0;j<ST;j\+\+\)\{\s*v=cells\[SL\+j\]&3;\s*if\(v\)\{\s*h1\^=ZS1\[j\*4\+v\];\s*h2\^=ZS2\[j\*4\+v\];\s*\}\s*\}/,
    'for(j=0;j<ST;j++){ v=cells[SL+j]; if(v){ h1^=ZS1[j*(N+1)+v]; h2^=ZS2[j*(N+1)+v]; } }',
    'hash full stun-square positions');
  source = replaceOnce(source,
    'isClassic:function(){return CLASSIC;},setClassic:setClassic',
    'isClassic:function(){return CLASSIC;},setBisonStunModes:function(p,m){BISON_STUN_MODE[0]=p|0;BISON_STUN_MODE[1]=(m===undefined?p:m)|0;},setClassic:setClassic',
    'expose per-side stun modes');
  return new Function(source + ';return makeEngine();')();
}

const E = makeExperimentalEngine();
const pairs = Math.max(1, +process.argv[2] || 20);
const ms = Math.max(1, +process.argv[3] || 20);
const initialSeed = (+process.argv[4] || 2026102907) >>> 0;
const plyCap = Math.max(1, +process.argv[5] || 120);
E.LEVELS[3].ms = ms;
E.setClassic(false);
E.setAI(true);
const {N,ROWS,COLS,DEN,TRAP,SL} = E;
const ZERO = [0,0,0,0,0,0,0,0,0,0];

function rng(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value,1664525)+1013904223)>>>0; return value/4294967296; };
}
function freshStats() {
  return {
    games:0, plusWins:0, minusWins:0, draws:0, totalPlies:0, avgPlies:0,
    endReasons:{}, hucs:0, hucsByRule1:0, hucsByRule2:0, hucsIntoOwnTrap:0,
    immediateDenThreatsPrevented:0, selfStunApplications:0
  };
}
function finish(st, winner, plies, reason, plusMode, minusMode) {
  st.games++; st.totalPlies += plies;
  st.endReasons[reason] = (st.endReasons[reason]||0)+1;
  if (winner===0) st.draws++;
  else {
    if (winner>0) st.plusWins++; else st.minusWins++;
    if (plusMode!==minusMode) {
      const winningMode = winner>0 ? plusMode : minusMode;
      if (winningMode===1) st.mode1Wins = (st.mode1Wins||0)+1;
      else st.mode2Wins = (st.mode2Wins||0)+1;
    }
  }
  return {winner,plies,reason};
}
function newSquad(master) {
  const squad=ZERO.slice();
  for(let r=2;r<=7;r++) squad[r]=master()<0.5?0:1;
  squad[5]=1;       // Crocodile available in every tested squad.
  squad[7]=1;       // Bison available for both sides in every tested game.
  squad[9]=master()<0.33?0:(master()<0.5?1:2);
  return squad;
}
function immediateDenWinExists(cells, targetIndex, targetSide) {
  const slot=SL+12+(targetSide>0?0:1);
  const saved=cells[slot];
  cells[slot]=0; // remove only the target's stun temporarily to test the counterfactual.
  const wins=E.genMoves(cells,targetSide).some(m =>
    (m&127)===targetIndex &&
    ((m>>14)&15)===0 &&
    DEN[(m>>7)&127]===-targetSide &&
    ((m>>18)&127)===((m>>25)&127)
  );
  cells[slot]=saved;
  return wins;
}
function play(squad, plusMode, minusMode, startSide, searchSeed, st) {
  E.setClassic(false);
  E.SQ[0]=squad.slice(); E.SQ[1]=squad.slice(); E.setKeys();
  E.setBisonStunModes(plusMode,minusMode);
  E.clearTT();
  Math.random=rng(searchSeed);
  const cells=E.initialCells();
  let side=startSide, plies=0;
  const history=[E.hashOf(cells,side)];
  while(plies<plyCap) {
    const moves=E.genMoves(cells,side);
    if(!moves.length) return finish(st,0,plies,'stalemate',plusMode,minusMode);
    const banned=moves.filter(m=>{
      const k=(m>>14)&15,t=(m>>7)&127;
      if(k===0&&DEN[t]===-side&&((m>>18)&127)===((m>>25)&127)) return false;
      const next=Int8Array.from(cells); E.commitM(next,m);
      const hash=E.hashOf(next,-side);
      return history.filter(h=>h===hash).length>=2;
    });
    if(banned.length===moves.length) return finish(st,0,plies,'repeat',plusMode,minusMode);
    const result=E.search(cells,side,3,history.slice(-14),banned);
    if(!result) return finish(st,0,plies,'null',plusMode,minusMode);

    if(result.k===9) {
      st.hucs++;
      const actorMode=side>0?plusMode:minusMode;
      if(actorMode===1) st.hucsByRule1++; else st.hucsByRule2++;
      if(actorMode>=2) st.selfStunApplications++;
    }
    E.commitM(cells,result.m);
    if(result.k===9) {
      const behind=result.t+((result.t-result.f)/2);
      const targetSide=cells[behind]>0?1:-1;
      if(TRAP[behind]===side) st.hucsIntoOwnTrap++;
      if(immediateDenWinExists(cells,behind,targetSide)) st.immediateDenThreatsPrevented++;
    }

    if(result.k===0 && DEN[result.t]===-side && result.bf===result.bt)
      return finish(st,side,plies+1,'den',plusMode,minusMode);
    const counts=E.counts(cells);
    if((side>0&&counts[1]===0)||(side<0&&counts[0]===0))
      return finish(st,side,plies+1,'wipe',plusMode,minusMode);
    side=-side; plies++; history.push(E.hashOf(cells,side));
  }
  return finish(st,0,plies,'cap',plusMode,minusMode);
}
function finalize(st) { st.avgPlies=st.games?+(st.totalPlies/st.games).toFixed(1):0; }
function checkStunSemantics(mode) {
  E.setClassic(false);
  E.SQ[0]=ZERO.slice(); E.SQ[1]=ZERO.slice();
  E.SQ[0][7]=1; E.SQ[1][7]=1; E.setKeys();
  E.setBisonStunModes(mode,mode); E.clearTT();
  const cells=new Int8Array(N+E.ST);
  const idx=(r,c)=>r*COLS+c;
  const bison=idx(4,4), target=idx(6,4), pushed=idx(7,4);
  cells[bison]=7; cells[target]=-8; cells[idx(6,6)]=2; cells[idx(1,1)]=-2;
  const huc=E.genMoves(cells,1).find(m=>(m&127)===bison&&((m>>7)&127)===target&&((m>>14)&15)===9);
  if(!huc) throw new Error('Sanity check failed: no legal Huc against uncapturable Elephant');
  E.commitM(cells,huc);
  if(cells[SL+13]!==pushed+1) throw new Error('Sanity check failed: pushed enemy was not marked stunned');
  if(mode===1 && cells[SL+12]!==0) throw new Error('Mode 1 incorrectly stuns Bison');
  if(mode===2 && cells[SL+12]!==((idx(5,4))+1)) throw new Error('Mode 2 did not stun Bison for its next own turn');
  if(E.genMoves(cells,-1).some(m=>(m&127)===pushed)) throw new Error('Sanity check failed: stunned target still has moves');
  if(!immediateDenWinExists(cells,pushed,-1)) throw new Error('Sanity check failed: test position should expose an immediate den win without stun');
  return {mode, targetStunned:true, bisonStunned:mode===2, immediateDenWinBlocked:true};
}

const sanity=[checkStunSemantics(1),checkStunSemantics(2)];
const out={
  design:'A = stunned target only; B = stunned target + Huc-performing Bison. Stun blocks that piece for its next own turn; other pieces remain playable.',
  seedPairs:pairs, ms, initialSeed, plyCap,
  sanity,
  selfPlay:{mode1:freshStats(),mode2:freshStats()},
  mixedCrossPlay:freshStats()
};
const started=Date.now();
try {
  const master=rng(initialSeed ^ 0x51a7e);
  for(let g=0;g<pairs;g++) {
    const squad=newSquad(master);
    const seedPlus=(initialSeed ^ Math.imul(g+1,0x9e3779b1) ^ 0xa341316c)>>>0;
    const seedMinus=(initialSeed ^ Math.imul(g+1,0x9e3779b1) ^ 0xc8013ea4)>>>0;
    for(const mode of [1,2]) {
      const st=mode===1?out.selfPlay.mode1:out.selfPlay.mode2;
      play(squad,mode,mode,1,seedPlus,st);
      play(squad,mode,mode,-1,seedMinus,st);
    }
    // Head-to-head: rule A starts once and rule B starts once for each paired squad.
    play(squad,1,2,1,seedPlus,out.mixedCrossPlay);
    play(squad,2,1,1,seedPlus,out.mixedCrossPlay);
  }
} finally {
  Math.random=originalRandom;
}
finalize(out.selfPlay.mode1); finalize(out.selfPlay.mode2); finalize(out.mixedCrossPlay);
out.runtimeSeconds=+((Date.now()-started)/1000).toFixed(1);
out.interpretation={
  pairedSelfPlay:'Each global ruleset is played against itself, with both starting sides. This measures game outcomes and Huc/trap frequencies, not a direct strength contest.',
  mixedCrossPlay:'A and B are assigned to opposite sides, then sides/start order are swapped for the paired game. Mode-specific wins are a head-to-head signal, not proof of universal balance.',
  caveat:'AI search is level 3 with a short time budget; treat small win-rate differences as directional. The benchmark only tests the stated stun rules under the same other experimental Huc/cooldown rules.'
};

/* Conditional experiment: force the same legal Huc in A and B, then let the AI play out.
   This isolates what changes after Huc is actually used; standard opening games above rarely choose Huc.
*/
function freshConditionalStats() {
  return {
    games:0, bisonSideWins:0, targetSideWins:0, draws:0, totalPlies:0, avgPlies:0,
    endReasons:{}, hucIntoBisonTrap:0, immediateDenThreatsPrevented:0,
    targetBlockedAtOpponentTurn:0, bisonSelfStunApplied:0
  };
}
function createHucScenario(layoutRng) {
  E.setClassic(false);
  E.SQ[0]=ZERO.slice(); E.SQ[1]=ZERO.slice();
  E.SQ[0][7]=1; E.SQ[1][7]=1; E.setKeys();
  const directions=[0,1,2,3];
  const validExtra = i => i>=0 && !E.DEN[i] && !E.WATER[i] && !E.ROCK[i] &&
    !E.BUSH[i] && !E.MARSH[i] && !E.TRAP[i] && !E.BRIDGE[i];
  for(let attempt=0;attempt<2500;attempt++) {
    const cells=new Int8Array(N+E.ST);
    const bison=(1+Math.floor(layoutRng()*7))*COLS+Math.floor(layoutRng()*COLS);
    if(!validExtra(bison)) continue;
    const dirs=directions.slice().sort(()=>layoutRng()-.5);
    let target=-1, middle=-1, behind=-1, foundDir=-1;
    for(const d of dirs) {
      const m=E.ADJ[bison*4+d];
      const t=m<0?-1:E.ADJ[m*4+d];
      const b=t<0?-1:E.ADJ[t*4+d];
      if(m<0||t<0||b<0) continue;
      if(!validExtra(m)||!validExtra(t)||E.DEN[b]||E.WATER[b]||E.ROCK[b]||E.BRIDGE[b]) continue;
      if(E.TRAP[t]===1) continue; // Bison-side trap would make this Elephant capturable.
      if(E.OUTPOST[m]) continue; // avoid conflating Huc with the bonus-step rule.
      middle=m; target=t; behind=b; foundDir=d; break;
    }
    if(foundDir<0) continue;
    cells[bison]=7; cells[target]=-8;
    const used=new Set([bison,middle,target,behind]);
    const plusRanks=[2,4,6], minusRanks=[1,3,5];
    function placeExtra(side,ranks) {
      for(const rank of ranks) {
        let placed=false;
        for(let k=0;k<300;k++) {
          const i=Math.floor(layoutRng()*N);
          if(used.has(i)||!validExtra(i)) continue;
          cells[i]=rank*side; used.add(i); placed=true; break;
        }
        if(!placed) return false;
      }
      return true;
    }
    if(!placeExtra(1,plusRanks)||!placeExtra(-1,minusRanks)) continue;
    const huc=E.genMoves(cells,1).find(m =>
      (m&127)===bison && ((m>>7)&127)===target && ((m>>14)&15)===9 &&
      (((m>>18)&127)===((m>>25)&127))
    );
    if(!huc) continue;
    const mirror=new Int8Array(N+E.ST);
    for(let i=0;i<N;i++) {
      if(!cells[i]) continue;
      const r=(i/COLS)|0, c=i%COLS, j=(ROWS-1-r)*COLS+c;
      mirror[j]=-cells[i];
    }
    const mirrorBison=(ROWS-1-((bison/COLS)|0))*COLS+(bison%COLS);
    const mirrorTarget=(ROWS-1-((target/COLS)|0))*COLS+(target%COLS);
    const mirrorHuc=E.genMoves(mirror,-1).find(m =>
      (m&127)===mirrorBison && ((m>>7)&127)===mirrorTarget && ((m>>14)&15)===9 &&
      (((m>>18)&127)===((m>>25)&127))
    );
    if(!mirrorHuc) continue;
    return {cells,huc,bison,target,behind,mirror,mirrorHuc,mirrorBison,mirrorTarget};
  }
  throw new Error('Could not build a Huc-legal scenario after 2500 attempts');
}
function playAfterForcedHuc(position, hucMove, hucSide, mode, seed, st) {
  E.setClassic(false);
  E.SQ[0]=ZERO.slice(); E.SQ[1]=ZERO.slice();
  E.SQ[0][7]=1; E.SQ[1][7]=1; E.setKeys();
  E.setBisonStunModes(mode,mode);
  E.clearTT(); Math.random=rng(seed);
  const cells=Int8Array.from(position);
  const f=hucMove&127, t=(hucMove>>7)&127;
  E.commitM(cells,hucMove);
  const pushed=t+(t-f)/2;
  if(TRAP[pushed]===hucSide) st.hucIntoBisonTrap++;
  const targetSide=-hucSide;
  if(immediateDenWinExists(cells,pushed,targetSide)) st.immediateDenThreatsPrevented++;
  if(!E.genMoves(cells,targetSide).some(m=>(m&127)===pushed)) st.targetBlockedAtOpponentTurn++;
  if(mode===2) {
    const slot=SL+12+(hucSide>0?0:1);
    if(cells[slot]===((f+t)>>1)+1) st.bisonSelfStunApplied++;
  }
  let side=-hucSide, plies=0, winner=0, reason='cap';
  const history=[E.hashOf(cells,side)];
  while(plies<plyCap) {
    const moves=E.genMoves(cells,side);
    if(!moves.length) { reason='stalemate'; break; }
    const banned=moves.filter(m=>{
      const k=(m>>14)&15,to=(m>>7)&127;
      if(k===0&&DEN[to]===-side&&((m>>18)&127)===((m>>25)&127)) return false;
      const next=Int8Array.from(cells); E.commitM(next,m);
      const hash=E.hashOf(next,-side);
      return history.filter(h=>h===hash).length>=2;
    });
    if(banned.length===moves.length) { reason='repeat'; break; }
    const result=E.search(cells,side,3,history.slice(-14),banned);
    if(!result) { reason='null'; break; }
    E.commitM(cells,result.m);
    if(result.k===0&&DEN[result.t]===-side&&result.bf===result.bt) {
      winner=side; reason='den'; plies++; break;
    }
    const counts=E.counts(cells);
    if((side>0&&counts[1]===0)||(side<0&&counts[0]===0)) {
      winner=side; reason='wipe'; plies++; break;
    }
    side=-side; plies++; history.push(E.hashOf(cells,side));
  }
  st.games++; st.totalPlies+=plies; st.endReasons[reason]=(st.endReasons[reason]||0)+1;
  if(winner===0) st.draws++;
  else if(winner===hucSide) st.bisonSideWins++;
  else st.targetSideWins++;
}
const conditional={scenarios:20,mode1:freshConditionalStats(),mode2:freshConditionalStats()};
const layoutRng=rng(initialSeed ^ 0x7ac31b5d);
for(let i=0;i<conditional.scenarios;i++) {
  const sc=createHucScenario(layoutRng);
  const seed=(initialSeed ^ Math.imul(i+1,0x85ebca6b))>>>0;
  playAfterForcedHuc(sc.cells,sc.huc,1,1,seed,conditional.mode1);
  playAfterForcedHuc(sc.cells,sc.huc,1,2,seed,conditional.mode2);
  // Mirror the same tactical pattern to balance which side performs Huc and who moves first.
  playAfterForcedHuc(sc.mirror,sc.mirrorHuc,-1,1,seed,conditional.mode1);
  playAfterForcedHuc(sc.mirror,sc.mirrorHuc,-1,2,seed,conditional.mode2);
}
for(const st of [conditional.mode1,conditional.mode2]) st.avgPlies=st.games?+(st.totalPlies/st.games).toFixed(1):0;
out.conditionalHuc=conditional;

console.log(JSON.stringify(out));
