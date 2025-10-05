#!/usr/bin/env node

/**
 * OpenAPI Type Generation Script
 *
 * Generates TypeScript types and API clients from OpenAPI schemas.
 * Uses openapi-typescript for type generation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const SCHEMAS_DIR = path.join(__dirname, '../shared/schemas');
const OUTPUT_DIR = path.join(__dirname, '../shared/types/generated');
const FRONTEND_OUTPUT = path.join(__dirname, '../frontend/src/types/generated');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`  ${description}...`, 'dim');
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`  ✗ Failed: ${description}`, 'red');
    return false;
  }
}

// Ensure output directories exist
function ensureDirectories() {
  log('\n📁 Ensuring output directories...', 'blue');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    log(`  ✓ Created ${OUTPUT_DIR}`, 'green');
  }

  if (!fs.existsSync(FRONTEND_OUTPUT)) {
    fs.mkdirSync(FRONTEND_OUTPUT, { recursive: true });
    log(`  ✓ Created ${FRONTEND_OUTPUT}`, 'green');
  }
}

// Find all OpenAPI schema files
function findSchemaFiles() {
  log('\n🔍 Finding OpenAPI schemas...', 'blue');

  if (!fs.existsSync(SCHEMAS_DIR)) {
    log(`  ✗ Schemas directory not found: ${SCHEMAS_DIR}`, 'red');
    log('  Please create OpenAPI schemas in shared/schemas/', 'yellow');
    return [];
  }

  const files = fs.readdirSync(SCHEMAS_DIR)
    .filter(file => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'))
    .map(file => path.join(SCHEMAS_DIR, file));

  if (files.length === 0) {
    log('  ⚠ No schema files found', 'yellow');
    return [];
  }

  log(`  ✓ Found ${files.length} schema file(s)`, 'green');
  files.forEach(file => log(`    - ${path.basename(file)}`, 'dim'));

  return files;
}

// Generate TypeScript types from OpenAPI schema
function generateTypes(schemaPath) {
  const schemaName = path.basename(schemaPath, path.extname(schemaPath));
  const outputFile = path.join(OUTPUT_DIR, `${schemaName}.types.ts`);

  log(`\n📝 Generating types for ${schemaName}...`, 'cyan');

  // Using openapi-typescript (npx to avoid global install)
  const command = `npx openapi-typescript "${schemaPath}" -o "${outputFile}"`;

  if (execCommand(command, `Generate ${schemaName}.types.ts`)) {
    log(`  ✓ Generated ${path.relative(process.cwd(), outputFile)}`, 'green');
    return true;
  }

  return false;
}

// Create barrel export file
function createBarrelExport(schemaFiles) {
  log('\n📦 Creating barrel exports...', 'blue');

  const exportStatements = schemaFiles.map(file => {
    const name = path.basename(file, path.extname(file));
    return `export * from './${name}.types';`;
  }).join('\n');

  const indexContent = `/**
 * Generated API Types
 *
 * Auto-generated from OpenAPI schemas.
 * DO NOT EDIT MANUALLY - run 'npm run generate:types' to regenerate.
 */

${exportStatements}
`;

  const indexPath = path.join(OUTPUT_DIR, 'index.ts');
  fs.writeFileSync(indexPath, indexContent);
  log(`  ✓ Created ${path.relative(process.cwd(), indexPath)}`, 'green');
}

// Copy types to frontend
function copyToFrontend() {
  log('\n📋 Copying types to frontend...', 'blue');

  // Copy all generated types
  const files = fs.readdirSync(OUTPUT_DIR);
  let copiedCount = 0;

  files.forEach(file => {
    const srcPath = path.join(OUTPUT_DIR, file);
    const destPath = path.join(FRONTEND_OUTPUT, file);

    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
  });

  log(`  ✓ Copied ${copiedCount} file(s) to frontend`, 'green');
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('  OpenAPI Type Generation', 'bright');
  log('='.repeat(60), 'bright');

  try {
    // 1. Ensure directories exist
    ensureDirectories();

    // 2. Find schema files
    const schemaFiles = findSchemaFiles();
    if (schemaFiles.length === 0) {
      log('\n⚠ No schemas to process. Exiting.', 'yellow');
      process.exit(0);
    }

    // 3. Generate types for each schema
    let successCount = 0;
    for (const schemaFile of schemaFiles) {
      if (generateTypes(schemaFile)) {
        successCount++;
      }
    }

    if (successCount === 0) {
      throw new Error('Failed to generate any types');
    }

    // 4. Create barrel export
    createBarrelExport(schemaFiles);

    // 5. Copy to frontend
    copyToFrontend();

    // Success summary
    log('\n' + '='.repeat(60), 'bright');
    log(`✅ Successfully generated types for ${successCount}/${schemaFiles.length} schema(s)`, 'green');
    log('='.repeat(60) + '\n', 'bright');

    log('📖 Next steps:', 'cyan');
    log('  1. Import types in your frontend:', 'dim');
    log('     import type { ... } from "@/types/generated"', 'dim');
    log('  2. Import types in backend services:', 'dim');
    log('     import type { ... } from "@shared/types/generated"', 'dim');
    log('  3. Run "make build" to verify compilation\n', 'dim');

    process.exit(0);

  } catch (error) {
    log('\n' + '='.repeat(60), 'bright');
    log(`❌ Type generation failed: ${error.message}`, 'red');
    log('='.repeat(60) + '\n', 'bright');
    process.exit(1);
  }
}

// Run
main();
