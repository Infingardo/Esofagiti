// ─────────────────────────────────────────────────────────────────────────────
//  MOTORE DIAGNOSTICO EoE — logica pura, nessuna dipendenza dal DOM.
//  Estratto da index.html nella v2.5. Ogni funzione riceve i valori gia' letti dal
//  form e restituisce dati: index.html conserva i lettori (getEosLevels,
//  checkAdequacy, checkHSSCoherence, buildHSSScore) come sottili wrapper.
//  Caricato da index.html e da tests/run.mjs — modificarlo richiede un test.
// ─────────────────────────────────────────────────────────────────────────────

const HSS_KEYS = ['ei','bzh','ea','esl','dis','sea','dec','lpf'];

// ── ADEGUATEZZA ─────────────────────────────────────────────────────────────
const adequacyWarnings = ({numBiopsies, contenitori, laminaPropria, sampledLevels}) => {
    const warnings = [];
    if (sampledLevels === 1)
        warnings.push('Solo 1 livello campionato con conta: ACG 2025 raccomanda ≥2 livelli per diagnosi affidabile.');
    if (numBiopsies > 0 && numBiopsies < 6)
        warnings.push(`Solo ${numBiopsies} biopsie: le LG raccomandano ≥6 biopsie per adeguata campionatura.`);
    if (contenitori === 'no')
        warnings.push('Contenitore unico: la localizzazione topografica non è dimostrabile.');
    // v2.5: la funzione segnala e basta. Prima forzava LPF a N/A nel form e non lo
    // ripristinava mai: rispondere "lamina propria campionata: si" non aveva alcun
    // effetto sull'HSS. Lo stato dell'item lo gestisce syncLpfAvailability().
    if (laminaPropria === 'no')
        warnings.push('Lamina propria non campionata: LPF non valutabile, escluso dall\'HSS (denominatore 21).');
    return warnings;
};

// ── HSS ─────────────────────────────────────────────────────────────────────
// Scala EI adottata dallo strumento. NB: e' una scala locale — il grado 1 copre conte
// sotto la soglia diagnostica (1-14), mentre nell'EoEHSS di Collins il grado 0 copre
// l'intero intervallo <15. La riga sulla remissione istologica ("EI grade 0-1") e'
// coerente con questa scala. Va dichiarata come deroga o riallineata: vedi readme.
const EI_GRADE_BANDS = { 0: '0', 1: '1–14', 2: '15–60', 3: '>60' };
const expectedEiGrade = (peak) => peak === 0 ? 0 : peak <= 14 ? 1 : peak <= 60 ? 2 : 3;

const hssCoherenceWarnings = ({peakEos, eiGrade, eiStage, surfaceLayering, eslGrade, microabscesses, eaGrade}) => {
    const warnings = [];
    // v2.5: catena riscritta su un'unica funzione di attesa. Prima l'ultimo ramo
    // (`peakEos >= 15 && eiGrade === 0`) era irraggiungibile — sempre intercettato dai
    // due rami di intervallo — e le soglie erano ripetute quattro volte.
    const exp = expectedEiGrade(peakEos);
    if (eiGrade !== exp)
        warnings.push(`Picco ${peakEos} eos/HPF (${EI_GRADE_BANDS[exp]}): EI grade atteso ${exp}, impostato ${eiGrade}.`);
    if (eiStage === 0 && eiGrade >= 2)
        warnings.push('EI stage 0% con EI grade elevato: verificare estensione del coinvolgimento eosinofilo.');
    if (surfaceLayering && eslGrade === 0)
        warnings.push('Eosinofili superficiali selezionati (Step 2) ma ESL grade = 0: verificare coerenza.');
    if (!surfaceLayering && eslGrade >= 2)
        warnings.push(`ESL grade ${eslGrade} ma feature "eosinofili superficiali" non selezionata: verificare coerenza.`);
    if (microabscesses && eaGrade === 0)
        warnings.push('Microascessi selezionati (Step 2) ma EA grade = 0: verificare coerenza.');
    if (!microabscesses && eaGrade >= 2)
        warnings.push(`EA grade ${eaGrade} ma feature "microascessi" non selezionata: verificare coerenza.`);
    return warnings;
};

