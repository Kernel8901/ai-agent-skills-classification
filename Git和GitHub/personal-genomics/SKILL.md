---
name: personal-genomics
description: Analyze raw DNA data from consumer genetics services (23andMe, AncestryDNA, etc.). Extract health markers, pharmacogenomics, traits, ancestry composition, ancient DNA comparisons, and generate comprehensive reports. Uses open-source bioinformatics tools locally — no data leaves your machine.
metadata:
  {
    "openclaw": {
      "emoji": "🧬",
      "homepage": "https://github.com/wkyleg/personal-genomics",
      "requires": { "bins": ["python3"], "env": [] },
      "install": [
        {
          "id": "uv",
          "kind": "uv",
          "requirements": ["pandas", "numpy", "scipy", "rich", "scikit-learn"],
          "label": "Install Python dependencies (uv)"
        }
      ]
    }
  }
---

# Personal Genomics Analysis 🧬

> **⚠️ IMPORTANT DISCLAIMERS**
> 
> **This tool is for educational and research purposes only.**
> 
> - **NOT a medical diagnostic tool** — Results are not clinically validated
> - **Consult healthcare professionals** — Do not make medical decisions based solely on these results
> - **Privacy responsibility** — You are responsible for securing your genetic data
> - **No warranties** — Results may contain errors; verify with clinical testing
> - **Genetic data is sensitive** — Once exposed, it cannot be "unexposed"

Analyze your raw DNA data locally and privately. **No data is uploaded anywhere.**

## Security & Privacy

🔒 **All analysis runs 100% locally on your machine**

- Zero network requests during analysis
- Your genetic data never leaves your computer
- Results stored only in your local filesystem
- No telemetry, no analytics, no external calls
- You control your data completely

**Recommendations:**
- Store DNA files in encrypted volumes
- Don't share raw genetic data publicly
- Be cautious about sharing detailed health results
- Consider implications for family members (shared genetics)

## Supported Input Formats

| Service | File Pattern | SNP Count |
|---------|--------------|-----------|
| **AncestryDNA** | `AncestryDNA.txt` | ~700K |
| **23andMe** | `genome_*.txt` | ~600K |
| **MyHeritage** | CSV export | ~700K |
| **FamilyTreeDNA** | CSV/TSV export | ~700K |
| **LivingDNA** | CSV export | ~600K |

## Quick Start

```bash
# Set your DNA file path
export DNA_FILE="/path/to/your/raw_data.txt"

# Run comprehensive analysis
python3 {baseDir}/analyze_dna.py "$DNA_FILE"
```

## Analysis Capabilities

