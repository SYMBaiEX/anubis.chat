'use client';

export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold text-foreground">Tailwind CSS v4 Test Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary color test */}
          <div className="bg-primary text-primary-foreground p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Primary</h2>
            <p>This uses bg-primary</p>
          </div>
          
          {/* Secondary color test */}
          <div className="bg-secondary text-secondary-foreground p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Secondary</h2>
            <p>This uses bg-secondary</p>
          </div>
          
          {/* Accent color test */}
          <div className="bg-accent text-accent-foreground p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Accent</h2>
            <p>This uses bg-accent</p>
          </div>
        </div>
        
        {/* Card test */}
        <div className="bg-card text-card-foreground p-6 rounded-lg border border-border">
          <h2 className="text-2xl font-bold mb-4">Card Component</h2>
          <p className="text-muted-foreground mb-4">
            This is a card using bg-card and border-border
          </p>
          <div className="flex gap-2">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
              Primary Button
            </button>
            <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:opacity-90">
              Destructive Button
            </button>
          </div>
        </div>
        
        {/* Custom Egyptian colors */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-egypt-gold h-20 rounded flex items-center justify-center text-black">
            Gold
          </div>
          <div className="bg-egypt-bronze h-20 rounded flex items-center justify-center text-white">
            Bronze
          </div>
          <div className="bg-egypt-amber h-20 rounded flex items-center justify-center text-white">
            Amber
          </div>
          <div className="bg-egypt-stone h-20 rounded flex items-center justify-center text-white">
            Stone
          </div>
          <div className="bg-egypt-dark-stone h-20 rounded flex items-center justify-center text-white">
            Dark Stone
          </div>
        </div>
        
        {/* ISIS brand colors */}
        <div className="flex gap-4">
          <div className="flex-1 bg-isis-primary text-black p-4 rounded">
            ISIS Primary
          </div>
          <div className="flex-1 bg-isis-accent text-white p-4 rounded">
            ISIS Accent
          </div>
          <div className="flex-1 bg-isis-error text-white p-4 rounded">
            ISIS Error
          </div>
        </div>
        
        {/* Responsive test */}
        <div className="bg-muted p-4 rounded">
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
            Responsive text sizing (grows with screen size)
          </p>
        </div>
        
        {/* Dark mode test */}
        <div className="bg-background dark:bg-card p-4 rounded border border-border">
          <p className="text-foreground">
            This card changes appearance in dark mode
          </p>
        </div>
      </div>
    </div>
  );
}