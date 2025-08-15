import type { Meta, StoryObj } from '@storybook/react';
import { Download, Heart, Mail, ShoppingCart } from 'lucide-react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    disabled: {
      control: 'boolean',
    },
    asChild: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default button
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

// Button variants
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// Button sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Heart className="h-4 w-4" />
      </Button>
    </div>
  ),
};

// Disabled states
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button disabled>Disabled Default</Button>
      <Button disabled variant="secondary">
        Disabled Secondary
      </Button>
      <Button disabled variant="destructive">
        Disabled Destructive
      </Button>
      <Button disabled variant="outline">
        Disabled Outline
      </Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Mail className="mr-2 h-4 w-4" />
        Login with Email
      </Button>
      <Button variant="secondary">
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart
      </Button>
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  ),
};

// Loading state
export const Loading: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading...
      </Button>
      <Button disabled variant="outline">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Processing
      </Button>
    </div>
  ),
};

// As child (link)
export const AsLink: Story = {
  render: () => (
    <Button asChild>
      <a href="https://anubis.chat" rel="noopener noreferrer" target="_blank">
        Visit Website
      </a>
    </Button>
  ),
};

// Button group
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex">
      <Button className="rounded-r-none" variant="outline">
        Previous
      </Button>
      <Button className="rounded-none border-l-0" variant="outline">
        1
      </Button>
      <Button className="rounded-none border-l-0" variant="outline">
        2
      </Button>
      <Button className="rounded-none border-l-0" variant="outline">
        3
      </Button>
      <Button className="rounded-l-none border-l-0" variant="outline">
        Next
      </Button>
    </div>
  ),
};
