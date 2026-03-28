#!/usr/bin/env node
/**
 * LEAP to Facet CRM Migration Script
 * 
 * Usage:
 *   npm run import:leap -- --dry-run        # Preview what would happen
 *   npm run import:leap -- --import         # Actually import
 *   npm run import:leap -- --stats          # Show CSV stats only
 * 
 * Environment:
 *   MONGODB_URI - MongoDB connection string
 *   LEAP_CSV_PATH - Path to CSV file (default: ../../Documents/LEAP/Leap_Customer_Listing_Report_*.csv)
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { Customer } from '../src/models/Customer.js';
import { Project } from '../src/models/Project.js';

// Parse command line args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const doImport = args.includes('--import');
const showStats = args.includes('--stats');

if (!isDryRun && !doImport && !showStats) {
  console.log('Usage:');
  console.log('  --dry-run    Preview changes without importing');
  console.log('  --import     Actually import to database');
  console.log('  --stats      Show CSV analysis only');
  process.exit(1);
}

// Load and parse CSV
function loadCSV() {
  const csvPath = process.env.LEAP_CSV_PATH || findLatestCSV();
  
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    process.exit(1);
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  return { path: csvPath, records };
}

function findLatestCSV() {
  // Try multiple possible paths
  const possiblePaths = [
    path.resolve(process.cwd(), '../../Documents/LEAP'),
    path.resolve(process.cwd(), '../../../Documents/LEAP'),
    path.resolve('/home/proto/facet/Documents/LEAP'),
    path.resolve(process.env.HOME || '~', 'facet/Documents/LEAP'),
  ];
  
  for (const docsPath of possiblePaths) {
    if (fs.existsSync(docsPath)) {
      const files = fs.readdirSync(docsPath)
        .filter(f => f.startsWith('Leap_Customer_Listing_Report') && f.endsWith('.csv'))
        .sort()
        .reverse();
      
      if (files.length > 0) {
        return path.join(docsPath, files[0]);
      }
    }
  }
  
  console.error('No LEAP CSV files found in any of these locations:');
  possiblePaths.forEach(p => console.error('  -', p));
  process.exit(1);
}

// Transform LEAP record to Facet schema
function transformRecord(record: any) {
  const firstName = cleanName(record['First Name']);
  const lastName = cleanName(record['Last Name']);
  
  // Skip if no name
  if (!firstName && !lastName) {
    return null;
  }
  
  // Parse combined names like "Richard and Marilyn", "Rosemary & Frank"
  const parsedNames = parseCombinedNames(firstName, lastName);
  
  // Build contact info
  const phone = extractPhone(record);
  const email = cleanEmail(record['E-mail']);
  
  // Address (mailing address preferred, fallback to billing)
  const address = extractAddress(record);
  
  // Referral source mapping
  const referralSource = mapReferralSource(record['Referred By']);
  
  // Customer notes
  const notes = record['Customer Note'] || '';
  
  return {
    primaryCustomer: {
      firstName: parsedNames.primary.firstName,
      lastName: parsedNames.primary.lastName,
      contacts: [{
        type: 'primary',
        name: `${parsedNames.primary.firstName} ${parsedNames.primary.lastName}`.trim(),
        phone,
        email,
        address,
      }],
      referralSource,
      notes,
      // Track LEAP import for auditing
      importedFrom: 'LEAP',
      importedAt: new Date(),
    },
    spouse: parsedNames.spouse ? {
      firstName: parsedNames.spouse.firstName,
      lastName: parsedNames.spouse.lastName,
    } : null,
    raw: record, // Keep raw for reference
  };
}

function cleanName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^['"]+|['"]+$/g, '') // Remove quotes at start/end
    .replace(/[\/']/g, ' ')         // Replace slashes and single quotes with spaces
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();
}

function parseCombinedNames(firstName: string, lastName: string) {
  // Handle cases like "Richard and Marilyn", "Jan / Bob", "'/ Dawn'"
  // If lastName is empty/missing, use 'Unknown'
  const cleanLastName = lastName?.trim() || 'Unknown';
  const cleanFirstName = firstName?.trim() || 'Unknown';
  const combined = `${cleanFirstName} ${cleanLastName}`.trim();
  
  // Patterns: "and", "&", "/", "'/"
  const separators = [' and ', ' & ', ' / ', "'/ "];
  
  for (const sep of separators) {
    const idx = combined.toLowerCase().indexOf(sep);
    if (idx > -1) {
      const part1 = combined.substring(0, idx).trim();
      const part2 = combined.substring(idx + sep.length).trim();
      
      // Assume first part is primary, second is spouse
      const name1Parts = part1.split(' ');
      const name2Parts = part2.split(' ');
      
      return {
        primary: {
          firstName: name1Parts[0] || '',
          lastName: name1Parts.slice(1).join(' ') || name2Parts.slice(1).join(' ') || '',
        },
        spouse: {
          firstName: name2Parts[0] || '',
          lastName: name2Parts.slice(1).join(' ') || name1Parts.slice(1).join(' ') || '',
        },
      };
    }
  }
  
  // Single person
  const parts = combined.split(' ');
  const first = parts[0] || 'Unknown';
  const last = parts.slice(1).join(' ') || 'Unknown';
  return {
    primary: {
      firstName: first,
      lastName: last,
    },
    spouse: null,
  };
}

function extractPhone(record: any): string {
  // Prioritize: Home > Cell > Phone > Office > Other
  const phones = [
    record['Home'],
    record['Cell'],
    record['Phone'],
    record['Office'],
    record['Other'],
  ];
  
  for (const phone of phones) {
    if (phone && phone.trim()) {
      return cleanPhone(phone);
    }
  }
  
  return '';
}

function cleanPhone(phone: string): string {
  if (!phone) return '';
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

function cleanEmail(email: string): string {
  if (!email) return '';
  if (email === 'no@yahoo.com' || email === 'no@gmail.com' || email === 'no@aol.com') {
    return ''; // These are placeholders
  }
  return email.trim().toLowerCase();
}

function extractAddress(record: any) {
  // Prefer mailing, fallback to billing
  let street = record['Mailing address street'] || record['Billing address street'];
  let city = record['Mailing address City'] || record['Billing address City'];
  let state = record['Mailing address State'] || record['Billing address State'];
  let zip = record['Mailing address Zip'] || record['Billing address Zip'];
  
  // Clean up common issues
  street = street?.trim() || '';
  city = city?.trim() || '';
  state = (state?.trim() || 'IL').toUpperCase(); // Default to Illinois
  zip = cleanZip(zip);
  
  return { street, city, state, zip };
}

function cleanZip(zip: string): string {
  if (!zip) return '';
  const cleaned = zip.replace(/\D/g, '');
  if (cleaned.length === 5) return cleaned;
  if (cleaned.length === 9) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  return zip.trim();
}

function mapReferralSource(source: string): string {
  if (!source) return 'Unknown';
  
  const mapping: Record<string, string> = {
    'AngiLeads': 'Angi',
    'Facet Website': 'Website',
    'Test1': 'Unknown', // Test data
    '': 'Unknown',
  };
  
  return mapping[source] || source;
}

// Stats and validation
function analyzeRecords(records: any[]) {
  const stats = {
    total: records.length,
    valid: 0,
    invalid: 0,
    withPhone: 0,
    withEmail: 0,
    withAddress: 0,
    referralSources: {} as Record<string, number>,
    issues: [] as string[],
  };
  
  const seen = new Set<string>();
  
  for (const record of records) {
    const transformed = transformRecord(record);
    
    if (!transformed) {
      stats.invalid++;
      stats.issues.push(`Invalid record: ${JSON.stringify(record).slice(0, 100)}`);
      continue;
    }
    
    stats.valid++;
    
    if (transformed.primaryCustomer.contacts[0].phone) stats.withPhone++;
    if (transformed.primaryCustomer.contacts[0].email) stats.withEmail++;
    if (transformed.primaryCustomer.contacts[0].address.street) stats.withAddress++;
    
    const ref = transformed.primaryCustomer.referralSource;
    stats.referralSources[ref] = (stats.referralSources[ref] || 0) + 1;
    
    // Check for potential duplicates
    const key = `${transformed.primaryCustomer.firstName.toLowerCase()}_${transformed.primaryCustomer.lastName.toLowerCase()}`;
    if (seen.has(key)) {
      stats.issues.push(`Potential duplicate: ${transformed.primaryCustomer.firstName} ${transformed.primaryCustomer.lastName}`);
    }
    seen.add(key);
  }
  
  return stats;
}

// Database operations
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/facet-crm';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function importCustomers(records: any[]) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };
  
  for (const record of records) {
    const transformed = transformRecord(record);
    if (!transformed) {
      results.skipped++;
      continue;
    }
    
    try {
      // Check for existing customer (by name + phone)
      const existing = await Customer.findOne({
        firstName: transformed.primaryCustomer.firstName,
        lastName: transformed.primaryCustomer.lastName,
        'contacts.phone': transformed.primaryCustomer.contacts[0].phone,
      });
      
      if (existing) {
        console.log(`  Skipping duplicate: ${transformed.primaryCustomer.firstName} ${transformed.primaryCustomer.lastName}`);
        results.skipped++;
        continue;
      }
      
      const customer = new Customer(transformed.primaryCustomer);
      await customer.save();
      results.imported++;
      
      // Create spouse as note if exists
      if (transformed.spouse) {
        customer.notes += `\nSpouse: ${transformed.spouse.firstName} ${transformed.spouse.lastName}`;
        await customer.save();
      }
      
    } catch (error: any) {
      results.errors.push(`${transformed.primaryCustomer.firstName} ${transformed.primaryCustomer.lastName}: ${error.message}`);
    }
  }
  
  return results;
}

// Main execution
async function main() {
  console.log('LEAP to Facet CRM Migration Tool');
  console.log('=================================\n');
  
  const { path: csvPath, records } = loadCSV();
  console.log(`Loaded ${records.length} records from ${csvPath}\n`);
  
  if (showStats) {
    const stats = analyzeRecords(records);
    console.log('CSV Analysis:');
    console.log('-------------');
    console.log(`Total records: ${stats.total}`);
    console.log(`Valid customers: ${stats.valid}`);
    console.log(`Invalid records: ${stats.invalid}`);
    console.log(`With phone: ${stats.withPhone}`);
    console.log(`With email: ${stats.withEmail}`);
    console.log(`With address: ${stats.withAddress}`);
    console.log('\nReferral Sources:');
    Object.entries(stats.referralSources)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
    
    if (stats.issues.length > 0) {
      console.log('\nIssues found (first 10):');
      stats.issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
    }
    return;
  }
  
  if (isDryRun) {
    console.log('DRY RUN - Previewing first 10 imports:\n');
    const samples = records.slice(0, 10).map(transformRecord).filter(Boolean);
    samples.forEach((t, i) => {
      console.log(`[${i + 1}] ${t.primaryCustomer.firstName} ${t.primaryCustomer.lastName}`);
      console.log(`    Phone: ${t.primaryCustomer.contacts[0].phone || 'N/A'}`);
      console.log(`    Email: ${t.primaryCustomer.contacts[0].email || 'N/A'}`);
      console.log(`    Address: ${t.primaryCustomer.contacts[0].address.street || 'N/A'}`);
      console.log(`    Referral: ${t.primaryCustomer.referralSource}`);
      if (t.spouse) {
        console.log(`    Spouse: ${t.spouse.firstName} ${t.spouse.lastName}`);
      }
      console.log('');
    });
    
    const stats = analyzeRecords(records);
    console.log(`\nWould import: ${stats.valid} customers`);
    console.log(`Would skip: ${stats.invalid} invalid + duplicates`);
    return;
  }
  
  if (doImport) {
    await connectDB();
    
    console.log('Starting import...\n');
    const results = await importCustomers(records);
    
    console.log('\nImport Complete:');
    console.log('-----------------');
    console.log(`Imported: ${results.imported}`);
    console.log(`Skipped: ${results.skipped}`);
    
    if (results.errors.length > 0) {
      console.log(`\nErrors (${results.errors.length}):`);
      results.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
