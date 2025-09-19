import { PostHog } from 'posthog-node'
import os from 'os'
import fs from 'fs'
import path from 'path'
import logger from './logger'

export interface TelemetryEvent {
    event: string
    properties?: Record<string, any>
    userId?: string
}

export interface DeviceInfo {
    os: string
    osVersion: string
    nodeVersion: string
    architecture: string
    platform: string
    packageVersion: string
    timestamp: string
}

export class TelemetryManager {
    private client: PostHog | null = null
    private deviceInfo: DeviceInfo
    private isEnabled: boolean
    private readonly projectKey: string
    private distinctId: string

    constructor() {
        // PostHog project key - replace with your actual project key
        this.projectKey = 'phc_OBBbu3I1ayLjFFxIECXcljhqJaLMFOIBmEgxnglSNAP'

        this.deviceInfo = this.collectDeviceInfo()
        this.isEnabled = this.checkTelemetryEnabled()

        if (this.isEnabled) {
            this.initializeClient()
        }

        // Initialize distinctId asynchronously
        this.distinctId = ''
        this.initializeDistinctId()
    }

    private async initializeDistinctId(): Promise<void> {
        try {
            const { nanoid } = await import('nanoid')
            this.distinctId = nanoid()
        } catch (error) {
            // Fallback to random string if nanoid fails
            this.distinctId = Math.random().toString(36).substring(2, 15)
            logger.debug('Failed to load nanoid, using fallback ID generation')
        }
    }

    private checkTelemetryEnabled(): boolean {
        // Check environment variable first
        const envDisabled = process.env.CREATE_C1_APP_DISABLE_TELEMETRY === 'true' ||
            process.env.CREATE_C1_APP_DISABLE_TELEMETRY === '1'

        if (envDisabled) {
            logger.debug('Telemetry disabled via environment variable')
            return false
        }

        return true
    }

    private collectDeviceInfo(): DeviceInfo {
        // Get package version from package.json
        let packageVersion = '1.0.0'
        try {
            const packageJsonPath = path.join(__dirname, '../../package.json')
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
            packageVersion = packageJson.version
        } catch (error) {
            logger.debug('Failed to read package version')
        }

        return {
            os: os.type(),
            osVersion: os.release(),
            nodeVersion: process.version,
            architecture: os.arch(),
            platform: os.platform(),
            packageVersion,
            timestamp: new Date().toISOString()
        }
    }

    private initializeClient(): void {
        try {
            this.client = new PostHog(this.projectKey, {
                host: 'https://us.i.posthog.com',
            })
            logger.debug('Telemetry client initialized')
        } catch (error) {
            logger.debug(`Failed to initialize telemetry client: ${error instanceof Error ? error.message : 'Unknown error'}`)
            this.isEnabled = false
        }
    }

    public async track(eventName: string, properties: Record<string, any> = {}): Promise<void> {
        if (this.isEnabledStatus() === false) {
            return
        }

        try {
            // Ensure distinctId is initialized
            if (!this.distinctId) {
                await this.initializeDistinctId()
            }

            const enrichedProperties = {
                ...properties,
                ...this.deviceInfo
            }

            this.client?.capture({
                distinctId: this.distinctId,
                event: eventName,
                properties: enrichedProperties
            })

            logger.debug(`Telemetry event tracked: ${eventName}`)
        } catch (error) {
            logger.debug(`Failed to track telemetry event: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }


    public async flush(): Promise<void> {
        if (!this.isEnabled || !this.client) {
            return
        }

        try {
            await this.client.flush()
            logger.debug('Telemetry events flushed')
        } catch (error) {
            logger.debug(`Failed to flush telemetry events: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    public async shutdown(): Promise<void> {
        if (!this.isEnabled || !this.client) {
            return
        }

        try {
            await this.client.shutdown()
            logger.debug('Telemetry client shut down')
        } catch (error) {
            logger.debug(`Failed to shutdown telemetry client: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    public getDeviceInfo(): DeviceInfo {
        return { ...this.deviceInfo }
    }

    public isEnabledStatus(): boolean {
        return this.isEnabled && this.client !== null
    }

    public disableTelemetry(): void {
        this.isEnabled = false
    }

}

// Export singleton instance
export const telemetry = new TelemetryManager()
export default telemetry
