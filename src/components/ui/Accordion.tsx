import { Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface AccordionItem {
  title: string;
  content: ReactNode;
}

export default function Accordion({ items, dark = false }: { items: AccordionItem[]; dark?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const border = dark ? 'border-white/15' : 'border-ink-100';
  const title = dark ? 'text-white' : 'text-ink-900';
  const body = dark ? 'text-ink-100/80' : 'text-ink-800/75';

  return (
    <div className={`border-t ${border}`}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={item.title} className={`border-b ${border}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`flex w-full items-center justify-between gap-6 py-5 text-left text-sm font-medium transition-colors hover:text-brand-500 ${title}`}
            >
              <span>{item.title}</span>
              <Plus className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} strokeWidth={1.5} />
            </button>
            <div className={`grid transition-all duration-500 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className={`pb-6 pr-10 text-sm leading-relaxed ${body}`}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
