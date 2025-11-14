/**
 * License Manager for DevBuddy Pro Features
 * 
 * This module handles license validation, trial management, and pro feature access.
 * Integrates with Lemon Squeezy for license management and GitHub for user verification.
 * 
 * @license Commercial - See LICENSE.pro
 */

import * as vscode from 'vscode';
import axios from 'axios';
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
  githubId?: string;
  githubUsername?: string;
}

interface LemonSqueezyValidateResponse {
  valid: boolean;
  license_key: {
    id: string;
    status: 'active' | 'inactive' | 'expired' | 'disabled';
    key: string;
    activation_limit: number;
    activation_usage: number;
    expires_at: string | null;
    test_mode: boolean;
    customer: {
      email: string;
      name: string;
    };
  };
  instance: {
    id: string;
    name: string;
    created_at: string;
  } | null;
  meta: {
    store_id: number;
    order_id: number;
    order_item_id: number;
    product_id: number;
    product_name: string;
    variant_id: number;
    variant_name: string;
    github_id?: string;
    github_username?: string;
  };
}

interface LemonSqueezyActivateResponse {
  activated: boolean;
  license_key: LemonSqueezyValidateResponse['license_key'];
  instance: {
    id: string;
    name: string;
    created_at: string;
  };
  meta: LemonSqueezyValidateResponse['meta'];
}

export class LicenseManager {
  private static instance: LicenseManager;
  private context: vscode.ExtensionContext;
  private licenseInfo: LicenseInfo | null = null;
  
  private readonly LICENSE_KEY = 'devBuddy.pro.licenseKey';
  private readonly LICENSE_METADATA_KEY = 'devBuddy.pro.licenseMetadata';
  private readonly TRIAL_START_KEY = 'devBuddy.pro.trialStartDate';
  private readonly LAST_VALIDATION_KEY = 'devBuddy.pro.lastValidation';
  
  // Lemon Squeezy Configuration
  // TODO: Set these via VS Code settings or environment variables for production
  private readonly LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
  private readonly LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';
  private readonly LEMONSQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';
  
