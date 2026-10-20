export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="page-header">
      {subtitle && <p className="eyebrow">{subtitle}</p>}
      <h1 className="title">{title}</h1>
    </header>
  )
}
