import validateNpmPackageName from 'validate-npm-package-name';
import { ValidationResult } from '../types/index.js';

export class Validator {
    static validateProjectName(name: string): ValidationResult {
        const errors: string[] = [];

        if (!name || name.trim().length === 0) {
            errors.push('Project name is required');
            return { isValid: false, errors };
        }

        const trimmedName = name.trim();

        // Check npm package name validity
        const npmValidation = validateNpmPackageName(trimmedName);
        if (!npmValidation.validForNewPackages) {
            if (npmValidation.errors) {
                errors.push(...npmValidation.errors);
            }
            if (npmValidation.warnings) {
                errors.push(...npmValidation.warnings);
            }
        }

        // Additional checks for directory/project names
        if (trimmedName.includes(' ')) {
            errors.push('Project name cannot contain spaces');
        }

        if (trimmedName.startsWith('.')) {
            errors.push('Project name cannot start with a dot');
        }

        if (trimmedName.length > 214) {
            errors.push('Project name must be less than 214 characters');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateEmail(email: string): ValidationResult {
        const errors: string[] = [];

        if (!email || email.trim().length === 0) {
            errors.push('Email is required');
            return { isValid: false, errors };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            errors.push('Please enter a valid email address');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validatePassword(password: string): ValidationResult {
        const errors: string[] = [];

        if (!password || password.length === 0) {
            errors.push('Password is required');
            return { isValid: false, errors };
        }

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateApiKey(apiKey: string): ValidationResult {
        const errors: string[] = [];

        if (!apiKey || apiKey.trim().length === 0) {
            errors.push('API key is required');
            return { isValid: false, errors };
        }

        const trimmedKey = apiKey.trim();

        if (trimmedKey.length < 10) {
            errors.push('API key appears to be too short');
        }

        // Check for common patterns that might indicate invalid keys
        if (trimmedKey === 'your-api-key' || trimmedKey === 'placeholder') {
            errors.push('Please provide a valid API key');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateUrl(url: string): ValidationResult {
        const errors: string[] = [];

        if (!url || url.trim().length === 0) {
            errors.push('URL is required');
            return { isValid: false, errors };
        }

        try {
            const urlObj = new URL(url.trim());

            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                errors.push('URL must use HTTP or HTTPS protocol');
            }
        } catch {
            errors.push('Please enter a valid URL');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static validateDirectoryPath(path: string): ValidationResult {
        const errors: string[] = [];

        if (!path || path.trim().length === 0) {
            errors.push('Directory path is required');
            return { isValid: false, errors };
        }

        const trimmedPath = path.trim();

        // Check for invalid characters (Windows and Unix)
        const invalidChars = /[<>:"|?*]/;
        if (invalidChars.test(trimmedPath)) {
            errors.push('Directory path contains invalid characters');
        }

        // Check for relative path attempts that might be dangerous
        if (trimmedPath.includes('..')) {
            errors.push('Directory path cannot contain ".."');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static sanitizeProjectName(name: string): string {
        return name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
}

export default Validator;
