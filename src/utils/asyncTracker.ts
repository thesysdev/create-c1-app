import { createHook } from 'async_hooks';
import logger from './logger';

interface AsyncResource {
    id: number;
    type: string;
    triggerAsyncId: number;
    created: Date;
    stack: string;
    destroyed: boolean;
    resolved?: boolean;
    rejected?: boolean;
    error?: any;
}

export class AsyncTracker {
    private static instance: AsyncTracker;
    private resources = new Map<number, AsyncResource>();
    private hook: any;
    private isTracking = false;
    private startTime: Date | null = null;

    static getInstance(): AsyncTracker {
        if (!AsyncTracker.instance) {
            AsyncTracker.instance = new AsyncTracker();
        }
        return AsyncTracker.instance;
    }

    start(): void {
        if (this.isTracking) {
            return;
        }

        this.startTime = new Date();
        this.isTracking = true;
        this.resources.clear();

        this.hook = createHook({
            init: (asyncId: number, type: string, triggerAsyncId: number) => {
                // Track promises and other async operations
                if (type === 'PROMISE' || type === 'TIMERWRAP' || type === 'TCPWRAP' ||
                    type === 'PIPECONNECTWRAP' || type === 'FSREQCALLBACK' || type === 'GETADDRINFOREQWRAP') {

                    const stack = new Error().stack || 'No stack trace available';

                    this.resources.set(asyncId, {
                        id: asyncId,
                        type,
                        triggerAsyncId,
                        created: new Date(),
                        stack,
                        destroyed: false
                    });
                }
            },

            before: () => {
                // Called before async callback is executed
            },

            after: () => {
                // Called after async callback is executed
            },

            destroy: (asyncId: number) => {
                // Called when async resource is destroyed
                const resource = this.resources.get(asyncId);
                if (resource) {
                    resource.destroyed = true;
                }
            },

            promiseResolve: (asyncId: number) => {
                // Called when promise is resolved
                const resource = this.resources.get(asyncId);
                if (resource) {
                    resource.resolved = true;
                }
            }
        });

        this.hook.enable();
        logger.debug('🔍 AsyncTracker started - monitoring async operations');
    }

    stop(): void {
        if (!this.isTracking) {
            return;
        }

        this.isTracking = false;
        if (this.hook) {
            this.hook.disable();
        }
        logger.debug('🛑 AsyncTracker stopped');
    }

    getUnresolvedPromises(): AsyncResource[] {
        return Array.from(this.resources.values()).filter(resource =>
            resource.type === 'PROMISE' &&
            !resource.destroyed &&
            !resource.resolved &&
            !resource.rejected
        );
    }

    getPendingAsyncOperations(): AsyncResource[] {
        return Array.from(this.resources.values()).filter(resource =>
            !resource.destroyed &&
            !resource.resolved &&
            !resource.rejected
        );
    }

    getAllAsyncOperations(): AsyncResource[] {
        return Array.from(this.resources.values());
    }

