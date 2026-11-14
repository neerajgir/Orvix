export type AgentDefinition = {
    schemaVersion: 1;
    instructions: string;
    model: { provider: "gemini"; modelId: string };
    tools: { toolId: string; config: Record<string, unknown> }[];
    memory: { enabled: boolean };
    limits: { maxToolCalls: number; timeoutMs: number };
  };
  
  export function defaultDefinition(): AgentDefinition {
    return {
      schemaVersion: 1,
      instructions: "You are a helpful assistant.",
      model: { provider: "gemini", modelId: "gemini-3.5-flash-lite" },
      tools: [],
      memory: { enabled: false },
      limits: { maxToolCalls: 5, timeoutMs: 60000 },
    };
  }
  