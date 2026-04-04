#!/usr/bin/env python3
"""Extended DNA Analysis - Additional Panels"""
import json
import pandas as pd
from collections import defaultdict

# Load raw data
print("Loading raw data...")
df = pd.read_csv('raw_data.txt', sep='\t', comment='#', 
                 names=['rsid', 'chromosome', 'position', 'allele1', 'allele2'],
                 low_memory=False)
df['genotype'] = df['allele1'] + df['allele2']

# Create lookup
snp_dict = dict(zip(df['rsid'], df['genotype']))

def lookup(rsid):
    return snp_dict.get(rsid, 'NA')

results = {}

# =====================================
# 1. EXPANDED CARDIOVASCULAR PANEL
# =====================================
print("\n=== EXPANDED CARDIOVASCULAR ===")
cardio = {
    'rs4977574': {'name': '9p21.3 CAD', 'risk': 'G'},
    'rs1333049': {'name': '9p21 CDKN2A/B', 'risk': 'C'},
    'rs10757278': {'name': '9p21 primary', 'risk': 'G'},
    'rs2383206': {'name': '9p21 secondary', 'risk': 'G'},
    'rs10116277': {'name': '9p21 tertiary', 'risk': 'T'},
    'rs6922269': {'name': 'MTHFD1L MI', 'risk': 'A'},
    'rs17465637': {'name': 'MIA3 CAD', 'risk': 'C'},
    'rs9818870': {'name': 'MRAS CAD', 'risk': 'T'},
    'rs1746048': {'name': 'CXCL12 CAD', 'risk': 'C'},
    'rs12526453': {'name': 'PHACTR1 CAD', 'risk': 'C'},
    'rs3798220': {'name': 'LPA MI (high risk)', 'risk': 'C'},
    'rs10455872': {'name': 'LPA CAD', 'risk': 'G'},
    'rs11206510': {'name': 'PCSK9 LDL', 'risk': 'T'},
    'rs515135': {'name': 'APOB LDL', 'risk': 'C'},
    'rs2228671': {'name': 'LDLR LDL', 'risk': 'T'},
    'rs629301': {'name': 'SORT1 LDL', 'risk': 'T'},
    'rs1800588': {'name': 'LIPC HDL', 'risk': 'C'},
    'rs12678919': {'name': 'LPL triglycerides', 'risk': 'A'},
    'rs964184': {'name': 'ZPR1 triglycerides', 'risk': 'G'},
}
results['cardiovascular_extended'] = {}
for rsid, info in cardio.items():
    gt = lookup(rsid)
    risk_count = gt.count(info['risk']) if gt != 'NA' else 'NA'
    results['cardiovascular_extended'][rsid] = {
        'name': info['name'], 'genotype': gt, 'risk_alleles': risk_count
    }
    print(f"  {info['name']}: {gt} (risk alleles: {risk_count})")

# =====================================
# 2. EXPANDED CANCER RISK PANEL
# =====================================
print("\n=== CANCER RISK MARKERS ===")
cancer = {
    'rs1042522': {'name': 'TP53 codon 72', 'note': 'Arg/Pro polymorphism'},
    'rs2279744': {'name': 'MDM2 T309G', 'note': 'p53 regulation'},
    'rs6983267': {'name': '8q24 colorectal', 'risk': 'G'},
    'rs10795668': {'name': '10p14 colorectal', 'risk': 'A'},
    'rs16892766': {'name': '8q23.3 colorectal', 'risk': 'A'},
    'rs13281615': {'name': '8q24 breast', 'risk': 'G'},
    'rs2981582': {'name': 'FGFR2 breast', 'risk': 'A'},
    'rs3803662': {'name': 'TOX3 breast', 'risk': 'A'},
    'rs889312': {'name': 'MAP3K1 breast', 'risk': 'C'},
    'rs1447295': {'name': '8q24 prostate', 'risk': 'A'},
    'rs4242382': {'name': '8q24 prostate 2', 'risk': 'A'},
    'rs16901979': {'name': '8q24 prostate 3', 'risk': 'A'},
    'rs401681': {'name': 'TERT lung', 'risk': 'T'},
    'rs2736100': {'name': 'TERT telomere', 'risk': 'C'},  # already checked but confirm
    'rs4488809': {'name': 'TP63 bladder', 'risk': 'T'},
    'rs1799782': {'name': 'XRCC1 DNA repair', 'risk': 'T'},
    'rs25487': {'name': 'XRCC1 Arg399Gln', 'risk': 'A'},
    'rs1052133': {'name': 'OGG1 DNA repair', 'risk': 'G'},
    'rs1805007': {'name': 'MC1R melanoma', 'risk': 'T'},  # red hair gene = melanoma risk
    'rs910873': {'name': 'IRF4 melanoma', 'risk': 'C'},
}
results['cancer_risk'] = {}
for rsid, info in cancer.items():
    gt = lookup(rsid)
    results['cancer_risk'][rsid] = {'name': info['name'], 'genotype': gt}
    print(f"  {info['name']}: {gt}")

