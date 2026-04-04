#!/usr/bin/env node
/**
 * Test script to verify dependency auto-installation works
 */

console.log('🧪 Testing dependency auto-installation...\n');

// This should trigger auto-install if ethers is missing
import { checkDependencies } from './check-dependencies.js';

try {
  console.log('Step 1: Checking dependencies...');
  checkDependencies(['ethers']);
  
  console.log('\nStep 2: Trying to import ethers...');
  const { ethers } = await import('ethers');
  
  console.log('\n✅ SUCCESS!');
  console.log(`   ethers version: ${ethers.version || 'unknown'}`);
  console.log('   Auto-installation system working correctly!');
  
} catch (error) {
  console.error('\n❌ FAILED!');
  console.error('   Error:', error.message);
  console.error('\nPlease run manually:');
  console.error('   cd scripts && npm install');
  process.exit(1);
}
