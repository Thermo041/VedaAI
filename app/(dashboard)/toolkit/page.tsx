"use client";

import Link from "next/link";
import { BookOpen, FileText, Sparkles, Wand2 } from "lucide-react";
import { PageIntro } from "@/components/layout/PageIntro";

const tools = [
  {
    title: "Question Paper Generator",
    description: "Create structured exam papers with AI.",
    href: "/assignments/create",
    icon: FileText,
    active: true,
  },
  {
    title: "Rubric Builder",
    description: "Define marking criteria for assignments.",
    href: "/toolkit/rubric",
    icon: BookOpen,
    active: true,
  },
  {
    title: "Lesson Plan Assistant",
    description: "Draft lesson plans aligned to your syllabus.",
    href: "/toolkit/lesson-plan",
    icon: Wand2,
    active: true,
  },
  {
    title: "AI Grading Helper",
    description: "Assist with grading student submissions.",
    href: "/toolkit/grading",
    icon: Sparkles,
    active: true,
  },
];

export default function ToolkitPage() {
  return (
    <section className="mx-auto max-w-6xl">
      <PageIntro
        title="AI Teacher's Toolkit"
        description="AI-powered tools to help you teach smarter."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const content = (
            <article
              className={`rounded-lg border p-6 shadow-sm transition ${
                tool.active
                  ? "border-orange-200 bg-white/95 hover:-translate-y-0.5 hover:shadow-xl"
                  : "border-white/80 bg-white/70 opacity-90"
              }`}
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-full ${
                  tool.active
                    ? "bg-orange-100 text-orange-600"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <tool.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-black text-zinc-900">{tool.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-zinc-500">
                {tool.description}
              </p>
              {tool.active ? (
                <p className="mt-4 text-sm font-bold text-orange-600">Open tool →</p>
              ) : (
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-zinc-400">
                  Coming soon
                </p>
              )}
            </article>
          );

          if (tool.href) {
            return (
              <Link key={tool.title} href={tool.href}>
                {content}
              </Link>
            );
          }

          return <div key={tool.title}>{content}</div>;
        })}
      </div>
    </section>
  );
}
