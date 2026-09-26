import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { createBlankWorkflow, loadStoredWorkflows, parseComfyWorkflow, saveStoredWorkflows, validateWorkflow, type ComfyWorkflow } from "../../../../agent-core/comfy-workflows";


export default function WorkflowStudio({ notify, onClose }: { notify: (message: string) => void; onClose: () => void }) {
  const [workflows, setWorkflows] = useState<ComfyWorkflow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("New ComfyUI Workflow");
  const [json, setJson] = useState("{}");
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const stored = loadStoredWorkflows();
    const initial = stored.length ? stored : [createBlankWorkflow()];
    setWorkflows(initial);
    select(initial[0]);
  }, []);

  function select(workflow: ComfyWorkflow) {
    setSelectedId(workflow.id);
    setName(workflow.name);
    setJson(JSON.stringify(workflow.prompt || workflow.ui || {}, null, 2));
  }

  function persist(next: ComfyWorkflow[]) {
    setWorkflows(next);
    saveStoredWorkflows(next);
  }

  function createWorkflow() {
    const workflow = createBlankWorkflow();
    persist([workflow, ...workflows]);
    select(workflow);
    setStatus("Created a new editable workflow.");
  }

  function importWorkflow(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const workflow = parseComfyWorkflow(JSON.parse(String(reader.result)), file.name.replace(/\.json$/i, ""));
        persist([workflow, ...workflows]);
        select(workflow);
        setStatus("Imported " + file.name);
        notify("ComfyUI workflow imported.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Import failed.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function save() {
    const current = workflows.find((workflow) => workflow.id === selectedId);
    if (!current) return;
    try {
      const parsed = JSON.parse(json);
      const nextWorkflow = { ...current, name: name.trim() || current.name, prompt: current.format === "api" ? parsed : current.prompt, updatedAt: new Date().toISOString() };
      const next = workflows.map((workflow) => workflow.id === current.id ? nextWorkflow : workflow);
      persist(next);
      select(nextWorkflow);
      setStatus("Workflow saved.");
    } catch (error) {
      setStatus("Invalid JSON: " + (error instanceof Error ? error.message : "unknown error"));
    }
  }

  async function run() {
    const current = workflows.find((workflow) => workflow.id === selectedId);
    if (!current) return;
    const validation = validateWorkflow(current);
    if (!validation.ok) { setStatus(validation.errors.join(" ")); return; }
    setRunning(true);
    setStatus("Running in ComfyUI...");
    try {
      const response = await fetch("/api/workflows/comfy/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workflow: current.prompt, wait: true }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "ComfyUI run failed.");
      setStatus("Completed · " + data.promptId);
      notify("ComfyUI workflow finished.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "ComfyUI run failed.");
    } finally {
      setRunning(false);
    }
  }

  const selected = useMemo(() => workflows.find((workflow) => workflow.id === selectedId) || workflows[0], [workflows, selectedId]);

  return (
    <div className="fixed inset-0 z-50 bg-[#090b10]/95 p-4 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl flex-col rounded-xl border border-border bg-[#14171d] shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="mono text-[9px] uppercase tracking-[.17em] text-primary">Workflow Studio</p><h2 className="mt-1 text-sm font-bold">ComfyUI · Import · Create · Run</h2></div><button onClick={onClose} className="text-muted-foreground hover:text-foreground">Close</button></div>
        <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[260px_1fr]">
          <aside className="overflow-auto rounded-lg border border-border bg-card/60 p-2"><button onClick={createWorkflow} className="mb-2 w-full rounded border border-primary/30 px-2 py-2 text-[10px] text-primary">+ New workflow</button><label className="mb-3 block cursor-pointer rounded border border-border px-2 py-2 text-center text-[10px] text-muted-foreground">Import ComfyUI JSON<input hidden type="file" accept=".json,application/json" onChange={importWorkflow} /></label>{workflows.map((workflow)=><button key={workflow.id} onClick={()=>select(workflow)} className={`mb-1 w-full rounded px-2 py-2 text-left text-[10px] ${workflow.id===selected?.id?'bg-primary/10 text-primary':'text-muted-foreground hover:bg-secondary'}`}><span className="block font-semibold">{workflow.name}</span><span className="mono text-[8px] opacity-60">{workflow.format} · {workflow.source}</span></button>)}</aside>
          <section className="min-h-0 rounded-lg border border-border bg-card/40 p-3"><div className="mb-2 flex gap-2"><input value={name} onChange={(event)=>setName(event.target.value)} className="flex-1 rounded border border-border bg-background px-2 py-2 text-xs" /><button onClick={save} className="rounded bg-secondary px-3 py-2 text-[10px] font-bold">Save</button><button onClick={run} disabled={running} className="rounded bg-primary px-3 py-2 text-[10px] font-bold text-primary-foreground">{running?'Running…':'Run'}</button></div><textarea value={json} onChange={(event)=>setJson(event.target.value)} spellCheck={false} className="h-[calc(100%-70px)] min-h-[480px] w-full resize-none rounded border border-border bg-[#090b10] p-3 font-mono text-[10px] leading-4 text-foreground outline-none" /><div className="mt-2 text-[10px] text-muted-foreground">{status}</div></section>
        </div>
      </div>
    </div>
  );
}
