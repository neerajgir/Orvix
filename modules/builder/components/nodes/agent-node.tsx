"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AppIcon } from "@/components/app-icon";
import { getToolIcon, getToolLabel } from "@/modules/builder/lib/tools-catalog";

export function AgentNode({ data }: NodeProps) {
  const tools = (data.tools as { toolId: string; config?: unknown }[]) ?? [];

  return (
    <div className="min-w-40 rounded-xl border-2 border-primary bg-card px-4 py-3 shadow-sm">
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Right} />
      <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
        <AppIcon name="bot" className="size-3.5" />
        Agent
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{(data.label as string) ?? "Main agent"}</p>
      {tools.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tools.map((tool, i) => (
            <span
              key={`${tool.toolId}-${i}`}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              <AppIcon name={getToolIcon(tool.toolId, tool.config)} className="size-2.5" />
              {getToolLabel(tool.toolId, tool.config)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}