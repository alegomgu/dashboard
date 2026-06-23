import type { ReactNode } from "react";

function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={`${part}-${index}`}
              className="rounded-md bg-panelSoft px-1.5 py-0.5 text-[0.92em] font-semibold text-ink [overflow-wrap:anywhere]"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    .filter((cells) => cells.length > 0);
  const [head, ...body] = rows;
  if (!head) {
    return null;
  }

  return (
    <div className="my-4 max-w-full overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead className="bg-panelSoft">
          <tr>
            {head.map((cell) => (
              <th
                key={cell}
                className="border-b border-line px-3 py-2 text-left text-xs font-semibold uppercase text-muted"
              >
                <Inline text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-line/70 last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 align-top">
                  <Inline text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownLite({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let table: string[] = [];

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-3 leading-7 text-muted [overflow-wrap:anywhere]">
          <Inline text={paragraph.join(" ")} />
        </p>,
      );
      paragraph = [];
    }
  }

  function flushList() {
    if (list.length) {
      blocks.push(
        <ul
          key={`ul-${blocks.length}`}
          className="my-3 grid min-w-0 gap-2 pl-5 text-sm leading-6 text-muted [overflow-wrap:anywhere]"
        >
          {list.map((item) => (
            <li key={item} className="list-disc">
              <Inline text={item} />
            </li>
          ))}
        </ul>,
      );
      list = [];
    }
  }

  function flushTable() {
    if (table.length) {
      blocks.push(<MarkdownTable key={`table-${blocks.length}`} lines={table} />);
      table = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }
    if (line.startsWith("|")) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }
    flushTable();
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="mt-2 text-xl font-semibold [overflow-wrap:anywhere]">
          <Inline text={line.slice(2)} />
        </h2>,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h4
          key={`h4-${blocks.length}`}
          className="mt-5 text-sm font-semibold uppercase text-muted [overflow-wrap:anywhere]"
        >
          <Inline text={line.slice(4)} />
        </h4>,
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="mt-6 text-lg font-semibold [overflow-wrap:anywhere]">
          <Inline text={line.slice(3)} />
        </h3>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="my-4 rounded-xl border-l-4 border-accent bg-panelSoft px-4 py-3 text-sm leading-6 text-muted [overflow-wrap:anywhere]"
        >
          <Inline text={line.replace(/^>\s?/, "")} />
        </blockquote>,
      );
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  flushTable();

  return <div className="min-w-0 max-w-full overflow-hidden">{blocks}</div>;
}
