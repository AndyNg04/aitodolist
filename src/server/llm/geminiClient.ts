import { SYSTEM_PROMPT } from './systemPrompt';
import {
  extractTaskIntent as localExtractTaskIntent,
  suggestScheduleAdjustments as localSuggest,
  ExtractTaskIntentParams,
  ExtractTaskIntentResult
} from './tools';

const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';

const extractDeclaration = {
  name: 'extract_task_intent',
  description: '将自然语言任务解析为 LumiList 的结构化槽位',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      notes: { type: 'string' },
      due: { type: 'string', description: 'ISO 8601 格式截止时间' },
      start: { type: 'string', description: 'ISO 8601 开始时间' },
      durationMin: { type: 'number' },
      priority: { type: 'string', enum: ['low', 'med', 'high'] },
      tags: { type: 'array', items: { type: 'string' } },
      flexibility: { type: 'string', enum: ['strict', '±15m', '±30m', '±2h'] },
      recurrence: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              rrule: { type: 'string' }
            }
          }
        ]
      },
      reminders: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            offsetMin: { type: 'number' },
            mode: { type: 'string', enum: ['silent', 'popup'] }
          },
          required: ['offsetMin', 'mode']
        }
      },
      conflicts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['worktime', 'quiet', 'overlap'] },
            detail: { type: 'string' }
          }
        }
      },
      rationale: { type: 'string' }
    },
    required: ['title', 'rationale']
  }
};

const suggestDeclaration = {
  name: 'suggest_schedule_adjustments',
  description: '针对冲突给出 2-4 个可选时段',
  parameters: {
    type: 'object',
    properties: {
      start: { type: 'string' },
      due: { type: 'string' },
      durationMin: { type: 'number' },
      flexibility: { type: 'string', enum: ['strict', '±15m', '±30m', '±2h'] },
      rationale: { type: 'string' }
    }
  }
};

async function callGemini(payload: Record<string, unknown>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }
  return res.json();
}

function parseFunctionCall(candidate: any) {
  const parts = candidate?.content?.parts ?? candidate?.parts ?? [];
  for (const part of parts) {
    if (part.functionCall) {
      const name = part.functionCall.name;
      const args = part.functionCall.args || part.functionCall.arguments || part.functionCall;
      if (args?.argumentsJson) {
        return { name, args: JSON.parse(args.argumentsJson) };
      }
      if (typeof args === 'string') {
        try {
          return { name, args: JSON.parse(args) };
        } catch {
          continue;
        }
      }
      if (args?.args) {
        return { name, args: args.args };
      }
      if (args?.parameters) {
        return { name, args: args.parameters };
      }
      if (args) {
        return { name, args };
      }
    }
  }
  return null;
}

export async function runExtractTaskIntent(
  params: ExtractTaskIntentParams
): Promise<ExtractTaskIntentResult> {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `当前时间：${params.nowISO} (${params.timezone}).\n用户输入：${params.inputText}\n请调用 extract_task_intent 工具并返回理由。`
          }
        ]
      }
    ],
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_PROMPT }]
    },
    tools: [
      {
        functionDeclarations: [extractDeclaration, suggestDeclaration]
      }
    ],
    toolConfig: {
      functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['extract_task_intent'] }
    }
  };

  try {
    const response = await callGemini(payload);
    if (response) {
      const candidate = response.candidates?.[0];
      const call = parseFunctionCall(candidate);
      if (call?.name === 'extract_task_intent') {
        return call.args as ExtractTaskIntentResult;
      }
    }
  } catch (error) {
    console.warn('Gemini 调用失败，使用本地解析', error);
  }

  return localExtractTaskIntent(params);
}

export async function runSuggestAdjustments(params: {
  draft: {
    start?: string | null;
    due?: string | null;
    durationMin?: number | null;
    flexibility?: 'strict' | '±15m' | '±30m' | '±2h';
  };
}) {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `针对草稿 ${JSON.stringify(params.draft)}，如存在冲突请调用 suggest_schedule_adjustments 工具给出候选。`
          }
        ]
      }
    ],
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_PROMPT }]
    },
    tools: [
      {
        functionDeclarations: [suggestDeclaration]
      }
    ],
    toolConfig: {
      functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['suggest_schedule_adjustments'] }
    }
  };

  try {
    const response = await callGemini(payload);
    if (response) {
      const candidate = response.candidates?.[0];
      const call = parseFunctionCall(candidate);
      if (call?.name === 'suggest_schedule_adjustments') {
        return Array.isArray(call.args) ? call.args : [call.args];
      }
    }
  } catch (error) {
    console.warn('Gemini 调用失败，使用本地候选', error);
  }

  return localSuggest({ draft: params.draft });
}
