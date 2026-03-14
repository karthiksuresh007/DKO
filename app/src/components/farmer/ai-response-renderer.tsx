import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  Info,
  Leaf,
  Scissors,
  Search,
  Shield,
  Sprout
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StepItem = {
  number: string;
  title: string;
  description: string;
};

type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "steps"; items: StepItem[] }
  | { type: "advisory"; title: string; blocks: ContentBlock[] };

type AIResponseRendererProps = {
  content: string;
};

const advisoryHeadingPattern = /^(warning|important|note|caution|when to seek help|when to get expert help|when to seek expert help|expert help|when to seek officer help|when to contact an officer)$/i;
const headingPattern = /^(recommended actions?|steps?|prevention|treatment|next steps?|monitoring|diagnosis|summary|observation|follow-up|recommended plan)$/i;
const numberedItemPattern = /^(\d+)[.)]\s+(.+)$/;
const bulletItemPattern = /^[-*•]\s+(.+)$/;

export function AIResponseRenderer({ content }: AIResponseRendererProps) {
  const blocks = parseContentBlocks(content);

  if (!blocks.length) {
    return <p className="text-base leading-8 text-neutral-700">No response yet.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {blocks.map((block, index) => (
        <RenderedBlock block={block} key={`${block.type}-${index}`} />
      ))}
    </div>
  );
}

