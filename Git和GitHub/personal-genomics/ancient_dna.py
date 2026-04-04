import json

# Load DNA data
snp_data = {}
with open('raw_data.txt', 'r') as f:
    for line in f:
        if line.startswith('#') or line.startswith('rsid'):
            continue
        parts = line.strip().split('\t')
        if len(parts) >= 5:
            rsid, chrom, pos, a1, a2 = parts[:5]
            snp_data[rsid] = a1 + a2

def get(rsid):
    return snp_data.get(rsid, 'NA')

print("="*70)
print("ANCIENT DNA COMPARISON")
print("="*70)
print("""
Comparing your genetic markers to ancient population signatures.
These markers help trace which ancestral migrations contributed to your genome.
""")

# ANCIENT POPULATION MARKERS
print("\n🏛️ NEOLITHIC FARMER MARKERS (Anatolia → Europe ~8,000 years ago)")
print("-"*60)

# SLC24A5 - the "light skin" allele spread with Neolithic farmers
slc24a5 = get('rs1426654')
print(f"  SLC24A5 (rs1426654): {slc24a5}")
if 'A' in slc24a5:
    print("  → A allele: Derived from Anatolian farmers")
    print("  → This mutation for lighter skin spread with agriculture into Europe")
    print("  → You carry the Neolithic farmer variant ✓")

# LCT - lactase persistence emerged ~7,500 years ago
lct = get('rs4988235')
print(f"\n  LCT lactase (rs4988235): {lct}")
if 'A' in lct:
    print("  → A allele: Lactase persistence mutation")
    print("  → Emerged in dairy-farming populations ~7,500 years ago")
    print("  → Spread from Pontic Steppe with Indo-European migrations")
    print("  → Strong positive selection in Northern Europe ✓")

print("\n\n🐴 YAMNAYA / INDO-EUROPEAN MARKERS (~5,000 years ago)")
print("-"*60)
print("""
The Yamnaya were Bronze Age pastoralists from the Pontic-Caspian Steppe.
They spread across Europe ~5,000 years ago, bringing:
  • Indo-European languages (including Proto-Celtic)
  • The R1b Y-haplogroup (your likely paternal line)
  • Lactase persistence
  • Horse domestication
""")

# Yamnaya had high frequency of R1b (which you likely carry)
print("  Y-haplogroup: Likely R1b-L21")
print("  → R1b originated in Yamnaya and spread with Bronze Age migrations")
print("  → R1b-L21 (Atlantic/Celtic) is a European descendant branch")
print("  → Your paternal line traces to Yamnaya expansion ✓")

# HERC2 blue eyes - ancient in Europe, pre-Yamnaya
herc2 = get('rs12913832')
print(f"\n  HERC2 eye color (rs12913832): {herc2}")
if 'G' in herc2:
    print("  → G allele: Blue/green eye variant")
    print("  → Ancient in Europe - found in Mesolithic hunter-gatherers")
    print("  → Pre-dates Yamnaya migrations")
    print("  → You carry ancient European hunter-gatherer ancestry ✓")

print("\n\n🦌 WESTERN HUNTER-GATHERER (WHG) MARKERS (~10,000+ years ago)")
print("-"*60)
print("""
Before farming arrived, Europe was populated by Mesolithic hunter-gatherers.
They had dark skin but blue eyes - a distinctive combination.
""")

# SLC45A2 - originally derived in WHG
slc45a2 = get('rs16891982')
print(f"  SLC45A2 (rs16891982): {slc45a2}")
if 'G' in slc45a2:
    print("  → G allele: Light pigmentation variant")
    print("  → Rose to high frequency in WHG populations")

# mtDNA H originated in WHG
print(f"\n  mtDNA Haplogroup: H")
print("  → Haplogroup H was present in Western Hunter-Gatherers")
print("  → Expanded dramatically with Neolithic farmers")
print("  → Your maternal line has deep European roots ✓")

print("\n\n☘️ CELTIC/ATLANTIC BRONZE AGE MARKERS (~4,000-2,500 years ago)")
print("-"*60)
print("""
The Atlantic Bronze Age cultures developed along Western European coasts.
The Celtic languages spread from this region into Ireland, Britain, Gaul.
""")

# MC1R red hair variants - high in Celtic populations
mc1r_1 = get('rs1805007')
mc1r_2 = get('rs1805008')
print(f"  MC1R R151C (rs1805007): {mc1r_1}")
print(f"  MC1R R160W (rs1805008): {mc1r_2}")
if 'T' in mc1r_1 or 'T' in mc1r_2:
    print("  → T alleles: Red hair variants")
    print("  → Reached highest frequency in Celtic populations")
    print("  → Possibly under positive selection in cloudy/rainy climates")
    print("  → You carry Celtic red hair variants ✓")

