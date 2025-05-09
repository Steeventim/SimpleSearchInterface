"use client";

import type { SearchFiltersType } from "@/components/search-interface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onChange: (filters: SearchFiltersType) => void;
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
      <h2 className="text-lg font-medium mb-4">Filtres</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date-filter">Date</Label>
          <Select
            value={filters.date}
            onValueChange={(value: any) =>
              onChange({ ...filters, date: value })
            }
          >
            <SelectTrigger id="date-filter">
              <SelectValue placeholder="Sélectionner une période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="this-week">Cette semaine</SelectItem>
              <SelectItem value="this-month">Ce mois</SelectItem>
              <SelectItem value="this-year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type-filter">Type de contenu</Label>
          <Select
            value={filters.type}
            onValueChange={(value: any) =>
              onChange({ ...filters, type: value })
            }
          >
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Vidéos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort-filter">Trier par</Label>
          <Select
            value={filters.sort}
            onValueChange={(value: any) =>
              onChange({ ...filters, sort: value })
            }
          >
            <SelectTrigger id="sort-filter">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Pertinence</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
