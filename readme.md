# Algoritmo Diagnostico Istologico per Esofagite Eosinofila (EoE)

## Descrizione

Tool HTML interattivo per supportare il patologo nella diagnosi istologica di esofagite eosinofila, basato sulle linee guida ACG 2025, ESPGHAN 2024 e sul sistema di scoring EoE-HSS di Collins.

**Versione:** 1.0  
**Data:** Dicembre 2025  
**Autore:** Generato con Claude AI per uso clinico

---

## Funzionalità

### Input diagnostici (5 step)

1. **Peak Eosinophil Count (PEC)**
   - Conta massima eosinofili/HPF
   - Cut-off diagnostico: ≥15 eos/HPF (su campo 0.24 mm²)

2. **Features istologiche accessorie**
   - Microascessi eosinofili (≥4 eos in cluster)
   - Degranulazione eosinofila
   - Eosinofili superficiali/intraluminali
   - Spongiosi (dilated intercellular spaces)
   - Iperplasia zona basale (>15-20% spessore epiteliale)
   - Allungamento papille
   - Fibrosi lamina propria
   - Alterazioni epiteliali superficiali (SEA/DEC)

3. **Elementi di esclusione/diagnosi alternativa**
   - Erosioni/ulcerazioni → GERD, farmaci
   - Neutrofili prominenti → esofagite acuta/infettiva
   - Ife fungine (Candida)
   - Inclusioni virali (HSV, CMV)
   - Granulomi → Crohn esofageo
   - Eosinofilia gastrica/duodenale → EGE/EGID

4. **Distribuzione dell'eosinofilia**
   - Prossimale/medio
   - Distale
   - Diffusa
   - Non valutabile

5. **EoE-HSS (Collins) - Opzionale**
   - Grade (severità): 8 parametri, scala 0-3
   - Stage (estensione): 8 parametri, scala 0-3
   - Score massimo: 24/24 per grade e stage

### Output

- **Diagnosi categoriale:**
  - Esofagite Eosinofila (criteri soddisfatti)
  - Quadro compatibile con EoE (correlare con clinica)
  - Eosinofilia esofagea sotto soglia
  - Diagnosi alternativa (infezione, Crohn, ecc.)

- **Riepilogo features** presenti/assenti

- **Diagnosi differenziale** quando indicata

- **EoE-HSS score** (se compilato) con criteri di remissione

- **Suggerimento referto** pronto per copia-incolla

---

## Logica diagnostica implementata

```
┌─────────────────────────────────────────────────────────────┐
│                    BIOPSIA ESOFAGEA                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Infezione (Candida,    │───YES──→ ESOFAGITE INFETTIVA
              │  HSV, CMV)?             │          Esclude EoE primaria
              └─────────────────────────┘
                            │ NO
                            ▼
              ┌─────────────────────────┐
              │  Granulomi presenti?    │───YES──→ CONSIDERARE CROHN
              └─────────────────────────┘          ESOFAGEO
                            │ NO
                            ▼
              ┌─────────────────────────┐
              │  Peak eos ≥15/HPF?      │───NO───→ SOTTO SOGLIA
              └─────────────────────────┘          (GERD? Remissione?)
                            │ YES
                            ▼
              ┌─────────────────────────┐
              │  Erosioni o neutrofili? │───YES──→ EOSINOFILIA CON
              └─────────────────────────┘          ELEMENTI ATIPICI
                            │ NO                   (DD necessaria)
                            ▼
              ┌─────────────────────────┐
              │  ≥2 features accessorie?│───NO───→ COMPATIBILE CON EoE
              └─────────────────────────┘          (correlare con clinica)
                            │ YES
                            ▼
              ┌─────────────────────────┐
              │     ESOFAGITE           │
              │     EOSINOFILA          │
              │  (criteri istologici    │
              │     soddisfatti)        │
              └─────────────────────────┘
```

---

## Criteri diagnostici (ACG 2025)

La diagnosi di EoE richiede:

1. **Sintomi di disfunzione esofagea** (valutazione clinica)
2. **≥15 eosinofili/HPF** su biopsia esofagea
3. **Esclusione di altre cause** di eosinofilia esofagea

### Note importanti

- La **risposta a PPI non esclude più la diagnosi** (dal 2018, AGREE consensus)
- La malattia è **patchy**: raccomandate ≥6 biopsie da ≥2 livelli esofagei
- Il **conteggio eosinofilo da solo non è patognomonico**
- Features accessorie aumentano la specificità diagnostica