    printDetailedReport(): void {
        const all = this.getAllAsyncOperations();
        const pending = this.getPendingAsyncOperations();
        const unresolvedPromises = this.getUnresolvedPromises();
        const destroyed = all.filter(r => r.destroyed);
        const resolved = all.filter(r => r.resolved);

        const elapsedTime = this.startTime ? Date.now() - this.startTime.getTime() : 0;

        logger.newLine();
        logger.info('🔍 Async Operations Tracking Report');
        logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger.info(`⏱️  Tracking Duration: ${Math.round(elapsedTime / 1000)}s`);
        logger.info(`📊 Total Async Operations: ${all.length}`);
        logger.info(`✅ Resolved/Completed: ${resolved.length}`);
        logger.info(`🗑️  Destroyed: ${destroyed.length}`);
        logger.info(`⏳ Still Pending: ${pending.length}`);
        logger.info(`🔴 Unresolved Promises: ${unresolvedPromises.length}`);
        logger.newLine();

        // Group by operation type
        const typeGroups = new Map<string, AsyncResource[]>();
        all.forEach(resource => {
            if (!typeGroups.has(resource.type)) {
                typeGroups.set(resource.type, []);
            }
            typeGroups.get(resource.type)!.push(resource);
        });

        logger.info('📋 Operations by Type:');
        for (const [type, resources] of typeGroups) {
            const pendingCount = resources.filter(r => !r.destroyed && !r.resolved).length;
            logger.info(`   ${type}: ${resources.length} total (${pendingCount} pending)`);
        }
        logger.newLine();

        if (unresolvedPromises.length > 0) {
            logger.warning('⚠️  UNRESOLVED PROMISES:');
            logger.newLine();
            unresolvedPromises.forEach((resource, index) => {
                const age = Date.now() - resource.created.getTime();
                logger.warning(`${index + 1}. Promise ID: ${resource.id}`);
                logger.info(`   Trigger ID: ${resource.triggerAsyncId}`);
                logger.info(`   Created: ${resource.created.toISOString()}`);
                logger.info(`   Age: ${Math.round(age / 1000)}s`);
                logger.info(`   Stack trace:`);
                const stackLines = resource.stack.split('\n').slice(1, 8); // Show first 7 stack frames
                stackLines.forEach(line => {
                    const cleanLine = line.trim();
                    if (cleanLine && !cleanLine.includes('node_modules') && !cleanLine.includes('internal/')) {
                        logger.info(`     ${cleanLine}`);
                    }
                });
                logger.newLine();
            });
        } else if (pending.length === 0) {
            logger.success('🎉 All async operations completed successfully!');
        }

        if (pending.length > 0 && unresolvedPromises.length === 0) {
            logger.warning('⚠️  OTHER PENDING ASYNC OPERATIONS:');
            logger.newLine();

            // Group pending by type
            const pendingByType = new Map<string, AsyncResource[]>();
            pending.forEach(resource => {
                if (!pendingByType.has(resource.type)) {
                    pendingByType.set(resource.type, []);
                }
                pendingByType.get(resource.type)!.push(resource);
            });

            for (const [type, resources] of pendingByType) {
                logger.warning(`${type}: ${resources.length} pending`);
                resources.slice(0, 3).forEach(resource => { // Show max 3 per type
                    const age = Date.now() - resource.created.getTime();
                    logger.info(`   ID: ${resource.id}, Age: ${Math.round(age / 1000)}s`);
                });
                if (resources.length > 3) {
                    logger.info(`   ... and ${resources.length - 3} more`);
                }
            }
        }
    }

    printSummaryReport(): void {
        const all = this.getAllAsyncOperations();
        const pending = this.getPendingAsyncOperations();
        const unresolvedPromises = this.getUnresolvedPromises();

        logger.newLine();
        logger.info('📊 Async Operations Summary');
        logger.info(`Total: ${all.length} | Pending: ${pending.length} | Unresolved Promises: ${unresolvedPromises.length}`);

        if (unresolvedPromises.length > 0) {
            logger.warning(`⚠️  ${unresolvedPromises.length} unresolved promise(s) detected!`);
        } else if (pending.length === 0) {
            logger.success('✅ All async operations completed!');
        } else {
            logger.info(`ℹ️  ${pending.length} non-promise async operation(s) still pending`);
        }
    }

    clear(): void {
        this.resources.clear();
        this.startTime = null;
    }

    // Wait for a specified time to see if pending operations complete
    async waitForCompletion(timeoutMs: number = 5000): Promise<{ completed: boolean; pending: number; promises: number }> {
        const checkInterval = 100;
        const maxChecks = Math.floor(timeoutMs / checkInterval);

        for (let i = 0; i < maxChecks; i++) {
            const pending = this.getPendingAsyncOperations();

            if (pending.length === 0) {
                return { completed: true, pending: 0, promises: 0 };
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        const finalPending = this.getPendingAsyncOperations();
        const finalPromises = this.getUnresolvedPromises();

        return {
            completed: false,
            pending: finalPending.length,
            promises: finalPromises.length
        };
    }
}

export const asyncTracker = AsyncTracker.getInstance();
