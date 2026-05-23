export function PageIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 hidden lg:block">
      <div className="mb-2 flex items-center gap-3">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">{title}</h1>
      </div>
      <p className="pl-8 text-sm font-medium text-zinc-500">{description}</p>
    </div>
  );
}
