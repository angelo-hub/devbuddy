/**
 * Pro Feature Gate - Access control for Pro features
 * 
 * Provides decorators and utilities for gating Pro features behind license validation.
 * 
 * @license Commercial - See LICENSE.pro
 */

import * as vscode from 'vscode';
import { LicenseManager } from './licenseManager';
import { getLogger } from '../../shared/utils/logger';

const logger = getLogger();

/**
 * Decorator for Pro features
 * 
 * Usage:
 * ```typescript
 * class MyProCommand {
 *   constructor(private context: vscode.ExtensionContext) {}
 *   
 *   @requireProLicense('Advanced Analytics')
 *   async execute() {
 *     // This code only runs if user has Pro license
 *   }
 * }
 * ```
 */
export function requireProLicense(featureName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = (this as any).context as vscode.ExtensionContext;
      const licenseManager = LicenseManager.getInstance(context);

      if (!licenseManager.hasProAccess()) {
        logger.info(`Pro feature "${featureName}" access denied - no valid license`);
        await licenseManager.promptUpgrade(featureName);
        return;
      }

      logger.debug(`Pro feature "${featureName}" access granted`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Check if Pro feature is available
 */
export function isProFeatureAvailable(context: vscode.ExtensionContext): boolean {
  const licenseManager = LicenseManager.getInstance(context);
  return licenseManager.hasProAccess();
}

/**
 * Check if specific feature is available
 */
export function isFeatureAvailable(context: vscode.ExtensionContext, featureName: string): boolean {
  const licenseManager = LicenseManager.getInstance(context);
  return licenseManager.hasFeatureAccess(featureName);
}

/**
 * Show Pro badge in UI
 */
export function getProBadge(): string {
  return '💎';
}

/**
 * Get Pro badge with text
 */
export function getProBadgeWithText(): string {
  return '💎 Pro';
}

/**
 * Create a command wrapper that requires Pro license
 * 
 * Usage:
 * ```typescript
 * const command = wrapProCommand(
 *   'Advanced Analytics',
 *   async () => {
 *     // Your Pro feature code
 *   }
 * );
 * 
 * vscode.commands.registerCommand('devBuddy.pro.analytics', command(context));
 * ```
 */
export function wrapProCommand(
  featureName: string,
  handler: () => Promise<void> | void
): (context: vscode.ExtensionContext) => () => Promise<void> {
  return (context: vscode.ExtensionContext) => {
    return async () => {
      const licenseManager = LicenseManager.getInstance(context);

      if (!licenseManager.hasProAccess()) {
        logger.info(`Pro feature "${featureName}" access denied - no valid license`);
        await licenseManager.promptUpgrade(featureName);
        return;
      }

      logger.debug(`Pro feature "${featureName}" access granted`);
      await handler();
    };
  };
}

/**
 * Show Pro trial status in status bar
 */
export function showTrialStatus(context: vscode.ExtensionContext): vscode.StatusBarItem {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  
  const licenseManager = LicenseManager.getInstance(context);
  const licenseInfo = licenseManager.getLicenseInfo();

  if (!licenseInfo) {
    statusBar.text = '$(star-empty) DevBuddy';
    statusBar.tooltip = 'Upgrade to Pro for advanced features';
    statusBar.command = 'devBuddy.showProFeatures';
  } else if (licenseInfo.isTrial && licenseInfo.isValid) {
    const daysRemaining = Math.ceil(
      (licenseInfo.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    statusBar.text = `$(star) DevBuddy Pro Trial (${daysRemaining}d)`;
    statusBar.tooltip = `${daysRemaining} days remaining in your trial`;
    statusBar.command = 'devBuddy.showProFeatures';
  } else if (licenseInfo.isTrial && !licenseInfo.isValid) {
    statusBar.text = '$(star-empty) DevBuddy (Trial Expired)';
    statusBar.tooltip = 'Your trial has expired. Upgrade to continue using Pro features.';
    statusBar.command = 'devBuddy.showProFeatures';
  } else if (licenseInfo.isValid) {
    statusBar.text = '$(star-full) DevBuddy Pro';
    statusBar.tooltip = `DevBuddy Pro (${licenseInfo.type})`;
    statusBar.command = 'devBuddy.showLicenseInfo';
  } else {
    statusBar.text = '$(star-empty) DevBuddy';
    statusBar.tooltip = 'License expired or invalid';
    statusBar.command = 'devBuddy.activateProLicense';
  }

  statusBar.show();
  return statusBar;
}