const computeHSSScore = (items) => {
    let gradeTotal = 0, stageTotal = 0, gradeMax = 0, stageMax = 0, lpfNA = false;
    items.forEach(({key, grade, stage}) => {
        if (grade === 'NA' || stage === 'NA') { if (key === 'lpf') lpfNA = true; return; }
        gradeTotal += parseInt(grade) || 0;
        stageTotal += parseInt(stage) || 0;
        gradeMax += 3; stageMax += 3;
    });
    return {
        gradeTotal, stageTotal, gradeMax, stageMax, lpfNA,
        gradeNorm: gradeMax > 0 ? (gradeTotal/gradeMax).toFixed(2) : 'N/A',
        stageNorm: stageMax > 0 ? (stageTotal/stageMax).toFixed(2) : 'N/A'
    };
};

// ── TOPOGRAFIA ──────────────────────────────────────────────────────────────
// FIX #2: auto-distribuzione solo se ≥2 livelli campionati
function computeAutoDistribution(levels) {
    if (levels.length < 2) {
        return { value: 'unknown', label: 'Non determinabile — campionato un solo livello (ACG raccomanda ≥2)' };
    }
    const proxVal = levels.find(l => l.label === 'prossimale')?.value;
    const midVal  = levels.find(l => l.label === 'medio')?.value;
    const distVal = levels.find(l => l.label === 'distale')?.value;
    const upperPos = (proxVal !== undefined && proxVal >= 15) || (midVal !== undefined && midVal >= 15);
    const distPos  = distVal !== undefined && distVal >= 15;

    if (upperPos && distPos)   return { value: 'diffuse',  label: 'Diffusa (prossimale/medio + distale)' };
    if (upperPos && !distPos)  return { value: 'proximal', label: 'Solo prossimale/medio' };
    if (!upperPos && distPos)  return { value: 'distal',   label: 'Solo distale ⚠️ — valutare componente GERD' };
    return { value: 'unknown', label: 'Non determinabile (eosinofilia sotto soglia in tutti i livelli campionati)' };
}

// FIX #3/#4: pattern topografico grezzo (indipendente dalla soglia diagnostica ≥15,
// usato per pesare il differenziale GERD vs EoE e per l'indicazione operativa)
function analyzeTopographyPattern(levels) {
    if (levels.length < 2) return null;
    const proxVal = levels.find(l => l.label === 'prossimale')?.value;
    const midVal  = levels.find(l => l.label === 'medio')?.value;
    const distVal = levels.find(l => l.label === 'distale')?.value;
    const values   = levels.map(l => l.value);
    const maxVal   = Math.max(...values);
    const minVal   = Math.min(...values);
    const spread   = maxVal - minVal;
    const uniform  = spread <= Math.max(2, maxVal * 0.25);
    const maxLevels = levels.filter(l => l.value === maxVal).map(l => l.label);

    if (uniform)
        return { type: 'uniform', atypicalForGerd: true, note: 'sostanzialmente uniforme tra i livelli campionati' };
    if (maxLevels.includes('prossimale'))
        return { type: 'proximalMax', atypicalForGerd: true, note: 'valore massimo in sede prossimale' };
    // v2.5: il gradiente distale si riconosce sui livelli effettivamente campionati.
    // Prima ne servivano tre: con solo medio e distale — il campionamento piu' comune —
    // il pattern GERD tipico usciva come "misto" e non pesava sul differenziale.
    const ordine = ['prossimale','medio','distale'];
    const seq = ordine.map(l => levels.find(x => x.label === l)).filter(Boolean);
    const crescenteVersoDistale = seq.every((x,i) => i === 0 || x.value >= seq[i-1].value);
    if (maxLevels.includes('distale') && seq.length >= 2 && crescenteVersoDistale)
        return { type: 'distalGradient', atypicalForGerd: false,
                 note: seq.length === 3
                     ? 'valore massimo distale con gradiente decrescente verso il prossimale'
                     : 'valore massimo distale con gradiente decrescente sui due livelli campionati' };
    return { type: 'mixed', atypicalForGerd: false, note: 'pattern topografico misto, senza gradiente netto' };
}