function RenderedBlock({ block }: { block: ContentBlock }) {
  if (block.type === "heading") {
    return <SectionHeader>{block.text}</SectionHeader>;
  }

  if (block.type === "paragraph") {
    return <p className="max-w-3xl text-base leading-8 text-neutral-700">{block.text}</p>;
  }

  if (block.type === "bullets") {
    return <BulletList items={block.items} />;
  }

  if (block.type === "steps") {
    return (
      <div className="grid gap-4">
        {block.items.map((item) => (
          <StepCard key={`${item.number}-${item.title}`} item={item} />
        ))}
      </div>
    );
  }

  return (
    <AdvisoryBox title={block.title}>
      <div className="space-y-4">
        {block.blocks.map((nestedBlock, index) => (
          <RenderedBlock block={nestedBlock} key={`${nestedBlock.type}-${index}`} />
        ))}
      </div>
    </AdvisoryBox>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-semibold tracking-tight text-neutral-900">{children}</h3>;
}

export function StepCard({ item }: { item: StepItem }) {
  const Icon = getStepIcon(item.title);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
          {item.number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F8E9] text-[#2E7D32]">
              <Icon className="h-4 w-4" />
            </div>
            <h4 className="text-base font-medium text-neutral-900">{item.title}</h4>
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-600">{item.description}</p>
        </div>
      </div>
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li className="flex items-start gap-3 text-sm leading-7 text-neutral-700" key={`${item}-${index}`}>
          <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-[#2E7D32]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function AdvisoryBox({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  const Icon = /note/i.test(title) ? Info : AlertTriangle;

  return (
    <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
          <Icon className="h-4 w-4" />
        </div>
        <SectionHeader>{title}</SectionHeader>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function parseContentBlocks(content: string): ContentBlock[] {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((chunk) => parseChunk(chunk));
}

function parseChunk(chunk: string): ContentBlock[] {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  if (isNumberedSequence(lines)) {
    return [{ type: "steps", items: parseNumberedItems(lines) }];
  }

  if (isBulletSequence(lines)) {
    return [{ type: "bullets", items: parseBulletItems(lines) }];
  }

  const firstLine = lines[0];
  const headingInfo = detectHeading(firstLine);
  if (headingInfo) {
    const remainder = lines.slice(1).join("\n").trim();

    if (headingInfo.isAdvisory) {
      return [
        {
          type: "advisory",
          title: headingInfo.text,
          blocks: remainder ? parseContentBlocks(remainder) : []
        }
      ];
    }

    return [
      { type: "heading", text: headingInfo.text },
      ...(remainder ? parseContentBlocks(remainder) : [])
    ];
  }

  const inlineAdvisory = detectInlineAdvisory(chunk);
  if (inlineAdvisory) {
    return [
      {
        type: "advisory",
        title: inlineAdvisory.title,
        blocks: parseContentBlocks(inlineAdvisory.body)
      }
    ];
  }

  return [
    {
      type: "paragraph",
      text: cleanText(lines.join(" "))
    }
  ];
}

function detectHeading(line: string) {
  const markdownHeading = line.match(/^#{1,6}\s+(.+)$/);
  if (markdownHeading) {
    const text = cleanText(markdownHeading[1]);
    return { text, isAdvisory: advisoryHeadingPattern.test(text) };
  }

  const boldHeading = line.match(/^\*\*(.+)\*\*:?$/);
  if (boldHeading) {
    const text = cleanText(boldHeading[1]);
    return { text, isAdvisory: advisoryHeadingPattern.test(text) };
  }

  const cleaned = cleanText(line.replace(/:$/, ""));
  const isShortHeading = cleaned.length <= 48 && !/[.!?]$/.test(cleaned);
  const isKnownHeading = headingPattern.test(cleaned) || advisoryHeadingPattern.test(cleaned);

  if (isKnownHeading || (line.endsWith(":") && isShortHeading)) {
    return { text: cleaned, isAdvisory: advisoryHeadingPattern.test(cleaned) };
  }

  return null;
}

function detectInlineAdvisory(chunk: string) {
  const match = chunk.match(/^(warning|important|note|caution|when to seek help|when to get expert help|when to seek expert help|expert help)\s*[:\-]\s*([\s\S]+)$/i);
  if (!match) {
    return null;
  }

  return {
    title: toTitleCase(match[1]),
    body: cleanText(match[2])
  };
}

function isNumberedSequence(lines: string[]) {
  const numberedCount = lines.filter((line) => numberedItemPattern.test(line)).length;
  return numberedCount >= 2;
}

function isBulletSequence(lines: string[]) {
  return lines.every((line) => bulletItemPattern.test(line));
}

function parseNumberedItems(lines: string[]): StepItem[] {
  const items: string[] = [];
  let current = "";
  let currentNumber = "1";

  for (const line of lines) {
    const match = line.match(numberedItemPattern);
    if (match) {
      if (current) {
        items.push(`${currentNumber}|${current}`);
      }
      currentNumber = match[1];
      current = cleanText(match[2]);
      continue;
    }

    current = `${current} ${cleanText(line)}`.trim();
  }

  if (current) {
    items.push(`${currentNumber}|${current}`);
  }

  return items.map((item) => {
    const [number, rawText] = item.split("|", 2);
    const text = cleanText(rawText);
    const parts = text.split(/[:\-]\s+/, 2);

    if (parts.length === 2 && parts[0].length <= 60) {
      return {
        number,
        title: parts[0],
        description: parts[1]
      };
    }

    const sentenceParts = text.split(/\.\s+/, 2);
    if (sentenceParts.length === 2 && sentenceParts[0].length <= 80) {
      return {
        number,
        title: sentenceParts[0],
        description: sentenceParts[1]
      };
    }

    return {
      number,
      title: `Step ${number}`,
      description: text
    };
  });
}

function parseBulletItems(lines: string[]) {
  return lines.map((line) => {
    const match = line.match(bulletItemPattern);
    return cleanText(match ? match[1] : line);
  });
}

function cleanText(value: string) {
  return value
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/^[#>-]+\s*/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStepIcon(title: string): LucideIcon {
  const normalized = title.toLowerCase();

  if (normalized.includes("inspect") || normalized.includes("observe") || normalized.includes("monitor")) {
    return Search;
  }

  if (normalized.includes("water") || normalized.includes("irrig")) {
    return Droplets;
  }

  if (normalized.includes("remove") || normalized.includes("prune") || normalized.includes("cut")) {
    return Scissors;
  }

  if (normalized.includes("protect") || normalized.includes("prevent") || normalized.includes("safety")) {
    return Shield;
  }

  if (normalized.includes("soil") || normalized.includes("fertil") || normalized.includes("nutrient")) {
    return Sprout;
  }

  return Leaf;
}
