# Algoritmo Diagnostico Istologico — Esofagite Eosinofila (EoE)

**Versione:** 2.2  
**Data:** Marzo 2026  
**Riferimenti normativi:** ACG Clinical Guideline 2025 · ESPGHAN 2024 · AGREE 2018 · Collins EoE-HSS 2017  
**Autore:** Dr. Filippo Bianchi — SC Anatomia Patologica, ASST FBF-Sacco, Milano  
**Generato con:** Claude AI (Anthropic) come strumento di supporto decisionale

---

## Descrizione

Tool HTML interattivo, autonomo, senza dipendenze esterne, per supportare il patologo nella diagnosi istologica di esofagite eosinofila. Non sostituisce il giudizio clinico-patologico: genera una **proposta diagnostica strutturata** da contestualizzare nel caso specifico.

Filosofia di base: la diagnosi di EoE non è una cifra, è un pattern istologico contestuale. Il tool è progettato per ragionare bene sia nei casi puliti sia nei casi sporchi — quelli che fanno sudare il camice.

---

## Funzionalità

### Input diagnostici (6 step)

**Step 0 — Adeguatezza del campione**
- Numero di biopsie pervenute (warning se <6)
- Contenitori separati per livello (se no: topografia disabilitata e degradata a *non valutabile* in tutto il flusso)
- Presenza di lamina propria (se no: LPF auto-impostato a N/A nell'HSS)
- Controllo automatico su numero di livelli campionati (warning se <2)

**Step 1 — Conta eosinofili per livello**
- Inserimento per livello: prossimale, medio, distale
- Calcolo automatico del peak eosinophil count con sede(i) del picco
- Conversione automatica in eos/mm² con area HPF inserita dall'utente
- Calcolo soglia equivalente: `15 eos/HPF → X eos/mm²` per l'area in uso
- Riferimento standardizzato: 0.27 mm² (trial CEGIR, ESPGHAN 2024) — nessun default fisso imposto

**Step 2 — Features istologiche accessorie**

| Feature | Categoria |
|---------|-----------|
| Microascessi eosinofili (cluster ≥4) | ★ Alta specificità |
| Degranulazione eosinofila | ★ Alta specificità |
| Eosinofili superficiali/intraluminali | ★ Alta specificità |
| Spongiosi (DIS) | Supportiva |
| Iperplasia zona basale (>15–20%) | Supportiva |
| Allungamento papille (>2/3) | Supportiva |
| Fibrosi lamina propria | Supportiva |
| Alterazioni epiteliali superficiali (SEA/DEC) | Supportiva |

**Step 3 — Red flags e contesto differenziale**

Tre livelli distinti — nessuna esclusione automatica:

- **⛔ Red flags forti** (quadro non interpretabile come EoE primaria senza rivalutazione): ife fungine (Candida), inclusioni virali (HSV/CMV), granulomi non-necrotizzanti
- **⚠️ Elementi atipici** (alert, non esclusione): erosioni/ulcerazioni, neutrofili prominenti
- **🔶 Coinvolgimento extraesofageo**: eosinofilia gastrica/duodenale — segnalato come possibile EGID concomitante, non esclude EoE (ESPGHAN 2024)

**Step 4 — Distribuzione topografica**
- Calcolata automaticamente dai dati dello Step 1 (badge AUTO)
- Richiede ≥2 livelli campionati; con un solo livello → *non determinabile*
- Override manuale stabile: una volta modificato manualmente, non viene più sovrascritto dagli aggiornamenti automatici
- Se contenitore unico: radio disabilitati, distribuzione forzata a *non valutabile*; al ripristino di contenitori separati, il calcolo auto si riattiva

**Step 5 — EoE Histologic Scoring System (Collins) — Facoltativo**
- 8 parametri valutati per Grade (severità, 0–3) e Stage (estensione, 0–3)
- LPF con opzione N/A (lamina propria non campionata); denominatore ridotto a 21 nel calcolo normalizzato
- Controllo di coerenza tra peak eos e EI grade:

| Peak eos/HPF | EI Grade atteso |
|-------------|----------------|
| 0 | 0 |
| 1–14 | 1 |
| 15–60 | 2 |
| >60 | 3 |

- Warning aggiornato in tempo reale sia al cambio dei select HSS sia alla modifica dei counts eosinofili

---

## Logica diagnostica

### Unica fonte di verità

Il tool implementa una separazione netta tra:

1. **`buildDiagnosisResult()`** — calcola l'oggetto diagnostico (label, cssClass, testo, differenziali, red flags, nota EGID)
2. **UI** — mostra il diagnosis box derivando da quell'oggetto
3. **`buildReportText()`** — genera il referto derivando **dallo stesso oggetto** senza ricalcoli

Questa architettura elimina la discordanza strutturale presente nelle versioni precedenti (diagnosis box e referto con logiche indipendenti).

### Red flags come layer separato

I red flags (infezione, granulomi) non sovrascrivono la diagnosi principale. Appaiono come:
- Banner rosso sopra il diagnosis box
- Addendum al referto (`redFlagReportAddendum`) — dopo la conclusione, non al posto di essa

Un caso con peak 40 eos/HPF + microascessi + Candida produce:
- Diagnosis box: **ESOFAGITE EOSINOFILA** (sfondo arancione per red flag attivi)
- Referto: conclusione EoE + addendum red flag Candida

### Flowchart diagnostica

```
BIOPSIA ESOFAGEA
│
├─ [Step 0] Adeguatezza: N biopsie, livelli campionati, contenitore, LP
│
├─ [Step 1] Peak eos/HPF
│   ├─ <5       → Assenza eosinofilia significativa
│   ├─ 5–14     → Eosinofilia lieve, sotto soglia
│   └─ ≥15      → continua ↓
│
├─ [Step 3] Red flags?
│   ├─ Candida/viral/granulomi → banner red flag (non esclusione)
│   └─ Erosioni/neutrofili → elementi atipici (alert)
│
├─ [Step 2] Features accessorie
│   ├─ ≥2 alta specificità OR ≥3 totali (senza atipici) → ESOFAGITE EOSINOFILA
│   ├─ ≥1 feature (senza atipici)                       → COMPATIBILE CON EoE
│   ├─ 0 features (senza atipici)                       → PATTERN ATIPICO
│   └─ qualsiasi + elementi atipici                     → DD NECESSARIA
│
└─ [Step 4] Distribuzione → alert se solo distale (GERD)
```

---

## Output

### Proposta diagnostica
Quattro categorie con codice colore:
- 🟢 **ESOFAGITE EOSINOFILA** — criteri istologici soddisfatti
- 🟡 **QUADRO COMPATIBILE / PATTERN ATIPICO / DD NECESSARIA** — vari gradi di incertezza
- ⬜ **EOSINOFILIA LIEVE** — sotto soglia
- 🔴 **ASSENZA EOSINOFILIA** — criteri non soddisfatti

### Suggerimento referto
Struttura standard:
```
MATERIALE:
  Biopsie pervenute: N — contenitori [separati/unico]
  Lamina propria: [presente/non campionata/non specificata]

ISTOLOGIA:
  [Descrizione morfologica calibrata sul livello di eosinofilia]
  Peak eosinophil count: X eos/HPF [Y eos/mm² — area HPF Z mm² — soglia equiv.: W eos/mm²]
  Distribuzione per sede: [prossimale: X; medio: Y; distale: Z] oppure [non attribuibile per livello]
  Distribuzione topografica: [diffusa/prossimale/distale/non determinabile]
  Lamina propria: [stato]
  Features accessorie: [lista o "non rilevate"]
  [Eventuali elementi atipici]

CONCLUSIONE:
  [Testo derivato dal label diagnostico]

[⛔ RED FLAGS se presenti — come addendum, non override]
[🔶 Nota EGID se presente]

[Rif: Dellon ES et al. ACG 2025 · ...]
```

---

## Gestione casi complessi

### Infezione + eosinofilia
Il tool mostra EoE come diagnosi principale (se i criteri numerici e morfologici sono soddisfatti) e aggiunge il red flag Candida/virale come addendum. La conclusione del referto rimane EoE con avvertenza esplicita di rivalutazione.

### EGID concomitante
L'eosinofilia gastrica/duodenale genera un banner separato (🔶) e una nota nel referto. Non modifica la diagnosi EoE. In accordo con ESPGHAN 2024: il coinvolgimento di altri segmenti GI non esclude EoE.

### Contenitore unico
- Distribuzione topografica: disabilitata e forzata a *non valutabile*
- Referto: `levelsDetail = "non attribuibile per livello (materiale in contenitore unico)"`
- `distText = "non determinabile (contenitore unico)"`
- Counts numerici per sede ancora visibili nel riepilogo (sono dati reali), ma non attribuiti topograficamente

### Un solo livello campionato
- Distribuzione auto: restituisce *non determinabile* con nota esplicita
- Warning in Step 0

---

## EoE-HSS — note tecniche

| Parametro | Abbreviazione | Grade (severità) | Stage (estensione) |
|-----------|---------------|------------------|--------------------|
| Eosinophil Inflammation | EI | 0–3 | 0–3 |
| Basal Zone Hyperplasia | BZH | 0–3 | 0–3 |
| Eosinophil Abscess | EA | 0–3 | 0–3 |
| Eosinophil Surface Layering | ESL | 0–3 | 0–3 |
| Dilated Intercellular Spaces | DIS | 0–3 | 0–3 |
| Surface Epithelial Alteration | SEA | 0–3 | 0–3 |
| Dyskeratotic Epithelial Cells | DEC | 0–3 | 0–3 |
| Lamina Propria Fibrosis | LPF | 0–3 / **N/A** | 0–3 / **N/A** |

**Score massimo:** 24 se LP campionata, 21 se LPF = N/A  
**Score normalizzato:** `gradeTotal / gradeMax` (denominatore adattato)

**Criteri di remissione istologica (EoEHRS):**
- PEC <15 eos/HPF in tutti i siti
- EI grade 0–1, EI stage 0
- Total grade ≤3, total stage ≤3

---

## Requisiti tecnici

- Browser moderno con JavaScript abilitato
- Nessuna dipendenza esterna, nessuna chiamata di rete
- File HTML singolo, autonomo (~35 KB)
- Funziona offline
- Responsive: ottimizzato per desktop e mobile

---

## Limiti e disclaimer

**⚠️ Questo tool è un supporto decisionale per il patologo. Non sostituisce la valutazione morfologica diretta né il giudizio clinico-patologico integrato.**

Limiti specifici:
- Non considera l'anamnesi farmacologica o alimentare del paziente
- Non valuta la risposta terapeutica (solo diagnosi iniziale/follow-up strutturato)
- La valutazione di alcune features (degranulazione, SEA) è operator-dependent
- Non classifica automaticamente l'attività endoscopica (EREFS)
- Non è validato per età pediatrica in modo specifico (i criteri istologici sono gli stessi)

---

## Changelog

### v2.2 (Marzo 2026)
- **HPF area:** rimosso 0.24 mm² come default; placeholder neutro; nota aggiornata con riferimento CEGIR 0.27 mm² (ESPGHAN 2024)
- **Soglia equivalente:** `buildReportText()` calcola e mostra `15/hpfArea eos/mm²` nel referto
- **Topografia con contenitore unico:** `levelsDetail` e `distText` nel referto ora usano testo esplicito "non attribuibile" invece dei counts per sede
- **Rientro distribuzione auto:** quando si passa da contenitore unico a separati, `autoSetDistribution()` si riattiva automaticamente
- **Coerenza HSS EI grade:** range 1–14 → grade atteso 1 (tolleranza rimossa per grade=0 con eos presenti)
- **Wording referto sub-soglia:** "infiltrato a prevalente componente eosinofila" sostituito con "modesta eosinofilia intraepiteliale sotto soglia diagnostica"

### v2.1 (Marzo 2026)
- Unica fonte di verità: referto derivato da `buildDiagnosisResult()`, nessun ricalcolo parallelo
- Distribuzione auto solo con ≥2 livelli campionati
- `checkAdequacy()` controlla numero di livelli campionati
- Contenitore unico: radio disabilitati + blocco distribuzione topografica
- Scala coerenza HSS corretta (peak >60 → grade 3)
- `checkHSSCoherence()` aggiornato al cambio degli input eos
- Override distribuzione stabile con flag `distributionManuallyEdited`
- Campo area HPF con conversione eos/mm² in tempo reale

### v2.0 (Marzo 2026)
- Red flags come layer separato (no esclusioni automatiche)
- `gastricEos` spostato in sezione EGID extraesofageo
- N/A per LPF nell'HSS
- Controllo coerenza HSS vs peak eos
- Step 0: adeguatezza campione
- Distribuzione auto-calcolata (override manuale)
- Referto strutturato con sezione MATERIALE

### v1.3 (Febbraio 2026)
- Logica features qualitativa (★ alta specificità vs supportive)
- Disclaimer prominente

### v1.0–1.1 (Dicembre 2025 – Gennaio 2026)
- Release iniziale con criteri ACG 2025, EoE-HSS completo, generazione referto

---

## Bibliografia

1. Dellon ES, Muir AB, Katzka DA, et al. *ACG Clinical Guideline: Diagnosis and Management of Eosinophilic Esophagitis.* Am J Gastroenterol 2025;120(1):31-59.
2. Amil-Dias J, Oliva S, Papadopoulou A, et al. *Diagnosis and management of eosinophilic esophagitis in children: ESPGHAN EGID Working Group update.* J Pediatr Gastroenterol Nutr 2024;79(1):1-44.
3. Dellon ES, Liacouras CA, Molina-Infante J, et al. *Updated international consensus diagnostic criteria for EoE: AGREE Conference.* Gastroenterology 2018;155(4):1022-1033.
4. Dhar A, Haboubi HN, Attwood SE, et al. *BSG and BSPGHAN joint consensus guidelines on EoE.* Gut 2022;71(8):1459-1487.
5. Collins MH, Martin LJ, Alexander ES, et al. *Newly developed and validated EoE histology scoring system.* Dis Esophagus 2017;30(3):1-8.
6. Collins MH, Arva NC, Bernieh A, et al. *Histopathology of Eosinophilic Esophagitis.* Immunol Allergy Clin North Am 2024;44(2):205-221.
7. Ma C, Jairath V, Feagan BG, et al. *Responsiveness of a Histologic Scoring System vs Peak Eosinophil Count in EoE.* Am J Gastroenterol 2022;117(2):264-271.
8. Gonsalves N. *Eosinophilic gastrointestinal disorders.* Clin Rev Allergy Immunol 2019;57(2):272-285.

---

## Contatti

**Dr. Filippo Bianchi**  
Direttore f.f. SC Anatomia Patologica  
ASST Fatebenefratelli-Sacco, Presidio FBF-Melloni-Territorio  
Piazzale Principessa Clotilde 3 — 20121 Milano  
✉ filippo.bianchi@asst-fbf-sacco.it

---

*Questo strumento è un supporto decisionale per il patologo e non sostituisce la valutazione professionale. La diagnosi finale deve integrare dati clinici, endoscopici e istologici secondo le linee guida vigenti.*