// FIX #3: usa il pattern topografico per pesare il differenziale GERD vs EoE
// (solo per i quadri dove quel differenziale è in discussione: sotto soglia / atipico)
function buildTopographyNote(d) {
    if (!d.topography) return '';
    if (!(d.label.includes('LIEVE') || d.label.includes('ATIPICO'))) return '';
    const t = d.topography;
    if (t.type === 'uniform' || t.type === 'proximalMax')
        return `Distribuzione topografica (${t.note}): elemento atipico per GERD, che tipicamente concentra l'eosinofilia in sede distale; dato rilevante a favore di una possibile EoE (in remissione parziale o sotto soglia), da considerare nel ragionamento clinico complessivo.`;
    if (t.type === 'distalGradient')
        return `Distribuzione topografica (${t.note}): pattern compatibile con entrambe le entità, GERD inclusa.`;
    return '';
}

// ── DIAGNOSI ────────────────────────────────────────────────────────────────
function buildDiagnosisResult(peakEos, levels, features, flags, distribution) {
    const highSpec = (features.microabscesses ? 1 : 0)
                   + (features.degranulation  ? 1 : 0)
                   + (features.surfaceLayering? 1 : 0);
    const total    = highSpec
                   + (features.spongiosis   ? 1 : 0)
                   + (features.bzh          ? 1 : 0)
                   + (features.papillae     ? 1 : 0)
                   + (features.fibrosis     ? 1 : 0)
                   + (features.dyskeratosis ? 1 : 0);
    // v2.5 — Prima `hasAtypical` era un veto assoluto: 200 eos/HPF con microascessi,
    // degranulazione ed eosinofili superficiali diventavano "diagnosi differenziale
    // necessaria" per la sola presenza di un'erosione. Erosioni e neutrofili sono comuni
    // nell'EoE severa e attesi dopo impatto alimentare o dilatazione — eccezione che il
    // testo del differenziale citava gia' ("salvo post-impaction o post-dilatazione") ma
    // che non era dichiarabile da nessuna parte. Ora:
    //   • se il contesto post-procedura e' dichiarato, il veto non si applica;
    //   • se il quadro EoE e' forte, l'etichetta viene qualificata, non sostituita;
    //   • sui quadri deboli il veto resta pieno, dove serve davvero.
    const atypicalPresent = flags.erosion || flags.neutrophils;
    const hasAtypical = atypicalPresent && !flags.postProcedural;

    // Red flags — layer separato, non modificano il label ma condizionano il messaggio
    const redFlags = [];
    if (flags.candida)    redFlags.push('Ife fungine (Candida): trattare l\'infezione e rivalutare. L\'eosinofilia non è interpretabile come EoE primaria in questo contesto infettivo.');
    if (flags.viral)      redFlags.push('Inclusioni virali (HSV/CMV): caratterizzare e trattare la componente infettiva prima di concludere per EoE.');
    if (flags.granulomas) redFlags.push('Granulomi non-necrotizzanti: escludere Crohn esofageo e infezione granulomatosa. L\'eosinofilia può essere secondaria.');

    const egidNote = flags.gastricEos
        ? 'Eosinofilia gastrica/duodenale segnalata. Non esclude EoE (ESPGHAN 2024), ma richiede valutazione per EGID concomitante o estensione extraesofagea.'
        : '';

    // — Testo aggiuntivo red flag per il referto (senza ricalcolo logica)
    const redFlagReportAddendum = redFlags.length
        ? '\n\n⛔ NOTA RED FLAGS:\n' + redFlags.map(f => '  - ' + f).join('\n')
        : '';

    const topography = analyzeTopographyPattern(levels);

    let res = {
        label: '', cssClass: '', text: '', differentials: [],
        redFlags, egidNote, redFlagReportAddendum,
        highSpec, total, peakEos, levels, features, flags, distribution, topography,
        isConditioned: redFlags.length > 0
    };

    // — Logica principale
    const strongEoE = highSpec >= 2 || total >= 3;

    if (peakEos >= 15) {
        if (!hasAtypical && strongEoE) {
            res.label    = 'ESOFAGITE EOSINOFILA';
            res.cssClass = redFlags.length ? 'diagnosis-compatible' : 'diagnosis-confirmed';
            res.text     = `Criteri istologici soddisfatti: ${peakEos} eos/HPF con pattern tipico (${highSpec} features ad alta specificità, ${total} totali). Diagnosi clinico-patologica: verificare sintomi di disfunzione esofagea ed escludere altre cause.`;
            if (atypicalPresent && flags.postProcedural) {
                const quali = [flags.erosion ? 'erosione' : null, flags.neutrophils ? 'neutrofili' : null].filter(Boolean).join(' e ');
                res.text += `\n\nPresenza di ${quali} in contesto post-impatto/post-dilatazione dichiarato: reperto atteso in quel contesto, non riorienta il differenziale.`;
            }
            if (redFlags.length) res.text += '\n\n⚠️ Presenza di red flags: il quadro non è interpretabile come EoE primaria senza contestualizzazione clinica (vedi sopra).';
        } else if (hasAtypical && strongEoE) {
            const quali = [flags.erosion ? 'erosione' : null, flags.neutrophils ? 'neutrofili' : null].filter(Boolean).join(' e ');
            res.label    = 'ESOFAGITE EOSINOFILA CON ELEMENTI ATIPICI';
            res.cssClass = 'diagnosis-compatible';
            res.text     = `Pattern istologico forte per EoE (${peakEos} eos/HPF, ${highSpec} features ad alta specificità, ${total} totali), con ${quali}. Il quadro eosinofilo non è annullato dagli elementi atipici, ma questi vanno spiegati: se il prelievo segue un impatto alimentare o una dilatazione, dichiararlo in Step 2; altrimenti considerare una componente sovrapposta.`;
            if (flags.erosion)     res.differentials.push('GERD erosiva o esofagite da farmaci sovrapposta');
            if (flags.neutrophils) res.differentials.push('Componente acuta/infettiva sovrapposta');
            res.differentials.push('EoE severa con erosione post-impatto o post-dilatazione (dichiarabile in Step 2)');
            if (redFlags.length) res.text += '\n\n⚠️ Presenza di red flags (vedi sopra).';
        } else if (!hasAtypical && total >= 1) {
            res.label    = 'QUADRO COMPATIBILE CON EoE';
            res.cssClass = 'diagnosis-compatible';
            res.text     = `Eosinofilia significativa (${peakEos} eos/HPF) con alcune features suggestive. Correlare con clinica ed endoscopia.`;
            if (redFlags.length) res.text += '\n\n⚠️ Presenza di red flags che condizionano il quadro (vedi sopra).';
        } else if (!hasAtypical && total === 0) {
            res.label    = 'EOSINOFILIA ESOFAGEA — PATTERN ATIPICO';
            res.cssClass = 'diagnosis-compatible';
            res.text     = `Eosinofilia significativa (${peakEos} eos/HPF) senza features accessorie. Considerare GERD con eosinofilia reattiva, campionamento subottimale o EoE atipica.`;
            res.differentials = ['GERD con eosinofilia', 'Campionamento subottimale', 'EoE atipica'];
        } else {
            res.label    = 'EOSINOFILIA ESOFAGEA — DIAGNOSI DIFFERENZIALE NECESSARIA';
            res.cssClass = 'diagnosis-compatible';
            res.text     = `Eosinofilia significativa (${peakEos} eos/HPF) con elementi atipici per EoE pura.`;
            if (flags.erosion)     res.differentials.push('GERD erosiva o esofagite da farmaci');
            if (flags.neutrophils) res.differentials.push('Esofagite acuta/infettiva (salvo post-impaction o post-dilatazione)');
        }
    } else if (peakEos >= 5) {
        res.label    = 'EOSINOFILIA ESOFAGEA LIEVE — NON DIAGNOSTICA PER EoE';
        res.cssClass = 'diagnosis-insufficient';
        res.text     = `Eosinofilia sotto soglia (${peakEos} eos/HPF; cut-off ≥15). Possibile: GERD reattiva, EoE in remissione parziale, campionamento subottimale.`;
        res.differentials = ['GERD', 'EoE in remissione parziale', 'Rivalutare con biopsie aggiuntive'];
    } else {
        res.label    = 'ASSENZA DI EOSINOFILIA SIGNIFICATIVA';
        res.cssClass = 'diagnosis-excluded';
        res.text     = `Conta eosinofila normale/minima (${peakEos} eos/HPF). Non soddisfatti criteri istologici per EoE.`;
    }

    // FIX #3: pesa il differenziale GERD vs EoE con il pattern topografico grezzo
    // v2.5: la nota va nel testo diagnostico e basta. Prima veniva spinta anche in
    // `differentials`, che l'interfaccia rende come elenco puntato: un paragrafo di 300
    // caratteri in mezzo a voci come "GERD" e "EoE in remissione parziale", per giunta
    // duplicato rispetto al testo qui sopra.
    const topographyNote = buildTopographyNote(res);
    if (topographyNote) res.text += '\n\n' + topographyNote;

    if (distribution === 'distal' && peakEos >= 15) {
        res.differentials.push('⚠️ Pattern esclusivamente distale: valutare attentamente componente GERD');
    }
    return res;
}

