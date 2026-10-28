export interface ProductFeedback { profileId: string; productId: string; rating: number | null; isFavorite: boolean; notInterested: boolean; createdAt: string; updatedAt: string; }
export interface InferredSignal { value: string; score: number; direction: 'positive' | 'negative'; }
export interface InferredPreferences { feedbackCount: number; active: boolean; confidence: 'insufficient' | 'emerging' | 'established'; colors: InferredSignal[]; styles: InferredSignal[]; materials: InferredSignal[]; subcategories: InferredSignal[]; }
