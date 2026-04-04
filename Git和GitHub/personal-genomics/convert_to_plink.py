#!/usr/bin/env python3
"""Convert AncestryDNA raw data to PLINK format"""
import pandas as pd

# Read raw data
print("Reading Ancestry raw data...")
df = pd.read_csv('raw_data.txt', sep='\t', comment='#', 
                 names=['rsid', 'chromosome', 'position', 'allele1', 'allele2'])

print(f"Total SNPs: {len(df)}")

# Filter valid chromosomes (1-22, X, Y, MT)
valid_chroms = [str(i) for i in range(1,23)] + ['X', 'Y', 'MT']
df = df[df['chromosome'].astype(str).isin(valid_chroms)]
print(f"After filtering: {len(df)}")

# Create MAP file (chromosome, rsid, genetic distance, position)
print("Creating MAP file...")
map_df = df[['chromosome', 'rsid', 'position']].copy()
map_df.insert(2, 'genetic_dist', 0)
map_df.to_csv('kyle.map', sep='\t', header=False, index=False)

# Create PED file (family, individual, father, mother, sex, phenotype, genotypes)
print("Creating PED file...")
genotypes = []
for _, row in df.iterrows():
    a1 = row['allele1'] if row['allele1'] != '0' else '0'
    a2 = row['allele2'] if row['allele2'] != '0' else '0'
    genotypes.extend([a1, a2])

ped_line = ['GRAVES', 'KYLE', '0', '0', '1', '-9'] + genotypes
with open('kyle.ped', 'w') as f:
    f.write('\t'.join(ped_line) + '\n')

print("Done! Created kyle.map and kyle.ped")
