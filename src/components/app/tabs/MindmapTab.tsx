"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Maximize2, Minus, Network, Plus } from "lucide-react";
import { Button } from "../../ui";
import { NoteData } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Build a tree from the note's Markdown headings & bullets            */
/* ------------------------------------------------------------------ */

interface MapNode {
  id: string;
  label: string;
  depth: number;
  children: MapNode[];
}

function cleanLabel(raw: string): string {
  const text = raw
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*]*)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_]/g, "")
    .trim();
  return text.length > 64 ? text.slice(0, 61) + "…" : text;
}

export function buildMindmap(note: NoteData): MapNode {
  const root: MapNode = {
    id: "root",
    label: cleanLabel(note.title) || "Note",
    depth: 0,
    children: [],
  };
  const md = note.notesMarkdown ?? "";
  let nid = 0;
  // Stack of most recent node at each depth.
  const stack: MapNode[] = [root];

  const push = (label: string, depth: number) => {
    if (!label) return;
    const node: MapNode = { id: `n${nid++}`, label, depth, children: [] };
    // Find the closest ancestor with a smaller depth.
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  };

  const lines = md.split("\n");
  let inCode = false;
  let headingDepth = 0;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    const heading = line.match(/^(#{2,4})\s+(.*)/);
    if (heading) {
      const depth = heading[1].length - 1; // ## -> 1, ### -> 2, #### -> 3
      headingDepth = depth;
      push(cleanLabel(heading[2]), depth);
      continue;
    }
    const bullet = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (bullet) {
      const indent = Math.floor(bullet[1].replace(/\t/g, "  ").length / 2);
      const label = cleanLabel(bullet[2]);
      // Keep the map readable: skip long sentence bullets deeper than 2 levels.
      if (indent > 2) continue;
      push(label, headingDepth + 1 + indent);
    }
  }

  // Fallback: no structure found — use key points or transcript preview.
  if (root.children.length === 0) {
    const points =
      note.keyPoints && note.keyPoints.length > 0
        ? note.keyPoints
        : note.transcript.slice(0, 6).map((s) => s.text);
    for (const p of points) {
      root.children.push({
        id: `n${nid++}`,
        label: cleanLabel(p),
        depth: 1,
        children: [],
      });
    }
  }
  return root;
}

/* ------------------------------------------------------------------ */
/* Layout: simple tidy horizontal tree                                 */
/* ------------------------------------------------------------------ */

interface Laid {
  node: MapNode;
  x: number;
  y: number;
  parent?: Laid;
  collapsed: boolean;
}

const X_GAP = 250;
const Y_GAP = 44;
const NODE_W = 210;
const NODE_H = 34;

function layoutTree(
  root: MapNode,
  collapsedIds: Set<string>
): { nodes: Laid[]; height: number } {
  const nodes: Laid[] = [];
  let leafY = 0;

  function walk(node: MapNode, depth: number, parent?: Laid): Laid {
    const collapsed = collapsedIds.has(node.id);
    const laid: Laid = { node, x: depth * X_GAP, y: 0, parent, collapsed };
    nodes.push(laid);
    const kids = collapsed ? [] : node.children;
    if (kids.length === 0) {
      laid.y = leafY;
      leafY += Y_GAP;
    } else {
      const childLaid = kids.map((c) => walk(c, depth + 1, laid));
      laid.y =
        (childLaid[0].y + childLaid[childLaid.length - 1].y) / 2;
    }
    return laid;
  }

  walk(root, 0);
  return { nodes, height: Math.max(leafY, Y_GAP) };
}

// Colors are theme tokens (var) with a hex fallback so the live map re-themes
// with [data-theme] while an exported standalone SVG (no :root vars) still
// renders with the swiss-palette fallback.
const PALETTE = [
  { fill: "var(--primary, #3d63c9)", text: "var(--primary-ink, #ffffff)", stroke: "var(--primary, #3d63c9)" }, // root
  { fill: "var(--surface-2, #eef0f2)", text: "var(--primary, #3d63c9)", stroke: "var(--primary, #3d63c9)" },
  { fill: "var(--surface, #f7f7f8)", text: "var(--ink, #2b2f36)", stroke: "var(--border, #dcdfe4)" },
  { fill: "var(--surface-2, #eef0f2)", text: "var(--muted, #667085)", stroke: "var(--border, #dcdfe4)" },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function MindmapTab({ note }: { note: NoteData }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [view, setView] = useState({ x: 40, y: 40, k: 1 });
  const dragging = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const tree = useMemo(() => buildMindmap(note), [note]);
  const { nodes, height } = useMemo(
    () => layoutTree(tree, collapsed),
    [tree, collapsed]
  );

  if (!note.notesMarkdown && tree.children.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
        <Network className="mx-auto text-primary" size={36} />
        <div className="mt-3 font-display font-bold text-ink">No mind map yet</div>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">
          The mind map is built from your note&apos;s structure — generate AI
          notes first (Notes tab) and the map will appear here.
        </p>
      </div>
    );
  }

  const toggle = (id: string) => {
    const next = new Set(collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCollapsed(next);
  };

  const zoom = (delta: number, cx?: number, cy?: number) => {
    setView((v) => {
      const k = Math.min(2.5, Math.max(0.3, v.k * (1 + delta)));
      if (cx !== undefined && cy !== undefined) {
        // zoom towards cursor
        const ratio = k / v.k;
        return {
          k,
          x: cx - (cx - v.x) * ratio,
          y: cy - (cy - v.y) * ratio,
        };
      }
      return { ...v, k };
    });
  };

  const fit = () => setView({ x: 40, y: 40, k: 1 });

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const maxX = Math.max(...nodes.map((n) => n.x)) + NODE_W + 60;
    clone.setAttribute("viewBox", `-30 -30 ${maxX} ${height + 60}`);
    const g = clone.querySelector("g");
    g?.setAttribute("transform", "");
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${note.title.slice(0, 40) || "mindmap"}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted">
          Click a node to collapse/expand · drag to pan · scroll to zoom
        </p>
        <div className="flex gap-1.5">
          <Button variant="ghost" onClick={() => zoom(0.2)} className="!p-2" title="Zoom in">
            <Plus size={15} />
          </Button>
          <Button variant="ghost" onClick={() => zoom(-0.2)} className="!p-2" title="Zoom out">
            <Minus size={15} />
          </Button>
          <Button variant="ghost" onClick={fit} className="!p-2" title="Reset view">
            <Maximize2 size={15} />
          </Button>
          <Button variant="ghost" onClick={downloadSvg} className="!p-2" title="Download SVG">
            <Download size={15} />
          </Button>
        </div>
      </div>

      <div className="h-[34rem] overflow-hidden rounded-lg border border-border bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-surface [background-size:22px_22px]">
        <svg
          ref={svgRef}
          className="h-full w-full cursor-grab active:cursor-grabbing"
          onWheel={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            zoom(e.deltaY < 0 ? 0.12 : -0.12, e.clientX - rect.left, e.clientY - rect.top);
          }}
          onMouseDown={(e) => {
            dragging.current = {
              sx: e.clientX,
              sy: e.clientY,
              ox: view.x,
              oy: view.y,
            };
          }}
          onMouseMove={(e) => {
            if (!dragging.current) return;
            const d = dragging.current;
            setView((v) => ({
              ...v,
              x: d.ox + (e.clientX - d.sx),
              y: d.oy + (e.clientY - d.sy),
            }));
          }}
          onMouseUp={() => (dragging.current = null)}
          onMouseLeave={() => (dragging.current = null)}
        >
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {/* edges */}
            {nodes.map(
              (n) =>
                n.parent && (
                  <path
                    key={`e-${n.node.id}`}
                    d={`M ${n.parent.x + NODE_W} ${n.parent.y + NODE_H / 2}
                        C ${n.parent.x + NODE_W + 40} ${n.parent.y + NODE_H / 2},
                          ${n.x - 40} ${n.y + NODE_H / 2},
                          ${n.x} ${n.y + NODE_H / 2}`}
                    fill="none"
                    stroke="var(--border, #dcdfe4)"
                    strokeWidth={1.6 / view.k}
                  />
                )
            )}
            {/* nodes */}
            {nodes.map((n) => {
              const style = PALETTE[Math.min(n.node.depth, PALETTE.length - 1)];
              const hasKids = n.node.children.length > 0;
              return (
                <g
                  key={n.node.id}
                  transform={`translate(${n.x},${n.y})`}
                  onClick={() => hasKids && toggle(n.node.id)}
                  className={hasKids ? "cursor-pointer" : ""}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={1.4}
                  />
                  <text
                    x={12}
                    y={NODE_H / 2 + 4}
                    fontSize={n.node.depth === 0 ? 13 : 12}
                    fontWeight={n.node.depth <= 1 ? 700 : 500}
                    fill={style.text}
                  >
                    {n.node.label.length > 30
                      ? n.node.label.slice(0, 29) + "…"
                      : n.node.label}
                  </text>
                  {hasKids && (
                    <g transform={`translate(${NODE_W - 1},${NODE_H / 2})`}>
                      <circle r={8} fill="var(--surface, #f7f7f8)" stroke="var(--primary, #3d63c9)" strokeWidth={1.2} />
                      <text
                        textAnchor="middle"
                        y={3.5}
                        fontSize={10}
                        fontWeight={700}
                        fill="var(--primary, #3d63c9)"
                      >
                        {n.collapsed ? "+" : "–"}
                      </text>
                    </g>
                  )}
                  {n.node.label.length > 30 && (
                    <title>{n.node.label}</title>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
