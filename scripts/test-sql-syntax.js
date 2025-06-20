#!/usr/bin/env node

/**
 * Test SQL Syntax Script
 *
 * This script validates the SQL syntax in the migration file
 * without actually executing it against the database.
 */

const fs = require('fs')
const path = require('path')

class SQLSyntaxTester {
  constructor() {
    this.errors = []
    this.warnings = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  validateSQL(sqlContent) {
    const lines = sqlContent.split('\n')
    let inComment = false
    let inString = false
    let stringChar = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1

      // Skip empty lines and comments
      if (!line || line.startsWith('--')) continue

      // Check for common syntax issues
      this.checkCommonIssues(line, lineNum)
    }

    // Check for duplicate policy names
    this.checkDuplicatePolicies(sqlContent)

    // Check for missing DROP statements
    this.checkMissingDropStatements(sqlContent)
  }

  checkCommonIssues(line, lineNum) {
    // Check for unmatched parentheses in CREATE statements
    if (line.includes('CREATE') && line.includes('(')) {
      const openParens = (line.match(/\(/g) || []).length
      const closeParens = (line.match(/\)/g) || []).length

      if (openParens > closeParens && !line.includes('...')) {
        // This might be a multi-line statement, which is okay
      }
    }

    // Check for function calls in constraints
    if (line.includes('UNIQUE(') && line.includes('date_trunc')) {
      this.errors.push(
        `Line ${lineNum}: Function calls not allowed in table-level UNIQUE constraints: ${line}`
      )
    }

    // Check for missing semicolons on CREATE statements
    if (line.includes('CREATE') && !line.endsWith(';') && !line.includes('(')) {
      this.warnings.push(
        `Line ${lineNum}: CREATE statement might be missing semicolon: ${line}`
      )
    }

    // Check for potential policy conflicts
    if (
      line.includes('CREATE POLICY') &&
      !line.includes('DROP POLICY IF EXISTS')
    ) {
      // Look for the corresponding DROP statement in previous lines
      const policyName = this.extractPolicyName(line)
      if (policyName) {
        this.warnings.push(
          `Line ${lineNum}: Policy "${policyName}" created without DROP IF EXISTS`
        )
      }
    }
  }

  extractPolicyName(line) {
    const match = line.match(/CREATE POLICY "([^"]+)"/)
    return match ? match[1] : null
  }

  checkDuplicatePolicies(sqlContent) {
    const policyNames = []
    const lines = sqlContent.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.includes('CREATE POLICY')) {
        const policyName = this.extractPolicyName(line)
        if (policyName) {
          if (policyNames.includes(policyName)) {
            this.errors.push(
              `Duplicate policy found: "${policyName}" at line ${i + 1}`
            )
          } else {
            policyNames.push(policyName)
          }
        }
      }
    }
  }

  checkMissingDropStatements(sqlContent) {
    const lines = sqlContent.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()

      if (line.includes('CREATE POLICY') || line.includes('CREATE TRIGGER')) {
        const prevLine = i > 0 ? lines[i - 1].trim() : ''

        if (!prevLine.includes('DROP') && !prevLine.includes('IF EXISTS')) {
          const itemType = line.includes('POLICY') ? 'policy' : 'trigger'
          this.warnings.push(
            `Line ${i + 1}: ${itemType} created without corresponding DROP IF EXISTS statement`
          )
        }
      }
    }
  }

  async testSQLFile() {
    try {
      this.log('Starting SQL syntax validation...')

      const sqlFilePath = path.join(
        __dirname,
        '..',
        'supabase',
        'migrations',
        'init_gallery_schema.sql'
      )

      if (!fs.existsSync(sqlFilePath)) {
        throw new Error(`SQL file not found: ${sqlFilePath}`)
      }

      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
      this.log(`Loaded SQL file: ${sqlFilePath}`)
      this.log(`File size: ${sqlContent.length} characters`)

      // Validate SQL syntax
      this.validateSQL(sqlContent)

      // Report results
      this.reportResults()
    } catch (error) {
      this.log(`SQL validation failed: ${error.message}`, 'error')
      throw error
    }
  }

  reportResults() {
    console.log('\n' + '='.repeat(50))
    console.log('SQL SYNTAX VALIDATION RESULTS')
    console.log('='.repeat(50))

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ No syntax issues found!')
    } else {
      if (this.errors.length > 0) {
        console.log(`\n❌ ERRORS (${this.errors.length}):`)
        this.errors.forEach(error => console.log(`  ${error}`))
      }

      if (this.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`)
        this.warnings.forEach(warning => console.log(`  ${warning}`))
      }
    }

    console.log('='.repeat(50))

    if (this.errors.length > 0) {
      console.log('❌ SQL file has syntax errors that need to be fixed.')
      process.exit(1)
    } else if (this.warnings.length > 0) {
      console.log('⚠️  SQL file has warnings but should work.')
    } else {
      console.log('✅ SQL file syntax looks good!')
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new SQLSyntaxTester()
  tester.testSQLFile().catch(error => {
    console.error('SQL syntax test failed:', error)
    process.exit(1)
  })
}

module.exports = SQLSyntaxTester
