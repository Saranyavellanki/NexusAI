import { base44 } from '@/api/base44Client';

// ──────────────────────────────────────────────
// Agent Registry — each agent is a config object
// ──────────────────────────────────────────────
const AGENT_REGISTRY = {};

export function registerAgent(config) {
  AGENT_REGISTRY[config.name] = config;
}

export function getAgent(name) {
  return AGENT_REGISTRY[name];
}

export function listAgents() {
  return Object.values(AGENT_REGISTRY);
}

// ──────────────────────────────────────────────
// Core executor — runs a single agent
// ──────────────────────────────────────────────
async function executeAgent(agentName, input, sessionId, customerId, orderIndex) {
  const agent = AGENT_REGISTRY[agentName];
  if (!agent) throw new Error(`Agent "${agentName}" not registered`);

  const execRecord = await base44.entities.AgentExecution.create({
    customer_id: customerId,
    session_id: sessionId,
    agent_name: agent.label,
    agent_type: agent.type,
    status: 'Running',
    input_data: { summary: agent.inputSummary?.(input) || 'Processing...' },
    order_index: orderIndex,
    model_used: 'automatic',
  });

  const startTime = Date.now();
  try {
    const output = await agent.execute(input);
    const duration = Date.now() - startTime;
    await base44.entities.AgentExecution.update(execRecord.id, {
      status: 'Completed',
      output_data: output,
      duration_ms: duration,
    });
    return { agentName, output, execId: execRecord.id };
  } catch (err) {
    const duration = Date.now() - startTime;
    await base44.entities.AgentExecution.update(execRecord.id, {
      status: 'Failed',
      output_data: { error: err.message },
      duration_ms: duration,
    });
    return { agentName, output: { error: err.message }, execId: execRecord.id };
  }
}

// ──────────────────────────────────────────────
// Planner — orchestrates the full pipeline
// ──────────────────────────────────────────────
export async function runPipeline(customer, onStepUpdate) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const context = { customer, memory: [], agentOutputs: {} };

  const steps = [
    'planner',
    'retrieval',
    'analysis',
    'sentiment',
    'reasoning',
    'recommendation',
    'explanation',
    'memory',
  ];

  // Planner step — decide which agents to run
  onStepUpdate?.('planner', 'running');
  const plannerResult = await executeAgent('planner', context, sessionId, customer.id, 0);
  context.agentOutputs.planner = plannerResult.output;
  onStepUpdate?.('planner', 'completed', plannerResult.output);

  const agentsToRun = plannerResult.output.agents_to_run || steps.slice(1);

  // Execute each agent sequentially (results feed forward)
  let orderIndex = 1;
  for (const agentName of agentsToRun) {
    if (!AGENT_REGISTRY[agentName]) continue;
    onStepUpdate?.(agentName, 'running');
    const result = await executeAgent(agentName, context, sessionId, customer.id, orderIndex);
    context.agentOutputs[agentName] = result.output;
    onStepUpdate?.(agentName, 'completed', result.output);
    orderIndex++;
  }

  return { sessionId, context };
}

// ──────────────────────────────────────────────
// Register all built-in agents
// ──────────────────────────────────────────────

registerAgent({
  name: 'planner',
  label: 'Planner Agent',
  type: 'Planner',
  inputSummary: (ctx) => `Planning for ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const c = ctx.customer;
    const prompt = `You are the Planner Agent of a Customer Success Decision Intelligence Platform.

Analyze this customer context and decide which specialized agents need to run.

Customer: ${c.company_name}
Health Score: ${c.health_score}/100
Usage Trend: ${c.usage_trend}
Usage Drop: ${c.usage_drop_percent}%
Days Since Login: ${c.days_since_login}
Churn Risk: ${c.churn_risk}
Sentiment: ${c.sentiment}
Open Tickets: ${c.open_tickets}
Negative Tickets: ${c.negative_tickets}
Feature Requests: ${(c.feature_requests || []).join(', ') || 'None'}
Renewal Date: ${c.renewal_date}
MRR: $${c.mrr}
Journey Stage: ${c.journey_stage}

Available Agents: retrieval, analysis, sentiment, reasoning, recommendation, explanation, memory

Decide which agents should run and in what order. For critical/at-risk customers, run all agents. For healthy customers, you may skip some.

Return your analysis as JSON.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          assessment: { type: 'string' },
          urgency_level: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          agents_to_run: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
        },
      },
    });
    return result;
  },
});