// FIX #4: indicazione operativa esplicita a chiusura del referto, condizionata
// dal quadro diagnostico e — per i quadri sotto soglia/atipici — dal pattern topografico
function buildOperationalRecommendation(d) {
    const atypicalForGerd = !!(d.topography && d.topography.atypicalForGerd);

    if (d.label === 'ESOFAGITE EOSINOFILA') {
        return 'Impostare terapia (dieta di eliminazione, steroidi topici deglutiti o IPP secondo il quadro clinico) e programmare biopsie di controllo a 8-12 settimane per la valutazione della risposta istologica.';
    }
    if (d.label === 'ESOFAGITE EOSINOFILA CON ELEMENTI ATIPICI') {
        return 'Chiarire il contesto degli elementi atipici (impatto alimentare o dilatazione recenti, terapia in corso, farmaci) e correlare con la clinica; se il contesto li spiega, procedere come per EoE — altrimenti caratterizzare la componente sovrapposta prima della ri-biopsia di controllo.';
    }
    if (d.label === 'QUADRO COMPATIBILE CON EoE') {
        return 'Si raccomanda correlazione clinico-endoscopica stretta; considerare trial terapeutico (IPP o dieta di eliminazione) con ri-biopsia di controllo per confermare il quadro.';
    }
    if (d.label.includes('ATIPICO') || d.label.includes('LIEVE')) {
        return atypicalForGerd
            ? 'Si raccomanda correlazione clinica più stretta con storia allergica/dietetica, dato il pattern topografico atipico per GERD (vedi sopra); considerare comunque trial terapeutico e ri-biopsia secondo il quadro clinico complessivo.'
            : 'Si raccomanda trial empirico con inibitori di pompa protonica (IPP) per 8 settimane, con ri-biopsia di controllo al termine per la rivalutazione istologica.';
    }
    if (d.label.includes('DIFFERENZIALE')) {
        return 'Si raccomanda approfondimento eziologico mirato (revisione farmacologica, caratterizzazione della componente infettiva/erosiva) prima di programmare biopsie di controllo.';
    }
    return 'Non sono richieste azioni specifiche in assenza di ulteriori elementi clinici; correlare comunque con il quadro sintomatologico ed endoscopico.';
}

// Export per Node (test runner) e browser (script tag).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HSS_KEYS, EI_GRADE_BANDS, expectedEiGrade, adequacyWarnings,
    hssCoherenceWarnings, computeHSSScore, computeAutoDistribution,
    analyzeTopographyPattern, buildTopographyNote, buildDiagnosisResult,
    buildOperationalRecommendation };
}
