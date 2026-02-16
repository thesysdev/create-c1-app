import { input } from '@inquirer/prompts'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { createRequire } from 'module'
import logger from './utils/logger.js'
import SpinnerManager from './utils/spinner.js'
import * as Validator from './utils/validation.js'
import { type CLIOptions, type CreateC1AppConfig, type AuthenticationResult } from './types/index.js'
import { ProjectGenerator } from './generators/project.js'
import { EnvironmentManager } from './env/envManager.js'
import telemetry from './utils/telemetry.js'
import { fetchUserInfo } from 'openid-client'
import Authenticator from './auth/authenticator.js'

// Load package.json for version info (ESM workaround)
const pkgRequire = createRequire(import.meta.url)
const packageJson = pkgRequire('../package.json')

const THESYS_API_URL = 'https://api.app.thesys.dev'
const THESYS_ISSUER_URL = 'https://api.app.thesys.dev/oidc'
const THESYS_CLIENT_ID = 'create-c1-app'


// HTTP request helper function
async function makeHttpRequest(url: string, headers?: Record<string, string>, data?: string): Promise<{ statusCode: number; body: string }> {
    const fetchOptions: RequestInit = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...headers
        }
    }

    if (data) {
        fetchOptions.body = data
    }

    try {
        const response = await fetch(url, fetchOptions)
        const body = await response.text()

        return {
            statusCode: response.status,
            body
        }
    } catch (error) {
        throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Check Node.js version before doing anything else
function checkNodeVersion(): void {
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    const minorVersion = parseInt(nodeVersion.slice(1).split('.')[1])

    // Check if version is greater than 20.19.0
    const isVersionSupported =
        majorVersion > 20 ||
        (majorVersion === 20 && minorVersion >= 9)

    if (!isVersionSupported) {
        console.error(`❌ Node.js version ${nodeVersion} is not supported.`)
        console.error(`📋 This package requires Node.js version >= 20.9.0`)
        console.error(`🔄 Please upgrade your Node.js version and try again.`)
        console.error(``)
        console.error(`💡 You can download the latest Node.js from: https://nodejs.org/`)
        process.exit(1)
    }
}

// Detect whether we're running in a non-interactive environment.
function isNonInteractiveEnvironment(explicitFlag: boolean): boolean {
  if (explicitFlag) return true
  if (!process.stdin.isTTY) return true
  return false
}

export const SKIP_AUTH_PLACEHOLDER_API_KEY = 'YOUR_API_KEY_HERE'

export type AuthMethod = 'oauth' | 'manual' | 'skip'

type AuthDecision =
  | { type: 'provided-api-key', apiKey: string }
  | { type: 'skip', apiKey: string }
  | { type: 'manual' }
  | { type: 'oauth' }
  | { type: 'error', message: string }

export function resolveAuthMethod(options: CLIOptions, authWasExplicitlyProvided = false): AuthMethod {
  if (options.skipAuth === true) {
    if (authWasExplicitlyProvided && options.auth !== undefined) {
      logger.warning('Both --auth and deprecated --skip-auth were provided. Using --auth.')
      return options.auth
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

const TOTAL_STEPS = 3
class CreateC1App {
    private readonly spinner: SpinnerManager
    private config: CreateC1AppConfig
    private nonInteractive: boolean

    constructor() {
        this.spinner = new SpinnerManager()
        this.config = {
            projectName: '',
            template: 'app'
        }
        this.nonInteractive = false
    }

    async main(): Promise<void> {
        try {
            // Check Node.js version first
            checkNodeVersion()

            // Parse CLI arguments first to check for debug mode
            const options = await this.parseArguments()

            // If we get here, it means help/version weren't called (they would have exited)

            if (options.debug === true) {
                logger.debugMode = true
                logger.info('🔍 Debug mode enabled ')
            }

            // Handle telemetry disable option
            if (options.disableTelemetry === true) {
                telemetry.disableTelemetry()
                logger.info('📊 Telemetry disabled for this session')
            }

            // Detect non-interactive mode
            this.nonInteractive = isNonInteractiveEnvironment(options.nonInteractive === true)
            if (this.nonInteractive) {
                logger.info('🤖 Running in non-interactive mode')
            }

            // Track app start
            await telemetry.track('started_create_c1_app')

            logger.info('🧙‍♂️ Welcome to Create C1 App!')
            logger.newLine()

            // If no options were provided, log instructions for AI agents
            const hasOptions = options.projectName || options.template || options.apiKey || options.auth || options.skipAuth
            if (!hasOptions) {
                logger.info('[AI Agent Instructions] This CLI requires interactive input by default. If you are an AI agent or automated tool, run `npx create-c1-app --help` to see all available options and pass them as flags to avoid interactive prompts.')
                logger.newLine()
            }

            // Show welcome message and steps
            this.showWelcome()

            // Handle authentication flow
            let authWasExplicitlyProvided = hideBin(process.argv).some((arg) => arg === '--auth' || arg.startsWith('--auth='))
            let resolvedOptions: CLIOptions = options

            if (shouldPromptForAuthMethod(options, this.nonInteractive, authWasExplicitlyProvided)) {
              const { select } = await import('@inquirer/prompts')
              const selectedAuth = await select({
                message: 'How would you like to authenticate?',
                choices: [
                  { name: 'OAuth (recommended)', value: 'oauth' },
                  { name: 'Manual API key entry', value: 'manual' },
                  { name: 'Skip authentication', value: 'skip' }
                ],
                default: 'oauth'
              }) as AuthMethod

              resolvedOptions = {
                ...options,
                auth: selectedAuth
              }
              authWasExplicitlyProvided = true
            }

            const authDecision = resolveAuthDecision(resolvedOptions, this.nonInteractive, authWasExplicitlyProvided)
            let authResult: AuthenticationResult

            switch (authDecision.type) {
              case 'provided-api-key':
                logger.info(`🔑 Using provided API key: ${authDecision.apiKey.substring(0, 8)}...`)
                authResult = { apiKey: authDecision.apiKey }
                await telemetry.track('provided_api_key')
                break
              case 'skip':
                logger.info('⏩ Skipping authentication and key generation as requested')
                logger.info('📝 A placeholder API key will be written to your .env file. Replace it before running your app.')
                authResult = { apiKey: authDecision.apiKey }
                await telemetry.track('skipped_authentication')
                break
              case 'manual': {
                const apiKey = await this.promptForApiKey()
                authResult = { apiKey }
                await telemetry.track('manual_api_key_entry')
                break
              }
              case 'oauth':
                try {
                  authResult = await this.authenticateAndGenerateAPIKey()
                } catch (error) {
                  console.log(error)
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                  logger.error(`Authentication failed: ${errorMessage}`)
                  logger.newLine()

                  // Fallback to manual API key input
                  logger.info('💡 Falling back to manual API key input...')
                  const apiKey = await this.promptForApiKey()
                  authResult = { apiKey }
                }
                await telemetry.track('oauth_authentication')
                break
              case 'error':
                throw new Error(authDecision.message)
            }

            // Step 1: Gather project configuration
            await this.gatherProjectConfig(options)

            // Step 2: Create project
            await this.createProject()

            // Step 3: Setup environment with dotenv
            await this.setupEnvironment(authResult.apiKey)

            // Track successful completion
            await telemetry.track('completed_create_c1_app', {
                template: this.config.template,
            })

            // Success message
            this.showSuccessMessage()

            // Flush and shutdown telemetry before exit
            await telemetry.flush()
            await telemetry.shutdown()
            this.spinner.stop()
        } catch (error) {
            // Track error
            await telemetry.track('failed_create_c1_app')

            // Flush and shutdown telemetry before exit
            await telemetry.flush()
            await telemetry.shutdown()

            logger.error(`Create C1 App failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
            process.exit(1)
        }
    }

    private async parseArguments(): Promise<CLIOptions> {
        const argv = await yargs(hideBin(process.argv))
            .scriptName('create-c1-app')
            .usage('Usage: $0 [project-name] [options]')
            .command('$0 [project-name]', 'Create a new C1 app', (yargs) => {
                yargs.positional('project-name', {
                    type: 'string',
                    description: 'Name of the project to create'
                })
            })
            .option('project-name', {
                alias: 'n',
                type: 'string',
                description: 'Name of the project to create (alternative to positional argument)'
            })
            .option('template', {
                alias: 't',
                type: 'string',
                choices: ['template-c1-component-next', 'template-c1-next'] as const,
                description: 'Next.js template to use'
            })
            .option('debug', {
                alias: 'd',
                type: 'boolean',
                description: 'Enable debug logging'
            })
            .option('api-key', {
                alias: 'k',
                type: 'string',
                description: 'API key to use (skips authentication and key generation)'
            })
            .option('skip-auth', {
                type: 'boolean',
                description: '[Deprecated: use --auth skip] Skip authentication and key generation',
                default: false
            })
            .option('auth', {
                type: 'string',
                choices: ['oauth', 'manual', 'skip'],
                description: 'Authentication method to use (oauth, manual, skip)',
                default: 'oauth'
            })
            .option('non-interactive', {
                type: 'boolean',
                description:
                    'Run in non-interactive mode (fails if required options are missing). Auto-enabled in CI environments or non-TTY shells.',
                default: false
            })
            .option('disable-telemetry', {
                type: 'boolean',
                description: 'Disable anonymous telemetry collection',
                default: false
            })
            .help('help', 'Show help')
            .alias('help', 'h')
            .version(packageJson.version)
            .alias('version', 'v')
            .exitProcess(true)
            .parseAsync()

        return argv as CLIOptions
    }

    private async promptForApiKey(): Promise<string> {
        logger.newLine()
        logger.info('🔑 API Key Required')
        logger.newLine()
        logger.info('To use Create C1 App, you need a Thesys API key.')
        logger.info('Follow these steps to generate one:')
        logger.newLine()
        logger.info('1. 🌐 Visit: https://console.thesys.dev/keys')
        logger.info('2. 🔐 Sign in to your Thesys account')
        logger.info('3. 🆕 Click "Create New API Key"')
        logger.info('4. 📝 Give your key a descriptive name')
        logger.info('5. 📋 Copy the generated API key')
        logger.newLine()
        logger.info('💡 Tip: Keep your API key secure and never share it publicly!')
        logger.newLine()

        await telemetry.track('prompted_for_api_key')

        const apiKey = await input({
            message: 'Please paste your API key here:',
            validate: (input: string) => {
                if (input === undefined || input.trim().length === 0) {
                    return 'API key cannot be empty. Please paste your API key.'
                }
                if (input.trim().length < 10) {
                    return 'API key seems too short. Please check and paste the complete key.'
                }
                return true
            },
            transformer: (input: string) => {
                // Hide most of the API key for security, showing only first few chars
                return input.length > 8 ? `${input.substring(0, 8)}${'*'.repeat(Math.min(input.length - 8, 32))}` : input
            }
        })

        const trimmedKey = apiKey.trim()
        logger.info(`🔑 API key received: ${trimmedKey.substring(0, 8)}****`)
        logger.newLine()

        return trimmedKey
    }

    private async authenticateAndGenerateAPIKey(): Promise<AuthenticationResult> {
        logger.info('🔐 Starting OAuth authentication...')
        logger.newLine()

        // Configuration for Thesys OAuth (these would be real values in production)
        const authConfig = {
            issuerUrl: THESYS_ISSUER_URL,
            clientId: THESYS_CLIENT_ID
        }

        const authenticator = new Authenticator(authConfig)

        // Initialize the OAuth client
        const initResult = await authenticator.initialize()
        if (!initResult.success) {
            throw new Error(initResult.error || 'Failed to initialize authentication')
        }

        // Perform OAuth authentication
        const authResult = await authenticator.authenticate()
        if (!authResult.success || !authResult.data) {
            throw new Error(authResult.error || 'Authentication failed')
        }


        const { userInfo, accessToken } = authResult.data

        const userInfoResponse = await fetchUserInfo(authenticator.getClientConfig(), accessToken, userInfo?.sub as string)

        logger.success('✅ Authentication successful!')
        if (userInfo?.email) {
            logger.info(`👤 Authenticated as: ${userInfo.email}`)
        }
        logger.newLine()

        logger.debug('Choosing first org')
        const orgId = (userInfoResponse['org_claims'] as { orgId: string }[])?.[0]?.orgId
        logger.debug(`Org ID: ${orgId}`)

        // Create API key using the authenticated credentials via HTTP call
        logger.info('🔑 Creating API key...')

        const apiUrl = THESYS_API_URL
        const endpoint = `${apiUrl}/application/application.createApiKeyWithOidc`

        const requestData = {
            name: 'Create C1 App',
            orgId: orgId,
            usageType: 'C1'
        }

        logger.debug(`Making API call to: ${endpoint}`)
        logger.debug(`Using orgId: ${orgId}`)

        const response = await makeHttpRequest(
            endpoint,
            {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            JSON.stringify(requestData)
        )

        if (response.statusCode >= 400) {
            throw new Error(`API call failed with status ${response.statusCode}: ${response.body}`)
        }

        const responseData = JSON.parse(response.body)
        const apiKey = responseData.apiKey

        if (!apiKey) {
            throw new Error('No API key returned from server')
        }

        logger.success('🎉 API key created successfully!')
        logger.newLine()

        return {
            apiKey,
            accessToken,
            userInfo
        }

    }

    private showWelcome(): void {
        logger.info('This tool will help you:')
        logger.info('  1. Authenticate and generate an API key')
        logger.info('  2. Create a new Thesys project')
        logger.info('  3. Setup environment')

        logger.newLine()
    }

    private async gatherProjectConfig(options: CLIOptions): Promise<void> {
        logger.step(1, TOTAL_STEPS, 'Project Configuration')

        let projectName = options.projectName
        let template = options.template

        // Project name
        projectName ??= await input({
            message: 'What is your project name?',
            default: 'my-c1-app',
            prefill: 'editable',
            validate: (input: string) => {
                const validation = Validator.validateProjectName(input)
                if (!validation.isValid) {
                    return validation.errors[0]
                }
                return true
            },
            transformer: (input: string) => Validator.sanitizeProjectName(input)
        })

        // Template selection
        if (template === undefined) {
            const { select } = await import('@inquirer/prompts')
            template = await select({
                message: 'Which Next.js template would you like to use?',
                choices: [
                    {
                        name: 'C1 with Next.js (Recommended)',
                        value: 'template-c1-next',
                        description: 'Next.js Generative UI app powered by C1'
                    },
                ],
                default: 'template-c1-next'
            })
        }

        // Update config with answers and CLI options
        this.config = {
            projectName,
            template: template || 'template-c1-component-next'
        }

        // Track project configuration
        await telemetry.track('project_configured', {
            template: this.config.template
        })

        logger.success(`Project "${this.config.projectName}" will be created with:`)
        logger.info(`  Template: ${this.config.template} `)
        logger.newLine()
    }

    private async createProject(): Promise<void> {
        logger.step(2, TOTAL_STEPS, 'Creating template')

        this.spinner.start('Setting up your template...')

        try {
            const generator = new ProjectGenerator()

            const result = await generator.createProject({
                name: this.config.projectName,
                template: this.config.template,
                directory: process.cwd()
            })

            if (result.success) {
                this.spinner.succeed('Template created successfully!')
                // Track successful project creation
                await telemetry.track('project_created', {
                    template: this.config.template,
                })
            } else {
                throw new Error(result.error ?? 'Failed to create template')
            }
        } catch (error) {
            this.spinner.fail('Failed to create template')

            // Track project creation error
            await telemetry.track('project_creation_error', {
                template: this.config.template,
            })

            throw error
        }

        logger.newLine()
    }

    private async setupEnvironment(apiKey: string): Promise<void> {
        logger.step(3, TOTAL_STEPS, 'Environment Setup')

        this.spinner.start('Setting up environment...')

        try {
            const envManager = new EnvironmentManager()

            const result = await envManager.setupEnvironment(this.config.projectName, apiKey)

            if (result.success) {
                // Track successful environment setup
                await telemetry.track('environment_setup_completed')
            } else {
                throw new Error(result.error ?? 'Failed to setup environment')
            }

            this.spinner.succeed('Environment setup completed')
        } catch (error) {
            this.spinner.fail('Failed to setup environment')

            // Track environment setup error
            await telemetry.track('environment_setup_error')

            throw error
        }

        logger.newLine()
    }

    private showSuccessMessage(): void {
        logger.success('🎉 Create C1 App completed successfully!')
        logger.info('Your API key is stored in .env file.')
        logger.newLine()

        logger.info('Your project is ready! Next steps:')
        logger.info(`  1. cd ${this.config.projectName}`)
        logger.info('  2. npm run dev')
        logger.newLine()

        logger.info('Happy coding! 🚀')
        logger.newLine()
    }
}

export async function main(): Promise<void> {
    // Check Node.js version before instantiating anything
    checkNodeVersion()

    const app = new CreateC1App()
    await app.main()

    process.exit(0)
}

// Handle process exit to ensure telemetry is flushed
process.on('exit', () => {
    // Note: We can't use async operations in exit handler
    // Telemetry should be flushed in main() before exit
})

process.on('SIGINT', async () => {
    console.log('\n\n👋 Goodbye!')
    await telemetry.flush()
    await telemetry.shutdown()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    await telemetry.flush()
    await telemetry.shutdown()
    process.exit(0)
})

// Export for testing
export { CreateC1App }

// Execute main function when run directly
// ESM equivalent of require.main === module
import { fileURLToPath } from 'url'
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url)

if (isMainModule) {
    main().catch((error) => {
        console.error('Error:', error.message)
        process.exit(1)
    })
}
