// import { confirm } from '@inquirer/prompts';
// import axios, { AxiosInstance } from 'axios';
// import keytar from 'keytar';
// import { exec } from 'child_process';
// import { promisify } from 'util';
import logger from '../utils/logger';
// import SpinnerManager from '../utils/spinner';
import { AuthSession, StepResult } from '../types/index';

// const execAsync = promisify(exec);

export class Authenticator {
    // private apiClient: AxiosInstance;
    // private spinner: SpinnerManager;
    private serviceName = 'create-c1-app';

    constructor(_apiEndpoint: string = process.env.CREATE_C1_APP_ENDPOINT || 'https://console.thesys.dev') {
        // this.apiClient = axios.create({
        //     baseURL: apiEndpoint,
        //     timeout: 30000,
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'User-Agent': 'Create-C1-App/1.0.0'
        //     }
        // });

        // this.spinner = new SpinnerManager();
    }

    async authenticate(): Promise<StepResult<AuthSession>> {
        try {
            // Check for existing stored credentials
            // const existingToken = await this.getStoredToken();
            // if (existingToken) {
            //     logger.info('Found existing authentication, verifying...');

            //     this.spinner.start('Verifying existing credentials...');
            //     const isValid = await this.verifyToken(existingToken);

            //     if (isValid) {
            //         this.spinner.succeed('Existing credentials verified!');
            //         return {
            //             success: true,
            //             data: {
            //                 token: existingToken,
            //                 expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Assume 24h validity
            //             }
            //         };
            //     } else {
            //         this.spinner.warn('Existing credentials are invalid, re-authenticating...');
            //         await this.clearStoredCredentials();
            //     }
            // }

            // // Use browser-based OAuth flow
            // const session = await this.authenticateWithBrowser();

            // // Store the new token securely
            // await this.storeToken(session.token);

            // return {
            //     success: true,
            //     data: session
            // };

            return {
                success: true,
                data: {
                    token: 'test',
                    refreshToken: 'test'
                }
            };

        } catch (error) {
            logger.debug(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            };
        }
    }

    // private async authenticateWithBrowser(): Promise<AuthSession> {
    //     // Step 1: Create authentication request with token
    //     this.spinner.start('Creating authentication request...');
    //     const authRequest = await this.createBrowserAuthRequest();
    //     this.spinner.succeed('Authentication request created!');

    //     // Step 2: Prompt user to open link in browser
    //     await this.promptUserToOpenBrowser(authRequest);

    //     // Step 3: Wait for user to complete authentication in browser
    //     this.spinner.start('Waiting for authentication in browser...');
    //     const authResponse = await this.waitForBrowserAuth(authRequest.requestToken);
    //     this.spinner.succeed('Browser authentication completed!');

    //     const session: AuthSession = {
    //         token: authResponse.token,
    //         expiresAt: authResponse.expiresAt
    //     };

    //     if (authResponse.refreshToken) {
    //         session.refreshToken = authResponse.refreshToken;
    //     }

    //     return session;
    // }

    // private async createBrowserAuthRequest(): Promise<BrowserAuthRequest> {
    //     try {
    //         const response = await this.apiClient.post('/auth/browser/request');

    //         return {
    //             authUrl: response.data.auth_url,
    //             requestToken: response.data.request_token,
    //             expiresAt: new Date(response.data.expires_at)
    //         };
    //     } catch (error) {
    //         if (axios.isAxiosError(error)) {
    //             throw new Error(`Failed to create auth request: ${error.response?.data?.message || error.message}`);
    //         }
    //         throw error;
    //     }
    // }

    // private async promptUserToOpenBrowser(authRequest: BrowserAuthRequest): Promise<void> {
    //     console.log('\n🔐 Browser Authentication Required');
    //     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    //     console.log(`\n📋 Authentication URL:\n${authRequest.authUrl}\n`);
    //     console.log('⏰ This link will expire in 10 minutes.\n');

