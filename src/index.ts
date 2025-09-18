import { input } from '@inquirer/prompts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import logger from './utils/logger';
import SpinnerManager from './utils/spinner';
import { Validator } from './utils/validation';
import { CLIOptions, CreateC1AppConfig } from './types/index';
import { ProjectGenerator } from './generators/project';

class CreateC1App {
    private spinner: SpinnerManager;
    private config: CreateC1AppConfig;

    private providedApiKey?: string;

    constructor() {
        this.spinner = new SpinnerManager();
        this.config = {
            projectName: '',
            template: 'app'
        };
    }

    async main(): Promise<void> {
        try {
            // Parse CLI arguments first to check for debug mode
            const options = await this.parseArguments();

            if (options.debug) {
                logger.info('🔍 Debug mode enabled - async tracking started');
            }

            logger.info('🧙‍♂️ Welcome to Create C1 App!');
            logger.newLine();

            // Show welcome message and steps
            this.showWelcome();

            // Store provided API key if given and validate it, or prompt for one
            if (options.apiKey && options.apiKey.trim().length > 0) {
                this.providedApiKey = options.apiKey.trim();
                logger.info(`🔑 Using provided API key: ${this.providedApiKey.substring(0, 8)}...`);
            } else {
                // Prompt user to generate and provide API key
                this.providedApiKey = await this.promptForApiKey();
            }

            // Step 1: Gather project configuration
            await this.gatherProjectConfig(options);

            // Step 2: Create project
            await this.createProject();

            // Step 3: Authenticate user (skip if API key provided)
            if (!this.providedApiKey) {
                // await this.authenticateUser();
                // // Step 4: Generate API key (skip if API key provided)
                // await this.generateApiKey();
            }

            // Step 5: Setup environment with dotenv
            await this.setupEnvironment();

            // Success message
            this.showSuccessMessage();

            this.spinner.stop();
        } catch (error) {
            logger.error(`Create C1 App failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            process.exit(1);
        }
    }

    private async parseArguments(): Promise<CLIOptions> {
        const argv = await yargs(hideBin(process.argv))
            .option('project-name', {
                alias: 'n',
                type: 'string',
                description: 'Name of the project to create'
            })
            .option('template', {
                alias: 't',
                type: 'string',
                choices: ['app', 'pages'] as const,
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
            .help()
            .version()
            .argv;

        return argv as CLIOptions;
    }

    private async promptForApiKey(): Promise<string> {
        logger.newLine();
        logger.info('🔑 API Key Required');
        logger.newLine();
        logger.info('To use Create C1 App, you need a Thesys API key.');
        logger.info('Follow these steps to generate one:');
        logger.newLine();
        logger.info('1. 🌐 Visit: https://console.thesys.dev/keys');
        logger.info('2. 🔐 Sign in to your Thesys account');
        logger.info('3. 🆕 Click "Create New API Key"');
        logger.info('4. 📝 Give your key a descriptive name');
        logger.info('5. 📋 Copy the generated API key');
        logger.newLine();
        logger.info('💡 Tip: Keep your API key secure and never share it publicly!');
        logger.newLine();

        const apiKey = await input({
            message: 'Please paste your API key here:',
            validate: (input: string) => {
                if (!input || input.trim().length === 0) {
                    return 'API key cannot be empty. Please paste your API key.';
                }
                if (input.trim().length < 10) {
                    return 'API key seems too short. Please check and paste the complete key.';
                }
                return true;
            },
            transformer: (input: string) => {
                // Hide most of the API key for security, showing only first few chars
                return input.length > 8 ? `${input.substring(0, 8)}${'*'.repeat(Math.min(input.length - 8, 32))}` : input;
            }
        });

        const trimmedKey = apiKey.trim();
        logger.info(`🔑 API key received: ${trimmedKey.substring(0, 8)}****`);
        logger.newLine();

        return trimmedKey;
    }

    private showWelcome(): void {
        logger.info('This tool will help you:');
        logger.info('  1. Create a new Thesys project');
        logger.info('  2. Authenticate and generate an API key');
        logger.info('  3. Setup environment');

        logger.newLine();
    }

    private async gatherProjectConfig(options: CLIOptions): Promise<void> {
        const totalSteps = this.providedApiKey ? 3 : 5;
        logger.step(1, totalSteps, 'Project Configuration');

        let projectName = options.projectName;
        let template = options.template;

        // Project name
        if (!projectName) {
            projectName = await input({
                message: 'What is your project name?',
                default: 'thesys-project',
                prefill: 'editable',
                validate: (input: string) => {
                    const validation = Validator.validateProjectName(input);
                    if (!validation.isValid) {
                        return validation.errors[0];
                    }
                    return true;
                },
                transformer: (input: string) => Validator.sanitizeProjectName(input)
            });
        }

        // Template selection
        if (!template) {
            template = 'template-c1-component-next';
            // TODO: Add other templates
            // template = await select<string>({
            //     message: 'Which Next.js template would you like to use?',
            //     choices: [
            //         { name: 'Quickstart (Recommended)', value: 'template-c1-next' },
            //         { name: 'Autogen', value: 'examples/autogen' }
            //     ],
            //     default: 'template-c1-next'
            // });
        }

        // Update config with answers and CLI options
        this.config = {
            projectName,
            template
        };

        logger.success(`Project "${this.config.projectName}" will be created with:`);
        logger.info(`  Template: ${this.config.template} `);
        logger.newLine();
    }

    private async createProject(): Promise<void> {
        const totalSteps = this.providedApiKey ? 3 : 5;
        logger.step(2, totalSteps, 'Creating template');

        this.spinner.start('Setting up your template...');

        try {
            const generator = new ProjectGenerator();

            const result = await generator.createProject({
                name: this.config.projectName,
                template: this.config.template,
                directory: process.cwd()
            });

            if (result.success) {
                this.spinner.succeed('Template created successfully!');
            } else {
                throw new Error(result.error || 'Failed to create template');
            }
        } catch (error) {
            this.spinner.fail('Failed to create template');
            throw error;
        }

        logger.newLine();
    }

    // private async authenticateUser(): Promise<void> {
    //     logger.step(3, 5, 'User Authentication');

    //     try {
    //         // Import and use authenticator
    //         const { Authenticator } = await import('./auth/authenticator');
    //         const auth = new Authenticator();

    //         const result = await auth.authenticate();

    //         if (result.success) {
    //             logger.success('Authentication successful!');
    //         } else {
    //             throw new Error(result.error || 'Authentication failed');
    //         }
    //     } catch (error) {
    //         logger.error('Authentication failed');
    //         throw error;
    //     }

    //     logger.newLine();
    // }

    // private async generateApiKey(): Promise<void> {
    //     logger.step(4, 5, 'API Key Generation');

    //     this.spinner.start('Generating your API key...');

    //     try {
    //         // Import and use key manager
    //         const { KeyManager } = await import('./api/keyManager');
    //         const keyManager = new KeyManager();

    //         const result = await keyManager.generateKey(this.config.projectName);

    //         if (result.success) {
    //             this.spinner.succeed('API key generated successfully!');
    //         } else {
    //             throw new Error(result.error || 'Failed to generate API key');
    //         }
    //     } catch (error) {
    //         this.spinner.fail('Failed to generate API key');
    //         throw error;
    //     }

    //     logger.newLine();
    // }

    private async setupEnvironment(): Promise<void> {
        const totalSteps = this.providedApiKey ? 3 : 5;
        const currentStep = this.providedApiKey ? 3 : 5;
        logger.step(currentStep, totalSteps, 'Environment Setup');

        this.spinner.start('Setting up environment...');

        try {
            // Import and use environment manager
            const { EnvironmentManager } = await import('./env/envManager');
            const envManager = new EnvironmentManager();

            // Use provided API key or get from key manager
            if (this.providedApiKey) {
                logger.debug('Using provided API key');
            } else {
                // Get API key from key manager (normally this would be stored from generateApiKey step)
                logger.debug('Using generated API key');
            }

            const result = await envManager.setupEnvironment(this.config.projectName);

            if (result.success) {
            } else {
                throw new Error(result.error || 'Failed to setup environment');
            }

            this.spinner.succeed('Environment setup completed');
        } catch (error) {
            this.spinner.fail('Failed to setup environment');
            throw error;
        }

        logger.newLine();
    }

    private showSuccessMessage(): void {
        logger.success('🎉 Create C1 App completed successfully!');
        logger.info('Your API credentials are stored in .env file.');
        logger.newLine();

        logger.info('Your project is ready! Next steps:');
        logger.info(`  1. cd ${this.config.projectName}`);
        logger.info('  2. npm run dev');
        logger.newLine();

        logger.info('Happy coding! 🚀');
        logger.newLine();
    }
}

export async function main(): Promise<void> {


    const app = new CreateC1App();

    await app.main();

}

// Export for testing
export { CreateC1App };

// Execute main function when run directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Error:', error.message);
        process.exit(1);
    });
}
