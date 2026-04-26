export const HEALING_RULES = {
    HIGH_CPU: {
        trigger: 'high_cpu',
        threshold: 80,        // % cpu usage
        action: 'scale_up',
        description: 'CPU above 80% — scale replicas up',
    },
    HIGH_MEMORY: {
        trigger: 'high_memory',
        threshold: 85,        // % memory usage
        action: 'restart_pod',
        description: 'Memory above 85% — restart pod',
    },
    HIGH_ERROR_RATE: {
        trigger: 'high_error_rate',
        threshold: 5,         // % error rate
        action: 'rollback',
        description: 'Error rate above 5% — rollback deployment',
    },
    POD_CRASH: {
        trigger: 'pod_crash',
        threshold: 0,         // podCount = 0
        action: 'restart_pod',
        description: 'No pods running — force restart',
    },
} as const;

export type HealingTrigger = keyof typeof HEALING_RULES;