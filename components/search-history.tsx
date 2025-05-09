"use client"

import { Button } from "@/components/ui/button"
import { Clock, X } from "lucide-react"

interface SearchHistoryProps {
  history: string[]
  onSelect: (item: string) => void
  onClear: () => void
}

export function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  return (
    <div>
      <ul className="py-1">
        {history.map((item, index) => (
          <li
            key={index}
            className="px-4 py-2 hover:bg-accent cursor-pointer flex items-center"
            onClick={() => onSelect(item)}
          >
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs w-full justify-center text-muted-foreground"
          onClick={onClear}
        >
          <X className="h-3 w-3 mr-1" />
          Effacer l'historique
        </Button>
      </div>
    </div>
  )
}
