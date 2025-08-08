'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Search,
  X,
  Filter,
  Calendar as CalendarIcon,
  User,
  Bot,
  Hash,
  Clock,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  placeholder = "Search conversations..."
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

  const hasFilters = filters.dateFrom || filters.dateTo || 
    filters.agents.length > 0 || filters.tags.length > 0 ||
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
    setFilters(prev => ({
      ...prev,
      messageTypes: prev.messageTypes.includes(type)
        ? prev.messageTypes.filter(t => t !== type)
        : [...prev.messageTypes, type]
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
          <Search className={cn(
            "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors",
            isSearching && "text-primary animate-pulse"
          )} />
          
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-9 pr-10"
          />
          
          {(query || hasFilters) && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
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
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-start"
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {filters.dateFrom ? format(filters.dateFrom, 'PP') : 'From'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 justify-start"
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {filters.dateTo ? format(filters.dateTo, 'PP') : 'To'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Message Types */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message Types</label>
                  <div className="space-y-1">
                    <DropdownMenuCheckboxItem
                      checked={filters.messageTypes.includes('user')}
                      onCheckedChange={() => toggleMessageType('user')}
                    >
                      <User className="h-3 w-3 mr-2" />
                      User Messages
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.messageTypes.includes('assistant')}
                      onCheckedChange={() => toggleMessageType('assistant')}
                    >
                      <Bot className="h-3 w-3 mr-2" />
                      AI Responses
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={filters.messageTypes.includes('system')}
                      onCheckedChange={() => toggleMessageType('system')}
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      System Messages
                    </DropdownMenuCheckboxItem>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Filters</label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setFilters(prev => ({ ...prev, dateFrom: today, dateTo: today }));
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const week = new Date();
                        week.setDate(week.getDate() - 7);
                        setFilters(prev => ({ ...prev, dateFrom: week, dateTo: new Date() }));
                      }}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const month = new Date();
                        month.setMonth(month.getMonth() - 1);
                        setFilters(prev => ({ ...prev, dateFrom: month, dateTo: new Date() }));
                      }}
                    >
                      Last month
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            <div className="p-2 flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({
                  agents: [],
                  messageTypes: ['user', 'assistant'],
                  tags: [],
                })}
              >
                Clear All
              </Button>
              <Button size="sm" onClick={handleSearch}>
                Apply
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={handleSearch} disabled={!query.trim() && !hasFilters}>
          Search
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-md shadow-lg z-50"
          >
            {recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Recent</span>
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                    onClick={() => {
                      setQuery(search);
                      setShowSuggestions(false);
                      handleSearch();
                    }}
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}
            
            {suggestions.length > 0 && (
              <div className="p-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Suggestions</span>
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm"
                    onClick={() => {
                      setQuery(suggestion);
                      setShowSuggestions(false);
                      handleSearch();
                    }}
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