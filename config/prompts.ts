// AI Extraction prompts - edit these to customize AI behavior
// The prompts are used by /api/extract to process voice transcripts

export const SYSTEM_PROMPT = `You are analyzing voice recordings from parents about their children's phone and screen usage.
Your task is to extract structured information from their responses to help build a better phone for kids.

Be empathetic and precise. Focus on:
- Specific pain points and concerns
- Emotional intensity
- Urgency of the problem
- Solutions they've already tried
- What would make them switch devices

Return ONLY valid JSON matching the requested schema.`;

// Step-specific extraction rules
export const STEP_PROMPTS: Record<string, string> = {
    '1': `This is a brain dump about the most challenging aspects of their child's relationship with screens.
Extract:
- main_concerns: Array of specific concerns mentioned
- emotional_tone: frustrated/worried/hopeful/resigned/angry/overwhelmed
- emotional_intensity: 1-5 (5 = very intense)
- key_quotes: Up to 3 direct quotes that capture their feelings
- specific_incidents: Array of specific events or examples mentioned`,

    '4': `This is about why their top pain points are most painful and how urgent solving them is.
Extract:
- urgency_level: 1-10 scale
- urgency_reasoning: Why they rated it this way
- impact_on_family: How it affects family dynamics
- timeline_pressure: Any mentions of time-sensitive concerns`,

    '5': `This is about solutions they've tried and their experiences.
Extract:
- solutions_tried: Array of {solution: string, outcome: string, cost: string}
- total_spend_estimate: Rough estimate of money spent
- time_invested: Rough estimate of time spent on solutions
- frustration_with_solutions: What didn't work and why`,

    '6': `This is about barriers to switching their child's phone.
Extract:
- switching_barriers: Array of concerns about switching
- child_resistance_level: 1-10 expected pushback
- social_factors: Peer pressure, school requirements, etc.
- practical_concerns: Cost, learning curve, compatibility`,
};

// Output schema that the AI should follow
export const OUTPUT_SCHEMA = {
    summary: "Brief 1-2 sentence summary of the response",
    main_concerns: "Array of concerns mentioned",
    emotional_tone: "frustrated|worried|hopeful|resigned|angry|overwhelmed",
    emotional_intensity: "1-5 scale",
    urgency_level: "1-10 scale (if mentioned)",
    key_quotes: "Up to 3 direct quotes",
    specific_incidents: "Array of specific events mentioned",
    solutions_tried: "Array of solutions and outcomes",
    switching_barriers: "Array of barriers to switching",
    actionable_insights: "Product development insights",
};
