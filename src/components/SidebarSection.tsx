import type { ReactNode } from 'react'

export function SidebarSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="sidebarSection">
      <div className="sidebarTitle">{title}</div>
      <div className="sidebarBody">{children}</div>
    </section>
  )
}

