// Runner dei test del motore EoE — nessun framework.
// Esecuzione:  node tests/run.mjs   (oppure: npm test)   Exit code 0 = tutto verde.
//
// Perche' esistono: fino alla v2.4 la logica viveva dentro index.html insieme alla UI e
// non era eseguibile fuori dal browser. Tre difetti su cinque erano regole enunciate
// nel testo dell'output e mai applicate dal codice — la classe di errore che una suite
// intercetta al primo giro.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const E = require('../engine.js');

let pass = 0, fail = 0; const failures = [];
const check = (n, c, d = '') => c ? pass++ : (fail++, failures.push(n + (d ? ` — ${d}` : '')));
const eq = (n, a, b) => check(n, a === b, `atteso ${JSON.stringify(b)}, ottenuto ${JSON.stringify(a)}`);
const section = t => console.log(`\n• ${t}`);

const F = o => Object.assign({ microabscesses:false, degranulation:false, surfaceLayering:false,
  spongiosis:false, bzh:false, papillae:false, fibrosis:false, dyskeratosis:false }, o || {});
const G = o => Object.assign({ erosion:false, neutrophils:false, candida:false, viral:false,
  granulomas:false, gastricEos:false, postProcedural:false }, o || {});
const L = (p, m, d) => [
  p !== null && p !== undefined ? { value:p, label:'prossimale', id:'eosProximal' } : null,
  m !== null && m !== undefined ? { value:m, label:'medio',      id:'eosMid'      } : null,
  d !== null && d !== undefined ? { value:d, label:'distale',    id:'eosDistal'   } : null
].filter(Boolean);
const dx = (levels, f, g, dist = 'unknown') =>
  E.buildDiagnosisResult(Math.max(...levels.map(l => l.value)), levels, F(f), G(g), dist);

const EOE_FORTE = { microabscesses:true, degranulation:true, surfaceLayering:true };

// ══════════════════════════════════════════════════════════════════════════
section('veto su erosione e neutrofili — deve degradare, non cancellare');
{
  eq('EoE florida senza atipie', dx(L(200,180,150), EOE_FORTE).label, 'ESOFAGITE EOSINOFILA');

  const conErosione = dx(L(200,180,150), EOE_FORTE, { erosion:true });
  eq('EoE florida + erosione → etichetta qualificata', conErosione.label, 'ESOFAGITE EOSINOFILA CON ELEMENTI ATIPICI');
  check('il quadro eosinofilo non viene annullato', /non è annullato/.test(conErosione.text));
  check('il differenziale nomina la GERD erosiva', conErosione.differentials.some(d => /GERD erosiva/.test(d)));
  check('suggerisce la dichiarazione post-procedura', conErosione.differentials.some(d => /post-impatto|post-dilatazione/.test(d)));

  eq('EoE florida + neutrofili → etichetta qualificata',
    dx(L(200,180,150), EOE_FORTE, { neutrophils:true }).label, 'ESOFAGITE EOSINOFILA CON ELEMENTI ATIPICI');

  const postProc = dx(L(200,180,150), EOE_FORTE, { erosion:true, postProcedural:true });
  eq('contesto post-procedura dichiarato → EoE piena', postProc.label, 'ESOFAGITE EOSINOFILA');
  check('il contesto viene esplicitato nel testo', /post-impatto\/post-dilatazione/.test(postProc.text));

  // sui quadri deboli il veto resta pieno: e' li' che serve
  eq('20 eos senza features + erosione → differenziale',
    dx(L(null,20,18), {}, { erosion:true }).label, 'EOSINOFILIA ESOFAGEA — DIAGNOSI DIFFERENZIALE NECESSARIA');
  eq('20 eos con 1 sola feature + erosione → differenziale',
    dx(L(null,20,18), { spongiosis:true }, { erosion:true }).label, 'EOSINOFILIA ESOFAGEA — DIAGNOSI DIFFERENZIALE NECESSARIA');

  check('la nuova etichetta ha una raccomandazione dedicata',
    /Chiarire il contesto/.test(E.buildOperationalRecommendation(conErosione)));
}

section('non regressione sulle altre etichette');
{
  eq('20 eos + 1 feature', dx(L(null,20,18), { spongiosis:true }).label, 'QUADRO COMPATIBILE CON EoE');
  eq('20 eos + 0 feature', dx(L(null,20,18)).label, 'EOSINOFILIA ESOFAGEA — PATTERN ATIPICO');
  eq('20 eos + 3 minori', dx(L(20,20,20), { spongiosis:true, bzh:true, papillae:true }).label, 'ESOFAGITE EOSINOFILA');
  eq('8 eos', dx(L(8,8,8)).label, 'EOSINOFILIA ESOFAGEA LIEVE — NON DIAGNOSTICA PER EoE');
  eq('2 eos', dx(L(1,2,2)).label, 'ASSENZA DI EOSINOFILIA SIGNIFICATIVA');
  const candida = dx(L(30,30,30), { microabscesses:true, degranulation:true }, { candida:true });
  eq('candida non cambia l etichetta', candida.label, 'ESOFAGITE EOSINOFILA');
  eq('ma la marca come condizionata', candida.isConditioned, true);
  eq('e declassa la classe visiva', candida.cssClass, 'diagnosis-compatible');
}

