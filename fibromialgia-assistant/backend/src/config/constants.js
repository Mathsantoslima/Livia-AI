/**
 * Constantes específicas para o contexto de fibromialgia
 */

// Sintomas comuns de fibromialgia
const SYMPTOMS = {
  PAIN: "pain",
  FATIGUE: "fatigue",
  SLEEP_DISORDERS: "sleepDisorders",
  COGNITIVE_ISSUES: "cognitiveIssues",
  STIFFNESS: "stiffness",
  HEADACHE: "headache",
  ANXIETY: "anxiety",
  DEPRESSION: "depression",
  IRRITABLE_BOWEL: "irritableBowel",
  SENSITIVITY: "sensitivity",
};

// Categorias de educação
const EDUCATION_CATEGORIES = {
  DISEASE_INFO: "diseaseInfo",
  TREATMENT: "treatment",
  LIFESTYLE: "lifestyle",
  MEDICATION: "medication",
  COPING_STRATEGIES: "copingStrategies",
  EXERCISE: "exercise",
  NUTRITION: "nutrition",
  SUPPORT_RESOURCES: "supportResources",
};

// Níveis de dor
const PAIN_LEVELS = {
  NONE: 0,
  MILD: 1,
  DISCOMFORTING: 2,
  DISTRESSING: 3,
  INTENSE: 4,
  EXCRUCIATING: 5,
};

// Fatores que influenciam os sintomas
const TRIGGER_FACTORS = {
  WEATHER_CHANGES: "weatherChanges",
  STRESS: "stress",
  PHYSICAL_ACTIVITY: "physicalActivity",
  LACK_OF_SLEEP: "lackOfSleep",
  DIET: "diet",
  HORMONAL_CHANGES: "hormonalChanges",
  TRAVEL: "travel",
};

// Tópicos para registros diários
const DIARY_TOPICS = {
  PAIN_LEVEL: "painLevel",
  MEDICATION: "medication",
  SLEEP_QUALITY: "sleepQuality",
  MOOD: "mood",
  ACTIVITY_LEVEL: "activityLevel",
  DIET: "diet",
  TRIGGER_FACTORS: "triggerFactors",
  NOTES: "notes",
};

// Estados emocionais para rastreamento
const MOOD_STATES = {
  EXCELLENT: "excellent",
  GOOD: "good",
  NEUTRAL: "neutral",
  SAD: "sad",
  ANXIOUS: "anxious",
  DEPRESSED: "depressed",
  IRRITABLE: "irritable",
  OVERWHELMED: "overwhelmed",
};

// Categorias de perguntas frequentes
const FAQ_CATEGORIES = {
  DIAGNOSIS: "diagnosis",
  TREATMENT: "treatment",
  MEDICATION: "medication",
  LIFESTYLE: "lifestyle",
  SUPPORT: "support",
  RESEARCH: "research",
};

// Status de atividade recomendada
const ACTIVITY_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  FAILED: "failed",
};

// Tipos de recursos de apoio
const SUPPORT_RESOURCE_TYPES = {
  GROUP: "group",
  SPECIALIST: "specialist",
  ONLINE_COMMUNITY: "onlineCommunity",
  EDUCATIONAL_MATERIAL: "educationalMaterial",
  APP: "app",
  THERAPY: "therapy",
};

// Níveis de recomendação baseados em evidências
const EVIDENCE_LEVELS = {
  STRONG: "strong",
  MODERATE: "moderate",
  LIMITED: "limited",
  EXPERT_OPINION: "expertOpinion",
};

module.exports = {
  SYMPTOMS,
  EDUCATION_CATEGORIES,
  PAIN_LEVELS,
  TRIGGER_FACTORS,
  DIARY_TOPICS,
  MOOD_STATES,
  FAQ_CATEGORIES,
  ACTIVITY_STATUS,
  SUPPORT_RESOURCE_TYPES,
  EVIDENCE_LEVELS,
};
