"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BottomNav from "@/components/bottom-nav"
import PageHeader from "@/components/page-header"
import { Search, MapPin, Heart } from "lucide-react"

const DOG_BREEDS = ["柯基", "哈士奇", "柴犬", "黃金獵犬", "拉布拉多"]
const ACTIVITIES = ["寵物瑜伽", "遊泳", "自行車陪跑", "丟球"]
const PET_PARKS = [
  { name: "彩虹河濱公園", distance: "0.5 km" },
  { name: "舞蝶步道", distance: "1.2 km" },
  { name: "永春高中河濱公園", distance: "1.8 km" },
]

interface Dog {
  id: string
  name: string
  breed: string
  activities: string[]
  owner: string
  status: "available" | "walking" | "completed"
}

const SAMPLE_DOGS: Dog[] = [
  {
    id: "1",
    name: "小Q",
    breed: "柯基",
    activities: ["丟球", "散步"],
    owner: "王先生",
    status: "available",
  },
  {
    id: "2",
    name: "旺財",
    breed: "哈士奇",
    activities: ["自行車陪跑", "散步"],
    owner: "李女士",
    status: "available",
  },
  {
    id: "3",
    name: "小白",
    breed: "柴犬",
    activities: ["遊泳", "丟球"],
    owner: "林先生",
    status: "walking",
  },
]

export default function BrowsePage() {
  const [selectedBreed, setSelectedBreed] = useState<string>("all")
  const [selectedActivity, setSelectedActivity] = useState<string>("all")
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [searchText, setSearchText] = useState("")

  const filteredDogs = useMemo(() => {
    return SAMPLE_DOGS.filter((dog) => {
      const breedMatch = selectedBreed === "all" || dog.breed === selectedBreed
      const activityMatch = selectedActivity === "all" || dog.activities.includes(selectedActivity)
      const searchMatch = !searchText || dog.name.includes(searchText) || dog.owner.includes(searchText)
      const statusMatch = dog.status === "available"
      return breedMatch && activityMatch && searchMatch && statusMatch
    })
  }, [selectedBreed, selectedActivity, searchText])

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="瀏覽可遛的狗狗" step={2} />

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="w-full grid grid-cols-2 gap-0 rounded-none border-b border-border bg-background h-auto p-0">
          <TabsTrigger
            value="browse"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            申辦
          </TabsTrigger>
          <TabsTrigger
            value="inquiry"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            查詢
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="px-4 py-6 space-y-4">
          {/* 搜尋區 */}
          <div className="flex gap-2">
            <Input
              placeholder="搜尋狗狗或飼主"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 bg-muted border-border"
            />
            <Button size="icon" className="bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* 篩選區 */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="breed" className="text-sm text-foreground">
                品種篩選
              </Label>
              <Select value={selectedBreed} onValueChange={setSelectedBreed}>
                <SelectTrigger id="breed" className="mt-1 bg-muted border-border">
                  <SelectValue placeholder="選擇品種" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部品種</SelectItem>
                  {DOG_BREEDS.map((breed) => (
                    <SelectItem key={breed} value={breed}>
                      {breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="activity" className="text-sm text-foreground">
                活動類型
              </Label>
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger id="activity" className="mt-1 bg-muted border-border">
                  <SelectValue placeholder="選擇活動" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部活動</SelectItem>
                  {ACTIVITIES.map((activity) => (
                    <SelectItem key={activity} value={activity}>
                      {activity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 狗狗列表 */}
          <div className="space-y-3 mt-6">
            {filteredDogs.map((dog) => (
              <Card
                key={dog.id}
                className="p-4 border border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl">🐕</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{dog.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dog.breed} • {dog.owner}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dog.activities.slice(0, 2).map((activity) => (
                        <span key={activity} className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-primary transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))}
            {filteredDogs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">找不到符合條件的狗狗</p>
              </div>
            )}
          </div>

          {/* 景點推薦 */}
          {selectedDog && (
            <div className="mt-8 space-y-3">
              <h3 className="font-semibold text-foreground">推薦寵物友善景點</h3>
              {PET_PARKS.map((park, idx) => (
                <Card key={idx} className="p-3 border border-border flex gap-3 items-center">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{park.name}</p>
                    <p className="text-sm text-muted-foreground">{park.distance}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inquiry" className="px-4 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">查詢功能開發中...</p>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  )
}
