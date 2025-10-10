import fs from 'fs/promises'
import path from 'path'
import logger from '../utils/logger.js'
import { type StepResult } from '../types/index.js'

export class EnvironmentManager {
  async setupEnvironment(projectName: string, apiKey: string): Promise<StepResult> {
    try {
      const projectPath = path.join(process.cwd(), projectName)

      // Ensure we're in the project directory
      try {
        await fs.access(projectPath)
      } catch {
        throw new Error(`Project directory "${projectName}" not found`)
      }

      // Create or update .env file with API key
      const envPath = path.join(projectPath, '.env')
      const apiKeyLine = `THESYS_API_KEY=${apiKey}`

      let envContent = ''

      try {
        await fs.access(envPath)
        // File exists, read it
        // Read existing .env file
        const existingContent = await fs.readFile(envPath, 'utf8')
        const lines = existingContent.split('\n')

        // Replace existing THESYS_API_KEY or add it
        let apiKeyFound = false
        const updatedLines = lines.map((line: string) => {
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
      } catch {
        // File doesn't exist, create new one
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
