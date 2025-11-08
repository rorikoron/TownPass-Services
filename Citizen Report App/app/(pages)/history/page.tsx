"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BottomNav from "@/components/bottom-nav"
import PageHeader from "@/components/page-header"
import { Calendar, CheckCircle, Clock } from "lucide-react"

interface Record {
  id: string
  dogName: string
  date: string
  duration: string
  status: "completed" | "ongoing" | "cancelled"
  type: "published" | "walked"
}

const HISTORY_RECORDS: Record[] = [
  {
    id: "1",
    dogName: "小Q",
    date: "2025-01-08",
    duration: "45 分鐘",
    status: "completed",
    type: "published",
  },
  {
    id: "2",
    dogName: "旺財",
    date: "2025-01-07",
    duration: "1 小時",
    status: "completed",
    type: "walked",
  },
  {
    id: "3",
    dogName: "小白",
    date: "2025-01-06",
    duration: "30 分鐘",
    status: "ongoing",
    type: "published",
  },
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-5 h-5 text-green-600" />
    case "ongoing":
      return <Clock className="w-5 h-5 text-blue-600" />
    default:
      return <Clock className="w-5 h-5 text-gray-400" />
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "已完成"
    case "ongoing":
      return "進行中"
    case "cancelled":
      return "已取消"
    default:
      return status
  }
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("published")

  const filteredRecords = HISTORY_RECORDS.filter((record) => record.type === activeTab)

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="遛狗紀錄" step={4} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 gap-0 rounded-none border-b border-border bg-background h-auto p-0 px-4">
          <TabsTrigger
            value="published"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            發佈紀錄
          </TabsTrigger>
          <TabsTrigger
            value="walked"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            遛狗紀錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="px-4 py-6 space-y-3">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <Card key={record.id} className="p-4 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🐕</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{record.dogName}</h4>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(record.status)}
                        <span className="text-xs text-muted-foreground">{getStatusLabel(record.status)}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {record.date}
                      </p>
                      <p className="text-sm text-muted-foreground">時長: {record.duration}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">沒有紀錄</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  )
}
