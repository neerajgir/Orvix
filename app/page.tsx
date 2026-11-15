import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { signIn } from "@/modules/auth/actions";
import { LandingCanvasMock } from "@/components/landing/landing-canvas-mock";
import { Button } from "@/components/ui/button";

export const instant = false;

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  const authed = Boolean(session);

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background text-foreground">
      {/* N5 · floating pill nav */}
      <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav className="flex items-center gap-1 rounded-4xl border border-border bg-card/90 py-1.5 pr-1.5 pl-4 shadow-sm backdrop-blur">
          <Image src="/logo.png" alt="Orvix" width={22} height={22} className="size-[22px]" />
          <span className="font-heading text-sm font-semibold tracking-tight">Orvix</span>
          <span className="mx-2 hidden h-4 w-px bg-border sm:block" />
          <Link
            href="#canvas"
            className="hidden rounded-2xl px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Canvas
          </Link>
          <Link
            href="#tools"
            className="hidden rounded-2xl px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Tools
          </Link>
          {authed ? (
            <Button size="sm" render={<Link href="/agents" />} nativeButton={false}>
              Open builder
            </Button>
          ) : (
            <form action={signIn}>
              <Button size="sm" type="submit">
                Sign in with GitHub
              </Button>
            </form>
          )}
        </nav>
      </div>

      {/* Hero — two-column: title left, lede right */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pt-40 pb-20 md:grid-cols-[1.4fr_1fr] md:items-end md:pt-56">
        <div>
          <p className="font-mono text-xs text-muted-foreground">~$ npx create-orvix-agent</p>
          <h1 className="font-heading mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Build agents on a canvas.
          </h1>
        </div>
        <div className="space-y-6">
          <p className="text-muted-foreground text-lg text-pretty">
            Orvix is a visual builder for AI agents. Wire a Start node to an Agent node
            to an End node, attach tools, hit Test Chat. Node wiring, not YAML.
          </p>
          {authed ? (
            <Button size="lg" render={<Link href="/agents/new" />} nativeButton={false}>
              Create an agent
            </Button>
          ) : (
            <form action={signIn} className="flex flex-wrap items-center gap-3">
              <Button size="lg" type="submit">
                Start building
              </Button>
              <Link
                href="#canvas"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                See the canvas first
              </Link>
            </form>
          )}
        </div>
      </section>

      {/* Workbench block 1 — the canvas */}
      <section id="canvas" className="mx-auto max-w-6xl scroll-mt-24 space-y-4 px-4 pb-24">
        <figure className="rounded-3xl border border-border bg-card p-6 sm:p-10">
          <LandingCanvasMock />
          <figcaption className="mt-6 max-w-md text-sm text-muted-foreground">
            The builder. Start, Agent, End — drag to wire. The Agent node carries
            instructions, a model ID, and every tool you attach.
          </figcaption>
        </figure>
      </section>

      {/* Workbench block 2 — tools */}
      <section id="tools" className="mx-auto max-w-6xl scroll-mt-24 space-y-4 px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,1.2fr)] md:items-center">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Tools attach in two clicks.
            </h2>
            <p className="text-muted-foreground text-pretty">
              Web search, GitHub reads, weather, calculator — pick from the drawer and
              they show as badges on the Agent node. Or define a custom tool: any HTTP
              endpoint, your own parameters and headers, the AI fills the rest.
            </p>
          </div>
          <div className="flex flex-wrap content-start gap-2 rounded-3xl border border-border bg-card p-6">
            {["Web Search", "GitHub Read File", "GitHub Get PR", "Weather", "Calculator", "My Custom Tool"].map(
              (tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-border bg-background px-3 py-1 font-mono text-xs text-muted-foreground"
                >
                  {tool}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Workbench block 3 — test chat */}
      <section className="mx-auto max-w-6xl space-y-4 px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-[1fr_minmax(0,1.2fr)] md:items-center">
          <div className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Test before you ship.
            </h2>
            <p className="text-muted-foreground text-pretty">
              A chat panel runs the exact graph on your canvas. Tool calls stream in
              live, responses persist to the conversation, memory keeps context across
              turns. What you test is what users get.
            </p>
          </div>
          <div className="space-y-3 rounded-3xl border border-border bg-card p-6 font-mono text-xs">
            <p className="text-muted-foreground">user · run the tool</p>
            <p>
              <span className="text-primary">tool_started</span>{" "}
              <span className="text-muted-foreground">web_search</span>
            </p>
            <p>
              <span className="text-emerald-600 dark:text-emerald-400">tool_completed</span>{" "}
              <span className="text-muted-foreground">3 results</span>
            </p>
            <p className="text-foreground">assistant · Done — top result is …</p>
          </div>
        </div>
      </section>

      {/* Final CTA — one button */}
      <section className="mx-auto max-w-6xl px-4 pb-28">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-12 text-center">
          <p className="font-heading text-2xl font-semibold tracking-tight text-pretty sm:text-3xl">
            One graph. Start to End.
          </p>
          {authed ? (
            <Button size="lg" render={<Link href="/agents/new" />} nativeButton={false}>
              Create an agent
            </Button>
          ) : (
            <form action={signIn}>
              <Button size="lg" type="submit">
                Start building
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Ft2 · inline single line */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-heading font-semibold text-foreground">
            <Image src="/logo.png" alt="Orvix" width={16} height={16} className="size-4" />
            Orvix
          </span>
          <span>Visual builder for AI agents</span>
          <span className="font-mono text-xs">@Orvix · self-hosted</span>
        </div>
      </footer>
    </div>
  );
}
