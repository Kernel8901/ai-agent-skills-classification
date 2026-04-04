#!/usr/bin/env python3
"""
DNA Analysis Script for Ancestry Raw Data
Analyzes health risks, pharmacogenomics, and traits from raw genotype data.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime

import pandas as pd
import numpy as np

# Paths
SCRIPT_DIR = Path(__file__).parent
DB_DIR = SCRIPT_DIR / "snp_databases"
OUTPUT_DIR = SCRIPT_DIR / "reports"

def load_ancestry_data(filepath):
    """Load Ancestry DNA raw data file."""
    print(f"Loading DNA data from {filepath}...")
    
    # Ancestry format: rsid, chromosome, position, allele1, allele2
    # Skip comment lines starting with #, and use the header row
    df = pd.read_csv(
        filepath, 
        sep='\t', 
        comment='#',
        dtype={'rsid': str, 'chromosome': str, 'position': str, 'allele1': str, 'allele2': str}
    )
    
    # Create genotype column
    df['genotype'] = df['allele1'] + df['allele2']
    
    # Index by rsid for fast lookup
    df = df.set_index('rsid')
    
    print(f"Loaded {len(df):,} SNPs")
    return df

def load_database(name):
    """Load a SNP database JSON file."""
    path = DB_DIR / f"{name}.json"
    with open(path) as f:
        return json.load(f)

def get_genotype(df, rsid):
    """Get genotype for a specific rsid, handling missing data."""
    if rsid in df.index:
        row = df.loc[rsid]
        return row['genotype']
    return None

def analyze_apoe(df):
    """Determine APOE status from rs429358 and rs7412."""
    rs429358 = get_genotype(df, 'rs429358')
    rs7412 = get_genotype(df, 'rs7412')
    
    if rs429358 is None or rs7412 is None:
        return "Unable to determine (missing data)"
    
    # APOE haplotype determination
    # rs429358: T=ε2/ε3, C=ε4
    # rs7412: C=ε2, T=ε3/ε4
    
    # Count risk alleles
    e4_count = rs429358.count('C')  # C at rs429358 = ε4
    e2_count = rs7412.count('C')     # C at rs7412 = ε2
    
    # Determine status
    if e4_count == 2:
        return "ε4/ε4 (HIGHEST RISK - ~12x Alzheimer's risk)"
    elif e4_count == 1 and e2_count == 0:
        return "ε3/ε4 (ELEVATED RISK - ~3x Alzheimer's risk)"
    elif e4_count == 1 and e2_count == 1:
        return "ε2/ε4 (Moderate risk)"
    elif e2_count == 2:
        return "ε2/ε2 (Protective)"
    elif e2_count == 1:
        return "ε2/ε3 (Slightly protective)"
    else:
        return "ε3/ε3 (Average risk - most common)"

def analyze_health(df):
    """Analyze health-related SNPs."""
    print("\n" + "="*60)
    print("HEALTH RISK ANALYSIS")
    print("="*60)
    
    health_db = load_database("health_snps")
    results = {}
    
    # Special handling for APOE
    apoe_status = analyze_apoe(df)
    results['APOE Status'] = {
        'result': apoe_status,
        'category': 'Alzheimer\'s Disease',
        'importance': 'HIGH'
    }
    print(f"\n🧠 APOE Status: {apoe_status}")
    
    for category, snps in health_db.items():
        if category == 'alzheimers_apoe':
            continue  # Already handled
            
        print(f"\n📋 {category.replace('_', ' ').title()}")
        for rsid, info in snps.items():
            genotype = get_genotype(df, rsid)
            if genotype:
                risk_allele = info.get('risk_allele', '')
                risk_count = genotype.count(risk_allele)
                
                if risk_count == 2:
                    status = "⚠️  HOMOZYGOUS RISK"
                elif risk_count == 1:
                    status = "⚡ Heterozygous (carrier)"
                else:
                    status = "✅ No risk alleles"
                
                print(f"  {info['name']} ({rsid}): {genotype} - {status}")
                results[rsid] = {
                    'name': info['name'],
                    'genotype': genotype,
                    'risk_count': risk_count,
                    'description': info['description']
                }
            else:
                print(f"  {info['name']} ({rsid}): Not in data")
    
    return results

def analyze_pharmacogenomics(df):
    """Analyze drug metabolism SNPs."""
    print("\n" + "="*60)
    print("PHARMACOGENOMICS (Drug Response)")
    print("="*60)
    
    pharma_db = load_database("pharmacogenomics")
    results = {}
    
    for drug_class, snps in pharma_db.items():
        print(f"\n💊 {drug_class.replace('_', ' ').title()}")
        for rsid, info in snps.items():
            genotype = get_genotype(df, rsid)
            if genotype:
                variant = info.get('variant_allele', '')
                variant_count = genotype.count(variant)
                
                if variant_count > 0:
                    print(f"  ⚠️  {info['name']} ({rsid}): {genotype}")
                    print(f"      Effect: {info['effect']}")
                    print(f"      Drugs: {', '.join(info['drugs'])}")
                else:
                    print(f"  ✅ {info['name']} ({rsid}): {genotype} - Normal metabolism")
                
                results[rsid] = {
                    'name': info['name'],
                    'genotype': genotype,
                    'variant_count': variant_count,
                    'effect': info['effect'] if variant_count > 0 else 'Normal',
                    'drugs': info['drugs']
                }
            else:
                print(f"  {info['name']} ({rsid}): Not in data")
    
    return results

def analyze_traits(df):
    """Analyze trait-related SNPs."""
    print("\n" + "="*60)
    print("TRAITS & CHARACTERISTICS")
    print("="*60)
    
    traits_db = load_database("traits")
    results = {}
    
    for trait, snps in traits_db.items():
        for rsid, info in snps.items():
            genotype = get_genotype(df, rsid)
            if genotype:
                # Normalize genotype (sort alleles for matching)
                norm_genotype = ''.join(sorted(genotype))
                
                # Check all possible representations
                prediction = "Unknown"
                for gt, desc in info.get('variants', {}).items():
                    if norm_genotype == ''.join(sorted(gt)):
                        prediction = desc
                        break
                
                print(f"\n🔬 {trait.replace('_', ' ').title()}")
                print(f"   {info['name']} ({rsid}): {genotype}")
                print(f"   → {prediction}")
                
                results[trait] = {
                    'rsid': rsid,
                    'name': info['name'],
                    'genotype': genotype,
                    'prediction': prediction
                }
    
    return results

def generate_ancestry_estimates(df):
    """Basic ancestry composition based on informative SNPs."""
    print("\n" + "="*60)
    print("ANCESTRY INFORMATIVE MARKERS (Basic)")
    print("="*60)
    
    # Note: Real ancestry analysis requires reference populations
    # This is a simplified check of a few highly informative markers
    
    markers = {
        'rs1426654': {
            'name': 'SLC24A5 (skin pigmentation)',
            'european': 'A',
            'interpretation': {
                'AA': 'European-associated variant (lighter skin)',
                'AG': 'Mixed ancestry signal',
                'GG': 'African/Asian-associated variant'
            }
        },
        'rs16891982': {
            'name': 'SLC45A2 (skin/hair pigmentation)', 
            'european': 'G',
            'interpretation': {
                'GG': 'European-associated',
                'GC': 'Mixed',
                'CC': 'Non-European associated'
            }
        },
        'rs3827760': {
            'name': 'EDAR (hair thickness - East Asian marker)',
            'east_asian': 'A',
            'interpretation': {
                'AA': 'East Asian-associated (thick straight hair)',
                'AG': 'Mixed',
                'GG': 'European/African-associated'
            }
        }
    }
    
    for rsid, info in markers.items():
        genotype = get_genotype(df, rsid)
        if genotype:
            norm_gt = ''.join(sorted(genotype))
            interp = info['interpretation'].get(norm_gt, info['interpretation'].get(genotype, 'Unknown'))
            print(f"\n  {info['name']}")
            print(f"  {rsid}: {genotype} → {interp}")

def main(dna_file):
    """Run full DNA analysis."""
    print("="*60)
    print("DNA ANALYSIS REPORT")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Load data
    df = load_ancestry_data(dna_file)
    
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Run analyses
    health_results = analyze_health(df)
    pharma_results = analyze_pharmacogenomics(df)
    trait_results = analyze_traits(df)
    generate_ancestry_estimates(df)
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total SNPs analyzed: {len(df):,}")
    print(f"Health markers checked: {len(health_results)}")
    print(f"Pharmacogenomic markers: {len(pharma_results)}")
    print(f"Trait markers: {len(trait_results)}")
    
    # Save results
    results = {
        'generated': datetime.now().isoformat(),
        'total_snps': len(df),
        'health': health_results,
        'pharmacogenomics': pharma_results,
        'traits': trait_results
    }
    
    output_file = OUTPUT_DIR / 'dna_analysis_results.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nFull results saved to: {output_file}")
    
    return results

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze_dna.py <ancestry_dna_file.txt>")
        print("\nLooking for DNA file in common locations...")
        
        # Check common locations
        possible_paths = [
            Path.home() / "Downloads" / "AncestryDNA.txt",
            Path.home() / "Downloads" / "dna_data.txt",
            Path.home() / "dna-analysis" / "raw_data.txt",
        ]
        
        for p in possible_paths:
            if p.exists():
                print(f"Found: {p}")
                main(p)
                sys.exit(0)
        
        print("No DNA file found. Please provide path as argument.")
        sys.exit(1)
    else:
        main(sys.argv[1])