    //     const shouldOpenBrowser = await confirm({
    //         message: 'Would you like to open this URL in your default browser?',
    //         default: true
    //     });

    //     if (shouldOpenBrowser) {
    //         try {
    //             await this.openUrlInBrowser(authRequest.authUrl);
    //             console.log('✅ Browser opened! Please complete authentication in the browser window.\n');
    //         } catch (error) {
    //             console.log('❌ Failed to open browser automatically. Please copy and paste the URL above into your browser.\n');
    //         }
    //     } else {
    //         console.log('📝 Please copy and paste the URL above into your browser to continue.\n');
    //     }

    //     console.log('🔄 Waiting for you to complete authentication...');
    // }

    // private async openUrlInBrowser(url: string): Promise<void> {
    //     const platform = process.platform;
    //     let command: string;

    //     switch (platform) {
    //         case 'darwin': // macOS
    //             command = `open "${url}"`;
    //             break;
    //         case 'win32': // Windows
    //             command = `start "" "${url}"`;
    //             break;
    //         default: // Linux and others
    //             command = `xdg-open "${url}"`;
    //             break;
    //     }

    //     await execAsync(command);
    // }

    // private async waitForBrowserAuth(requestToken: string): Promise<BrowserAuthResponse> {
    //     const maxAttempts = 60; // 5 minutes with 5-second intervals
    //     const pollInterval = 5000; // 5 seconds

    //     for (let attempt = 0; attempt < maxAttempts; attempt++) {
    //         try {
    //             const response = await this.apiClient.get(`/auth/browser/poll/${requestToken}`);

    //             if (response.data.status === 'completed') {
    //                 return {
    //                     token: response.data.token,
    //                     expiresAt: new Date(response.data.expires_at),
    //                     refreshToken: response.data.refresh_token
    //                 };
    //             } else if (response.data.status === 'expired' || response.data.status === 'denied') {
    //                 throw new Error(`Authentication ${response.data.status}. Please try again.`);
    //             }

    //             // Continue polling if status is 'pending'
    //             await new Promise(resolve => setTimeout(resolve, pollInterval));

    //         } catch (error) {
    //             if (axios.isAxiosError(error) && error.response?.status === 404) {
    //                 // Request token not found or expired
    //                 throw new Error('Authentication request expired. Please try again.');
    //             }

    //             // For other errors, continue polling unless it's the last attempt
    //             if (attempt === maxAttempts - 1) {
    //                 throw error;
    //             }

    //             await new Promise(resolve => setTimeout(resolve, pollInterval));
    //         }
    //     }

    //     throw new Error('Authentication timeout. Please try again.');
    // }


    // private async verifyToken(token: string): Promise<boolean> {
    //     try {
    //         const response = await this.apiClient.get('/auth/verify', {
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });

    //         return response.status === 200 && response.data?.valid !== false;

    //     } catch (error) {
    //         logger.debug(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //         return false;
    //     }
    // }

    // private async getStoredToken(): Promise<string | null> {
    //     try {
    //         const token = await keytar.getPassword(this.serviceName, 'auth-token');
    //         return token;
    //     } catch (error) {
    //         logger.debug(`Failed to retrieve stored token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //         return null;
    //     }
    // }

    // private async storeToken(token: string): Promise<void> {
    //     try {
    //         await keytar.setPassword(this.serviceName, 'auth-token', token);
    //         logger.debug('Authentication token stored securely');
    //     } catch (error) {
    //         logger.warning('Failed to store authentication token securely');
    //         logger.debug(`Token storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    //     }
    // }

    private async clearStoredCredentials(): Promise<void> {
        try {
            const keytar = await import('keytar');
            await keytar.default.deletePassword(this.serviceName, 'auth-token');
            logger.debug('Stored credentials cleared');
        } catch (error) {
            logger.debug(`Failed to clear stored credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async logout(): Promise<void> {
        await this.clearStoredCredentials();
        logger.info('Logged out successfully');
    }
}

export default Authenticator;
