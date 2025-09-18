import validateNpmPackageName from 'validate-npm-package-name'
import { type ValidationResult } from '../types/index'

export function validateProjectName (name: string): ValidationResult {
  const errors: string[] = []

  if (name === null || name === undefined || name.trim().length === 0) {
    errors.push('Project name is required')
    return { isValid: false, errors }
  }

  const trimmedName = name.trim()

  // Check npm package name validity
  const npmValidation = validateNpmPackageName(trimmedName)
  if (!npmValidation.validForNewPackages) {
    if (npmValidation.errors != null) {
      errors.push(...npmValidation.errors)
    }
    if (npmValidation.warnings != null) {
      errors.push(...npmValidation.warnings)
    }
  }

  // Additional checks for directory/project names
  if (trimmedName.includes(' ')) {
    errors.push('Project name cannot contain spaces')
  }

  if (trimmedName.startsWith('.')) {
    errors.push('Project name cannot start with a dot')
  }

  if (trimmedName.length > 214) {
    errors.push('Project name must be less than 214 characters')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function sanitizeProjectName (name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
