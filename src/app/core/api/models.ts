// =============================================
// Domain Models — Stress Test Dashboard
// =============================================

export type TestStatus = 'CREATED' | 'RUNNING' | 'STOPPED' | 'FINISHED' | 'ERROR';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type TestType = 'HTTP' | 'KAFKA' | 'MQ';

// --- Create Test Request ---
export interface CreateTestRequest {
  name: string;
  testType: TestType;
  target: TargetConfig;
  load: LoadConfig;
}

export interface TargetConfig {
  // HTTP
  url?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  // KAFKA
  topic?: string;
  kafkaKey?: string;
  // MQ
  queueName?: string;
  exchangeName?: string;
  routingKey?: string;
  // For Kafka/MQ
  messageTemplate?: string;
}

export interface LoadConfig {
  virtualUsers: number;
  rampUpSeconds: number;
  rampDownSeconds: number;
  thinkTimeMillis: number;
  durationSeconds?: number;
  totalRequests?: number;
}

// --- Create Test Response ---

export interface CreateTestResponse {
  testId: string;
  status: TestStatus;
  startEpochMillis: number;
  terminationMode: 'TIME' | 'REQUESTS';
  plannedEndEpochMillis?: number;
  plannedTotalRequests?: number;
}



// --- Test List Item ---

export interface TestListItem {
  testId: string;
  name: string;
  status: TestStatus;
  createdAt: number;
  startedAt: number;
  endedAt: number;
}



// --- Test Detail ---

export interface TestDetail {
  testId: string;
  name: string;
  status: TestStatus;
  createdAt: number;
  startedAt: number;
  endedAt: number;
  virtualUsers: number;
  rampUpSeconds: number;
  thinkTimeMillis: number;
  url: string;
  method: HttpMethod;
  terminationMode: 'TIME' | 'REQUESTS';
  durationSeconds: number;
  totalRequests: number;
}

// --- Summary (KPIs) ---
export interface TestSummary {
  testId: string;
  status: TestStatus;
  totalRequests: number;
  totalErrors: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  backlogCurrent: number;
  activeWorkers: number;
  rpsCurrent: number;
}

// --- Timeseries ---
export interface TimeseriesPoint {
  epochSecond: number;
  requests: number;
  errors: number;
  avgLatencyMs: number;
}

export interface TestTimeseries {
  testId: string;
  points: TimeseriesPoint[];
}

// --- Preview Request & Response ---
export interface PreviewRequest {
  template: string;
  testType: TestType;
}

export interface PreviewResponse {
  executionId: string;
  variablesDetected: Record<string, string>;
  finalBody: string;
  error?: string;
}

// --- Wizard Form Models ---
export interface HeaderPair {
  key: string;
  value: string;
}

export interface SlaThreshold {
  metric: string;
  operator: string;
  value: number;
}

export interface WizardStepOne {
  name: string;
  description: string;
  testType: TestType;
}

export interface WizardStepHttp {
  url: string;
  method: HttpMethod;
  headers: HeaderPair[];
  body: string;
}

export interface WizardStepKafka {
  topic: string;
  kafkaKey?: string;
  messageTemplate: string;
}

export interface WizardStepMq {
  queueName: string;
  exchangeName: string;
  routingKey: string;
  messageTemplate: string;
}

export interface WizardStepLoad {
  virtualUsers: number;
  durationSeconds: number;
  rampUpSeconds: number;
  rampDownSeconds: number;
  thinkTimeMillis: number;
  thresholds: SlaThreshold[];
}

export interface WizardState {
  stepOne: WizardStepOne;
  stepHttp: WizardStepHttp;
  stepKafka: WizardStepKafka;
  stepMq: WizardStepMq;
  stepLoad: WizardStepLoad;
}

export interface Topic {
  name: string;
  partitions: number;
}

export interface ProbeRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
}

export interface ProbeResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
}
