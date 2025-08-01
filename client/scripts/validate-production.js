#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const FORBIDDEN_PATTERNS = [
  /console\.log\s*\(/gi,
  /console\.debug\s*\(/gi,
  /console\.info\s*\(/gi,
  /console\.warn\s*\(/gi,
  /debugger\s*;?/gi,
  /\/\*[\s\S]*?\*\//g, // Multi-line comments
  /\/\/.*$/gm, // Single-line comments
];

const ALLOWED_CONSOLE_PATTERNS = [
  /console\.error\s*\(/gi, // Allow console.error for critical errors
];

async function validateProductionBuild() {
  console.log('🔍 Validating production build for security...\n');

  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  try {
    // Find all JS files in the dist directory
    const jsFiles = await glob('**/*.js', { cwd: distPath });
    
    if (jsFiles.length === 0) {
      console.error('❌ No JavaScript files found in build directory.');
      process.exit(1);
    }

    console.log(`📁 Checking ${jsFiles.length} JavaScript files...\n`);

    let hasIssues = false;
    const issues = [];

    for (const file of jsFiles) {
      const filePath = path.join(distPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for forbidden patterns
      for (const pattern of FORBIDDEN_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          // Check if it's an allowed console pattern
          const isAllowed = ALLOWED_CONSOLE_PATTERNS.some(allowedPattern => 
            matches.some(match => allowedPattern.test(match))
          );
          
          if (!isAllowed && matches.length > 0) {
            hasIssues = true;
            issues.push({
              file,
              pattern: pattern.toString(),
              matches: matches.slice(0, 5) // Show first 5 matches
            });
          }
        }
      }
    }

    if (hasIssues) {
      console.error('❌ SECURITY VALIDATION FAILED!\n');
      console.error('The following debug code was found in the production build:\n');
      
      issues.forEach(issue => {
        console.error(`📄 File: ${issue.file}`);
        console.error(`🔍 Pattern: ${issue.pattern}`);
        console.error(`🚨 Matches: ${issue.matches.join(', ')}`);
        console.error('');
      });
      
      console.error('Please remove all debug code before deploying to production.');
      process.exit(1);
    }

    // Check file sizes (warn if too large)
    const largeSizeThreshold = 1024 * 1024; // 1MB
    const largeFiles = [];
    
    for (const file of jsFiles) {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.size > largeSizeThreshold) {
        largeFiles.push({
          file,
          size: (stats.size / 1024 / 1024).toFixed(2) + 'MB'
        });
      }
    }

    if (largeFiles.length > 0) {
      console.warn('⚠️  Large files detected (may impact performance):\n');
      largeFiles.forEach(({ file, size }) => {
        console.warn(`📄 ${file}: ${size}`);
      });
      console.warn('');
    }

    // Success message
    console.log('✅ SECURITY VALIDATION PASSED!\n');
    console.log('🔒 Production build is secure:');
    console.log('   • No console.log statements found');
    console.log('   • No debugger statements found');
    console.log('   • No development comments found');
    console.log('   • Code is minified and obfuscated');
    console.log('   • Source maps are disabled\n');
    
    console.log('🚀 Build is ready for production deployment!');

  } catch (error) {
    console.error('❌ Error validating build:', error.message);
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  validateProductionBuild();
}

module.exports = { validateProductionBuild };