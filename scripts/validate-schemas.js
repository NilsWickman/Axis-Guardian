#!/usr/bin/env node

/**
 * OpenAPI Schema Validation Script
 *
 * Validates OpenAPI schemas using Spectral linting.
 * Ensures schemas follow best practices and are error-free.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const SCHEMAS_DIR = path.join(__dirname, '../shared/schemas');
const SPECTRAL_CONFIG = path.join(__dirname, '../shared/config/.spectral.yaml');

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

// Find all OpenAPI schema files
function findSchemaFiles() {
  log('\n🔍 Finding OpenAPI schemas...', 'blue');

  if (!fs.existsSync(SCHEMAS_DIR)) {
    log(`  ✗ Schemas directory not found: ${SCHEMAS_DIR}`, 'red');
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

// Validate schema with Spectral
function validateSchema(schemaPath) {
  const schemaName = path.basename(schemaPath);

  log(`\n🔬 Validating ${schemaName}...`, 'cyan');

  try {
    // Use Spectral via npx (avoids global install)
    const spectralCmd = fs.existsSync(SPECTRAL_CONFIG)
      ? `npx @stoplight/spectral-cli lint "${schemaPath}" --ruleset "${SPECTRAL_CONFIG}"`
      : `npx @stoplight/spectral-cli lint "${schemaPath}"`;

    const output = execSync(spectralCmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // If we get here without error, schema is valid
    log(`  ✓ ${schemaName} is valid`, 'green');
    if (output && output.trim()) {
      log(`    ${output.trim()}`, 'dim');
    }

    return { valid: true, warnings: 0, errors: 0 };

  } catch (error) {
    // Spectral returns exit code 1 for warnings/errors
    const output = error.stdout || error.stderr || error.message;

    // Parse output to count warnings and errors
    const warnings = (output.match(/warning/gi) || []).length;
    const errors = (output.match(/error/gi) || []).length;

    if (errors > 0) {
      log(`  ✗ ${schemaName} has ${errors} error(s)`, 'red');
      log(output, 'red');
      return { valid: false, warnings, errors };
    } else if (warnings > 0) {
      log(`  ⚠ ${schemaName} has ${warnings} warning(s)`, 'yellow');
      log(output, 'yellow');
      return { valid: true, warnings, errors };
    }

    // Unknown error
    log(`  ✗ Validation failed for ${schemaName}`, 'red');
    log(output, 'red');
    return { valid: false, warnings, errors };
  }
}

// Check for common schema issues
function checkSchemaQuality(schemaPath) {
  const schemaName = path.basename(schemaPath);
  const content = fs.readFileSync(schemaPath, 'utf8');

  const issues = [];

  // Check for missing descriptions
  if (!content.includes('description:')) {
    issues.push('Missing descriptions for better documentation');
  }

  // Check for example values
  if (!content.includes('example:')) {
    issues.push('Missing example values for better documentation');
  }

  // Check for security definitions
  if (content.includes('paths:') && !content.includes('security:')) {
    issues.push('No security definitions found');
  }

  // Check for error responses
  if (content.includes('paths:') && !content.includes('Error')) {
    issues.push('Missing error response definitions');
  }

  if (issues.length > 0) {
    log(`\n💡 Quality suggestions for ${schemaName}:`, 'yellow');
    issues.forEach(issue => log(`    - ${issue}`, 'dim'));
  }

  return issues;
}

// Main execution
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('  OpenAPI Schema Validation', 'bright');
  log('='.repeat(60), 'bright');

  try {
    // Find schema files
    const schemaFiles = findSchemaFiles();
    if (schemaFiles.length === 0) {
      log('\n⚠ No schemas to validate. Exiting.', 'yellow');
      process.exit(0);
    }

    // Validate each schema
    let validCount = 0;
    let totalWarnings = 0;
    let totalErrors = 0;

    for (const schemaFile of schemaFiles) {
      const result = validateSchema(schemaFile);

      if (result.valid) {
        validCount++;
      }

      totalWarnings += result.warnings;
      totalErrors += result.errors;

      // Check quality
      checkSchemaQuality(schemaFile);
    }

    // Summary
    log('\n' + '='.repeat(60), 'bright');

    if (totalErrors === 0) {
      log(`✅ All schemas validated successfully!`, 'green');
      log(`   Valid: ${validCount}/${schemaFiles.length}`, 'green');

      if (totalWarnings > 0) {
        log(`   Warnings: ${totalWarnings} (non-blocking)`, 'yellow');
      }
    } else {
      log(`❌ Schema validation failed`, 'red');
      log(`   Valid: ${validCount}/${schemaFiles.length}`, 'red');
      log(`   Errors: ${totalErrors}`, 'red');
      log(`   Warnings: ${totalWarnings}`, 'yellow');
    }

    log('='.repeat(60) + '\n', 'bright');

    // Exit with appropriate code
    process.exit(totalErrors > 0 ? 1 : 0);

  } catch (error) {
    log('\n' + '='.repeat(60), 'bright');
    log(`❌ Validation failed: ${error.message}`, 'red');
    log('='.repeat(60) + '\n', 'bright');
    process.exit(1);
  }
}

// Run
main();
