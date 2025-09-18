import axios, { AxiosInstance } from 'axios';
// import keytar from 'keytar';
import logger from '../utils/logger';
import SpinnerManager from '../utils/spinner';
import { ApiKeyResponse, StepResult } from '../types/index';

export class KeyManager {
    private apiClient: AxiosInstance;
    private spinner: SpinnerManager;
    private serviceName = 'create-c1-app';

    constructor(apiEndpoint: string = process.env.CREATE_C1_APP_ENDPOINT || 'https://api.example.com') {
        this.apiClient = axios.create({
            baseURL: apiEndpoint,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Create-C1-App/1.0.0'
            }
        });

        this.spinner = new SpinnerManager();
    }

    async generateKey(_projectName: string): Promise<StepResult<ApiKeyResponse>> {
        return {
            success: true,
            data: {
                key: 'test'
            }
        };
        // try {
        //     // Get authentication token
        //     const authToken = await this.getAuthToken();
        //     if (!authToken) {
        //         throw new Error('No authentication token found. Please authenticate first.');
        //     }

        //     // Set up authorization header
        //     this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;


        //     // Configure new API key
        //     const keyConfig = await this.promptKeyConfiguration(projectName);

        //     // Generate new API key
        //     const apiKey = await this.createApiKey(keyConfig);


        //     return {
        //         success: true,
        //         data: apiKey
        //     };

        // } catch (error) {
        //     logger.debug(`API key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        //     return {
        //         success: false,
        //         error: error instanceof Error ? error.message : 'Failed to generate API key'
        //     };
        // }
    }

    private async getAuthToken(): Promise<string | null> {
        try {
            const keytar = await import('keytar');
            const token = await keytar.default.getPassword(this.serviceName, 'auth-token');
            return token;
        } catch (error) {
            logger.debug(`Failed to retrieve auth token: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }


    // private async promptKeyConfiguration(projectName: string): Promise<{ name: string; permissions?: string[] }> {
    //     const name = await input({
    //         message: 'Enter a name for your API key:',
    //         default: `${projectName}-key`,
    //         validate: (input: string) => {
    //             if (!input || input.trim().length === 0) {
    //                 return 'API key name is required';
    //             }
    //             if (input.trim().length < 3) {
    //                 return 'API key name must be at least 3 characters long';
    //             }
    //             return true;
    //         }
    //     });

    //     // Check if the API supports permission scopes
    //     const supportsPermissions = await this.checkPermissionSupport();
    //     let permissions: string[] | undefined;

    //     if (supportsPermissions) {
    //         permissions = await checkbox({
    //             message: 'Select permissions for this API key:',
    //             choices: [
    //                 { name: 'Read access', value: 'read', checked: true },
    //                 { name: 'Write access', value: 'write', checked: true },
    //                 { name: 'Delete access', value: 'delete', checked: false },
    //                 { name: 'Admin access', value: 'admin', checked: false }
    //             ]
    //         });
    //     }

    //     return permissions !== undefined ? { name, permissions } : { name };
    // }


    // private async createApiKey(config: { name: string; permissions?: string[] }): Promise<ApiKeyResponse> {
    //     this.spinner.start(`Creating API key "${config.name}"...`);

    //     return {
    //         key: 'test'
    //     };
    //     // try {
    //     //     const payload: any = {
    //     //         name: config.name
    //     //     };

    //     //     if (config.permissions && config.permissions.length > 0) {
    //     //         payload.permissions = config.permissions;
    //     //     }

    //     //     const response = await this.apiClient.post('/api-keys', payload);

    //     //     this.spinner.succeed(`API key "${config.name}" created successfully!`);

    //     //     // Handle different response formats
    //     //     const keyData = response.data.key || response.data;

    //     //     return {
    //     //         id: keyData.id,
    //     //         key: keyData.key || keyData.token,
    //     //         name: keyData.name,
    //     //         permissions: keyData.permissions,
    //     //         createdAt: new Date(keyData.created_at || keyData.createdAt || Date.now()),
    //     //         expiresAt: keyData.expires_at ? new Date(keyData.expires_at) : undefined
    //     //     };

    //     // } catch (error) {
    //     //     this.spinner.fail('Failed to create API key');

    //     //     if (axios.isAxiosError(error)) {
    //     //         if (error.response?.status === 409) {
    //     //             throw new Error('An API key with this name already exists');
    //     //         } else if (error.response?.status === 403) {
    //     //             throw new Error('You do not have permission to create API keys');
    //     //         } else if (error.response?.status === 429) {
    //     //             throw new Error('Rate limit exceeded. Please try again later.');
    //     //         } else {
    //     //             throw new Error(`Failed to create API key: ${error.response?.data?.message || error.message}`);
    //     //         }
    //     //     }

    //     //     throw error;
    //     // }
    // }

    // private async storeApiKey(apiKey: string): Promise<void> {
    //     try {
    //         await keytar.setPassword(this.serviceName, 'api-key', apiKey);
    //         logger.debug('API key stored securely');
    //     } catch (error) {
    //         logger.warning('Failed to store API key securely');
    //         logger.debug(`API key storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //     }
    // }

    async getStoredApiKey(): Promise<string | null> {
        try {
            const keytar = await import('keytar');
            const apiKey = await keytar.default.getPassword(this.serviceName, 'api-key');
            return apiKey;
        } catch (error) {
            logger.debug(`Failed to retrieve stored API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        }
    }

    async revokeKey(keyId: string): Promise<StepResult> {
        try {
            const authToken = await this.getAuthToken();
            if (!authToken) {
                throw new Error('No authentication token found');
            }

            this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

            this.spinner.start('Revoking API key...');

            await this.apiClient.delete(`/api-keys/${keyId}`);

            this.spinner.succeed('API key revoked successfully');

            // Clear stored key if it matches
            const storedKey = await this.getStoredApiKey();
            if (storedKey) {
                const keytar = await import('keytar');
                await keytar.default.deletePassword(this.serviceName, 'api-key');
            }

            return { success: true };

        } catch (error) {
            this.spinner.fail('Failed to revoke API key');

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to revoke API key'
            };
        }
    }
}

export default KeyManager;
