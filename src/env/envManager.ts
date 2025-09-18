
import fs from 'fs-extra';
import path from 'path';
// import keytar from 'keytar';
import logger from '../utils/logger';
import SpinnerManager from '../utils/spinner';
import { EnvironmentConfig, StepResult } from '../types/index';

export class EnvironmentManager {
    private spinner: SpinnerManager;
    // private serviceName = 'create-c1-app';

    constructor() {
        this.spinner = new SpinnerManager();
    }

    async setupEnvironment(projectName: string, config: EnvironmentConfig): Promise<StepResult> {
        try {
            const projectPath = path.join(process.cwd(), projectName);

            console.log(projectPath);

            // Ensure we're in the project directory
            if (!await fs.pathExists(projectPath)) {
                throw new Error(`Project directory "${projectName}" not found`);
            }

            // Create environment configuration
            await this.createEnvironmentFiles(config.apiKey, config, projectPath);

            return { success: true };

        } catch (error) {
            logger.debug(`Environment setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to setup environment'
            };
        }
    }


    // private async getStoredApiKey(): Promise<string | null> {
    //     try {
    //         const apiKey = await keytar.getPassword(this.serviceName, 'api-key');
    //         return apiKey;
    //     } catch (error) {
    //         logger.debug(`Failed to retrieve stored API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //         return null;
    //     }
    // }

    private async createEnvironmentFiles(apiKey: string, _config: EnvironmentConfig, projectPath: string): Promise<void> {
        this.spinner.start('Creating environment files...');

        // Create .env file with environment variables
        const envContent = `# API Configuration
THESYS_API_KEY=${apiKey}
# Environment
NODE_ENV=development
`;

        const envFilePath = path.join(projectPath, '.env');
        await fs.writeFile(envFilePath, envContent);

        this.spinner.succeed('Environment files created');

        logger.debug('.env file');
    }



}

export default EnvironmentManager;