registerAgent({
  name: 'retrieval',
  label: 'Retrieval Agent',
  type: 'Retrieval',
  inputSummary: (ctx) => `Retrieving data for ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const c = ctx.customer;
    // Fetch past recommendations and memory records for this customer
    let pastRecs = [];
    let memoryRecords = [];
    try {
      pastRecs = await base44.entities.Recommendation.filter({ customer_id: c.id }, '-created_date', 5);
    } catch (e) { /* no records yet */ }
    try {
      memoryRecords = await base44.entities.MemoryRecord.filter({ customer_id: c.id }, '-created_date', 10);
    } catch (e) { /* no records yet */ }

    const prompt = `You are the Retrieval Agent. Compile a comprehensive knowledge summary about this customer.

Customer Profile:
- Company: ${c.company_name}
- Contact: ${c.contact_name} (${c.contact_email})
- Industry: ${c.industry}
- Plan: ${c.plan}
- MRR: $${c.mrr}
- Contract Start: ${c.contract_start_date}
- Renewal Date: ${c.renewal_date}
- Lifetime Value: $${c.lifetime_value}
- CSM: ${c.csm_assigned}
- Notes: ${c.notes || 'None'}

Previous Recommendations: ${pastRecs.length > 0 ? pastRecs.map(r => `${r.title} (${r.status})`).join('; ') : 'None on file'}

Memory Records: ${memoryRecords.length > 0 ? memoryRecords.map(m => `${m.title}: ${m.content || ''}`).join('; ') : 'None on file'}

Feature Requests: ${(c.feature_requests || []).join(', ') || 'None'}

Compile all retrieved knowledge into a structured summary for downstream agents.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          customer_profile_summary: { type: 'string' },
          relationship_history: { type: 'string' },
          key_concerns: { type: 'array', items: { type: 'string' } },
          previous_actions_taken: { type: 'array', items: { type: 'string' } },
          relevant_knowledge: { type: 'array', items: { type: 'string' } },
          data_gaps: { type: 'array', items: { type: 'string' } },
        },
      },
    });
    ctx.memory = memoryRecords;
    return result;
  },
});

registerAgent({
  name: 'analysis',
  label: 'Customer Analysis Agent',
  type: 'Analysis',
  inputSummary: (ctx) => `Analyzing ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const c = ctx.customer;
    const prompt = `You are the Customer Analysis Agent. Perform a deep analysis of this customer's health and predict outcomes.

Metrics:
- Health Score: ${c.health_score}/100
- Engagement Score: ${c.engagement_score}/100
- Usage Trend: ${c.usage_trend}
- Usage Drop: ${c.usage_drop_percent}%
- Days Since Login: ${c.days_since_login}
- MRR: $${c.mrr}
- Plan: ${c.plan}
- Lifetime Value: $${c.lifetime_value}
- Open Tickets: ${c.open_tickets}
- Negative Tickets: ${c.negative_tickets}
- Renewal Date: ${c.renewal_date}
- Journey Stage: ${c.journey_stage}

Previous Agent Output (Retrieval):
${JSON.stringify(ctx.agentOutputs.retrieval || {}, null, 2)}

Analyze and predict:
1. Churn probability (0-100%)
2. Upsell opportunity score (0-100%)
3. Key risk factors
4. Positive signals
5. Customer segment classification`;

    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          churn_probability: { type: 'number' },
          upsell_opportunity: { type: 'number' },
          risk_factors: { type: 'array', items: { type: 'string' } },
          positive_signals: { type: 'array', items: { type: 'string' } },
          customer_segment: { type: 'string' },
          health_trend_prediction: { type: 'string' },
          revenue_impact: { type: 'string' },
          recommended_attention_level: { type: 'string' },
        },
      },
    });
  },
});

registerAgent({
  name: 'sentiment',
  label: 'Sentiment Analysis Agent',
  type: 'Sentiment',
  inputSummary: (ctx) => `Analyzing sentiment for ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const c = ctx.customer;
    const prompt = `You are the Sentiment Analysis Agent. Analyze the overall customer sentiment.

Customer: ${c.company_name}
Current Sentiment Tag: ${c.sentiment}
Open Tickets: ${c.open_tickets}
Negative Tickets: ${c.negative_tickets}
Feature Requests: ${(c.feature_requests || []).join(', ') || 'None'}
Notes from CSM: ${c.notes || 'None'}
Days Since Login: ${c.days_since_login}
Usage Drop: ${c.usage_drop_percent}%

Based on this data, provide a detailed sentiment analysis. Infer emotional state, urgency, frustration levels, and engagement willingness from the behavioral and ticket data.`;

    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_sentiment: { type: 'string', enum: ['Positive', 'Neutral', 'Negative', 'Mixed'] },
          sentiment_score: { type: 'number' },
          urgency_level: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          frustration_level: { type: 'string', enum: ['None', 'Low', 'Medium', 'High', 'Severe'] },
          satisfaction_indicators: { type: 'array', items: { type: 'string' } },
          concern_indicators: { type: 'array', items: { type: 'string' } },
          engagement_willingness: { type: 'string' },
          communication_tone_recommendation: { type: 'string' },
        },
      },
    });
  },
});

