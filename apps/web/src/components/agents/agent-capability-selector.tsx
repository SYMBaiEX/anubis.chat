'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Check,
  X,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentCapability } from './types';
import { capabilities, categories } from './constants';

interface Capability extends Omit<AgentCapability, 'enabled'> {
  premium?: boolean;
  beta?: boolean;
  dependencies?: string[];
  incompatible?: string[];
}

interface AgentCapabilitySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}

export function AgentCapabilitySelector({ 
  selected = [], 
  onChange, 
  maxSelections 
}: AgentCapabilitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredCapability, setHoveredCapability] = useState<string | null>(null);

  const filteredCapabilities = capabilities.filter(cap => {
    const matchesSearch = cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cap.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || cap.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleCapability = (capabilityId: string) => {
    if (selected.includes(capabilityId)) {
      onChange(selected.filter(id => id !== capabilityId));
    } else {
      if (!maxSelections || selected.length < maxSelections) {
        onChange([...selected, capabilityId]);
      }
    }
  };

  const getCategoryCapabilities = (category: string) => {
    return capabilities.filter(cap => cap.category === category);
  };

  const getCategoryCount = (category: string) => {
    const categoryCapabilities = getCategoryCapabilities(category);
    return categoryCapabilities.filter(cap => selected.includes(cap.id)).length;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {maxSelections && (
            <Badge variant="outline" className="px-3 py-2">
              {selected.length} / {maxSelections}
            </Badge>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex gap-2">
          {categories.map(category => {
            const count = category === 'All' ? selected.length : getCategoryCount(category);
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="relative"
              >
                {category}
                {count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 px-1"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Capabilities Grid */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCapabilities.map((capability) => {
            const isSelected = selected.includes(capability.id);
            const isDisabled = !isSelected && maxSelections && selected.length >= maxSelections;
            const Icon = capability.icon;
            
            return (
              <motion.div
                key={capability.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => setHoveredCapability(capability.id)}
                onMouseLeave={() => setHoveredCapability(null)}
              >
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'h-auto p-4 justify-start text-left relative group',
                    'hover:shadow-md transition-all',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => !isDisabled && toggleCapability(capability.id)}
                  disabled={isDisabled}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      'rounded-lg p-2',
                      isSelected ? 'bg-primary-foreground/10' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{capability.name}</span>
                        {capability.premium && (
                          <Badge variant="secondary" className="text-xs">
                            Premium
                          </Badge>
                        )}
                        {capability.beta && (
                          <Badge variant="outline" className="text-xs">
                            Beta
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {capability.description}
                      </p>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </div>

                  {/* Hover Info */}
                  {hoveredCapability === capability.id && (capability.dependencies || capability.incompatible) && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-popover border rounded-md shadow-lg z-10"
                    >
                      {capability.dependencies && capability.dependencies.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Requires: </span>
                          {capability.dependencies.join(', ')}
                        </div>
                      )}
                      {capability.incompatible && capability.incompatible.length > 0 && (
                        <div className="text-xs text-destructive">
                          <span className="font-medium">Incompatible with: </span>
                          {capability.incompatible.join(', ')}
                        </div>
                      )}
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {filteredCapabilities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No capabilities found</p>
          </div>
        )}
      </ScrollArea>

      {/* Quick Actions */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {selected.length} capabilities selected
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

export default AgentCapabilitySelector;