# =====================================
# 3. PSYCHIATRIC/NEUROPSYCH EXPANDED
# =====================================
print("\n=== PSYCHIATRIC MARKERS ===")
psych = {
    'rs4680': {'name': 'COMT Val158Met', 'already': True},
    'rs6265': {'name': 'BDNF Val66Met', 'already': True},
    'rs1800497': {'name': 'DRD2 Taq1A', 'already': True},
    'rs53576': {'name': 'OXTR empathy', 'already': True},
    'rs4570625': {'name': 'TPH2 serotonin', 'note': 'anxiety/depression'},
    'rs6313': {'name': 'HTR2A serotonin receptor', 'note': 'antidepressant response'},
    'rs6311': {'name': 'HTR2A promoter', 'note': 'serotonin function'},
    'rs1799971': {'name': 'OPRM1 A118G', 'note': 'opioid receptor, reward'},
    'rs25531': {'name': '5-HTTLPR SLC6A4', 'note': 'serotonin transporter'},
    'rs140700': {'name': 'SLC6A4 serotonin transporter', 'note': 'SSRI response'},
    'rs7794745': {'name': 'CNTNAP2 autism/language', 'risk': 'T'},
    'rs2710102': {'name': 'CNTNAP2 second', 'risk': 'T'},
    'rs1006737': {'name': 'CACNA1C bipolar', 'risk': 'A'},
    'rs10994336': {'name': 'ANK3 bipolar', 'risk': 'T'},
    'rs12899193': {'name': 'NRGN schizophrenia', 'risk': 'T'},
    'rs6904071': {'name': 'ZNF804A schizophrenia', 'risk': 'T'},
    'rs1360780': {'name': 'FKBP5 stress response', 'note': 'PTSD risk'},
    'rs9296158': {'name': 'FKBP5 second', 'note': 'cortisol regulation'},
    'rs3800373': {'name': 'FKBP5 third', 'note': 'HPA axis'},
    'rs6269': {'name': 'COMT haplotype A', 'note': 'pain sensitivity'},
    'rs4818': {'name': 'COMT haplotype B', 'note': 'pain sensitivity'},
    'rs4633': {'name': 'COMT haplotype C', 'note': 'pain sensitivity'},
}
results['psychiatric'] = {}
for rsid, info in psych.items():
    gt = lookup(rsid)
    results['psychiatric'][rsid] = {'name': info['name'], 'genotype': gt, 'note': info.get('note', '')}
    print(f"  {info['name']}: {gt}")