registerAgent({
  name: 'reasoning',
  label: 'Business Reasoning Agent',
  type: 'Reasoning',
  inputSummary: (ctx) => `Reasoning about ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const c = ctx.customer;
    const prompt = `You are the Business Reasoning Agent. Combine all previous agent outputs and identify risks, opportunities, and priorities.

Customer: ${c.company_name} | MRR: $${c.mrr} | LTV: $${c.lifetime_value}

Retrieval Output: ${JSON.stringify(ctx.agentOutputs.retrieval || {})}
Analysis Output: ${JSON.stringify(ctx.agentOutputs.analysis || {})}
Sentiment Output: ${JSON.stringify(ctx.agentOutputs.sentiment || {})}

Provide strategic business reasoning:
1. What are the main risks?
2. What opportunities exist?
3. What information is missing?
4. What should be prioritized?
5. What are the business consequences of inaction?`;

    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          key_risks: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          missing_information: { type: 'array', items: { type: 'string' } },
          business_priorities: { type: 'array', items: { type: 'string' } },
          cost_of_inaction: { type: 'string' },
          strategic_context: { type: 'string' },
          time_sensitivity: { type: 'string' },
        },
      },
    });
  },
});

registerAgent({
  name: 'recommendation',
  label: 'Recommendation Agent',
  type: 'Recommendation',
  inputSummary: (ctx) => `Generating recommendations for ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const c = ctx.customer;
    const prompt = `You are the Recommendation Agent. Generate ranked Next Best Actions for this customer.

Customer: ${c.company_name} | MRR: $${c.mrr} | Health: ${c.health_score}/100

All Previous Outputs:
Retrieval: ${JSON.stringify(ctx.agentOutputs.retrieval || {})}
Analysis: ${JSON.stringify(ctx.agentOutputs.analysis || {})}
Sentiment: ${JSON.stringify(ctx.agentOutputs.sentiment || {})}
Reasoning: ${JSON.stringify(ctx.agentOutputs.reasoning || {})}

Generate 1 top recommendation and 2-3 alternatives. Each must include priority, confidence score (0-100), and expected business impact.

Action types to consider:
- Schedule account review meeting
- Offer renewal discount
- Assign senior CSM
- Give early access to requested features
- Recommend additional training
- Escalate to engineering
- Send personalized follow-up email
- Proactive executive outreach
- Custom success plan`;

    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          top_recommendation: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string' },
              confidence_score: { type: 'number' },
              expected_impact: { type: 'string' },
              impact_score: { type: 'number' },
              category: { type: 'string' },
            },
          },
          alternatives: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                confidence_score: { type: 'number' },
                expected_impact: { type: 'string' },
              },
            },
          },
          reasoning_summary: { type: 'string' },
        },
      },
    });
  },
});