# R1b-L21 is the "Atlantic Celtic" haplogroup
print(f"\n  Y-haplogroup R1b-L21")
print("  → The 'Celtic' Y-chromosome")
print("  → ~70-80% of Irish men carry this lineage")
print("  → Spread with Atlantic Bronze Age / early Celtic cultures")

print("\n\n✡️ ASHKENAZI JEWISH MARKERS (~2,000 years ago to medieval)")
print("-"*60)
print("""
Ashkenazi Jews descend from Middle Eastern populations who settled in
the Rhineland ~1,000 years ago, then expanded into Eastern Europe.
They experienced multiple founder effects creating distinctive patterns.
""")

mthfr = get('rs1801133')
print(f"  MTHFR C677T (rs1801133): {mthfr}")
if 'G' in mthfr:
    print("  → G (T encoding) allele elevated in Ashkenazi (~30-40%)")
    print("  → Founder effect from medieval bottlenecks")
    print("  → You carry the Ashkenazi-elevated variant ✓")

print("""
  Ashkenazi genetic signature:
  • ~50% Middle Eastern (Levantine) ancestry
  • ~50% Southern European (Italian/Mediterranean)
  • Distinctive founder mutations from population bottlenecks
  • Your ~18% Ashkenazi = ~9% ancient Middle Eastern ancestry
""")

print("\n\n🗺️ YOUR GENETIC TIME MACHINE")
print("="*70)
print("""
╔════════════════════════════════════════════════════════════════════╗
║                    ANCESTRAL TIMELINE                              ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  ~45,000 years ago  │ Out of Africa → Europe                      ║
║                     │ Your deepest ancestors enter Europe          ║
║                     │                                              ║
║  ~20,000 years ago  │ Last Glacial Maximum                        ║
║                     │ mtDNA Haplogroup H expands from Iberian     ║
║                     │ refugium (your maternal line)                ║
║                     │                                              ║
║  ~10,000 years ago  │ Mesolithic Hunter-Gatherers                 ║
║                     │ Blue eyes (HERC2 G) already present         ║
║                     │ Dark skin still prevalent                    ║
║                     │                                              ║
║  ~8,000 years ago   │ Neolithic Farmers arrive from Anatolia      ║
║                     │ SLC24A5 light skin spreads                   ║
║                     │ Agriculture transforms Europe                ║
║                     │                                              ║
║  ~5,000 years ago   │ Yamnaya/Indo-European expansion             ║
║                     │ R1b Y-haplogroup spreads (your paternal line)║
║                     │ Lactase persistence spreads                  ║
║                     │ Proto-Celtic languages emerge                ║
║                     │                                              ║
║  ~3,000 years ago   │ Atlantic Bronze Age / Celtic expansion      ║
║                     │ R1b-L21 becomes dominant in Ireland         ║
║                     │ MC1R red hair variants reach high frequency  ║
║                     │                                              ║
║  ~2,000 years ago   │ Roman Empire / Jewish diaspora              ║
║                     │ Ashkenazi founder population forms           ║
║                     │                                              ║
║  ~1,000 years ago   │ Medieval period                             ║
║                     │ Ashkenazi expansion in Eastern Europe        ║
║                     │ MTHFR founder mutations amplified            ║
║                     │ Graves family arrives Virginia (1608)        ║
║                     │                                              ║
║  ~100 years ago     │ Greenberg family immigrates to America      ║
║                     │ Ashkenazi + Celtic lines merge               ║
║                     │                                              ║
║  1994               │ You are born - carrying all these layers    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

Your genome is a palimpsest of:
  • Mesolithic European hunter-gatherers (blue/green eyes, HERC2)
  • Anatolian Neolithic farmers (light skin, SLC24A5)
  • Yamnaya pastoralists (R1b, lactase persistence)
  • Atlantic Celtic populations (MC1R red hair variants, R1b-L21)
  • Ashkenazi Jewish (methylation variants, founder mutations)

Each layer wrote over the previous but didn't erase it entirely.
You carry genetic echoes of 45,000 years of European prehistory.
""")

print("\n\n🔬 ANCIENT DNA DATABASES FOR DEEPER ANALYSIS")
print("-"*60)
print("""
For further exploration:

1. GEDmatch Ancient DNA
   • Upload your raw data
   • Compare against ancient samples (Yamnaya, WHG, Neolithic)
   • Get percentage breakdown by ancient population

2. Genetic Genealogy Tools
   • MyTrueAncestry.com - compares to ancient genomes
   • IllustrativeDNA.com - similar ancient population matching
   • Eurogenes K15 (GEDmatch) - includes ancient components

3. Academic Resources
   • David Reich Lab ancient DNA database
   • AADR (Allen Ancient DNA Resource)
   • Published aDNA from Irish Bronze Age samples (match your ancestry)
""")