# =====================================
# 4. INTELLIGENCE/COGNITION
# =====================================
print("\n=== COGNITION MARKERS ===")
cognition = {
    'rs363050': {'name': 'SNAP25 IQ', 'note': 'synaptic function'},
    'rs17070145': {'name': 'KIBRA memory', 'note': 'T carriers have better episodic memory'},
    'rs1800497': {'name': 'DRD2 learning', 'already': True},
    'rs6265': {'name': 'BDNF neuroplasticity', 'already': True},
    'rs4680': {'name': 'COMT working memory', 'already': True},
    'rs2228611': {'name': 'DRD4 attention', 'note': 'ADHD association'},
    'rs1611115': {'name': 'DBH dopamine beta-hydroxylase', 'note': 'attention'},
    'rs1000952': {'name': 'CHRNA4 nicotinic receptor', 'note': 'attention'},
    'rs324650': {'name': 'NRXN1 synaptic', 'note': 'autism/learning'},
}
results['cognition'] = {}
for rsid, info in cognition.items():
    gt = lookup(rsid)
    results['cognition'][rsid] = {'name': info['name'], 'genotype': gt, 'note': info.get('note', '')}
    print(f"  {info['name']}: {gt}")

# =====================================
# 5. AUTOIMMUNE/INFLAMMATION EXPANDED
# =====================================
print("\n=== AUTOIMMUNE/INFLAMMATION ===")
autoimmune = {
    'rs2476601': {'name': 'PTPN22 autoimmune master', 'risk': 'A'},
    'rs3761847': {'name': 'TRAF1-C5 rheumatoid', 'risk': 'G'},
    'rs6457617': {'name': 'HLA-DQB1 RA', 'risk': 'T'},
    'rs2104286': {'name': 'IL2RA MS/T1D', 'risk': 'A'},
    'rs12722489': {'name': 'IL2RA second', 'risk': 'C'},
    'rs3129934': {'name': 'HLA-DRB1 MS', 'risk': 'T'},
    'rs7574865': {'name': 'STAT4 lupus/RA', 'risk': 'T'},
    'rs10488631': {'name': 'IRF5 lupus', 'risk': 'C'},
    'rs7903146': {'name': 'TCF7L2 T2D (checked)', 'already': True},
    'rs1990760': {'name': 'IFIH1 T1D', 'risk': 'A'},
    'rs12708716': {'name': 'CLEC16A T1D', 'risk': 'A'},
    'rs17696736': {'name': 'NAA25 T1D', 'risk': 'G'},
    'rs11209026': {'name': 'IL23R Crohn/IBD protective', 'protective': 'A'},
    'rs2241880': {'name': 'ATG16L1 Crohn', 'risk': 'G'},
    'rs10883365': {'name': 'NKX2-3 IBD', 'risk': 'A'},
    'rs744166': {'name': 'STAT3 Crohn', 'risk': 'A'},
    'rs2188962': {'name': 'IL12B psoriasis', 'risk': 'C'},
    'rs11209026': {'name': 'IL23R psoriasis', 'risk': 'G'},
    'rs12720356': {'name': 'TYK2 psoriasis/autoimmune', 'risk': 'C'},
    'rs1800629': {'name': 'TNF-alpha inflammation', 'risk': 'A'},
    'rs1800795': {'name': 'IL-6 inflammation', 'note': 'C = higher IL-6'},
    'rs1800896': {'name': 'IL-10 anti-inflammatory', 'note': 'A = lower IL-10'},
}
results['autoimmune'] = {}
for rsid, info in autoimmune.items():
    gt = lookup(rsid)
    results['autoimmune'][rsid] = {'name': info['name'], 'genotype': gt}
    print(f"  {info['name']}: {gt}")

# =====================================
# 6. LONGEVITY EXPANDED
# =====================================
print("\n=== LONGEVITY MARKERS ===")
longevity = {
    'rs2736100': {'name': 'TERT telomere (checked)', 'already': True},
    'rs7762395': {'name': 'TERT second', 'note': 'telomere length'},
    'rs4420638': {'name': 'APOE/TOMM40 longevity', 'note': 'proxy for APOE4'},
    'rs2075650': {'name': 'TOMM40 longevity', 'note': 'strongest longevity SNP'},
    'rs429358': {'name': 'APOE4 defining (if present)', 'note': 'Alzheimer risk'},
    'rs7412': {'name': 'APOE2 defining (if present)', 'note': 'protective'},
    'rs2802292': {'name': 'FOXO3 longevity', 'protective': 'G'},
    'rs10457180': {'name': 'FOXO3 second', 'protective': 'T'},
    'rs12206094': {'name': 'FOXO3 third', 'protective': 'T'},
    'rs3758391': {'name': 'SIRT1 longevity', 'note': 'calorie restriction pathway'},
    'rs2234693': {'name': 'ESR1 longevity', 'note': 'estrogen receptor'},
}
results['longevity_extended'] = {}
for rsid, info in longevity.items():
    gt = lookup(rsid)
    results['longevity_extended'][rsid] = {'name': info['name'], 'genotype': gt, 'note': info.get('note', '')}
    print(f"  {info['name']}: {gt}")

