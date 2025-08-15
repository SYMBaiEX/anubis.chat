'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

interface ComponentPreviewProps {
  title: string;
  description?: string;
  component: React.ReactNode;
  code?: string;
  className?: string;
}

/**
 * Component preview for documentation and development
 * Shows live component with code example
 */
export function ComponentPreview({
  title,
  description,
  component,
  code,
  className,
}: ComponentPreviewProps) {
  const [activeTab, setActiveTab] = useState('preview');

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && (
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        )}
      </div>

      <Tabs onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          {code && <TabsTrigger value="code">Code</TabsTrigger>}
        </TabsList>

        <TabsContent className="mt-0" value="preview">
          <motion.div
            animate={{ opacity: 1 }}
            className="p-6"
            initial={{ opacity: 0 }}
          >
            {component}
          </motion.div>
        </TabsContent>

        {code && (
          <TabsContent className="mt-0" value="code">
            <motion.div
              animate={{ opacity: 1 }}
              className="relative"
              initial={{ opacity: 0 }}
            >
              <pre className="overflow-x-auto bg-muted p-6">
                <code className="text-sm">{code}</code>
              </pre>
              <button
                className="absolute top-4 right-4 rounded-md bg-background px-2 py-1 text-xs hover:bg-accent"
                onClick={() => navigator.clipboard.writeText(code)}
              >
                Copy
              </button>
            </motion.div>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}

/**
 * Component showcase grid
 */
interface ComponentShowcaseProps {
  components: Array<{
    title: string;
    description?: string;
    component: React.ReactNode;
    code?: string;
  }>;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function ComponentShowcase({
  components,
  columns = 2,
  className,
}: ComponentShowcaseProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {components.map((item, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          key={item.title}
          transition={{ delay: index * 0.1 }}
        >
          <ComponentPreview {...item} />
        </motion.div>
      ))}
    </div>
  );
}
