import { Card } from "@/components/ui/card"

interface PageHeaderProps {
  title: string
  step: number
}

export default function PageHeader({ title, step }: PageHeaderProps) {
  return (
    <Card className="sticky top-0 z-10 rounded-none border-b border-t-0 border-l-0 border-r-0 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 px-4 py-4 flex items-center gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
        {step}
      </div>
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
    </Card>
  )
}
