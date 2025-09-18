import fs from 'fs-extra'
import path from 'path'
import logger from '../utils/logger'
import { type StepResult } from '../types/index'

export class EnvironmentManager {
  async setupEnvironment (projectName: string, apiKey: string): Promise<StepResult> {
    try {
      const projectPath = path.join(process.cwd(), projectName)

      // Ensure we're in the project directory
      if (!await fs.pathExists(projectPath)) {
        throw new Error(`Project directory "${projectName}" not found`)
      }

      // Create or update .env file with API key
      const envPath = path.join(projectPath, '.env')
      const apiKeyLine = `THESYS_API_KEY=${apiKey}`

      let envContent = ''

      if (await fs.pathExists(envPath)) {
        // Read existing .env file
        const existingContent = await fs.readFile(envPath, 'utf8')
        const lines = existingContent.split('\n')

        // Replace existing THESYS_API_KEY or add it
        let apiKeyFound = false
        const updatedLines = lines.map(line => {
          if (line.startsWith('THESYS_API_KEY=')) {
            apiKeyFound = true
            return apiKeyLine
          }
          return line
        })

        if (!apiKeyFound) {
          // Add the API key if it wasn't found
          updatedLines.push(apiKeyLine)
        }

        envContent = updatedLines.join('\n')
        logger.debug(`Updated existing .env file with API key at ${envPath}`)
      } else {
        // Create new .env file
        envContent = apiKeyLine + '\n'
        logger.debug(`Created new .env file with API key at ${envPath}`)
      }

      await fs.writeFile(envPath, envContent)

      return { success: true }
    } catch (error) {
      logger.debug(`Environment setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to setup environment'
      }
    }
  }
}

export default EnvironmentManager
