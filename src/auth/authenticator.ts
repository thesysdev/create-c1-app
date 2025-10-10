import http from 'http'
import { discovery, randomPKCECodeVerifier, calculatePKCECodeChallenge, buildAuthorizationUrl, authorizationCodeGrant, Configuration } from 'openid-client'
import logger from '../utils/logger.js'
import { type StepResult } from '../types/index.js'
import open from 'open'


export interface AuthConfig {
  issuerUrl: string
  clientId: string
  redirectUri?: string
  scopes?: string[]
}

export interface AuthResult {
  accessToken: string
  refreshToken?: string | undefined
  idToken?: string | undefined
  userInfo?: Record<string, unknown> | undefined
}

export class Authenticator {
  private readonly config: AuthConfig
  private clientConfig?: Configuration
  private codeVerifier?: string

  constructor(config: AuthConfig) {
    this.config = {
      redirectUri: config.redirectUri || 'http://localhost:0/cb', // 0 = any available port
      scopes: ['openid', 'profile', 'email'],
      ...config
    }
  }

  getClientConfig(): Configuration {
    if (!this.clientConfig) {
      throw new Error('Client not initialized. Call initialize() first.')
    }
    return this.clientConfig
  }

  /**
   * Initialize the OAuth client by discovering the authorization server
   */
  async initialize(): Promise<StepResult<void>> {
    logger.debug('🔍 Discovering authorization server...')

    this.clientConfig = await discovery(
      new URL(this.config.issuerUrl),
      this.config.clientId,

    )

    logger.debug('✅ Authorization server discovered successfully')

    return { success: true }
  }

  /**
   * Start the OAuth 2.0 with PKCE authentication flow
   */
  async authenticate(): Promise<StepResult<AuthResult>> {
    if (!this.clientConfig) {
      return {
        success: false,
        error: 'Client not initialized. Call initialize() first.'
      }
    }

    try {
      logger.info('🔐 Starting authentication...')

      // Generate PKCE parameters
      this.codeVerifier = randomPKCECodeVerifier()
      const codeChallenge = await calculatePKCECodeChallenge(this.codeVerifier)

      // Start authentication flow with dynamic port handling
      const authResult = await this.handleBrowserAuth(codeChallenge)

      if (!authResult.success) {
        return authResult
      }

      logger.success('🎉 Authentication completed successfully!')

      return authResult

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Authentication failed: ${errorMessage}`)

      return {
        success: false,
        error: `Authentication failed: ${errorMessage}`
      }
    }
  }

  /**
   * Handle the browser-based OAuth flow
   */
  private async handleBrowserAuth(codeChallenge: string): Promise<StepResult<AuthResult>> {
    return new Promise((resolve) => {
      let serverClosed = false
      let actualPort: number

      // Create a temporary HTTP server to handle the callback
      const server = http.createServer(async (req, res) => {
        try {
          if (req.url?.startsWith('/cb')) {
            logger.debug('📨 Received callback from authorization server')

            // Create URL object from the callback request
            const callbackUrl = new URL(req.url, `http://localhost:${actualPort}`)

            if (!this.clientConfig || !this.codeVerifier) {
              throw new Error('Client not properly initialized')
            }

            // Exchange authorization code for tokens
            const tokenResponse = await authorizationCodeGrant(
              this.clientConfig,
              callbackUrl,
              {
                pkceCodeVerifier: this.codeVerifier
              }
            )

            logger.debug('🎫 Tokens received and validated')

            // Get user info if available (this would require userinfo endpoint call)
            let userInfo: Record<string, unknown> | undefined
            try {
              // For now, we'll get user info from ID token claims if available
              const claims = tokenResponse.claims()
              if (claims) {
                userInfo = claims as Record<string, unknown>
                logger.debug('👤 User info retrieved from ID token')
              }
            } catch (error) {
              logger.debug('⚠️ Could not retrieve user info')
            }

            // Prepare result
            const authResult: AuthResult = {
              accessToken: tokenResponse.access_token || '',
              refreshToken: tokenResponse.refresh_token || undefined,
              idToken: tokenResponse.id_token || undefined,
              userInfo
            }

            // Send success response to browser
            res.writeHead(200, { 'Content-Type': 'text/html', 'Connection': 'close' })
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Authentication Successful</title>
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .success { color: #4CAF50; }
                    .container { max-width: 500px; margin: 0 auto; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1 class="success">Authentication Successful!</h1>
                    <p>You have been successfully authenticated.</p>
                    <p><strong>You can now close this window and return to your terminal.</strong></p>
                  </div>
                </body>
              </html>
            `)

            // Close server and resolve
            serverClosed = true
            server.close()
            resolve({ success: true, data: authResult })

          } else {
            // Handle other requests
            res.writeHead(404, { 'Connection': 'close' })
            res.end('Not found')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          logger.error(`Token exchange failed: ${errorMessage}`)

          // Send error response to browser
          res.writeHead(200, { 'Content-Type': 'text/html', 'Connection': 'close' })
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Authentication Failed</title>
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                  .error { color: #f44336; }
                  .container { max-width: 500px; margin: 0 auto; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1 class="error">❌ Authentication Failed</h1>
                  <p>There was an error during authentication. Please try again.</p>
                  <p><strong>Error:</strong> ${errorMessage}</p>
                </div>
              </body>
            </html>
          `)

          // Close server and resolve with error
          serverClosed = true
          server.close()
          resolve({
            success: false,
            error: `Token exchange failed: ${errorMessage}`
          })
        }
      })

      // Handle server errors
      server.on('error', (error) => {
        if (serverClosed) return

        const errorMessage = error.message
        logger.error(`Server error: ${errorMessage}`)

        serverClosed = true
        resolve({
          success: false,
          error: `Server error: ${errorMessage}`
        })
      })

      // Start the server on any available port
      server.listen(0, async () => {
        try {
          // Get the actual port that was assigned
          const address = server.address()
          if (!address || typeof address === 'string') {
            throw new Error('Failed to get server address')
          }
          actualPort = address.port

          if (!this.clientConfig) {
            throw new Error('Client not initialized')
          }

          // Generate authorization URL with the correct redirect URI
          const authorizationUrl = buildAuthorizationUrl(this.clientConfig, {
            redirect_uri: `http://localhost:${actualPort}/cb`,
            scope: this.config.scopes?.join(' ') || 'openid profile email',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            prompt: 'consent',
          })

          logger.info(`🌐 Started callback server on port ${actualPort}`)
          logger.info('🌐 Opening browser for authentication...')
          logger.info('💡 If the browser doesn\'t open automatically, please visit:')
          logger.info(`   ${authorizationUrl.toString()}`)
          logger.newLine()

          // Open browser with authorization URL
          await open(authorizationUrl.toString())

          logger.info('⏳ Waiting for authentication to complete...')
          logger.info('   Please complete the authentication in your browser.')

        } catch (error) {
          console.log(error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          logger.error(`Failed to open browser: ${errorMessage}`)
          logger.info('💡 Please manually visit the authorization URL shown above')
        }
      })

      // Set a timeout to avoid hanging indefinitely
      setTimeout(() => {
        if (!serverClosed) {
          logger.error('⏰ Authentication timed out after 5 minutes')
          serverClosed = true
          server.close()
          resolve({
            success: false,
            error: 'Authentication timed out. Please try again.'
          })
        }
      }, 5 * 60 * 1000) // 5 minutes timeout
    })
  }
}

export default Authenticator