  private readonly TRIAL_DAYS = 30;
  private readonly OFFLINE_GRACE_DAYS = 7;
  private readonly REVALIDATION_HOURS = 24;

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
      logger.debug('Found stored license key, loading from cache...');
      this.licenseInfo = await this.getCachedLicenseInfo();
    } else {
      logger.debug('No license key found, checking trial status...');
      await this.initializeTrial();
    }

    // Show license status in output
    this.logLicenseStatus();
  }

  /**
   * Activate a license key with GitHub verification
   */
  async activateLicense(licenseKey: string): Promise<boolean> {
    logger.info('Attempting to activate license with GitHub verification...');
    
    // Step 1: Authenticate with GitHub
    let githubSession;
    try {
      githubSession = await vscode.authentication.getSession(
        'github',
        ['user:email'],
        { createIfNone: true }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        '❌ GitHub authentication is required to activate DevBuddy Pro. Please sign in to GitHub in VS Code.'
      );
      logger.error('GitHub authentication failed:', error);
      return false;
    }

    if (!githubSession) {
      vscode.window.showErrorMessage(
        '❌ Failed to authenticate with GitHub. Please try again.'
      );
      return false;
    }

    const githubUsername = githubSession.account.label;
    logger.debug(`GitHub user authenticated: ${githubUsername}`);

    // Step 2: Get GitHub user ID
    const githubId = await this.getGitHubUserId(githubSession.accessToken);
    if (!githubId) {
      vscode.window.showErrorMessage(
        '❌ Failed to retrieve GitHub user information. Please try again.'
      );
      return false;
    }

    // Step 3: Check if license is already associated with a different GitHub account
    try {
      const validationResponse = await this.validateLicenseWithLemonSqueezy(licenseKey);
      
      if (!validationResponse) {
        vscode.window.showErrorMessage(
          '❌ Invalid license key. Please check and try again.'
        );
        return false;
      }

      const existingGitHubId = validationResponse.meta?.github_id;

      if (existingGitHubId && existingGitHubId !== githubId) {
        const choice = await vscode.window.showErrorMessage(
          `❌ This license is already associated with another GitHub account. ` +
          `If you own both accounts, you can transfer the license.`,
          'Contact Support',
          'Cancel'
        );

        if (choice === 'Contact Support') {
          vscode.env.openExternal(
            vscode.Uri.parse('mailto:support@angelogirardi.com?subject=DevBuddy Pro License Transfer Request')
          );
        }
        return false;
      }

      // Step 4: Activate license with Lemon Squeezy
      const activationResult = await this.activateLicenseWithLemonSqueezy(
        licenseKey,
        githubUsername,
        githubId
      );

      if (!activationResult) {
        return false;
      }

      // Step 5: Store license info locally
      await this.storeLicenseInfo({
        key: licenseKey,
        email: validationResponse.license_key.customer.email,
        type: 'personal', // TODO: Determine type from product
        expiresAt: validationResponse.license_key.expires_at 
          ? new Date(validationResponse.license_key.expires_at)
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year default
        isValid: true,
        isTrial: false,
        features: ['all'],
        githubId: githubId,
        githubUsername: githubUsername,
      });

      await this.context.globalState.update(this.LAST_VALIDATION_KEY, new Date().toISOString());

      vscode.window.showInformationMessage(
        `✨ DevBuddy Pro activated successfully for @${githubUsername}!`
      );
      logger.success(`License activated for GitHub user: ${githubUsername} (ID: ${githubId})`);

      return true;

    } catch (error: any) {
      logger.error('License activation error:', error);
      
      if (error.response?.status === 422) {
        vscode.window.showErrorMessage(
          '❌ License activation limit reached. Please deactivate on another machine first.'
        );
      } else if (error.response?.status === 404) {
        vscode.window.showErrorMessage(
          '❌ Invalid license key. Please check and try again.'
        );
      } else {
        vscode.window.showErrorMessage(
          '❌ Failed to activate license. Please try again or contact support.'
        );
      }
      
      return false;
    }
  }

  /**
   * Validate license with Lemon Squeezy
   */
  private async validateLicenseWithLemonSqueezy(
    licenseKey: string
  ): Promise<LemonSqueezyValidateResponse | null> {
    try {
      logger.debug('Validating license with Lemon Squeezy...');

      // For development/testing without API key
      if (!this.LEMONSQUEEZY_API_KEY || this.LEMONSQUEEZY_API_KEY === '') {
        logger.warn('No Lemon Squeezy API key configured, using mock validation');
        return this.mockLemonSqueezyValidation(licenseKey);
      }

      const response = await axios.post<LemonSqueezyValidateResponse>(
        `${this.LEMONSQUEEZY_API_URL}/licenses/validate`,
        {
          license_key: licenseKey,
          instance_name: vscode.env.machineId,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.valid && response.data.license_key.status === 'active') {
        logger.debug('License validated successfully');
        return response.data;
      }

      logger.warn(`License validation failed: ${response.data.license_key.status}`);
      return null;

    } catch (error: any) {
      logger.error('Lemon Squeezy validation error:', error);
      
      // Check offline grace period
      if (await this.checkOfflineGracePeriod()) {
        logger.info('License validation failed but offline grace period is active');
        // Return cached license info if available
        const cached = await this.getCachedLicenseInfo();
        if (cached) {
          return this.mockLemonSqueezyValidation(cached.key);
        }
      }
      
      throw error;
    }
  }

  /**
   * Activate license with Lemon Squeezy
   */
  private async activateLicenseWithLemonSqueezy(
    licenseKey: string,
    githubUsername: string,
    githubId: string
  ): Promise<boolean> {
    try {
      logger.debug('Activating license with Lemon Squeezy...');

      // For development/testing without API key
      if (!this.LEMONSQUEEZY_API_KEY || this.LEMONSQUEEZY_API_KEY === '') {
        logger.warn('No Lemon Squeezy API key configured, using mock activation');
        return true;
      }

      const response = await axios.post<LemonSqueezyActivateResponse>(
        `${this.LEMONSQUEEZY_API_URL}/licenses/activate`,
        {
          license_key: licenseKey,
          instance_name: `${githubUsername}@${vscode.env.machineId}`,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data.activated) {
        logger.debug('License activated successfully');
        
        // TODO: Update license metadata with GitHub ID via your serverless endpoint
        // This requires a backend endpoint since we can't update metadata from client-side
        // await this.updateLicenseMetadata(licenseKey, { github_id: githubId, github_username: githubUsername });
        
        return true;
      }

      return false;

    } catch (error: any) {
      logger.error('Lemon Squeezy activation error:', error);
      throw error;
    }
  }

  /**
   * Get GitHub user ID from access token
   */
  private async getGitHubUserId(accessToken: string): Promise<string | null> {
    try {
      logger.debug('Fetching GitHub user ID...');

      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 10000,
      });

      const userId = response.data.id.toString();
      logger.debug(`GitHub user ID retrieved: ${userId}`);
      
      return userId;

    } catch (error) {
      logger.error('Failed to retrieve GitHub user ID:', error);
      return null;
    }
  }

  /**
   * Store license info securely
   */
  private async storeLicenseInfo(info: LicenseInfo): Promise<void> {
    await this.context.secrets.store(this.LICENSE_KEY, info.key);
    
    const metadata = {
      email: info.email,
      type: info.type,
      expiresAt: info.expiresAt.toISOString(),
      isValid: info.isValid,
      isTrial: info.isTrial,
      trialEndsAt: info.trialEndsAt?.toISOString(),
      features: info.features,
      githubId: info.githubId,
      githubUsername: info.githubUsername,
      lastValidation: new Date().toISOString(),
    };
    
    await this.context.globalState.update(this.LICENSE_METADATA_KEY, metadata);
    
    this.licenseInfo = info;
  }

  /**
   * Get cached license info
   */
  private async getCachedLicenseInfo(): Promise<LicenseInfo | null> {
    const key = await this.context.secrets.get(this.LICENSE_KEY);
    const metadata = this.context.globalState.get<any>(this.LICENSE_METADATA_KEY);

    if (!key || !metadata) {
      return null;
    }

    return {
      key,
      email: metadata.email,
      type: metadata.type,
      expiresAt: new Date(metadata.expiresAt),
      isValid: metadata.isValid,
      isTrial: metadata.isTrial,
      trialEndsAt: metadata.trialEndsAt ? new Date(metadata.trialEndsAt) : undefined,
      features: metadata.features,
      githubId: metadata.githubId,
      githubUsername: metadata.githubUsername,
    };
  }

  /**
   * Mock Lemon Squeezy validation for development
   */
  private mockLemonSqueezyValidation(licenseKey: string): LemonSqueezyValidateResponse {
    return {
      valid: true,
      license_key: {
        id: 'mock-id',
        status: 'active',
        key: licenseKey,
        activation_limit: 3,
        activation_usage: 1,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        test_mode: true,
        customer: {
          email: 'dev@example.com',
          name: 'Development User',
        },
      },
      instance: {
        id: 'mock-instance',
        name: vscode.env.machineId,
        created_at: new Date().toISOString(),
      },
      meta: {
        store_id: 0,
        order_id: 0,
        order_item_id: 0,
        product_id: 0,
        product_name: 'DevBuddy Pro (Dev)',
        variant_id: 0,
        variant_name: 'Personal',
      },
    };
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
  private async checkOfflineGracePeriod(): Promise<boolean> {
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
   * Check if Pro features are available (with GitHub verification)
   */
  public async hasProAccess(): Promise<boolean> {
    // Load license info if not already loaded
    if (!this.licenseInfo) {
      this.licenseInfo = await this.getCachedLicenseInfo();
    }

    if (!this.licenseInfo || !this.licenseInfo.isValid) {
      return false;
    }

    // Check if license has expired
    if (this.licenseInfo.expiresAt && this.licenseInfo.expiresAt < new Date()) {
      logger.warn('License has expired');
      await this.showExpiredLicenseNotification();
      return false;
    }

    // Verify GitHub account still matches (if GitHub ID is stored)
    if (this.licenseInfo.githubId) {
      try {
        const githubSession = await vscode.authentication.getSession(
          'github',
          ['user:email'],
          { createIfNone: false } // Don't force sign-in
        );

        if (githubSession) {
          const currentGitHubId = await this.getGitHubUserId(githubSession.accessToken);
          
          if (currentGitHubId && currentGitHubId !== this.licenseInfo.githubId) {
            vscode.window.showWarningMessage(
              `⚠️ You are signed in with a different GitHub account. ` +
              `Please sign in with @${this.licenseInfo.githubUsername} to use Pro features.`
            );
            return false;
          }
        } else {
          // No GitHub session - allow grace period for offline usage
          logger.debug('No GitHub session available, checking offline grace period');
          return await this.checkOfflineGracePeriod();
        }
      } catch (error) {
        // GitHub auth failed, allow grace period
        logger.warn('GitHub verification failed, using offline mode');
        return await this.checkOfflineGracePeriod();
      }
    }

    // Check if we need to revalidate (every 24 hours)
    const lastValidation = this.context.globalState.get<string>(this.LAST_VALIDATION_KEY);
    if (lastValidation) {
      const hoursSinceValidation = 
        (Date.now() - new Date(lastValidation).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceValidation > this.REVALIDATION_HOURS) {
        logger.debug('License needs revalidation (24 hours passed)');
        
        try {
          // Revalidate in background
          const validation = await this.validateLicenseWithLemonSqueezy(this.licenseInfo.key);
          
          if (validation) {
            await this.context.globalState.update(this.LAST_VALIDATION_KEY, new Date().toISOString());
            logger.debug('License revalidated successfully');
          } else {
            // Validation failed, check grace period
            return await this.checkOfflineGracePeriod();
          }
        } catch (error) {
          // Revalidation failed (offline?), use grace period
          logger.warn('License revalidation failed, checking grace period');
          return await this.checkOfflineGracePeriod();
        }
      }
    }

    return true;
  }

  /**
   * Show expired license notification
   */
  private async showExpiredLicenseNotification(): Promise<void> {
    const choice = await vscode.window.showWarningMessage(
      '⚠️ Your DevBuddy Pro license has expired. Please renew to continue using Pro features.',
      'Renew License',
      'Contact Support'
    );

    if (choice === 'Renew License') {
      vscode.env.openExternal(
        vscode.Uri.parse('https://github.com/angelo-hub/devbuddy#pricing')
      );
    } else if (choice === 'Contact Support') {
      vscode.env.openExternal(
        vscode.Uri.parse('mailto:support@angelogirardi.com?subject=DevBuddy Pro License Renewal')
      );
    }
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

