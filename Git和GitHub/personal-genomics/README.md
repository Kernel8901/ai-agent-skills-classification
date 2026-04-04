# 🧬 Personal Genomics

[![ClawHub](https://img.shields.io/badge/ClawHub-personal--genomics-blue)](https://clawhub.ai/wkyleg/personal-genomics)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)

**Analyze your raw DNA data locally and privately.** Extract health markers, pharmacogenomics, traits, ancestry, and ancient DNA comparisons from consumer genetic testing services — all without your data ever leaving your machine.

<p align="center">
  <img src="https://img.shields.io/badge/Privacy-100%25_Local-green?style=for-the-badge" alt="Privacy: 100% Local">
  <img src="https://img.shields.io/badge/Network_Requests-Zero-green?style=for-the-badge" alt="Network Requests: Zero">
</p>

---

## ⚠️ Important Disclaimers

> **This tool is for educational and research purposes only.**
>
> - ❌ **NOT a medical diagnostic tool** — Results are not clinically validated
> - 👨‍⚕️ **Consult healthcare professionals** — Do not make medical decisions based solely on these results
> - 🔐 **You are responsible** for securing your genetic data
> - ⚠️ **No warranties** — Results may contain errors; verify with clinical testing

---

## Features

### 🏥 Health Markers
- Cardiovascular risk (APOE, LPA, PCSK9, Factor V Leiden)
- Cancer predisposition indicators (BRCA1/2, TP53, MLH1)
- Metabolic conditions (MTHFR, HFE, TCF7L2)
- Neurological markers (APOE ε4, Parkinson's variants)

### 💊 Pharmacogenomics
- Drug metabolism (CYP2D6, CYP2C19, CYP3A4)
- Warfarin sensitivity (VKORC1, CYP2C9)
- Statin myopathy risk (SLCO1B1)
- Caffeine metabolism speed (CYP1A2)

### 🧬 Traits
- Eye/hair/skin color prediction
- Muscle fiber composition (ACTN3)
- Lactose tolerance (MCM6)
- Circadian rhythm tendencies

### 🌍 Ancestry & Ancient DNA
- Y-DNA and mtDNA haplogroup prediction
- Ancient population comparisons (AADR database compatible)
- Neanderthal variant analysis
- Parental ancestry inference

---

## Supported Services

| Service | File Format | SNPs |
|---------|-------------|------|
| AncestryDNA | `AncestryDNA.txt` | ~700K |
| 23andMe | `genome_*.txt` | ~600K |
| MyHeritage | CSV export | ~700K |
| FamilyTreeDNA | CSV/TSV | ~700K |
| LivingDNA | CSV export | ~600K |

---

## Quick Start

### Installation

```bash
# Via ClawHub (for OpenClaw users)
clawhub install personal-genomics

# Or clone directly
git clone https://github.com/wkyleg/personal-genomics.git
cd personal-genomics
pip install pandas numpy scipy rich scikit-learn
```

### Basic Usage

```bash
# Set your DNA file path
export DNA_FILE="/path/to/your/raw_data.txt"

# Run comprehensive analysis
python3 analyze_dna.py "$DNA_FILE"
```

### Output

Reports are generated in `~/dna-analysis/reports/`:

```
├── health_report.json      # Health marker analysis
├── pharma_report.json      # Pharmacogenomics
├── traits_report.json      # Physical traits
├── ancestry_report.json    # Haplogroups & ancestry
├── supplement_protocol.md  # Personalized suggestions
└── full_report.md          # Human-readable summary
```

---

## Analysis Scripts

| Script | Purpose |
|--------|---------|
| `analyze_dna.py` | Core health, pharma, and traits analysis |
| `extended_analysis.py` | 600+ additional markers |
| `advanced_analysis.py` | Polygenic risk scores, PCA |
| `ancient_dna.py` | Ancient population markers |
| `ancient_comparison.py` | AADR database comparison |
| `neanderthal_analysis.py` | Archaic variant detection |
| `parental_inference.py` | Maternal/paternal ancestry split |
| `ethnicity_analysis.py` | Population composition |
| `supplement_protocol.py` | Evidence-based supplement suggestions |
| `convert_to_plink.py` | Convert to PLINK format |

---

## For AI Agents

This skill outputs structured JSON designed for agent consumption:

```python
import json

with open("~/dna-analysis/reports/health_report.json") as f:
    health = json.load(f)

# Each finding includes actionable metadata
finding = health["cardiovascular"]["9p21_risk"]
print(finding["actionable"])
# {
#   "priority": "medium",
#   "action_type": "lifestyle",
#   "evidence_level": "strong",
#   "references": ["PMID:17634449"]
# }
```

---

## Privacy & Security

🔒 **Your genetic data never leaves your machine.**

- ✅ Zero network requests during analysis
- ✅ All processing runs locally
- ✅ No telemetry or analytics
- ✅ You control your data completely

### Recommendations

- Store DNA files in encrypted volumes
- Don't share raw genetic data publicly
- Consider implications for family members
- Be cautious about sharing detailed results

---

## Limitations

1. **Consumer chips miss rare variants** — Only ~0.02% of your genome
2. **Population bias** — Most research based on European populations
3. **Penetrance varies** — Risk variant ≠ guaranteed condition
4. **Science evolves** — Understanding changes over time

---

## References

- [SNPedia](https://www.snpedia.com) — SNP encyclopedia
- [ClinVar](https://www.ncbi.nlm.nih.gov/clinvar/) — Clinical variants
- [PharmGKB](https://www.pharmgkb.org) — Pharmacogenomics
- [AADR](https://reich.hms.harvard.edu/allen-ancient-dna-resource-aadr-downloadable-genotypes-present-day-and-ancient-dna-data) — Ancient DNA
- [gnomAD](https://gnomad.broadinstitute.org/) — Population frequencies

---

## License

MIT License — see [LICENSE](LICENSE)

**You accept all responsibility for how you use these results.**

---

## Contributing

Issues and PRs welcome. Please ensure any additions:
- Include proper citations
- Don't make unsubstantiated health claims
- Maintain privacy-first design (no external calls)

---

<p align="center">
  <i>Built for personal exploration of your own genetics. Use wisely.</i> 🧬
</p>