registerAgent({
  name: 'explanation',
  label: 'Explanation Agent',
  type: 'Explanation',
  inputSummary: (ctx) => `Generating explanation for ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const rec = ctx.agentOutputs.recommendation || {};
    const prompt = `You are the Explanation Agent. Create a clear, business-friendly explanation of the recommendation.

Recommendation: ${JSON.stringify(rec.top_recommendation || {})}
Analysis: ${JSON.stringify(ctx.agentOutputs.analysis || {})}
Reasoning: ${JSON.stringify(ctx.agentOutputs.reasoning || {})}
Sentiment: ${JSON.stringify(ctx.agentOutputs.sentiment || {})}

Write an explanation that a non-technical Customer Success Manager can understand:
1. Why this recommendation was generated
2. What data influenced the decision
3. Supporting evidence points
4. Confidence level justification`;

    return await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          explanation_summary: { type: 'string' },
          key_drivers: { type: 'array', items: { type: 'string' } },
          supporting_evidence: { type: 'array', items: { type: 'string' } },
          confidence_justification: { type: 'string' },
          risk_if_not_acted: { type: 'string' },
          expected_timeline: { type: 'string' },
        },
      },
    });
  },
});

registerAgent({
  name: 'memory',
  label: 'Memory Agent',
  type: 'Memory',
  inputSummary: (ctx) => `Updating memory for ${ctx.customer.company_name}`,
  execute: async (ctx) => {
    const c = ctx.customer;
    const rec = ctx.agentOutputs.recommendation?.top_recommendation || {};
    const explanation = ctx.agentOutputs.explanation || {};

    // Store the analysis as a memory record
    await base44.entities.MemoryRecord.create({
      customer_id: c.id,
      customer_name: c.company_name,
      record_type: 'Recommendation',
      title: rec.title || 'Agent Analysis Run',
      content: explanation.explanation_summary || 'Analysis completed',
      decision: 'N/A',
      tags: ['auto-generated', c.churn_risk?.toLowerCase() || 'unknown'],
    });

    return {
      status: 'Memory updated',
      stored_items: ['Customer analysis snapshot', 'Recommendation record', 'Agent execution trace'],
      memory_context_size: (ctx.memory || []).length + 1,
    };
  },
});

// ──────────────────────────────────────────────
// Helper: Save final recommendation to entity
// ──────────────────────────────────────────────
export async function saveRecommendation(customer, pipelineContext) {
  const rec = pipelineContext.agentOutputs.recommendation?.top_recommendation || {};
  const explanation = pipelineContext.agentOutputs.explanation || {};
  const alternatives = pipelineContext.agentOutputs.recommendation?.alternatives || [];

  const categoryMap = {
    'retention': 'Retention', 'upsell': 'Upsell', 'support': 'Support',
    'engagement': 'Engagement', 'training': 'Training', 'escalation': 'Escalation', 'review': 'Review',
  };
  const rawCat = (rec.category || 'retention').toLowerCase();
  const category = categoryMap[rawCat] || 'Retention';

  return await base44.entities.Recommendation.create({
    customer_id: customer.id,
    customer_name: customer.company_name,
    title: rec.title || 'Pending Review',
    description: rec.description || '',
    priority: rec.priority || 'Medium',
    confidence_score: rec.confidence_score || 50,
    expected_impact: rec.expected_impact || '',
    impact_score: rec.impact_score || 50,
    category,
    status: 'Pending',
    explanation: explanation.explanation_summary || '',
    supporting_evidence: explanation.supporting_evidence || [],
    alternative_actions: alternatives.map(a => ({
      title: a.title,
      confidence: a.confidence_score,
      impact: a.expected_impact,
    })),
    agent_outputs: {
      analysis: pipelineContext.agentOutputs.analysis || {},
      sentiment: pipelineContext.agentOutputs.sentiment || {},
      reasoning: pipelineContext.agentOutputs.reasoning || {},
    },
  });
}