import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  apiBaseUrl: string;
  pollIntervalMs: number;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export const appConfigFactory = (): AppConfig => ({
  apiBaseUrl: environment.apiBaseUrl,
  pollIntervalMs: environment.pollIntervalMs
});
