"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import BottomNav from "@/components/bottom-nav"
import PageHeader from "@/components/page-header"
import { Plus, X } from "lucide-react"

const DOG_BREEDS = ["柯基", "哈士奇", "柴犬", "黃金獵犬", "拉布拉多", "貴賓犬"]
const ACTIVITIES = ["寵物瑜伽", "遊泳", "自行車陪跑", "丟球"]
const USE_CASES = [
  { id: "owner", label: "飼主可發佈任務讓他人代遛狗" },
  { id: "walker", label: "無狗者可接任務運動並陪伴狗狗" },
  { id: "both", label: "雙方皆有狗時可配對一起遛狗" },
]

interface Dog {
  id: string
  name: string
  breed: string
  activities: string[]
  useCase: string
}

export default function PostPage() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [currentDog, setCurrentDog] = useState<Partial<Dog>>({
    activities: [],
  })

  const addDog = () => {
    if (currentDog.name && currentDog.breed && currentDog.useCase) {
      const newDog: Dog = {
        id: Date.now().toString(),
        name: currentDog.name || "",
        breed: currentDog.breed || "",
        activities: currentDog.activities || [],
        useCase: currentDog.useCase || "",
      }
      setDogs([...dogs, newDog])
      setCurrentDog({ activities: [] })
    }
  }

  const removeDog = (id: string) => {
    setDogs(dogs.filter((dog) => dog.id !== id))
  }

  const toggleActivity = (activity: string) => {
    setCurrentDog((prev) => ({
      ...prev,
      activities: prev.activities?.includes(activity)
        ? prev.activities.filter((a) => a !== activity)
        : [...(prev.activities || []), activity],
    }))
  }

  const handlePublish = () => {
    if (dogs.length > 0) {
      console.log("Publishing dogs:", dogs)
      alert(`已發佈 ${dogs.length} 隻狗狗！`)
      setDogs([])
      setCurrentDog({ activities: [] })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="發佈狗狗資訊" step={1} />

      <div className="px-4 py-6 space-y-6">
        {/* 發佈單隻狗的表單 */}
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">狗狗基本資訊</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground">
                狗狗名字 *
              </Label>
              <Input
                id="name"
                placeholder="輸入狗狗名字"
                value={currentDog.name || ""}
                onChange={(e) => setCurrentDog({ ...currentDog, name: e.target.value })}
                className="mt-2 bg-muted border-border"
              />
            </div>

            <div>
              <Label htmlFor="breed" className="text-foreground">
                狗狗品種 *
              </Label>
              <Select
                value={currentDog.breed || ""}
                onValueChange={(value) => setCurrentDog({ ...currentDog, breed: value })}
              >
                <SelectTrigger id="breed" className="mt-2 bg-muted border-border">
                  <SelectValue placeholder="選擇品種" />
                </SelectTrigger>
                <SelectContent>
                  {DOG_BREEDS.map((breed) => (
                    <SelectItem key={breed} value={breed}>
                      {breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">狗狗喜歡的活動</Label>
              <div className="mt-3 space-y-2">
                {ACTIVITIES.map((activity) => (
                  <div key={activity} className="flex items-center gap-3">
                    <Checkbox
                      id={activity}
                      checked={currentDog.activities?.includes(activity) || false}
                      onCheckedChange={() => toggleActivity(activity)}
                    />
                    <Label htmlFor={activity} className="font-normal cursor-pointer">
                      {activity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="useCase" className="text-foreground">
                使用場景 *
              </Label>
              <Select
                value={currentDog.useCase || ""}
                onValueChange={(value) => setCurrentDog({ ...currentDog, useCase: value })}
              >
                <SelectTrigger id="useCase" className="mt-2 bg-muted border-border">
                  <SelectValue placeholder="選擇使用場景" />
                </SelectTrigger>
                <SelectContent>
                  {USE_CASES.map((useCase) => (
                    <SelectItem key={useCase.id} value={useCase.id}>
                      {useCase.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addDog} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              新增狗狗
            </Button>
          </div>
        </Card>

        {/* 已新增的狗狗列表 */}
        {dogs.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">待發佈狗狗 ({dogs.length})</h3>
            {dogs.map((dog) => (
              <Card key={dog.id} className="p-4 bg-muted border border-border">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{dog.name}</h4>
                    <p className="text-sm text-muted-foreground">{dog.breed}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {dog.activities.map((activity) => (
                        <span key={activity} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => removeDog(dog.id)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button
          onClick={handlePublish}
          disabled={dogs.length === 0}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-semibold"
        >
          發佈 {dogs.length > 0 ? `(${dogs.length} 隻)` : ""}
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