# =====================================
# 7. METABOLISM EXPANDED
# =====================================
print("\n=== METABOLISM EXPANDED ===")
metabolism = {
    'rs9939609': {'name': 'FTO obesity (checked)', 'already': True},
    'rs1421085': {'name': 'FTO functional', 'risk': 'C'},
    'rs17782313': {'name': 'MC4R appetite', 'risk': 'C'},
    'rs1137101': {'name': 'LEPR leptin receptor', 'risk': 'G'},
    'rs7903146': {'name': 'TCF7L2 diabetes (checked)', 'already': True},
    'rs5219': {'name': 'KCNJ11 diabetes', 'risk': 'T'},
    'rs13266634': {'name': 'SLC30A8 diabetes', 'risk': 'C'},
    'rs10811661': {'name': 'CDKN2A/B diabetes', 'risk': 'T'},
    'rs4402960': {'name': 'IGF2BP2 diabetes', 'risk': 'T'},
    'rs1801282': {'name': 'PPARG Pro12Ala', 'note': 'insulin sensitivity'},
    'rs8050136': {'name': 'FTO second', 'risk': 'A'},
    'rs662799': {'name': 'APOA5 triglycerides', 'risk': 'G'},
    'rs328': {'name': 'LPL S474X', 'note': 'triglyceride metabolism'},
    'rs12255372': {'name': 'TCF7L2 second diabetes', 'risk': 'T'},
    'rs1801133': {'name': 'MTHFR (checked)', 'already': True},
    'rs1799883': {'name': 'FABP2 fat absorption', 'risk': 'A'},
}
results['metabolism_extended'] = {}
for rsid, info in metabolism.items():
    gt = lookup(rsid)
    results['metabolism_extended'][rsid] = {'name': info['name'], 'genotype': gt}
    print(f"  {info['name']}: {gt}")

# =====================================
# 8. PAIN/SENSITIVITY
# =====================================
print("\n=== PAIN/SENSITIVITY ===")
pain = {
    'rs4680': {'name': 'COMT pain sensitivity', 'note': 'GG = lower pain sensitivity'},
    'rs6269': {'name': 'COMT haplotype pain', 'note': 'part of pain haplotype'},
    'rs1799971': {'name': 'OPRM1 A118G', 'note': 'opioid response'},
    'rs1800587': {'name': 'IL1A pain/inflammation', 'note': 'musculoskeletal pain'},
    'rs16944': {'name': 'IL1B pain/inflammation', 'note': 'chronic pain'},
    'rs4986790': {'name': 'TLR4 pain', 'note': 'neuropathic pain'},
    'rs1800795': {'name': 'IL6 pain', 'note': 'fibromyalgia association'},
    'rs1800896': {'name': 'IL10 pain modulation', 'note': 'anti-inflammatory'},
    'rs324420': {'name': 'FAAH endocannabinoid', 'note': 'A = lower pain/anxiety'},
    'rs806380': {'name': 'CNR1 cannabinoid receptor', 'note': 'pain perception'},
}
results['pain_sensitivity'] = {}
for rsid, info in pain.items():
    gt = lookup(rsid)
    results['pain_sensitivity'][rsid] = {'name': info['name'], 'genotype': gt, 'note': info.get('note', '')}
    print(f"  {info['name']}: {gt}")

