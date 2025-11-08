"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Compass, Map, History } from "lucide-react"

const NAV_ITEMS = [
  { path: "/post", label: "發佈", icon: FileText },
  { path: "/browse", label: "瀏覽", icon: Compass },
  { path: "/instant", label: "地圖", icon: Map },
  { path: "/history", label: "紀錄", icon: History },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3 flex justify-around md:hidden">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.path

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-md transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
