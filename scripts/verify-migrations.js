#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '../dist/migrations');

console.log('Verifying migrations were compiled...');

if (!fs.existsSync(migrationsDir)) {
  console.error('✗ ERROR: migrations directory not found at', migrationsDir);
  process.exit(1);
}

const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));

if (migrations.length === 0) {
  console.error('✗ ERROR: No migration files found in dist/migrations/');
  console.error('Files in directory:', fs.readdirSync(migrationsDir));
  process.exit(1);
}

console.log(`✓ Migrations found in dist/migrations/ (${migrations.length} file(s))`);
console.log('Migration files:');
migrations.forEach(f => console.log(`  - ${f}`));
