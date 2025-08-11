'use client';

import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Calendar as CalendarIcon,
  Clock,
  Filter,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SearchFilters {
  dateFrom?: Date;
  dateTo?: Date;
  agents: string[];
  messageTypes: ('user' | 'assistant' | 'system')[];
  tags: string[];
}

interface ChatSearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onClear?: () => void;
  suggestions?: string[];
  recentSearches?: string[];
  className?: string;
  placeholder?: string;
}

export function ChatSearchBar({
  onSearch,
  onClear,
  suggestions = [],
  recentSearches = [],
  className,
  placeholder = 'Search conversations...',
}: ChatSearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    agents: [],
    messageTypes: ['user', 'assistant'],
    tags: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.agents.length > 0 ||
    filters.tags.length > 0 ||
    filters.messageTypes.length < 2;

  const handleSearch = () => {
    if (query.trim() || hasFilters) {
      setIsSearching(true);
      onSearch(query, filters);
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  const handleClear = () => {
    setQuery('');
    setFilters({
      agents: [],
      messageTypes: ['user', 'assistant'],
      tags: [],
    });
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const toggleMessageType = (type: 'user' | 'assistant' | 'system') => {
    setFilters((prev) => ({
      ...prev,
      messageTypes: prev.messageTypes.includes(type)
        ? prev.messageTypes.filter((t) => t !== type)
        : [...prev.messageTypes, type],
    }));
  };

  const activeFilterCount = [
    filters.dateFrom ? 1 : 0,
    filters.dateTo ? 1 : 0,
    filters.agents.length,
    filters.tags.length,
    filters.messageTypes.length < 2 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className={cn(
              '-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground transition-colors',
              isSearching && 'animate-pulse text-primary'
            )}
          />

          <Input
            className="pr-10 pl-9"
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={inputRef}
            type="text"
            value={query}
          />

          {(query || hasFilters) && (
            <Button
              className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7"
              onClick={handleClear}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="relative" variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  className="-top-2 -right-2 absolute flex h-5 w-5 items-center justify-center p-0"
                  variant="secondary"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Search Filters</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <div className="p-2">
              <div className="space-y-3">
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="font-medium text-sm">Date Range</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="flex-1 justify-start"
                          size="sm"
                          variant="outline"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {filters.dateFrom
                            ? format(filters.dateFrom, 'PP')
                            : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          onSelect={(date) =>
                            setFilters((prev) => ({ ...prev, dateFrom: date }))
                          }
                          selected={filters.dateFrom}
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="flex-1 justify-start"
                          size="sm"
                          variant="outline"
                        >
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {filters.dateTo ? format(filters.dateTo, 'PP') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          onSelect={(date) =>
                            setFilters((prev) => ({ ...prev, dateTo: date }))
                          }
                          selected={filters.dateTo}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Message Types */}
                <div className="space-y-2">
                  <label className="font-medium text-sm">Message Types</label>
                  <div className="space-y-1">
                    <DropdownMenuCheckboxItem
                      checked={filters.messageTypes.includes('user')}
                      onCheckedChange={() => toggleMessageType('user')}
                    >
                      <User className="mr-2 h-3 w-3" />
                      User Messages
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.messageTypes.includes('assistant')}
                      onCheckedChange={() => toggleMessageType('assistant')}
                    >
                      <Bot className="mr-2 h-3 w-3" />
                      AI Responses
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.messageTypes.includes('system')}
                      onCheckedChange={() => toggleMessageType('system')}
                    >
                      <Sparkles className="mr-2 h-3 w-3" />
                      System Messages
                    </DropdownMenuCheckboxItem>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  <label className="font-medium text-sm">Quick Filters</label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      onClick={() => {
                        const today = new Date();
                        setFilters((prev) => ({
                          ...prev,
                          dateFrom: today,
                          dateTo: today,
                        }));
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Today
                    </Button>
                    <Button
                      onClick={() => {
                        const week = new Date();
                        week.setDate(week.getDate() - 7);
                        setFilters((prev) => ({
                          ...prev,
                          dateFrom: week,
                          dateTo: new Date(),
                        }));
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Last 7 days
                    </Button>
                    <Button
                      onClick={() => {
                        const month = new Date();
                        month.setMonth(month.getMonth() - 1);
                        setFilters((prev) => ({
                          ...prev,
                          dateFrom: month,
                          dateTo: new Date(),
                        }));
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Last month
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />
            <div className="flex justify-between p-2">
              <Button
                onClick={() =>
                  setFilters({
                    agents: [],
                    messageTypes: ['user', 'assistant'],
                    tags: [],
                  })
                }
                size="sm"
                variant="ghost"
              >
                Clear All
              </Button>
              <Button onClick={handleSearch} size="sm">
                Apply
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button disabled={!(query.trim() || hasFilters)} onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions &&
          (suggestions.length > 0 || recentSearches.length > 0) && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 left-0 z-50 mt-2 rounded-md border bg-popover shadow-lg"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: -10 }}
            >
              {recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-muted-foreground text-xs">
                      Recent
                    </span>
                    <Clock className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                      key={index}
                      onClick={() => {
                        setQuery(search);
                        setShowSuggestions(false);
                        handleSearch();
                      }}
                      type="button"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="border-t p-2">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-muted-foreground text-xs">
                      Suggestions
                    </span>
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                      key={index}
                      onClick={() => {
                        setQuery(suggestion);
                        setShowSuggestions(false);
                        handleSearch();
                      }}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

export default ChatSearchBar;
