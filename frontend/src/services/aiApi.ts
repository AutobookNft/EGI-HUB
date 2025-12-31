import api from './api';

export interface Consultation {
    id: number;
    user_id: number;
    user_name: string;
    egi_id: number;
    egi_name: string;
    prompt: string;
    response: string;
    tokens_used: number;
    model: string;
    created_at: string;
}

export interface AiStats {
    data: Consultation[];
    meta: {
        total: number;
        today: number;
        week: number;
        tokens_consumed: number;
    };
}

export interface AiFeature {
    slug: string;
    name: string;
    description: string;
    enabled: boolean;
    credits_cost: number;
    model: string;
    max_tokens: number;
}

export interface CreditStats {
    total_credits_issued: number;
    total_credits_used: number;
    total_credits_available: number;
    users_with_credits: number;
}

export interface CreditTransaction {
    id: number;
    user_id: number;
    user_name: string;
    amount: number;
    type: 'assigned' | 'used' | 'expired';
    reason: string;
    created_at: string;
}

export interface CreditsResponse {
    stats: CreditStats;
    transactions: CreditTransaction[];
}

/**
 * Get AI Consultations
 */
export async function getAiConsultations(): Promise<AiStats> {
    const response = await api.get('/superadmin/ai/consultations');
    return response.data;
}

/**
 * Get AI Credits
 */
export async function getAiCredits(): Promise<CreditsResponse> {
    const response = await api.get('/superadmin/ai/credits');
    return response.data;
}

/**
 * Get AI Statistics
 */
export async function getAiStatistics(): Promise<any> {
    const response = await api.get('/superadmin/ai/statistics');
    return response.data;
}

/**
 * Get AI Features
 */
export async function getAiFeatures(): Promise<AiFeature[]> {
    const response = await api.get('/superadmin/ai/features');
    return response.data.data;
}

/**
 * Toggle AI Feature
 */
export async function toggleAiFeature(slug: string): Promise<any> {
    const response = await api.post(`/superadmin/ai/features/${slug}/toggle`);
    return response.data;
}

export const aiApi = {
    getConsultations: getAiConsultations,
    getStatistics: getAiStatistics,
    getFeatures: getAiFeatures,
    toggleFeature: toggleAiFeature
};

export default aiApi;
