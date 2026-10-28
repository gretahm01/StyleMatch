export type AnalysisErrorCategory = 'configuration' | 'quota' | 'authentication' | 'model' | 'timeout' | 'json' | 'network' | 'service' | 'unknown';
export class AnalysisProviderError extends Error {
  constructor(public readonly status: number, message: string, public readonly category: AnalysisErrorCategory = 'unknown') { super(message); this.name = 'AnalysisProviderError'; }
}
