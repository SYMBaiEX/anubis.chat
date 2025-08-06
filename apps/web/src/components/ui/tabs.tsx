import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import type { TabsProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

const tabsListVariants = cva(
  'inline-flex items-center justify-center rounded-lg p-1',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        pills: 'space-x-2 bg-transparent',
        underline:
          'border-gray-200 border-b bg-transparent dark:border-gray-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        pills:
          'rounded-full bg-gray-100 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:bg-gray-800',
        underline:
          'rounded-none border-transparent border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Tabs component - Provides tabbed navigation interface
 */
export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  className,
  children,
}: TabsProps) {
  const [currentTab, setCurrentTab] = React.useState(
    activeTab ?? tabs[0]?.id ?? ''
  );

  React.useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab, currentTab]);

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === currentTab)?.content;

  return (
    <div className={cn('w-full', className)}>
      {/* Tab List */}
      <div className={cn(tabsListVariants({ variant }))}>
        {tabs.map((tab) => (
          <button
            aria-controls={`tab-content-${tab.id}`}
            aria-selected={currentTab === tab.id}
            className={cn(tabsTriggerVariants({ variant }))}
            data-state={currentTab === tab.id ? 'active' : 'inactive'}
            disabled={tab.disabled}
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {tabs.map((tab) => (
          <div
            aria-labelledby={`tab-${tab.id}`}
            className={cn(
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              currentTab === tab.id ? 'block' : 'hidden'
            )}
            id={`tab-content-${tab.id}`}
            key={tab.id}
            role="tabpanel"
          >
            {tab.content}
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}

export default Tabs;
