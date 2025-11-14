/**
 * License Manager for DevBuddy Pro Features
 * 
 * This module handles license validation, trial management, and pro feature access.
 * 
 * @license Commercial - See LICENSE.pro
 */

import * as vscode from 'vscode';
import { getLogger } from '../../shared/utils/logger';

const logger = getLogger();

export interface LicenseInfo {
  key: string;
  email: string;
  type: 'personal' | 'team' | 'enterprise';
  expiresAt: Date;
  isValid: boolean;
  isTrial: boolean;
  trialEndsAt?: Date;
  features: string[];
}

export class LicenseManager {
  private static instance: LicenseManager;
  private context: vscode.ExtensionContext;
  private licenseInfo: LicenseInfo | null = null;
  
  private readonly LICENSE_KEY = 'devBuddy.pro.licenseKey';
  private readonly TRIAL_START_KEY = 'devBuddy.pro.trialStartDate';
  private readonly LAST_VALIDATION_KEY = 'devBuddy.pro.lastValidation';
  
  // TODO: Replace with your actual backend URL when ready
  private readonly LICENSE_API = 'https://api.devbuddy.dev/v1/validate';
  
  private readonly TRIAL_DAYS = 30;
  private readonly OFFLINE_GRACE_DAYS = 7;

  private constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public static getInstance(context: vscode.ExtensionContext): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager(context);
    }
    return LicenseManager.instance;
  }

  /**
   * Initialize license on extension activation
   */
  async initialize(): Promise<void> {
    logger.info('Initializing license manager...');
    
    const storedKey = await this.context.secrets.get(this.LICENSE_KEY);
    
    if (storedKey) {
      logger.debug('Found stored license key, validating...');
      await this.validateLicense(storedKey);
    } else {
      logger.debug('No license key found, checking trial status...');
      await this.initializeTrial();
    }

    // Show license status in output
    this.logLicenseStatus();
  }

  /**
   * Activate a license key
   */
  async activateLicense(licenseKey: string): Promise<boolean> {
    logger.info('Attempting to activate license...');
    
    const isValid = await this.validateLicense(licenseKey);
    
    if (isValid) {
      await this.context.secrets.store(this.LICENSE_KEY, licenseKey);
      await this.context.globalState.update(this.LAST_VALIDATION_KEY, new Date().toISOString());
      
      vscode.window.showInformationMessage('✨ DevBuddy Pro activated successfully!');
      logger.success('License activated successfully');
      
      return true;
    } else {
      vscode.window.showErrorMessage('❌ Invalid license key. Please check and try again.');
      logger.error('License validation failed');
      
      return false;
    }
  }

  /**
   * Validate license with backend
   * 
   * TODO: Implement actual backend validation when ready
   * For now, this is a mock implementation that always validates
   */
  private async validateLicense(licenseKey: string): Promise<boolean> {
    try {
      logger.debug('Validating license key...');
      
      // TODO: Remove this mock validation and implement real backend call
      // For now, we'll accept any license key for development purposes
      if (process.env.NODE_ENV === 'development' || !this.LICENSE_API.includes('devbuddy.dev')) {
        logger.warn('Using mock license validation (development mode)');
        
        this.licenseInfo = {
          key: licenseKey,
          email: 'dev@example.com',
          type: 'personal',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isValid: true,
          isTrial: false,
          features: ['all'],
        };
        
        return true;
      }

      // TODO: Implement actual API call when backend is ready
      // const response = await fetch(this.LICENSE_API, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     licenseKey,
      //     product: 'devbuddy',
      //     version: vscode.extensions.getExtension('angelogirardi.dev-buddy')?.packageJSON.version,
      //   }),
      // });

      // if (!response.ok) {
      //   return false;
      // }

      // const data = await response.json();
      // this.licenseInfo = {
      //   key: licenseKey,
      //   email: data.email,
      //   type: data.type,
      //   expiresAt: new Date(data.expiresAt),
      //   isValid: data.isValid,
      //   isTrial: data.isTrial,
      //   trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
      //   features: data.features || ['all'],
      // };

      // return data.isValid;
      
      return false; // Return false until backend is ready
      
    } catch (error) {
      logger.error('License validation error:', error);
      // Offline grace period: allow if validated within last 7 days
      return this.checkOfflineGracePeriod();
    }
  }

  /**
   * Initialize trial period
   */
  private async initializeTrial(): Promise<void> {
    const trialStart = this.context.globalState.get<string>(this.TRIAL_START_KEY);

    if (!trialStart) {
      // First time - start trial
      const now = new Date();
      await this.context.globalState.update(this.TRIAL_START_KEY, now.toISOString());
      
      const trialEnd = new Date(now.getTime() + this.TRIAL_DAYS * 24 * 60 * 60 * 1000);
      
      this.licenseInfo = {
        key: 'TRIAL',
        email: '',
        type: 'personal',
        expiresAt: trialEnd,
        isValid: true,
        isTrial: true,
        trialEndsAt: trialEnd,
        features: ['all'],
      };

      logger.info(`Trial started: ${this.TRIAL_DAYS} days remaining`);
      
      vscode.window.showInformationMessage(
        `🎉 Welcome to DevBuddy Pro! You have ${this.TRIAL_DAYS} days free trial.`,
        'Learn More'
      ).then(selection => {
        if (selection === 'Learn More') {
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/angelo-hub/devbuddy#pro-features'));
        }
      });
    } else {
      // Check if trial expired
      const trialDate = new Date(trialStart);
      const now = new Date();
      const daysElapsed = (now.getTime() - trialDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysRemaining = this.TRIAL_DAYS - Math.floor(daysElapsed);

      const trialEnd = new Date(trialDate.getTime() + this.TRIAL_DAYS * 24 * 60 * 60 * 1000);

      if (daysElapsed > this.TRIAL_DAYS) {
        this.licenseInfo = {
          key: 'TRIAL_EXPIRED',
          email: '',
          type: 'personal',
          expiresAt: trialEnd,
          isValid: false,
          isTrial: true,
          trialEndsAt: trialEnd,
          features: [],
        };
        
        logger.info('Trial period expired');
      } else {
        this.licenseInfo = {
          key: 'TRIAL',
          email: '',
          type: 'personal',
          expiresAt: trialEnd,
          isValid: true,
          isTrial: true,
          trialEndsAt: trialEnd,
          features: ['all'],
        };
        
        logger.info(`Trial active: ${daysRemaining} days remaining`);
      }
    }
  }

  /**
   * Check offline grace period (7 days)
   */
  private checkOfflineGracePeriod(): boolean {
    const lastValidation = this.context.globalState.get<string>(this.LAST_VALIDATION_KEY);
    
    if (!lastValidation) {
      return false;
    }

    const lastDate = new Date(lastValidation);
    const now = new Date();
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    const withinGracePeriod = daysSince <= this.OFFLINE_GRACE_DAYS;
    
    if (withinGracePeriod) {
      logger.debug(`Offline grace period: ${Math.floor(this.OFFLINE_GRACE_DAYS - daysSince)} days remaining`);
    }
    
    return withinGracePeriod;
  }

  /**
   * Check if Pro features are available
   */
  public hasProAccess(): boolean {
    return this.licenseInfo?.isValid ?? false;
  }

  /**
   * Check if specific feature is available
   */
  public hasFeatureAccess(featureName: string): boolean {
    if (!this.licenseInfo?.isValid) {
      return false;
    }
    
    // 'all' means all features are available
    if (this.licenseInfo.features.includes('all')) {
      return true;
    }
    
    return this.licenseInfo.features.includes(featureName);
  }

  /**
   * Get license info
   */
  public getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }

  /**
   * Show upgrade prompt
   */
  public async promptUpgrade(featureName: string): Promise<void> {
    const message = this.licenseInfo?.isTrial && !this.licenseInfo?.isValid
      ? `💎 Your trial has expired. Upgrade to DevBuddy Pro to access "${featureName}" and other advanced features!`
      : `💎 "${featureName}" is a Pro feature. Upgrade to access advanced capabilities!`;
    
    const action = await vscode.window.showInformationMessage(
      message,
      'View Plans',
      'Activate License',
      'Dismiss'
    );

    if (action === 'View Plans') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/angelo-hub/devbuddy#pricing'));
    } else if (action === 'Activate License') {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your DevBuddy Pro license key',
        placeHolder: 'XXXX-XXXX-XXXX-XXXX',
        password: true,
      });

      if (key) {
        await this.activateLicense(key);
      }
    }
  }

  /**
   * Deactivate license
   */
  public async deactivateLicense(): Promise<void> {
    await this.context.secrets.delete(this.LICENSE_KEY);
    this.licenseInfo = null;
    logger.info('License deactivated');
    vscode.window.showInformationMessage('License deactivated. You can still use all free features.');
  }

  /**
   * Log current license status
   */
  private logLicenseStatus(): void {
    if (!this.licenseInfo) {
      logger.info('License Status: No license (free features only)');
      return;
    }

    if (this.licenseInfo.isTrial) {
      const daysRemaining = Math.ceil((this.licenseInfo.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      if (this.licenseInfo.isValid) {
        logger.info(`License Status: Trial (${daysRemaining} days remaining)`);
      } else {
        logger.info('License Status: Trial expired');
      }
    } else {
      const expiresAt = this.licenseInfo.expiresAt.toLocaleDateString();
      logger.info(`License Status: ${this.licenseInfo.type} (expires ${expiresAt})`);
    }
  }
}