# =====================================
# 9. DRUG METABOLISM EXPANDED
# =====================================
print("\n=== PHARMACOGENOMICS EXPANDED ===")
pharma = {
    'rs9923231': {'name': 'VKORC1 warfarin (checked)', 'already': True},
    'rs1799853': {'name': 'CYP2C9*2 warfarin', 'note': 'poor metabolizer'},
    'rs1057910': {'name': 'CYP2C9*3 warfarin', 'note': 'poor metabolizer'},
    'rs4244285': {'name': 'CYP2C19*2 clopidogrel (checked)', 'already': True},
    'rs4986893': {'name': 'CYP2C19*3 clopidogrel', 'note': 'poor metabolizer'},
    'rs12248560': {'name': 'CYP2C19*17 clopidogrel', 'note': 'ultra-rapid metabolizer'},
    'rs762551': {'name': 'CYP1A2 caffeine (checked)', 'already': True},
    'rs4149056': {'name': 'SLCO1B1 statins (checked)', 'already': True},
    'rs2032582': {'name': 'ABCB1 drug transport', 'note': 'affects many drugs'},
    'rs1045642': {'name': 'ABCB1 C3435T', 'note': 'drug bioavailability'},
    'rs1128503': {'name': 'ABCB1 third', 'note': 'MDR1'},
    'rs20417': {'name': 'PTGS2 COX-2', 'note': 'NSAID response'},
    'rs5277': {'name': 'PTGS2 COX-2 second', 'note': 'NSAID GI effects'},
    'rs8099917': {'name': 'IL28B hepatitis C', 'note': 'treatment response'},
    'rs12979860': {'name': 'IL28B second', 'note': 'interferon response'},
    'rs3745274': {'name': 'CYP2B6 methadone/efavirenz', 'note': 'HIV drugs'},
    'rs28399433': {'name': 'CYP2A6 nicotine', 'note': 'smoking cessation drugs'},
    'rs1051740': {'name': 'EPHX1 drug metabolism', 'note': 'epoxide hydrolase'},
}
results['pharmacogenomics_extended'] = {}
for rsid, info in pharma.items():
    gt = lookup(rsid)
    results['pharmacogenomics_extended'][rsid] = {'name': info['name'], 'genotype': gt, 'note': info.get('note', '')}
    print(f"  {info['name']}: {gt}")

# =====================================
# 10. ADDITIONAL TRAITS
# =====================================
print("\n=== ADDITIONAL TRAITS ===")
traits = {
    'rs4988235': {'name': 'Lactase (checked)', 'already': True},
    'rs182549': {'name': 'Lactase regulatory', 'note': 'C = persistence'},
    'rs713598': {'name': 'TAS2R38 bitter/PTC (checked)', 'already': True},
    'rs10246939': {'name': 'TAS2R38 second bitter', 'note': 'cilantro taste'},
    'rs1726866': {'name': 'TAS2R38 third bitter', 'note': 'alcohol bitterness'},
    'rs17822931': {'name': 'ABCC11 earwax/sweat', 'note': 'CC = dry earwax, less BO'},
    'rs4481887': {'name': 'Asparagus anosmia', 'note': 'G = can smell asparagus pee'},
    'rs7294919': {'name': 'Hippocampus size', 'note': 'HMGA2'},
    'rs6602024': {'name': 'Neanderthal introgression tag', 'note': 'archaic admixture'},
    'rs4775936': {'name': 'Alopecia (balding)', 'note': 'T = higher risk'},
    'rs2180439': {'name': 'Androgenetic alopecia', 'note': 'A = risk'},
    'rs12896399': {'name': 'Hair color', 'note': 'SLC24A4'},
    'rs1800407': {'name': 'OCA2 eye color', 'note': 'blue eye modifier'},
    'rs7495174': {'name': 'OCA2 green eyes', 'note': 'green/hazel'},
    'rs2238289': {'name': 'Height HMGA2', 'note': 'contributes to height'},
    'rs3791679': {'name': 'Height EFEMP1', 'note': 'contributes to height'},
    'rs1042725': {'name': 'Height HMGA1', 'note': 'contributes to height'},
}
results['traits_extended'] = {}
for rsid, info in traits.items():
    gt = lookup(rsid)
    results['traits_extended'][rsid] = {'name': info['name'], 'genotype': gt, 'note': info.get('note', '')}
    print(f"  {info['name']}: {gt}")

