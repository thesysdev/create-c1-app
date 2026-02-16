import logger from '../utils/logger.js'
import { type AuthMethod, type CLIOptions } from '../types/index.js'

export const SKIP_AUTH_PLACEHOLDER_API_KEY = 'YOUR_API_KEY_HERE'

export type AuthDecision =
  | { type: 'provided-api-key'; apiKey: string }
  | { type: 'skip'; apiKey: string }
  | { type: 'manual' }
  | { type: 'oauth' }
  | { type: 'error'; message: string }

export function resolveAuthMethod(options: CLIOptions, authWasExplicitlyProvided = false): AuthMethod {
  if (options.skipAuth === true) {
    if (authWasExplicitlyProvided) {
      logger.warning('Both --auth and deprecated --skip-auth were provided. Using --auth.')
      return options.auth ?? 'oauth'
    }

    logger.warning('The --skip-auth flag is deprecated. Use --auth skip instead.')
    return 'skip'
  }

  if (options.auth !== undefined) {
    return options.auth
  }

  return 'oauth'
}

export function resolveAuthDecision(
  options: CLIOptions,
  nonInteractive: boolean,
  authWasExplicitlyProvided = false
): AuthDecision {
  const apiKey = options.apiKey?.trim()
  if (apiKey !== undefined && apiKey.length > 0) {
    return { type: 'provided-api-key', apiKey }
  }

  const authMethod = resolveAuthMethod(options, authWasExplicitlyProvided)
  if (authMethod === 'skip') {
    return { type: 'skip', apiKey: SKIP_AUTH_PLACEHOLDER_API_KEY }
  }

  if (nonInteractive) {
    return {
      type: 'error',
      message:
        'An API key is required in non-interactive mode. ' +
        'Provide one with --api-key <key>.\n' +
        '  Example: npx create-c1-app my-project --template template-c1-next --api-key <your-key>\n' +
        '  Get a key at: https://console.thesys.dev/keys'
    }
  }

  if (authMethod === 'manual') {
    return { type: 'manual' }
  }

  return { type: 'oauth' }
}

export function shouldPromptForAuthMethod(
  options: CLIOptions,
  nonInteractive: boolean,
  authWasExplicitlyProvided = false
): boolean {
  const hasApiKey = options.apiKey !== undefined && options.apiKey.trim().length > 0
  return !nonInteractive && !hasApiKey && options.skipAuth !== true && !authWasExplicitlyProvided
}
