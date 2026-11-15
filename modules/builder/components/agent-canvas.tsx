"use client";

import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { AgentNode } from "@/modules/builder/components/nodes/agent-node";
import { EndNode } from "@/modules/builder/components/nodes/end-node";
import { MemoryNode } from "@/modules/builder/components/nodes/memory-node";
import { ModelNode } from "@/modules/builder/components/nodes/model-node";
import { StartNode } from "@/modules/builder/components/nodes/start-node";
import { ToolNode } from "@/modules/builder/components/nodes/tool-node";
import { useCanvasStore } from "@/modules/builder/store/canvas-store";

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  model: ModelNode,
  tool: ToolNode,
  memory: MemoryNode,
  start: StartNode,
  end: EndNode,
};

function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel
      position="bottom-left"
      className="flex items-center gap-1 rounded-2xl border border-border bg-card/90 p-1 shadow-sm backdrop-blur"
    >
      <Button variant="ghost" size="icon" aria-label="Zoom out" onClick={() => zoomOut({ duration: 200 })}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </Button>
      <Button variant="ghost" size="icon" aria-label="Fit view" onClick={() => fitView({ duration: 200 })}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </Button>
      <Button variant="ghost" size="icon" aria-label="Zoom in" onClick={() => zoomIn({ duration: 200 })}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Button>
    </Panel>
  );
}

export function AgentCanvas() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const selectNode = useCanvasStore((s) => s.selectNode);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={2}
          color="var(--border)"
          bgColor="var(--muted)"
        />
        <ZoomControls />
        <MiniMap
          pannable
          zoomable
          className="hidden md:block"
          bgColor="transparent"
          maskColor="color-mix(in oklab, var(--color-muted) 55%, transparent)"
          nodeColor={() => "var(--color-primary)"}
          nodeStrokeWidth={0}
        />
      </ReactFlow>
    </div>
  );
}