section('topografia');
{
  eq('gradiente distale su tre livelli',
    E.analyzeTopographyPattern(L(2,5,8)).type, 'distalGradient');
  // v2.5: prima ne servivano tre e il caso piu' comune usciva "mixed"
  eq('gradiente distale su due livelli (medio+distale)',
    E.analyzeTopographyPattern(L(null,10,40)).type, 'distalGradient');
  eq('gradiente distale su due livelli (prossimale+distale)',
    E.analyzeTopographyPattern(L(5,null,30)).type, 'distalGradient');
  eq('uniforme', E.analyzeTopographyPattern(L(8,8,8)).type, 'uniform');
  eq('massimo prossimale', E.analyzeTopographyPattern(L(40,10,5)).type, 'proximalMax');
  eq('misto (massimo al livello medio)', E.analyzeTopographyPattern(L(5,30,20)).type, 'mixed');
  eq('un solo livello → nessun pattern', E.analyzeTopographyPattern(L(null,null,40)), null);

  check('uniforme e massimo prossimale sono atipici per GERD',
    E.analyzeTopographyPattern(L(8,8,8)).atypicalForGerd && E.analyzeTopographyPattern(L(40,10,5)).atypicalForGerd);
  check('il gradiente distale non lo e', !E.analyzeTopographyPattern(L(2,5,8)).atypicalForGerd);
}

section('la nota topografica compare una volta sola');
{
  const r = dx(L(8,8,8));
  check('la nota e nel testo diagnostico', /Distribuzione topografica/.test(r.text));
  // v2.5: prima lo stesso paragrafo finiva anche in `differentials`, che la UI rende
  // come elenco puntato di diagnosi differenziali
  check('e non nell elenco dei differenziali',
    !r.differentials.some(d => /Distribuzione topografica/.test(d)), JSON.stringify(r.differentials));
  check('nessun differenziale e un paragrafo',
    r.differentials.every(d => d.length < 110), JSON.stringify(r.differentials.map(d => d.length)));
}

section('coerenza HSS — nessun ramo irraggiungibile');
{
  const w = (o) => E.hssCoherenceWarnings(Object.assign({
    peakEos:0, eiGrade:0, eiStage:0, surfaceLayering:false, eslGrade:0, microabscesses:false, eaGrade:0 }, o));
  eq('picco 0, grade 0 → nessun avviso', w({}).length, 0);
  check('picco 0, grade 2 → avviso', /atteso 0/.test(w({ peakEos:0, eiGrade:2 })[0] || ''));
  check('picco 8, grade 0 → atteso 1', /atteso 1/.test(w({ peakEos:8, eiGrade:0 })[0] || ''));
  check('picco 40, grade 1 → atteso 2', /atteso 2/.test(w({ peakEos:40, eiGrade:1 })[0] || ''));
  // il caso che la vecchia catena non poteva segnalare in modo specifico
  check('picco 40, grade 0 → atteso 2', /atteso 2/.test(w({ peakEos:40, eiGrade:0 })[0] || ''));
  check('picco 80, grade 0 → atteso 3', /atteso 3/.test(w({ peakEos:80, eiGrade:0 })[0] || ''));
  eq('picco 80, grade 3, stage 2 → nessun avviso', w({ peakEos:80, eiGrade:3, eiStage:2 }).length, 0);
  // la scala e' una funzione sola, non quattro rami che si sovrappongono
  [[0,0],[1,1],[14,1],[15,2],[60,2],[61,3],[500,3]].forEach(([p,g]) =>
    eq(`expectedEiGrade(${p})`, E.expectedEiGrade(p), g));
  check('stage 0 con grade alto → avviso', w({ peakEos:40, eiGrade:2, eiStage:0 }).some(x => /EI stage 0%/.test(x)));
  check('cross-check ESL', w({ surfaceLayering:true, eslGrade:0 }).some(x => /ESL grade = 0/.test(x)));
  check('cross-check EA', w({ microabscesses:true, eaGrade:0 }).some(x => /EA grade = 0/.test(x)));
}

