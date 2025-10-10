import execa from 'execa'
import fs, { createReadStream, createWriteStream } from 'fs'
import path from 'path'

import logger from '../utils/logger.js'
import { type ProjectGenerationOptions, type StepResult } from '../types/index.js'
import { Extract } from 'unzipper'
import telemetry from '../utils/telemetry.js'

export class ProjectGenerator {
  async createProject(options: ProjectGenerationOptions): Promise<StepResult> {
    try {
      const projectPath = path.join(options.directory, options.name)

      // Check if directory already exists
      try {
        await fs.promises.access(projectPath, fs.constants.F_OK)
        throw new Error(`Directory "${options.name}" already exists`)
      } catch (error) {
        // Directory doesn't exist, which is what we want
      }

      logger.debug(`Creating project from template at: ${projectPath}`)

      const downloaded = await this.downloadTemplate(options)
      if (!downloaded) {
        throw new Error('Failed to download template')
      }

      // Install dependencies if package.json exists
      await this.installDependencies(projectPath)

      // Setup project structure enhancements
      await this.enhanceProjectStructure(options, projectPath)

      return {
        success: true,
        data: { projectPath }
      }
    } catch (error) {
      logger.debug(`Project creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async downloadTemplate(options: ProjectGenerationOptions): Promise<boolean> {
    if (await this.downloadViaHttp(options)) {
      return true
    }

    return false
  }

  private async downloadViaHttp(options: ProjectGenerationOptions): Promise<boolean> {
    try {
      const zipUrl = `https://github.com/thesysdev/${options.template}/archive/refs/heads/main.zip`
      const tempZipPath = path.join(options.directory, `${options.template}-temp.zip`)
      const tempExtractPath = path.join(options.directory, `${options.template}-temp-extract`)
      const projectPath = path.join(options.directory, options.name)

      logger.debug(`Downloading template from: ${zipUrl}`)

      // Download the zip file
      await this.downloadFile(zipUrl, tempZipPath)

      // Extract to temporary directory
      await this.extractZip(tempZipPath, tempExtractPath)

      // Move contents from the extracted template folder to project directory
      const extractedTemplatePath = path.join(tempExtractPath, `${options.template}-main`)

      // Create the project directory
      await fs.promises.mkdir(projectPath, { recursive: true })

      // Copy contents of the extracted template to project directory
      try {
        logger.debug(`Copying template contents from ${extractedTemplatePath} to ${projectPath}`)
        await fs.promises.cp(extractedTemplatePath, projectPath, {
          recursive: true
        })
      } catch (error) {
        throw new Error(`Extracted template folder ${extractedTemplatePath} not found`)
      }

      // Clean up temporary files
      await fs.promises.rm(tempZipPath, { recursive: true })
      await fs.promises.rm(tempExtractPath, { recursive: true })

      logger.debug(`Template extracted successfully to: ${projectPath}`)

      // Track successful template download
      await telemetry.track('template_downloaded', {
        template: options.template,
      })

      return true
    } catch (error) {
      logger.debug(`HTTP download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)

      // Track template download failure
      await telemetry.track('template_download_failed', {
        template: options.template,
      })

      return false
    }
  }

  private async downloadFile(url: string, destination: string): Promise<void> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const fileStream = createWriteStream(destination)

    await new Promise<void>((resolve, reject) => {
      if (response.body === null) {
        throw new Error('Response body is null')
      }
      response.body.pipeTo(
        new WritableStream({
          write(chunk) {
            fileStream.write(chunk)
          },
          close() {
            fileStream.end()
            resolve()
          },
          abort(error) {
            fileStream.destroy()
            reject(error)
          }
        })
      ).catch(reject)
    })
  }

  private async extractZip(zipPath: string, destination: string): Promise<void> {
    await new Promise((resolve, reject) => {
      createReadStream(zipPath)
        .pipe(Extract({ path: destination }))
        .on('finish', resolve)
        .on('error', reject)
    })
  }

  private async installDependencies(projectPath: string): Promise<void> {
    // Check if package.json exists in the project directory
    const packageJsonPath = path.join(projectPath, 'package.json')
    try {
      await fs.promises.access(packageJsonPath, fs.constants.F_OK)

      logger.debug('package.json found, installing dependencies')
    } catch (error) {
      logger.debug('No package.json found, skipping dependency installation')
      return
    }

    logger.debug('Installing dependencies...')

    try {
      // Install existing dependencies from package.json
      await execa('npm', ['install'], {
        cwd: projectPath,
        stdio: 'pipe'
      })

      logger.debug('Dependencies installed successfully')

      // Track successful dependency installation
      await telemetry.track('dependencies_installed')
    } catch (error) {
      logger.debug(`Warning: Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`)

      // Track dependency installation failure
      await telemetry.track('dependencies_install_failed')

      // Don't fail the entire process if dependency installation fails
    }
  }

  private async enhanceProjectStructure(_options: ProjectGenerationOptions, projectPath: string): Promise<void> {
    logger.debug('Enhancing project structure...')

    // Setup git with proper .gitignore
    await this.setupGit(projectPath)

    logger.debug('Project structure enhanced')
  }

  private async setupGit(projectPath: string): Promise<void> {
    try {
      // Ensure environment files are in .gitignore
      const gitignorePath = path.join(projectPath, '.gitignore')
      let gitignoreExists = false

      try {
        await fs.promises.access(gitignorePath, fs.constants.F_OK)
        gitignoreExists = true
      } catch (error) {
        logger.debug('No .gitignore found, creating one')
        await this.createGitignoreFile(projectPath)
      }

      if (gitignoreExists) {
        const gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf8')

        if (!gitignoreContent.includes('.env')) {
          await fs.promises.appendFile(gitignorePath, '\n# Environment variables\n.env\n')
        }
      } else {
        const gitignoreContent = `
# Environment variables
.env
`
        await fs.promises.writeFile(gitignorePath, gitignoreContent.trim())
      }
    } catch (error) {
      logger.debug(`Git setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Git setup failure shouldn't fail the entire project creation
    }
  }

  private async createGitignoreFile(projectPath: string): Promise<void> {
    const gitignoreContent = `
# Environment variables
.env

# Dependencies
node_modules/

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
`
    const gitignorePath = path.join(projectPath, '.gitignore')
    await fs.promises.writeFile(gitignorePath, gitignoreContent.trim())
  }
}

export default ProjectGenerator
