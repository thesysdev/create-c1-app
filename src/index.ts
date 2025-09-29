import { input } from '@inquirer/prompts'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import logger from './utils/logger'
import SpinnerManager from './utils/spinner'
import * as Validator from './utils/validation'
import { type CLIOptions, type CreateC1AppConfig, type AuthenticationResult } from './types/index'
import { ProjectGenerator } from './generators/project'
import { EnvironmentManager } from './env/envManager'
import telemetry from './utils/telemetry'
import { fetchUserInfo } from 'openid-client'
import Authenticator from './auth/authenticator'

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

const TOTAL_STEPS = 3
class CreateC1App {
    private readonly spinner: SpinnerManager
    private config: CreateC1AppConfig

    constructor() {
        this.spinner = new SpinnerManager()
        this.config = {
            projectName: '',
            template: 'app'
        }
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

            // Track app start
            await telemetry.track('started_create_c1_app')

            logger.info('🧙‍♂️ Welcome to Create C1 App!')
            logger.newLine()

            // Show welcome message and steps
            this.showWelcome()

            // Handle authentication flow
            let authResult: AuthenticationResult
            if (options.apiKey !== undefined && options.apiKey !== null && options.apiKey.trim().length > 0) {
                // Use provided API key
                const apiKey = options.apiKey.trim()
                logger.info(`🔑 Using provided API key: ${apiKey.substring(0, 8)}...`)
                authResult = { apiKey }
                await telemetry.track('provided_api_key')
            } else {
                // Perform OAuth authentication flow
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
            .usage('Usage: $0 [options]')
            .option('project-name', {
                alias: 'n',
                type: 'string',
                description: 'Name of the project to create'
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
                description: 'Skip authentication and key generation',
                default: false
            })
            .option('disable-telemetry', {
                type: 'boolean',
                description: 'Disable anonymous telemetry collection',
                default: false
            })
            .help('help', 'Show help')
            .alias('help', 'h')
            .version('version', 'Show version number')
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

         console.log(authResult.data)
         const { userInfo, accessToken } = authResult.data

         const userInfoResponse = await fetchUserInfo(authenticator.getClientConfig(), accessToken, userInfo?.sub as string)

         logger.success('✅ Authentication successful!')
         if (userInfo?.email) {
             logger.info(`👤 Authenticated as: ${userInfo.email}`)
         }
         logger.newLine()

         logger.debug('Choosing first org')
         const orgId = (userInfoResponse['org_claims'] as {orgId: string}[])?.[0]?.orgId
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
            default: 'thesys-project',
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
                        name: 'C1 Next (Recommended)',
                        value: 'template-c1-next',
                        description: 'Next.js Generative UI app powered by C1'
                    },
                    {
                        name: 'C1 Component Next',
                        value: 'template-c1-component-next',
                        description: 'Next.js Chat with C1 components'
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
if (require.main === module) {
    main().catch((error) => {
        console.error('Error:', error.message)
        process.exit(1)
    })
}
