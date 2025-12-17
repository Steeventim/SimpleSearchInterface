"use client"

import type React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"

interface SearchBarProps {
  query: string
  setQuery: (query: string) => void
  onSearch: (query: string) => void
  isLoading: boolean
  onFocus?: () => void
}

export function SearchBar({ query, setQuery, onSearch, isLoading, onFocus }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <Input
          type="text"
          placeholder="Rechercher..."
          className="pl-10 pr-20 py-6 text-lg rounded-full border-2 border-border focus-visible:ring-primary"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          suppressHydrationWarning
        />
        <div className="absolute left-3 text-muted-foreground">
          <Search size={20} />
        </div>
        <Button type="submit" className="absolute right-1 rounded-full" disabled={isLoading || !query.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
        </Button>
      </div>
    </form>
  )
}