section('adeguatezza: segnala, non scrive');
{
  const a = (o) => E.adequacyWarnings(Object.assign({ numBiopsies:6, contenitori:'si', laminaPropria:'si', sampledLevels:2 }, o));
  eq('caso adeguato → nessun avviso', a({}).length, 0);
  check('1 solo livello', a({ sampledLevels:1 }).some(x => /≥2 livelli/.test(x)));
  check('<6 biopsie', a({ numBiopsies:4 }).some(x => /≥6 biopsie/.test(x)));
  check('contenitore unico', a({ contenitori:'no' }).some(x => /Contenitore unico/.test(x)));
  check('lamina propria non campionata', a({ laminaPropria:'no' }).some(x => /denominatore 21/.test(x)));
  check('la funzione e pura: nessun effetto collaterale dichiarato',
    !/document\./.test(E.adequacyWarnings.toString()));
}

section('HSS: calcolo e denominatore');
{
  const items = (over = {}) => E.HSS_KEYS.map(k => ({ key:k, grade: over[k] ?? '0', stage: over[k] ?? '0' }));
  const tutto0 = E.computeHSSScore(items({ lpf:'NA' }));
  eq('LPF N/A → denominatore 21', tutto0.gradeMax, 21);
  eq('LPF N/A segnalato', tutto0.lpfNA, true);
  const pieno = E.computeHSSScore(items());
  eq('tutti gli 8 item → denominatore 24', pieno.gradeMax, 24);
  eq('LPF valutato → nessun flag N/A', pieno.lpfNA, false);
  const misto = E.computeHSSScore(E.HSS_KEYS.map(k => ({ key:k, grade: k === 'ei' ? '3' : '1', stage:'1' })));
  eq('totale grade', misto.gradeTotal, 3 + 7);
  eq('normalizzato', misto.gradeNorm, (10/24).toFixed(2));
}

section('distribuzione automatica');
{
  eq('un solo livello → non determinabile', E.computeAutoDistribution(L(null,null,40)).value, 'unknown');
  eq('prossimale + distale sopra soglia → diffusa', E.computeAutoDistribution(L(20,null,20)).value, 'diffuse');
  eq('solo distale sopra soglia', E.computeAutoDistribution(L(2,null,20)).value, 'distal');
  eq('solo prossimale sopra soglia', E.computeAutoDistribution(L(20,null,2)).value, 'proximal');
  eq('tutti sotto soglia', E.computeAutoDistribution(L(2,3,4)).value, 'unknown');
}

section('purezza e invarianti di progetto');
{
  const levels = L(200,180,150), f = F(EOE_FORTE), g = G({ erosion:true });
  const snap = JSON.stringify({ levels, f, g });
  E.buildDiagnosisResult(200, levels, f, g, 'unknown');
  eq('buildDiagnosisResult non muta gli argomenti', JSON.stringify({ levels, f, g }), snap);

  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const eng  = fs.readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
  const pkg  = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  check('index.html carica engine.js', /<script src="engine\.js/.test(html));
  check('il motore non tocca il DOM', !/document\.|getElementById|window\./.test(eng));
  ['buildDiagnosisResult', 'analyzeTopographyPattern', 'computeHSSScore', 'adequacyWarnings']
    .forEach(fn => check(`index.html non ridefinisce ${fn}`, !html.includes(`function ${fn}(`) && !html.includes(`const ${fn} =`)));
  check('versione allineata a package.json', html.includes(`engine.js?v=${pkg.version}`), pkg.version);
  check('titolo allineato', html.includes(`EoE v${pkg.version}`), pkg.version);
  check('la casella post-procedura esiste nel form', /id="postProcedural"/.test(html));
  check('il menu lamina propria richiama syncLpfAvailability', /syncLpfAvailability/.test(html));
  // Il ripristino di LPF confronta il valore dell'option: se cambia il markup senza
  // cambiare la funzione, la risposta "Sì" torna a non avere effetto.
  const lpSelect = (html.match(/<select id="laminaPropria"[\s\S]*?<\/select>/) || [''])[0];
  const lpValues = [...lpSelect.matchAll(/value="([^"]+)"/g)].map(m => m[1]).sort();
  eq('valori del menu lamina propria', JSON.stringify(lpValues), JSON.stringify(['no','unknown','yes']));
  const syncSrc = (html.match(/function syncLpfAvailability\(\)[\s\S]*?\n\}/) || [''])[0];
  lpValues.filter(v => v !== 'unknown').forEach(v =>
    check(`syncLpfAvailability tratta il valore "${v}"`, syncSrc.includes(`'${v}'`), syncSrc.slice(0, 200)));
}

console.log(`\n${fail === 0 ? 'OK' : 'FALLITO'} — ${pass} pass, ${fail} fail`);
if (failures.length) { console.log('\nFallimenti:'); failures.forEach(f => console.log('  ✗ ' + f)); }
process.exit(fail === 0 ? 0 : 1);
