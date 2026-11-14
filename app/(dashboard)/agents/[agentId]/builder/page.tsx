import { Suspense } from "react";

import { BuilderPageContent } from "@/modules/agents/components/builder-page-content";

async function BuilderPageSlot({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  return <BuilderPageContent agentId={agentId} />;
}

export default function BuilderPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <BuilderPageSlot params={params} />
    </Suspense>
  );
}