### 🏥 Health Markers
- **Cardiovascular:** APOE, LPA, PCSK9, F5 (Factor V Leiden), 9p21
- **Cancer predisposition:** BRCA1/2 indicators, TP53, MLH1, APC
- **Metabolic:** MTHFR, HFE (hemochromatosis), TCF7L2 (diabetes)
- **Autoimmune:** HLA variants, celiac markers
- **Neurological:** APOE ε4 (Alzheimer's risk), Parkinson's markers
- **Eye health:** CFH, ARMS2 (macular degeneration)

### 💊 Pharmacogenomics
- **Drug metabolism:** CYP2D6, CYP2C19, CYP3A4, CYP2C9
- **Warfarin:** VKORC1 sensitivity, CYP2C9 variants
- **Statins:** SLCO1B1 myopathy risk
- **Opioids:** OPRM1 response variants
- **Antidepressants:** SLC6A4, HTR2A response
- **Caffeine:** CYP1A2 metabolism speed

### 🧬 Traits & Characteristics
- Eye/hair/skin color prediction
- Muscle fiber composition (ACTN3)
- Caffeine metabolism speed
- Lactose tolerance (MCM6)
- Circadian rhythm (CLOCK genes)
- Alcohol flush reaction (ALDH2)
- Bitter taste perception (TAS2R38)

### 🌍 Ancestry & Ancient DNA
- Y-DNA haplogroup prediction
- mtDNA haplogroup prediction
- Ancient population comparisons (AADR database)
- Neanderthal variant analysis
- Population-specific markers
- Parental ancestry inference

### 📊 Advanced Data Science
- Polygenic risk score calculations
- Principal component analysis (PCA)
- Population clustering
- ROH (runs of homozygosity) analysis
- Rare variant identification

## Output

Reports are generated in `~/dna-analysis/reports/`:

| File | Contents |
|------|----------|
| `health_report.json` | Health marker analysis |
| `pharma_report.json` | Pharmacogenomics |
| `traits_report.json` | Physical traits |
| `ancestry_report.json` | Haplogroups & ancestry |
| `ancient_dna_report.json` | Ancient population matches |
| `supplement_protocol.md` | Personalized supplement suggestions |
| `full_report.md` | Human-readable comprehensive summary |

## Advanced Analysis Scripts

### Health & Pharmacogenomics
```bash
python3 {baseDir}/analyze_dna.py "$DNA_FILE"           # Core analysis
python3 {baseDir}/extended_analysis.py "$DNA_FILE"     # 600+ markers
python3 {baseDir}/advanced_analysis.py "$DNA_FILE"     # PRS & clustering
```

### Ancestry & Ancient DNA
```bash
python3 {baseDir}/ethnicity_analysis.py "$DNA_FILE"    # Population composition
python3 {baseDir}/ancient_dna.py "$DNA_FILE"           # Ancient markers
python3 {baseDir}/ancient_comparison.py "$DNA_FILE"    # AADR comparison
python3 {baseDir}/neanderthal_analysis.py "$DNA_FILE"  # Archaic variants
python3 {baseDir}/parental_inference.py "$DNA_FILE"    # Maternal/paternal split
```

### Utilities
```bash
python3 {baseDir}/convert_to_plink.py "$DNA_FILE" out  # PLINK format
python3 {baseDir}/supplement_protocol.py "$DNA_FILE"   # Supplement suggestions
```

## For AI Agents

### Structured Output for Agent Consumption

All JSON reports use consistent schemas for easy parsing:

```python
# Example: Reading health results
import json
with open("~/dna-analysis/reports/health_report.json") as f:
    health = json.load(f)
    
# Access specific markers
apoe_status = health["alzheimers"]["apoe_status"]
cardiovascular_risk = health["cardiovascular"]["risk_level"]
```

### Agent-Actionable Insights

The reports include `actionable` fields:
- `priority`: high/medium/low
- `action_type`: monitor/discuss_with_doctor/lifestyle/supplement
- `evidence_level`: strong/moderate/preliminary
- `references`: PubMed IDs for verification

### Integration Example

```python
# Your agent can use this pattern:
if health["mthfr"]["status"] == "compound_heterozygous":
    if health["mthfr"]["actionable"]["priority"] == "high":
        suggest_supplement("methylfolate", "400-800mcg")
```

## Requirements

- Python 3.10+
- ~500MB disk space for analysis
- 4GB RAM recommended
- Optional: plink2 for advanced analysis

## Installation

```bash
# Via ClawHub
clawhub install personal-genomics

# Or manually
git clone https://github.com/wkyleg/personal-genomics
cd personal-genomics
pip install pandas numpy scipy rich scikit-learn
```

## Limitations

⚠️ **Important limitations to understand:**

1. **Consumer chips miss rare variants** — Only ~0.02% of genome covered
2. **Imputation has errors** — Some reported variants are statistical guesses
3. **Population bias** — Most research is on European populations
4. **Penetrance varies** — Having a risk variant ≠ getting the condition
5. **Environment matters** — Genetics is only part of health outcomes
6. **Science evolves** — Today's understanding may change

## Ethical Considerations

- **Family implications:** Your DNA reveals information about relatives
- **Insurance:** Some jurisdictions allow genetic discrimination
- **Employment:** Consider privacy before sharing results
- **Law enforcement:** DNA databases have been used in investigations
- **Future unknowns:** We don't know all future uses of genetic data

## References

- [SNPedia](https://www.snpedia.com) — SNP encyclopedia
- [ClinVar](https://www.ncbi.nlm.nih.gov/clinvar/) — Clinical variants
- [PharmGKB](https://www.pharmgkb.org) — Pharmacogenomics
- [AADR](https://reich.hms.harvard.edu/allen-ancient-dna-resource-aadr-downloadable-genotypes-present-day-and-ancient-dna-data) — Ancient DNA
- [gnomAD](https://gnomad.broadinstitute.org/) — Population frequencies

## License

MIT License — Use freely, but **you accept all responsibility for how you use results**.

---

*Built for personal exploration of your own genetics. Use wisely.* 🧬