---

## EoE Histologic Scoring System (Collins)

### 8 Parametri valutati

| Parametro | Abbreviazione | Descrizione |
|-----------|---------------|-------------|
| Eosinophil Inflammation | EI | Densità eosinofili |
| Basal Zone Hyperplasia | BZH | % spessore zona basale |
| Eosinophil Abscess | EA | Cluster ≥4 eosinofili |
| Eosinophil Surface Layering | ESL | Eosinofili in fila superficiale |
| Dilated Intercellular Spaces | DIS | Spongiosi |
| Surface Epithelial Alteration | SEA | Alterazioni superficie |
| Dyskeratotic Epithelial Cells | DEC | Cellule discheratotiche |
| Lamina Propria Fibrosis | LPF | Fibrosi (se campionata) |

### Scoring

- **Grade (severità):** 0-3 per parametro (max 24)
- **Stage (estensione):** 0-3 per parametro (max 24)
- **Score normalizzato:** totale/24

### Criteri di remissione istologica (EoEHRS)

- PEC <15 eos/HPF in tutti i siti
- EI grade 0-1
- EI stage 0
- Total grade ≤3
- Total stage ≤3

---

## Diagnosi differenziale istologica

| Condizione | Elementi distintivi |
|------------|---------------------|
| **GERD** | Eosinofilia solitamente <15/HPF, prevalenza distale, erosioni, può coesistere |
| **Esofagite infettiva** | Candida: ife/pseudoife. HSV: inclusioni Cowdry A. CMV: inclusioni citomegaliche |
| **Crohn esofageo** | Granulomi non necrotizzanti, coinvolgimento altri tratti GI |
| **Esofagite da farmaci** | Anamnesi farmacologica, necrosi epiteliale, "pill esophagitis" |
| **Gastroenterite eosinofila** | Eosinofilia anche gastrica/duodenale |
| **Acalasia** | Eosinofilia secondaria a stasi, quadro clinico-manometrico |
| **Connettivopatie** | Contesto sistemico, vasculite |

---

## Requisiti tecnici

- Browser moderno (Chrome, Firefox, Safari, Edge)
- JavaScript abilitato
- Nessuna dipendenza esterna
- File HTML autosufficiente (~30 KB)
- Funziona offline

---

## Utilizzo

1. Aprire il file `eoe_diagnostic_algorithm.html` nel browser
2. Inserire il peak eosinophil count
3. Selezionare le features istologiche presenti
4. Indicare eventuali elementi di esclusione
5. Specificare la distribuzione dell'eosinofilia
6. (Opzionale) Compilare l'EoE-HSS
7. Cliccare "Genera Valutazione Diagnostica"
8. Copiare il referto suggerito se appropriato

---

## Limitazioni

- **Non sostituisce il giudizio clinico-patologico**
- La diagnosi di EoE è clinico-patologica e richiede integrazione con dati clinici ed endoscopici
- Il tool non considera l'anamnesi farmacologica o alimentare del paziente
- Non valuta la risposta a terapia (utile per diagnosi iniziale)

---

## Bibliografia principale

1. Dellon ES et al. *ACG Clinical Guideline: Diagnosis and Management of Eosinophilic Esophagitis.* Am J Gastroenterol 2025;120(1):31-59

2. Amil-Dias J et al. *Diagnosis and management of eosinophilic esophagitis in children: An ESPGHAN update.* J Pediatr Gastroenterol Nutr 2024

3. Collins MH et al. *Newly developed and validated eosinophilic esophagitis histology scoring system.* Dis Esophagus 2017;30(3):1-8

4. Dellon ES et al. *Updated international consensus diagnostic criteria for eosinophilic esophagitis: AGREE Conference.* Gastroenterology 2018;155(4):1022-1033

5. Collins MH et al. *Histopathology of Eosinophilic Esophagitis.* Immunol Allergy Clin North Am 2024;44(2):205-221

---

## Disclaimer

⚠️ Questo strumento è un **supporto decisionale** per il patologo e non sostituisce la valutazione professionale. La diagnosi finale deve integrare dati clinici, endoscopici e istologici secondo le linee guida vigenti. L'autore non si assume responsabilità per decisioni cliniche basate esclusivamente su questo tool.

---

## Changelog

### v1.0 (Dicembre 2025)
- Release iniziale
- Implementazione criteri ACG 2025
- EoE-HSS completo (grade + stage)
- Generazione automatica referto
- Bibliografia aggiornata (17 riferimenti)
