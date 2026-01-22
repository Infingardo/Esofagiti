# Algoritmo Diagnostico Istologico per Esofagite Eosinofila (EoE)

## Descrizione

Tool HTML interattivo per supportare il patologo nella diagnosi istologica di esofagite eosinofila, basato sulle linee guida ACG 2025, ESPGHAN 2024 e sul sistema di scoring EoE-HSS di Collins.

**Versione:** 1.1  
**Data:** Gennaio 2026  
**Autore:** Generato con Claude AI per uso clinico

---

## Funzionalità

### Input diagnostici (5 step)

1. **Peak Eosinophil Count (PEC)**
   - Conta massima eosinofili/HPF per ciascun livello esofageo
   - Cut-off diagnostico: ≥15 eos/HPF
   - Campo teorico standard: 0.24 mm² (⚠️ varia tra 0.20-0.30 mm² secondo microscopio utilizzato)

2. **Features istologiche accessorie**
   - **Ad alta specificità (★):**
     - Microascessi eosinofili (≥4 eos in cluster)
     - Degranulazione eosinofila (granuli extracellulari visibili)
     - Eosinofili superficiali/intraluminali
   - **Supportive:**
     - Spongiosi (dilated intercellular spaces - DIS)
     - Iperplasia zona basale (>15-20% spessore epiteliale)
     - Allungamento papille (>2/3 dell'epitelio)
     - Fibrosi lamina propria (se campionata)
     - Alterazioni epiteliali superficiali (SEA/DEC)

3. **Elementi di esclusione/diagnosi alternativa**
   - Erosioni/ulcerazioni → GERD, farmaci (inusuali in EoE pura)
   - Neutrofili prominenti → esofagite acuta/infettiva (salvo post-procedura)
   - Ife fungine (Candida) → esofagite infettiva
   - Inclusioni virali (HSV, CMV) → esofagite virale
   - Granulomi → Crohn esofageo
   - Eosinofilia gastrica/duodenale → EGE/EGID

4. **Distribuzione dell'eosinofilia**
   - Prossimale/medio
   - Distale (⚠️ alert per possibile componente GERD)
   - Diffusa
   - Non valutabile

5. **EoE-HSS (Collins) - Opzionale**
   - Grade (severità): 8 parametri, scala 0-3
   - Stage (estensione): 8 parametri, scala 0-3
   - Score massimo: 24/24 per grade e stage
   - Utile per follow-up e trial clinici, non necessario per diagnosi di routine

### Output

- **Proposta diagnostica categoriale:**
  - Esofagite Eosinofila (pattern istologico compatibile)
  - Quadro compatibile con EoE (correlare con clinica)
  - Eosinofilia esofagea sotto soglia
  - Diagnosi alternativa (infezione, Crohn, ecc.)

- **Riepilogo features** presenti/assenti con indicatori di specificità (★)

- **Diagnosi differenziale** quando indicata

- **EoE-HSS score** (se compilato) con criteri di remissione

- **Suggerimento referto** pronto per copia-incolla, con reminder esplicito sulla necessità di correlazione clinica

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
              │ ≥2 features alta spec.  │───NO───→ COMPATIBILE CON EoE
              │    OR ≥3 features tot.? │          (correlare con clinica)
              └─────────────────────────┘
                            │ YES
                            ▼
              ┌─────────────────────────┐
              │     ESOFAGITE           │
              │     EOSINOFILA          │
              │  (quadro istologico     │
              │     compatibile)        │
              └─────────────────────────┘
```

### Novità v1.1: Valutazione qualitativa features

Invece di un conteggio rigido (≥2 features), il tool ora utilizza una **valutazione qualitativa**:

- **Features ad alta specificità (★)**: microascessi, degranulazione, eosinofili superficiali
  - Presenza di ≥2 di queste → forte supporto diagnostico
  
- **Features supportive**: spongiosi, BZH, papille, fibrosi, alterazioni epiteliali
  - Contribuiscono al pattern complessivo

**Criteri decisionali:**
- Alta specificità ≥2 **OPPURE** features totali ≥3 (senza elementi atipici) → EoE confermata
- Features totali ≥1 → compatibile con EoE
- Features totali = 0 → pattern atipico, considerare alternative

Questo approccio riflette meglio la realtà diagnostica: alcune features "pesano" di più nella decisione.

---

## Criteri diagnostici (ACG 2025)

La diagnosi di EoE richiede **tutti e tre**:

1. **Sintomi di disfunzione esofagea** (valutazione clinica)
2. **≥15 eosinofili/HPF** su biopsia esofagea
3. **Esclusione di altre cause** di eosinofilia esofagea

### Note importanti

- La **risposta a PPI non esclude più la diagnosi** (dal 2018, AGREE consensus)
- La malattia è **patchy**: raccomandate ≥6 biopsie da ≥2 livelli esofagei
- Il **conteggio eosinofilo da solo non è patognomonico**
- Features accessorie aumentano la specificità diagnostica
- **L'istologia da sola non basta**: necessaria correlazione clinica-endoscopica

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
| **GERD** | Eosinofilia solitamente <15/HPF, prevalenza distale, erosioni comuni, può coesistere |
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
- File HTML autosufficiente (~34 KB)
- Funziona offline
- **Ottimizzato per mobile**: responsive design con touch targets appropriati (≥24px)

---

## Utilizzo

1. Aprire il file HTML nel browser
2. **Step 1:** Inserire il peak eosinophil count per livello esofageo
3. **Step 2:** Selezionare le features istologiche presenti
4. **Step 3:** Indicare eventuali elementi di esclusione/diagnosi alternativa
5. **Step 4:** Specificare la distribuzione dell'eosinofilia
6. **Step 5 (opzionale):** Compilare l'EoE-HSS se necessario per follow-up
7. Cliccare "**Genera Proposta Diagnostica**"
8. Rivedere la proposta, validarla nel contesto clinico
9. Copiare il referto suggerito se appropriato

---

## Limitazioni e disclaimer

### ⚠️ IMPORTANTE

- **Non sostituisce il giudizio clinico-patologico**
- La diagnosi di EoE è **clinico-patologica** e richiede integrazione con:
  - Sintomi di disfunzione esofagea
  - Aspetto endoscopico
  - Esclusione di altre cause
- Il tool genera una **proposta diagnostica**, non una diagnosi definitiva
- **L'istologia da sola non basta**: senza correlazione clinica-endoscopica, la diagnosi non può essere posta
- Il conteggio degli eosinofili può variare secondo l'area HPF del microscopio utilizzato
- La valutazione di alcune features (es. degranulazione) è operator-dependent
- Non considera l'anamnesi farmacologica o alimentare del paziente
- Non valuta la risposta a terapia (utile per diagnosi iniziale)

---

## Bibliografia principale

1. Dellon ES et al. *ACG Clinical Guideline: Diagnosis and Management of Eosinophilic Esophagitis.* Am J Gastroenterol 2025;120(1):31-59

2. Amil-Dias J et al. *Diagnosis and management of eosinophilic esophagitis in children: An ESPGHAN update.* J Pediatr Gastroenterol Nutr 2024;79(1):1-44

3. Collins MH et al. *Newly developed and validated eosinophilic esophagitis histology scoring system.* Dis Esophagus 2017;30(3):1-8

4. Dellon ES et al. *Updated international consensus diagnostic criteria for eosinophilic esophagitis: AGREE Conference.* Gastroenterology 2018;155(4):1022-1033

5. Collins MH et al. *Histopathology of Eosinophilic Esophagitis.* Immunol Allergy Clin North Am 2024;44(2):205-221

(Bibliografia completa: vedi 17 riferimenti nel tool)

---

## Changelog

### v1.1 (Gennaio 2026)
- **Logica features più flessibile**: valutazione qualitativa invece di conteggio rigido ≥2
- **Features categorizzate**: alta specificità (★) vs supportive
- **Disclaimer prominente**: spostato sopra il pulsante, enfasi su "proposta" vs "diagnosi"
- **HPF area warning**: nota esplicita su variabilità 0.20-0.30 mm² tra microscopi
- **Report più concisi**: eliminata verbosità quando diagnosi chiara
- **Reminder correlazione clinica**: aggiunto nel referto quando proposta EoE
- **Testi migliorati**: erosioni/neutrofili da "esclusione" a "inusuali/red flag"
- **UI refinements**: features list con indicatori specificità, titoli corretti
- **Mobile-friendly**: media queries complete per uso su smartphone/tablet (touch targets 24px, layout responsive, tab verticali)

### v1.0 (Dicembre 2025)
- Release iniziale
- Implementazione criteri ACG 2025
- EoE-HSS completo (grade + stage)
- Generazione automatica referto
- Bibliografia aggiornata (17 riferimenti)

---

## Filosofia del tool

Questo non è un algoritmo deterministico ma una **grammatica diagnostica**: fornisce una struttura per organizzare il pensiero morfologico, non una formula per sostituirlo.

Il messaggio che passa è chiaro:
> **L'EoE non è una cifra, è un pattern istologico contestuale.**

E questo è esattamente il messaggio giusto da dare in un'epoca di patologi sotto pressione e clinici algoritmici.

---

## Note per uso didattico

Il tool può essere utilizzato per:
- Training specializzandi in anatomia patologica
- Discussioni multidisciplinari (patologo-gastroenterologo)
- Standardizzazione refertazione intra-laboratorio
- Quality assurance diagnostica

**Non dovrebbe** essere usato per:
- Diagnosi automatica senza validazione del patologo
- Casi complessi senza discussione con il team
- Sostituzione della valutazione morfologica diretta

---

## Contatti e feedback

Per segnalazioni, suggerimenti o richieste di miglioramento:

**Dr. Filippo Bianchi**  
Direttore SC Anatomia Patologica  
ASST Fatebenefratelli-Sacco, Milano  
Email: filippo.bianchi@asst-fbf-sacco.it

---

**Disclaimer finale:** Questo strumento è un **supporto decisionale** per il patologo e non sostituisce la valutazione professionale. La diagnosi finale deve integrare dati clinici, endoscopici e istologici secondo le linee guida vigenti. L'autore non si assume responsabilità per decisioni cliniche basate esclusivamente su questo tool.
