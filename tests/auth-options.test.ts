import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import logger from '../src/utils/logger.js'
import {
  SKIP_AUTH_PLACEHOLDER_API_KEY,
  resolveAuthDecision,
  resolveAuthMethod,
  shouldPromptForAuthMethod
} from '../src/index.js'
import { type CLIOptions } from '../src/types/index.js'

describe('resolveAuthMethod', () => {
  let warningSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warningSpy = vi.spyOn(logger, 'warning').mockImplementation(() => {})
  })

  afterEach(() => {
    warningSpy.mockRestore()
  })

  it('returns oauth by default', () => {
    expect(resolveAuthMethod({} as CLIOptions)).toBe('oauth')
    expect(warningSpy).not.toHaveBeenCalled()
  })

  it('returns the explicit --auth value', () => {
    expect(resolveAuthMethod({ auth: 'skip' })).toBe('skip')
    expect(resolveAuthMethod({ auth: 'manual' })).toBe('manual')
    expect(resolveAuthMethod({ auth: 'oauth' })).toBe('oauth')
    expect(warningSpy).not.toHaveBeenCalled()
  })

  it('supports deprecated --skip-auth and warns', () => {
    expect(resolveAuthMethod({ skipAuth: true })).toBe('skip')
    expect(warningSpy).toHaveBeenCalledWith(
      'The --skip-auth flag is deprecated. Use --auth skip instead.'
    )
  })

  it('uses --skip-auth when oauth comes from default (not explicit)', () => {
    expect(resolveAuthMethod({ auth: 'oauth', skipAuth: true }, false)).toBe('skip')
    expect(warningSpy).toHaveBeenCalledWith(
      'The --skip-auth flag is deprecated. Use --auth skip instead.'
    )
  })

  it('prefers --auth over --skip-auth and warns', () => {
    expect(resolveAuthMethod({ auth: 'manual', skipAuth: true }, true)).toBe('manual')
    expect(warningSpy).toHaveBeenCalledWith(
      'Both --auth and deprecated --skip-auth were provided. Using --auth.'
    )
  })
})

describe('resolveAuthDecision', () => {
  it('uses provided --api-key before any auth mode', () => {
    const decision = resolveAuthDecision(
      { apiKey: '  provided-api-key  ', auth: 'skip' },
      false
    )

    expect(decision).toEqual({
      type: 'provided-api-key',
      apiKey: 'provided-api-key'
    })
  })

  it('returns skip decision with placeholder key', () => {
    const decision = resolveAuthDecision({ auth: 'skip' }, false)

    expect(decision).toEqual({
      type: 'skip',
      apiKey: SKIP_AUTH_PLACEHOLDER_API_KEY
    })
  })

  it('returns manual decision in interactive mode', () => {
    const decision = resolveAuthDecision({ auth: 'manual' }, false)
    expect(decision).toEqual({ type: 'manual' })
  })

  it('returns oauth decision by default in interactive mode', () => {
    const decision = resolveAuthDecision({}, false)
    expect(decision).toEqual({ type: 'oauth' })
  })

  it('returns error decision in non-interactive mode without api key', () => {
    const decision = resolveAuthDecision({ auth: 'manual' }, true)
    expect(decision.type).toBe('error')
    if (decision.type === 'error') {
      expect(decision.message).toContain('An API key is required in non-interactive mode.')
    }
  })

  it('treats --skip-auth as skip when oauth is implicit default', () => {
    const decision = resolveAuthDecision({ auth: 'oauth', skipAuth: true }, false, false)
    expect(decision).toEqual({
      type: 'skip',
      apiKey: SKIP_AUTH_PLACEHOLDER_API_KEY
    })
  })
})

describe('shouldPromptForAuthMethod', () => {
  it('returns true in interactive mode when no auth options are provided', () => {
    expect(shouldPromptForAuthMethod({}, false, false)).toBe(true)
  })

  it('returns false when api key is provided', () => {
    expect(shouldPromptForAuthMethod({ apiKey: 'my-key' }, false, false)).toBe(false)
  })

  it('returns false when skip-auth is provided', () => {
    expect(shouldPromptForAuthMethod({ skipAuth: true }, false, false)).toBe(false)
  })

  it('returns false when --auth was explicitly provided', () => {
    expect(shouldPromptForAuthMethod({ auth: 'manual' }, false, true)).toBe(false)
  })

  it('returns false in non-interactive mode', () => {
    expect(shouldPromptForAuthMethod({}, true, false)).toBe(false)
  })
})