# =====================================
# 11. ANCESTRY INFORMATIVE MARKERS
# =====================================
print("\n=== ANCESTRY INFORMATIVE MARKERS ===")
aims = {
    'rs12913832': {'name': 'HERC2/OCA2 eye color', 'note': 'GG=blue, AG=green, AA=brown'},
    'rs16891982': {'name': 'SLC45A2 skin', 'note': 'GG=European light skin'},
    'rs1426654': {'name': 'SLC24A5 skin', 'note': 'AA=light skin (Neolithic farmer)'},
    'rs2228479': {'name': 'MC1R red hair 2', 'note': 'European redhead'},
    'rs1805008': {'name': 'MC1R R160W', 'note': 'European redhead'},
    'rs1805009': {'name': 'MC1R D294H', 'note': 'European redhead'},
    'rs4778138': {'name': 'OCA2 eye color', 'note': 'European light eyes'},
    'rs2031526': {'name': 'East Asian marker', 'note': 'EDAR hair thickness'},
    'rs3827760': {'name': 'EDAR Asian hair', 'note': 'A=thick straight hair (East Asian)'},
    'rs260690': {'name': 'African marker ABCC11', 'note': 'West African signature'},
}
results['ancestry_informative'] = {}
for rsid, info in aims.items():
    gt = lookup(rsid)
    results['ancestry_informative'][rsid] = {'name': info['name'], 'genotype': gt, 'note': info.get('note', '')}
    print(f"  {info['name']}: {gt}")

# =====================================
# CALCULATE STATS
# =====================================
print("\n=== GENOTYPE STATISTICS ===")
total_snps = len(df)
heterozygous = sum(1 for _, r in df.iterrows() if r['allele1'] != r['allele2'] and r['allele1'] != '0' and r['allele2'] != '0')
homozygous = sum(1 for _, r in df.iterrows() if r['allele1'] == r['allele2'] and r['allele1'] != '0')
missing = sum(1 for _, r in df.iterrows() if r['allele1'] == '0' or r['allele2'] == '0')

het_rate = heterozygous / (heterozygous + homozygous) if (heterozygous + homozygous) > 0 else 0

stats = {
    'total_snps': total_snps,
    'heterozygous': heterozygous,
    'homozygous': homozygous,
    'missing': missing,
    'heterozygosity_rate': round(het_rate, 4),
    'call_rate': round((total_snps - missing) / total_snps, 4)
}
results['statistics'] = stats

print(f"  Total SNPs: {total_snps:,}")
print(f"  Heterozygous: {heterozygous:,}")
print(f"  Homozygous: {homozygous:,}")
print(f"  Missing: {missing:,}")
print(f"  Heterozygosity rate: {het_rate:.4f}")
print(f"  Call rate: {(total_snps - missing) / total_snps:.4f}")

# =====================================
# CHROMOSOME DISTRIBUTION
# =====================================
print("\n=== CHROMOSOME DISTRIBUTION ===")
chrom_counts = df['chromosome'].value_counts()
results['chromosome_distribution'] = chrom_counts.to_dict()
for chrom in ['1', '2', '3', '22', 'X', 'Y']:
    if chrom in chrom_counts.index:
        print(f"  Chr {chrom}: {chrom_counts[chrom]:,}")

# =====================================
# SAVE RESULTS
# =====================================
with open('reports/extended_analysis_results.json', 'w') as f:
    json.dump(results, f, indent=2, default=str)

print(f"\n✓ Results saved to reports/extended_analysis_results.json")
print(f"✓ Analyzed {len(results)} panels with {sum(len(v) for k, v in results.items() if isinstance(v, dict)):,} total markers")
