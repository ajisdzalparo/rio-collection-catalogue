'use client';

import React, { useState } from 'react';
import {
  Eye,
  Code2,
  Sparkles,
  Search,
  User,
  Settings,
  LogOut,
  Plus,
  Loader2,
  Trash2,
  Mail,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Folder,
  Layers,
  Globe,
  Building,
  CreditCard,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FilterDrawer, type FilterState } from '@/components/shared/filter-drawer';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { MultiSelect } from '@/components/ui/multi-select';
import { CodeBlock } from '@/components/ui/code-block';
import { toast } from '@/components/ui/sonner';
import { DataTable, type Column } from '@/components/shared/data-table/data-table';
import { DatePicker } from '@/components/ui/date-picker';
import { FormDatePicker } from '@/components/shared/form/form-date-picker';
import { FormInput } from '@/components/shared/form/form-input';
import type { DateRange } from '@/types/date-picker.types';
import { format as formatDate } from 'date-fns';
import { Wizard, WizardStep } from '@/components/shared/wizard';
import type { StepItem } from '@/types/stepper.types';
import { ShieldCheck, HelpCircle, Info } from 'lucide-react';
import {
  QuickTooltip,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip';
import { QuickTabs, type TabItem } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { FormSwitch } from '@/components/shared/form/form-switch';
import { Textarea } from '@/components/ui/textarea';
import { FormTextarea } from '@/components/shared/form/form-textarea';

import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
  TypographyBlockquote,
  TypographyCode
} from '@/components/ui/typography';
import { FadeIn } from '@/components/ui/motion';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, Radio } from '@/components/ui/radio';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from '@/components/ui/skeleton';
import { Grid, Flex, VStack, HStack, Center } from '@/components/ui/layout';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const demoTabItems: TabItem[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: User,
    badge: 3,
    content: (
      <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2 text-xs">
        <h4 className="font-extrabold text-foreground text-sm">Account Overview</h4>
        <p className="text-muted-foreground leading-relaxed">
          Manage your personal profile, account credentials, and connected workspace preferences.
        </p>
      </div>
    )
  },
  {
    value: 'billing',
    label: 'Billing & Plan',
    icon: CreditCard,
    content: (
      <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2 text-xs">
        <h4 className="font-extrabold text-foreground text-sm">Subscription & Invoices</h4>
        <p className="text-muted-foreground leading-relaxed">
          Your current plan is{' '}
          <strong className="text-primary font-bold">Pro Team ($29/month)</strong>. Renewal date:
          Sept 1, 2026.
        </p>
      </div>
    )
  },
  {
    value: 'settings',
    label: 'Settings',
    icon: Settings,
    content: (
      <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2 text-xs">
        <h4 className="font-extrabold text-foreground text-sm">Security & Integrations</h4>
        <p className="text-muted-foreground leading-relaxed">
          Configure multi-factor authentication, API tokens, and webhook notifications.
        </p>
      </div>
    )
  }
];

const demoWizardSteps: StepItem[] = [
  { id: '1', title: 'Account Info', description: 'User credentials', icon: User },
  { id: '2', title: 'Plan & Payment', description: 'Select subscription', icon: CreditCard },
  { id: '3', title: 'Verification', description: 'Review & submit', icon: ShieldCheck }
];

const projectOptions: ComboboxOption[] = [
  {
    value: 'equa-design',
    label: 'Equa Design System',
    description: 'Core UI kit & design tokens',
    icon: Layers
  },
  {
    value: 'nextjs-boilerplate',
    label: 'Next.js Boilerplate',
    description: 'Production ready starter template',
    icon: Folder
  },
  {
    value: 'cms-dashboard',
    label: 'CMS Dashboard',
    description: 'Content management & analytics',
    icon: Globe
  },
  {
    value: 'wms-inventory',
    label: 'WMS Inventory Portal',
    description: 'Warehouse management system',
    icon: Building
  },
  {
    value: 'pos-checkout',
    label: 'POS Checkout System',
    description: 'Point of sale terminal app',
    icon: CreditCard
  }
];

interface SampleUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
}

const sampleUsersData: SampleUserRow[] = [
  {
    id: '1',
    name: 'Ajis Johnson',
    email: 'Ajis@equa.design',
    role: 'Administrator',
    status: 'active'
  },
  {
    id: '2',
    name: 'Sarah Miller',
    email: 'sarah@equa.design',
    role: 'Content Editor',
    status: 'active'
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael@equa.design',
    role: 'Standard User',
    status: 'pending'
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily@equa.design',
    role: 'Standard User',
    status: 'suspended'
  }
];

const sampleUserColumns: Column<SampleUserRow>[] = [
  {
    header: 'User',
    accessorKey: 'name',
    sortable: true,
    cell: (item) => {
      const initials = item.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2);
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold ring-2 ring-background shadow-2xs">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-xs">{item.name}</span>
            <span className="text-[11px] font-medium text-muted-foreground">{item.email}</span>
          </div>
        </div>
      );
    }
  },
  {
    header: 'Role',
    accessorKey: 'role',
    sortable: true,
    cell: (item) => (
      <Badge variant="outline" className="capitalize text-[11px] font-semibold">
        {item.role}
      </Badge>
    )
  },
  {
    header: 'Status',
    accessorKey: 'status',
    sortable: true,
    cell: (item) => {
      const isPending = item.status === 'pending';
      const isSuspended = item.status === 'suspended';
      const dotColor = isPending
        ? 'bg-amber-500'
        : isSuspended
          ? 'bg-destructive'
          : 'bg-emerald-500';

      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/50 border border-border/50 text-[11px] font-bold">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          <span className="capitalize text-foreground">{item.status}</span>
        </div>
      );
    }
  },

  {
    header: 'Actions',
    className: 'text-right pr-4',
    cell: (item) => (
      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant="ghost"
          size="icon-xs"
          className="rounded-lg"
          onClick={() => toast.info(`Editing ${item.name}`)}
        >
          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="sr-only">Edit</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-xs" className="rounded-lg">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="sr-only">More Options</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => toast.info(`View details for ${item.name}`)}
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span>View Details</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => toast.info(`Editing ${item.name}`)}
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Edit User</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={() => toast.error(`Deleted ${item.name}`)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete User</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
];

export default function ComponentsDocsPage() {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openSheet, setOpenSheet] = useState<boolean>(false);
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [btnLoading, setBtnLoading] = useState<boolean>(false);

  const [inputText, setInputText] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('equa-design');
  const [selectedTags, setSelectedTags] = useState<string[]>(['equa-design', 'cms-dashboard']);
  const [singleDate, setSingleDate] = useState<Date | undefined>(() => new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return { from: today, to: nextWeek };
  });
  const [formSingleDate, setFormSingleDate] = useState<Date | undefined>(undefined);
  const [formDateRange, setFormDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    return { from: lastMonth, to: today };
  });

  const [tableSelection, setTableSelection] = useState<boolean>(true);
  const [tableRowNumbers, setTableRowNumbers] = useState<boolean>(true);
  const [tableSearch, setTableSearch] = useState<boolean>(true);
  const [tableSorting, setTableSorting] = useState<boolean>(true);

  const [wizardStep, setWizardStep] = useState<number>(0);
  const [wizardName, setWizardName] = useState<string>('Ajis Johnson');
  const [wizardEmail, setWizardEmail] = useState<string>('Ajis@equa.design');
  const [wizardVariant, setWizardVariant] = useState<'default' | 'cards' | 'pills'>('default');

  const [switchNotifications, setSwitchNotifications] = useState<boolean>(true);
  const [switchDarkMode, setSwitchDarkMode] = useState<boolean>(false);
  const [switchAutoSave, setSwitchAutoSave] = useState<boolean>(true);

  const [textareaVal, setTextareaVal] = useState<string>(
    'This boilerplate features standardized UI tokens and component architectures.'
  );

  const [radioVal, setRadioVal] = useState<string>('comfortable');

  const handleConfirmDelete = async (): Promise<void> => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setOpenConfirm(false);
    }, 1500);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 sm:p-10 text-foreground shadow-xs">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Equa Design System UI Docs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Component Documentation (TypeScript)
          </h1>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
            Dokumentasi komponen UI interaktif dengan dukungan tipe TypeScript lengkap. Setiap
            komponen dilengkapi varian visual, live sandbox, dan kode TypeScript 1-klik copy.
          </p>
        </div>
      </div>

      {/* COMPONENT 1: BADGE */}
      <DocSection
        title="1. Badge"
        description="Komponen badge status dengan geometri pill dan tipe variant TypeScript."
        codeSnippet={`import { Badge } from "@/components/ui/badge";

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "ghost";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
}

<Badge variant="default">Active</Badge>
<Badge variant="secondary">In Progress</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Critical Error</Badge>`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 p-5 rounded-2xl bg-muted/40 border border-border/40">
            <Badge variant="default">Active</Badge>
            <Badge variant="secondary">In Progress</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Critical Error</Badge>
            <Badge variant="ghost">Draft</Badge>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 2: BUTTON */}
      <DocSection
        title="2. Button"
        description="Komponen tombol utama dengan tipe variant, size, dan loading state TypeScript."
        codeSnippet={`import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export type ButtonVariant = "default" | "secondary" | "outline" | "destructive" | "ghost";
export type ButtonSize = "default" | "xs" | "sm" | "lg" | "icon";

export interface ActionButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  onClick?: () => void;
}

<Button variant="default">Primary Obsidian</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline Card</Button>
<Button variant="destructive">Destructive</Button>`}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Variants
            </span>
            <div className="flex flex-wrap items-center gap-3 p-5 rounded-2xl bg-muted/40 border border-border/40">
              <Button variant="default">Primary Obsidian</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline Card</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost Link</Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Sizes & States
            </span>
            <div className="flex flex-wrap items-center gap-3 p-5 rounded-2xl bg-muted/40 border border-border/40">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large Hero</Button>
              <Button size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>

              <Button
                disabled={btnLoading}
                onClick={() => {
                  setBtnLoading(true);
                  setTimeout(() => setBtnLoading(false), 2000);
                }}
              >
                {btnLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Test Loading Trigger</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 3: INPUT FIELD TEXT */}
      <DocSection
        title="3. Input Field Text"
        description="Komponen input teks dengan antarmuka React.ComponentProps<'input'> TypeScript."
        codeSnippet={`import { Input } from "@/components/ui/input";
import { Search, Mail } from "lucide-react";

export interface FormInputProps extends React.ComponentProps<"input"> {
  label?: string;
  helperText?: string;
  error?: string;
}

<Input placeholder="Enter user name..." />

// Input with Left Icon:
<div className="relative">
  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-9" placeholder="Search projects or logs..." />
</div>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-muted/40 border border-border/40">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Standard Input</label>
            <Input
              value={inputText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
              placeholder="Type user name..."
            />
            <p className="text-[11px] font-medium text-muted-foreground">
              Live value: &quot;{inputText}&quot;
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Input with Left Icon</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search projects or logs..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Email Field</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" className="pl-9" placeholder="Ajis@equa.design" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Disabled Input</label>
            <Input disabled value="System Locked Field" />
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 4: DROPDOWN MENU */}
      <DocSection
        title="4. Dropdown Menu (Standard & Premium)"
        description="Komponen menu dropdown dengan tipe data item menu TypeScript."
        codeSnippet={`import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface UserMenuItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  shortcut?: string;
  variant?: "default" | "destructive";
  onSelect: () => void;
}

<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="outline">Options</Button>} />
  <DropdownMenuContent align="start" className="w-56">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="cursor-pointer">
      <User className="h-4 w-4" />
      <span>Profile</span>
      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
      >
        <div className="flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-muted/40 border border-border/40">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>User Account Menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel className="p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-extrabold leading-none text-foreground">
                    Ajis Johnson
                  </p>
                  <p className="text-[10px] font-medium leading-none text-muted-foreground">
                    Ajis@equa.design
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
                <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Notifications</span>
                <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0">
                  3
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="cursor-pointer">
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="default" className="gap-2">
                  <span>Quick Actions</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="h-4 w-4 text-muted-foreground" />
                <span>Edit Document</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Add Item</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DocSection>

      {/* COMPONENT 5: DROPDOWN WITH SEARCH (COMBOBOX) */}
      <DocSection
        title="5. Dropdown with Search (Searchable Combobox)"
        description="Komponen select dropdown pencarian dengan antarmuka ComboboxOption & ComboboxProps TypeScript."
        codeSnippet={`import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

const projectOptions: ComboboxOption[] = [
  { value: "equa-design", label: "Equa Design System", description: "Core UI kit" },
  { value: "nextjs-boilerplate", label: "Next.js Boilerplate", description: "Production starter" }
];

const [selectedProject, setSelectedProject] = useState<string>("equa-design");

<Combobox
  options={projectOptions}
  value={selectedProject}
  onChange={(val: string) => setSelectedProject(val)}
  placeholder="Search and select project..."
  searchPlaceholder="Type to filter projects..."
/>`}
      >
        <div className="space-y-4 p-5 rounded-2xl bg-muted/40 border border-border/40 max-w-md">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Select Active Project (Searchable)
            </label>
            <Combobox
              options={projectOptions}
              value={selectedProject}
              onChange={(val: string) => setSelectedProject(val)}
              placeholder="Search and select project..."
              searchPlaceholder="Type to filter projects..."
            />
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 6: MULTI-SELECT DROPDOWN */}
      <DocSection
        title="6. Multi-Select Dropdown (MultiSelect)"
        description="Komponen dropdown multi-select dengan antarmuka MultiSelectOption & MultiSelectProps TypeScript."
        codeSnippet={`import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";

const projectOptions: MultiSelectOption[] = [
  { value: "equa-design", label: "Equa Design System" },
  { value: "nextjs-boilerplate", label: "Next.js Boilerplate" }
];

const [selectedTags, setSelectedTags] = useState<string[]>(["equa-design"]);

<MultiSelect
  options={projectOptions}
  value={selectedTags}
  onChange={(tags: string[]) => setSelectedTags(tags)}
  placeholder="Select multiple projects..."
  searchPlaceholder="Filter items..."
  maxCount={1}
/>`}
      >
        <div className="space-y-4 p-5 rounded-2xl bg-muted/40 border border-border/40 max-w-lg">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Select Multiple Projects / Tags
            </label>
            <MultiSelect
              options={projectOptions}
              value={selectedTags}
              onChange={(tags: string[]) => setSelectedTags(tags)}
              placeholder="Search and select multiple projects..."
              searchPlaceholder="Filter items..."
              maxCount={1}
            />
          </div>
        </div>
      </DocSection>

      {/* COMPONENT: DYNAMIC DATE PICKER (SINGLE & RANGE) */}
      <DocSection
        title="7. Dynamic Date Picker (Single & Date Range with Presets)"
        description="Komponen pemilih tanggal dinamis dengan dukungan Single Date, Date Range dengan Preset shortcut, navigasi bulan/tahun cepat, dan integrasi Form."
        codeSnippet={`import { DatePicker } from "@/components/ui/date-picker";
import { FormDatePicker } from "@/components/shared/form/form-date-picker";
import type { DateRange } from "@/types/date-picker.types";

const [singleDate, setSingleDate] = useState<Date | undefined>(new Date());
const [dateRange, setDateRange] = useState<DateRange | undefined>({
  from: new Date(),
  to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// Single Date Mode
<DatePicker
  mode="single"
  value={singleDate}
  onChange={(d) => setSingleDate(d)}
  placeholder="Select single date..."
/>

// Date Range Mode with Presets (Today, Last 7 Days, This Month, etc.)
<DatePicker
  mode="range"
  rangeValue={dateRange}
  onRangeChange={(r) => setDateRange(r)}
  placeholder="Select date range..."
  showPresets
/>

// Form Integration Component
<FormDatePicker
  label="Schedule Release Date"
  mode="single"
  value={singleDate}
  onChange={(d) => setSingleDate(d)}
  helperText="Select planned target release date"
/>`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-muted/40 border border-border/40">
          {/* Single Date Picker */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              Single Date Picker
            </h4>
            <DatePicker
              mode="single"
              value={singleDate}
              onChange={(d) => setSingleDate(d)}
              placeholder="Select date..."
            />
            {singleDate && (
              <p className="text-[11px] font-medium text-muted-foreground">
                Selected:{' '}
                <span className="font-bold text-foreground">
                  {formatDate(singleDate, 'MMM dd, yyyy')}
                </span>
              </p>
            )}
          </div>

          {/* Date Range Picker with Presets */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
              Date Range Picker (With Shortcuts)
            </h4>
            <DatePicker
              mode="range"
              rangeValue={dateRange}
              onRangeChange={(r) => setDateRange(r)}
              placeholder="Select date range..."
              showPresets
            />
            {dateRange?.from && (
              <p className="text-[11px] font-medium text-muted-foreground">
                Range:{' '}
                <span className="font-bold text-foreground">
                  {formatDate(dateRange.from, 'MMM dd, yyyy')}
                  {dateRange.to
                    ? ` - ${formatDate(dateRange.to, 'MMM dd, yyyy')}`
                    : ' (picking...)'}
                </span>
              </p>
            )}
          </div>

          {/* Form Integrated Date Picker */}
          <div className="space-y-2 md:col-span-2 pt-4 border-t border-border/50">
            <h4 className="text-xs font-bold text-foreground">
              Form-Integrated Wrapper (FormDatePicker)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormDatePicker
                label="Filter Period"
                mode="range"
                rangeValue={formDateRange}
                onRangeChange={(r) => setFormDateRange(r)}
                helperText="Select period range to filter records"
              />
              <FormDatePicker
                label="Required Target Date"
                mode="single"
                value={formSingleDate}
                onChange={(d) => setFormSingleDate(d)}
                placeholder="Pick target release date..."
                error={!formSingleDate ? 'Please select a valid date' : undefined}
              />
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 8: MODAL (DIALOG) */}
      <DocSection
        title="8. Modal (Dialog)"
        description="Komponen dialog modal interaktif dengan antarmuka props & handler TypeScript."
        codeSnippet={`import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export interface EditProfileFormData {
  name: string;
  email: string;
}

const [open, setOpen] = useState<boolean>(false);

<Dialog open={open} onOpenChange={(val: boolean) => setOpen(val)}>
  <DialogTrigger render={<Button>Open Modal</Button>} />
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Edit Profile Settings</DialogTitle>
      <DialogDescription>Update your personal information.</DialogDescription>
    </DialogHeader>

    <div className="space-y-3 py-2">
      <Input placeholder="Full Name" />
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={() => setOpen(false)}>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40">
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger
              render={
                <Button variant="default" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Open Equa Modal Dialog</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit User Profile</DialogTitle>
                <DialogDescription>
                  Update your account information below. Click save when finished.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Name</label>
                  <Input defaultValue="Ajis Johnson" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Email Address</label>
                  <Input defaultValue="Ajis@equa.design" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpenModal(false)}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </DocSection>

      {/* COMPONENT 9: SIDE MODAL (SHEET / SLIDE-OVER DRAWER) */}
      <DocSection
        title="9. Side Modal (Sheet / Slide-over Drawer)"
        description="Komponen modal panel samping dengan prop side: 'right' | 'left' | 'top' | 'bottom' TypeScript."
        codeSnippet={`import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

export type SheetSide = "right" | "left" | "top" | "bottom";

export interface SideDrawerProps {
  side?: SheetSide;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

<Sheet open={openSheet} onOpenChange={(val: boolean) => setOpenSheet(val)}>
  <SheetTrigger render={<Button>Open Side Drawer</Button>} />
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Project Details</SheetTitle>
      <SheetDescription>View and manage project settings.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <Button variant="outline" onClick={() => setOpenSheet(false)}>Cancel</Button>
      <Button onClick={() => setOpenSheet(false)}>Save Project</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40">
          <Sheet open={openSheet} onOpenChange={setOpenSheet}>
            <SheetTrigger
              render={
                <Button variant="default" className="gap-2">
                  <Layers className="h-4 w-4" />
                  <span>Open Side Drawer (Slide-Over Panel)</span>
                </Button>
              }
            />
            <SheetContent side="right">
              <SheetHeader className="pr-8">
                <SheetTitle>Project Configuration</SheetTitle>
                <SheetDescription>
                  Configure your side panel settings and metadata.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Project Name</label>
                  <Input defaultValue="Equa Design System" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Category</label>
                  <Input defaultValue="UI Kit & Boilerplate" />
                </div>
              </div>

              <SheetFooter>
                <Button variant="outline" onClick={() => setOpenSheet(false)}>
                  Close
                </Button>
                <Button onClick={() => setOpenSheet(false)}>Save Configuration</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </DocSection>

      {/* COMPONENT 10: SLIDE-OVER FILTER PANEL (FILTER DRAWER) */}
      <DocSection
        title="10. Slide-Over Filter Panel (Filter Drawer)"
        description="Komponen modal penyaring data dengan tipe antarmuka FilterState & FilterDrawerProps TypeScript."
        codeSnippet={`import { FilterDrawer, type FilterState } from "@/components/shared/filter-drawer";

const handleApplyFilters = (filters: FilterState): void => {
  console.log("Applied filters:", filters);
};

<FilterDrawer onApplyFilters={handleApplyFilters} />`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40">
          <FilterDrawer
            onApplyFilters={(applied: FilterState) => {
              console.log('Applied filters:', applied);
            }}
          />
        </div>
      </DocSection>

      {/* COMPONENT 11: MODAL CONFIRM (CONFIRM DIALOG) */}
      <DocSection
        title="11. Modal Confirm (Confirm Dialog)"
        description="Komponen konfirmasi aksi penting dengan antarmuka ConfirmDialogProps TypeScript."
        codeSnippet={`import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export interface ConfirmState {
  open: boolean;
  isLoading: boolean;
  onConfirm: () => Promise<void>;
}

<ConfirmDialog
  open={openConfirm}
  onOpenChange={(val: boolean) => setOpenConfirm(val)}
  title="Delete Account"
  description="Are you sure you want to delete this account?"
  confirmText="Delete Account"
  variant="destructive"
  isLoading={isDeleting}
  onConfirm={handleConfirmDelete}
/>`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40">
          <Button variant="destructive" className="gap-2" onClick={() => setOpenConfirm(true)}>
            <Trash2 className="h-4 w-4" />
            <span>Test Delete Confirm Modal</span>
          </Button>

          <ConfirmDialog
            open={openConfirm}
            onOpenChange={setOpenConfirm}
            title="Delete Account Data"
            description="Are you sure you want to delete this user account? All associated records will be permanently removed."
            confirmText="Delete Account"
            cancelText="Cancel"
            variant="destructive"
            isLoading={isDeleting}
            onConfirm={handleConfirmDelete}
          />
        </div>
      </DocSection>

      {/* COMPONENT 12: TOAST NOTIFICATION */}
      <DocSection
        title="12. Toast Notification (Sonner)"
        description="Komponen notifikasi toast mengambang dengan dukungan varian pesan dan kustomisasi 6 posisi layar."
        codeSnippet={`import { toast, Toaster } from "@/components/ui/sonner";

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// 1. Ubah Posisi Global di Layout/Root:
<Toaster position="top-right" richColors />

// 2. Ubah Posisi Per Toast:
toast.success("Top Left Toast", { position: "top-left" });
toast.info("Top Center Toast", { position: "top-center" });
toast.warning("Bottom Right Toast", { position: "bottom-right" });`}
      >
        <div className="space-y-6">
          {/* Section 1: Toast Variants */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Toast Message Variants
            </span>
            <div className="flex flex-wrap items-center gap-3 p-5 rounded-2xl bg-muted/40 border border-border/40">
              <Button
                variant="default"
                className="gap-2"
                onClick={() =>
                  toast.success('User Account Created', {
                    description: 'Ajis Johnson has been added as Administrator.'
                  })
                }
              >
                <span>Success Toast</span>
              </Button>

              <Button
                variant="destructive"
                className="gap-2"
                onClick={() =>
                  toast.error('Permission Denied', {
                    description: 'You need Super Admin privileges to perform this action.'
                  })
                }
              >
                <span>Error Toast</span>
              </Button>

              <Button
                variant="secondary"
                className="gap-2"
                onClick={() =>
                  toast.info('System Update Scheduled', {
                    description: 'Maintenance is scheduled for tonight at 02:00 UTC.'
                  })
                }
              >
                <span>Info Toast</span>
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  toast('Campaign Event Created', {
                    description: 'Q3 Marketing launch created successfully.',
                    action: {
                      label: 'Undo Action',
                      onClick: () => toast.info('Action undone!')
                    }
                  })
                }
              >
                <span>Toast with Action Button</span>
              </Button>
            </div>
          </div>

          {/* Section 2: Toast Positions */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Custom Screen Positions (6 Locations)
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-5 rounded-2xl bg-muted/40 border border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.success('Top Left Notification', {
                    position: 'top-left',
                    description: 'Positioned at top-left corner.'
                  })
                }
              >
                <span>Top Left</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.info('Top Center Notification', {
                    position: 'top-center',
                    description: 'Positioned at top-center.'
                  })
                }
              >
                <span>Top Center</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.success('Top Right Notification', {
                    position: 'top-right',
                    description: 'Positioned at top-right corner.'
                  })
                }
              >
                <span>Top Right (Default)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.warning('Bottom Left Notification', {
                    position: 'bottom-left',
                    description: 'Positioned at bottom-left corner.'
                  })
                }
              >
                <span>Bottom Left</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.info('Bottom Center Notification', {
                    position: 'bottom-center',
                    description: 'Positioned at bottom-center.'
                  })
                }
              >
                <span>Bottom Center</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.error('Bottom Right Notification', {
                    position: 'bottom-right',
                    description: 'Positioned at bottom-right corner.'
                  })
                }
              >
                <span>Bottom Right</span>
              </Button>
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 13: DATA TABLE */}
      <DocSection
        title="13. Data Table (DataTable)"
        description="Komponen tabel data interaktif dengan fitur filter pencarian keyword, render kolom custom, status badges, aksi tombol row, dan paginasi."
        codeSnippet={`import { DataTable, type Column } from "@/components/shared/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Eye, Trash2 } from "lucide-react";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "pending" | "suspended";
}

const columns: Column<UserRow>[] = [
  { header: "Name", accessorKey: "name" },
  { header: "Email", accessorKey: "email" },
  { header: "Role", accessorKey: "role" },
  {
    header: "Status",
    cell: (item) => (
      <Badge variant={item.status === "active" ? "default" : "secondary"}>
        {item.status}
      </Badge>
    )
  },
  {
    header: "Actions",
    className: "text-right pr-4",
    cell: (item) => (
      <div className="flex items-center justify-end gap-1 text-right">
        <Button variant="ghost" size="icon-xs" onClick={() => console.log("Edit", item.id)}>
          <Edit className="h-3.5 w-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon-xs">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => console.log("View", item.id)}>
              <Eye className="h-3.5 w-3.5" />
              <span>View Details</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => console.log("Delete", item.id)}>
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }
];

<DataTable
  columns={columns}
  data={userDataList}
  searchKey="name"
  showSearch={true} // Set to false to hide search bar completely
  showRowNumbers={true} // Automatically prepends '#' row numbers column
  enableSelection={true} // Enables multi-row selection & bulk action bar
  filterComponents={<Button variant="outline" size="sm">Filter Options</Button>}
  bulkActions={(selectedItems, clearSelection) => (
    <Button
      onClick={() => {
        toast.error(\`Deleted \${selectedItems.length} user(s)\`);
        clearSelection();
      }}
      className="gap-1.5 text-xs font-bold h-8 px-3.5 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-none transition-all cursor-pointer shadow-md shadow-red-950/20"
    >
      Delete
    </Button>
  )}
  pageSize={5}
/>`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 space-y-4">
          {/* Customization Control Toggles */}
          <div className="flex flex-wrap items-center gap-4 pb-3 border-b border-border/50 text-xs font-bold text-foreground">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px]">
              Live Customizations:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tableSelection}
                onChange={(e) => setTableSelection(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
              />
              <span>Checkbox Selection (`enableSelection`)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tableRowNumbers}
                onChange={(e) => setTableRowNumbers(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
              />
              <span>Row Numbers (`showRowNumbers`)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tableSearch}
                onChange={(e) => setTableSearch(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
              />
              <span>Search Bar (`showSearch`)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={tableSorting}
                onChange={(e) => setTableSorting(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border text-primary accent-primary cursor-pointer"
              />
              <span>Column Sorting (`enableSorting`)</span>
            </label>
          </div>

          <DataTable
            columns={sampleUserColumns}
            data={sampleUsersData}
            searchKey="name"
            searchPlaceholder="Search users by name or email..."
            showSearch={tableSearch}
            showRowNumbers={tableRowNumbers}
            enableSelection={tableSelection}
            enableSorting={tableSorting}
            pageSize={5}
          />
        </div>
      </DocSection>

      {/* COMPONENT 14: STEPPER & MULTI-STEP WIZARD */}
      <DocSection
        title="14. Stepper & Multi-Step Wizard"
        description="Komponen pemandu langkah-demi-langkah (Wizard) dengan indikator Stepper interaktif, validasi per langkah, dan tombol navigasi Back / Next / Finish."
        codeSnippet={`import { Stepper } from "@/components/ui/stepper";
import { Wizard, WizardStep } from "@/components/shared/wizard";
import type { StepItem } from "@/types/stepper.types";

const steps: StepItem[] = [
  { id: '1', title: 'Account Info', description: 'User credentials', icon: User },
  { id: '2', title: 'Plan & Payment', description: 'Select subscription', icon: CreditCard },
  { id: '3', title: 'Verification', description: 'Review & submit', icon: ShieldCheck }
];

const [currentStep, setCurrentStep] = useState(0);

<Wizard
  steps={steps}
  currentStep={currentStep}
  onStepChange={(idx) => setCurrentStep(idx)}
  onBeforeNext={(stepIdx) => {
    // Return false to prevent advancing if validation fails
    if (stepIdx === 0 && !wizardName) {
      toast.error('Please enter your full name');
      return false;
    }
    return true;
  }}
  onFinish={() => toast.success('Registration Completed Successfully!')}
  clickableSteps
>
  <WizardStep stepIndex={0}>
    <FormInput label="Full Name" value={wizardName} onChange={(e) => setWizardName(e.target.value)} />
  </WizardStep>

  <WizardStep stepIndex={1}>
    <p>Select plan...</p>
  </WizardStep>

  <WizardStep stepIndex={2}>
    <p>Confirmation details...</p>
  </WizardStep>
</Wizard>`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 space-y-6">
          {/* Variant Selector Toggles */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-border/50">
            <span className="text-xs font-bold text-muted-foreground mr-2 uppercase tracking-wider text-[10px]">
              Visual Style:
            </span>
            {(['default', 'cards', 'pills'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setWizardVariant(v)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer',
                  wizardVariant === v
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                )}
              >
                {v === 'default'
                  ? 'Default Stepper'
                  : v === 'cards'
                    ? 'Segmented Cards'
                    : 'Pills Bar'}
              </button>
            ))}
          </div>

          <Wizard
            steps={demoWizardSteps}
            currentStep={wizardStep}
            variant={wizardVariant}
            onStepChange={(idx) => setWizardStep(idx)}
            onBeforeNext={(stepIdx) => {
              if (stepIdx === 0 && !wizardName.trim()) {
                toast.error('Please fill in your full name before continuing');
                return false;
              }
              return true;
            }}
            onFinish={() => toast.success('Multi-Step Wizard Registration Completed!')}
            clickableSteps
          >
            {/* Step 1: Account Info */}
            <WizardStep stepIndex={0}>
              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Step 1: Account Information</h3>
                  <p className="text-xs text-muted-foreground">
                    Enter your basic credentials to set up your account.
                  </p>
                </div>
                <div className="space-y-3 pt-2">
                  <FormInput
                    label="Full Name"
                    value={wizardName}
                    onChange={(e) => setWizardName(e.target.value)}
                    placeholder="Enter your name..."
                  />
                  <FormInput
                    label="Work Email Address"
                    type="email"
                    value={wizardEmail}
                    onChange={(e) => setWizardEmail(e.target.value)}
                    placeholder="name@company.com"
                  />
                </div>
              </div>
            </WizardStep>

            {/* Step 2: Plan & Payment */}
            <WizardStep stepIndex={1}>
              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    Step 2: Select Subscription Plan
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Choose a plan that fits your team size and workflow.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-4 rounded-2xl border-2 border-primary bg-primary/10 space-y-1 cursor-pointer">
                    <span className="text-xs font-bold text-primary">Pro Team</span>
                    <p className="text-lg font-extrabold text-foreground">$29/mo</p>
                    <p className="text-[11px] text-muted-foreground">Unlimited projects & users</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border/60 bg-card space-y-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-muted-foreground">Enterprise</span>
                    <p className="text-lg font-extrabold text-foreground">$99/mo</p>
                    <p className="text-[11px] text-muted-foreground">Dedicated support & SLA</p>
                  </div>
                </div>
              </div>
            </WizardStep>

            {/* Step 3: Verification */}
            <WizardStep stepIndex={2}>
              <div className="space-y-4 max-w-md">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    Step 3: Review & Confirmation
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Please review your account details before submitting.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground font-medium">Name:</span>
                    <span className="font-bold text-foreground">{wizardName || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground font-medium">Email:</span>
                    <span className="font-bold text-foreground">{wizardEmail || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Selected Plan:</span>
                    <span className="font-bold text-primary">Pro Team ($29/mo)</span>
                  </div>
                </div>
              </div>
            </WizardStep>
          </Wizard>
        </div>
      </DocSection>

      {/* COMPONENT 15: TOOLTIP */}
      <DocSection
        title="15. Tooltip Component"
        description="Komponen tooltip modern dengan dukungan 4 posisi (top, right, bottom, left), shortcut tombol keyboard, dan mode QuickTooltip."
        codeSnippet={`import { QuickTooltip, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Usage 1: QuickTooltip (Single Wrap Convenience)
<QuickTooltip content="This action cannot be undone" side="top">
  <Button variant="outline">Hover Me</Button>
</QuickTooltip>

// Usage 2: Compound Tooltip Primitives with Keyboard Shortcuts
<TooltipProvider delay={100}>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon"><Info /></Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="flex items-center gap-2">
      <span>Quick search</span>
      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/20 rounded">⌘K</kbd>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* QuickTooltip Top */}
            <QuickTooltip content="Tooltip positioned on top" side="top">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span>Hover Top</span>
              </Button>
            </QuickTooltip>

            {/* QuickTooltip Bottom */}
            <QuickTooltip content="Tooltip positioned on bottom" side="bottom">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Hover Bottom</span>
              </Button>
            </QuickTooltip>

            {/* QuickTooltip Left */}
            <QuickTooltip content="Tooltip positioned on left" side="left">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
                <span>Hover Left</span>
              </Button>
            </QuickTooltip>

            {/* QuickTooltip Right */}
            <QuickTooltip content="Tooltip positioned on right" side="right">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-1.5">
                <span>Hover Right</span>
              </Button>
            </QuickTooltip>

            {/* Rich Tooltip with Kbd shortcut */}
            <TooltipProvider delay={100}>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Assistant</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="flex items-center gap-2 font-semibold">
                  <span>Activate AI Chat</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/25 rounded border border-background/20">
                    ⌘J
                  </kbd>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 16: TABS */}
      <DocSection
        title="16. Tabs Navigation Component"
        description="Komponen tab navigasi dengan 3 gaya visual (Segmented Pills, Line Underline, & Card Tabs) serta pembungkus QuickTabs."
        codeSnippet={`import { QuickTabs, Tabs, TabsList, TabsTrigger, TabsContent, type TabItem } from "@/components/ui/tabs";

const tabItems: TabItem[] = [
  { value: 'overview', label: 'Overview', icon: User, badge: 3, content: <p>Overview content...</p> },
  { value: 'billing', label: 'Billing & Plan', icon: CreditCard, content: <p>Billing content...</p> },
  { value: 'settings', label: 'Settings', icon: Settings, content: <p>Settings content...</p> }
];

// Usage 1: QuickTabs (Convenience Wrapper)
<QuickTabs items={tabItems} variant="pills" />
<QuickTabs items={tabItems} variant="line" />
<QuickTabs items={tabItems} variant="cards" />

// Usage 2: Compound Primitives
<Tabs defaultValue="account">
  <TabsList variant="pills">
    <TabsTrigger value="account" variant="pills">Account</TabsTrigger>
    <TabsTrigger value="password" variant="pills">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account settings...</TabsContent>
  <TabsContent value="password">Password settings...</TabsContent>
</Tabs>`}
      >
        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Variant 1: Segmented Pills Bar (variant=&quot;pills&quot;)
            </span>
            <QuickTabs items={demoTabItems} variant="pills" defaultValue="overview" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Variant 2: Bottom Line Underline (variant=&quot;line&quot;)
            </span>
            <QuickTabs items={demoTabItems} variant="line" defaultValue="overview" />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Variant 3: Elevated Cards (variant=&quot;cards&quot;)
            </span>
            <QuickTabs items={demoTabItems} variant="cards" defaultValue="overview" />
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 17: TYPOGRAPHY SYSTEM */}
      <DocSection
        title="17. Typography System"
        description="Sistem tipografi standar boilerplate dengan varian hirarki teks (Heading 1-4, Body, Lead, Large, Small, Muted, Blockquote, & Code) agar seluruh aplikasi konsisten."
        codeSnippet={`import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted,
  TypographyBlockquote,
  TypographyCode
} from "@/components/ui/typography";

<TypographyH1>Heading 1 - Page Title</TypographyH1>
<TypographyH2>Heading 2 - Section Title</TypographyH2>
<TypographyH3>Heading 3 - Card Title</TypographyH3>
<TypographyH4>Heading 4 - Subsection</TypographyH4>

<TypographyLead>Lead paragraph subtitle text...</TypographyLead>
<TypographyP>Standard body paragraph description text...</TypographyP>
<TypographyLarge>Large bold highlighted text</TypographyLarge>
<TypographySmall>Small detail label or caption</TypographySmall>
<TypographyMuted>Muted secondary description text</TypographyMuted>

<TypographyBlockquote>Quote statement line...</TypographyBlockquote>
<TypographyCode>bun add date-fns</TypographyCode>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-6">
          <div className="space-y-4 border-b border-border/40 pb-6">
            <TypographyH1>Heading 1: Modern Web Boilerplate</TypographyH1>
            <TypographyH2>Heading 2: Built for Scale & Performance</TypographyH2>
            <TypographyH3>Heading 3: Standardized Design Tokens</TypographyH3>
            <TypographyH4>Heading 4: Reusable Component Ecosystem</TypographyH4>
          </div>

          <div className="space-y-3 border-b border-border/40 pb-6">
            <TypographyLead>
              This lead paragraph introduces the core architectural features of Next.js 16 with
              Turbopack and Tailwind CSS v4.
            </TypographyLead>
            <TypographyP>
              Consistent typography ensures that heading hierarchies, paragraph line heights,
              tracking, and font weights remain harmonious across every page.
            </TypographyP>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border/40 pb-6">
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Large Bold
              </span>
              <TypographyLarge>TypographyLarge Text</TypographyLarge>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Small Caption
              </span>
              <TypographySmall>TypographySmall Detail</TypographySmall>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                Muted Text
              </span>
              <TypographyMuted>TypographyMuted Secondary Info</TypographyMuted>
            </div>
          </div>

          <div className="space-y-4">
            <TypographyBlockquote>
              &ldquo;Design is not just what it looks like and feels like. Design is how it
              works.&rdquo; &mdash; Steve Jobs
            </TypographyBlockquote>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Command example:</span>
              <TypographyCode>bun run build</TypographyCode>
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 18: TOGGLE SWITCH */}
      <DocSection
        title="18. Toggle Switch Component"
        description="Komponen sakelar beralih (Toggle Switch) dengan 3 pilihan ukuran (small, default, large) serta pembungkus FormSwitch terintegrasi."
        codeSnippet={`import { Switch } from "@/components/ui/switch";
import { FormSwitch } from "@/components/shared/form/form-switch";

// Usage 1: Standalone UI Switch
<Switch checked={isEnabled} onCheckedChange={setIsEnabled} size="default" />

// Usage 2: Form-Integrated Switch with Label & Description
<FormSwitch
  label="Push Notifications"
  description="Receive instant alerts for user activities and system status."
  checked={switchNotifications}
  onCheckedChange={(val) => setSwitchNotifications(val)}
/>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-6">
          <div className="space-y-3 border-b border-border/40 pb-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Standalone Switch Sizes (size=&quot;sm&quot; | &quot;default&quot; | &quot;lg&quot;)
            </span>
            <div className="flex items-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <Switch size="sm" defaultChecked />
                <span className="text-xs font-semibold text-muted-foreground">Small</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch size="default" defaultChecked />
                <span className="text-xs font-semibold text-muted-foreground">Default</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch size="lg" defaultChecked />
                <span className="text-xs font-semibold text-muted-foreground">Large</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <Switch size="default" disabled defaultChecked />
                <span className="text-xs font-semibold text-muted-foreground">Disabled</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Form-Integrated Switches (`FormSwitch`)
            </span>
            <div className="space-y-3 pt-1">
              <FormSwitch
                label="Push Notifications"
                description="Receive real-time alerts when team members complete assigned tasks."
                checked={switchNotifications}
                onCheckedChange={(val) => setSwitchNotifications(Boolean(val))}
              />
              <div className="h-px bg-border/40" />
              <FormSwitch
                label="Dark Theme Preference"
                description="Automatically sync interface theme with system preferences."
                checked={switchDarkMode}
                onCheckedChange={(val) => setSwitchDarkMode(Boolean(val))}
              />
              <div className="h-px bg-border/40" />
              <FormSwitch
                label="Automatic Draft Autosave"
                description="Periodically save form inputs to local browser storage."
                checked={switchAutoSave}
                onCheckedChange={(val) => setSwitchAutoSave(Boolean(val))}
              />
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 19: TEXTAREA */}
      <DocSection
        title="19. Textarea Component"
        description="Komponen input teks beberapa baris (Textarea) dengan konfirmasi batas karakter (character count limit), opsi resizable, dan pembungkus FormTextarea."
        codeSnippet={`import { Textarea } from "@/components/ui/textarea";
import { FormTextarea } from "@/components/shared/form/form-textarea";

// Usage 1: Standalone UI Textarea with Character Limit
<Textarea
  placeholder="Enter notes..."
  maxLength={200}
  showCount
  value={val}
  onChange={(e) => setVal(e.target.value)}
/>

// Usage 2: Form-Integrated Textarea
<FormTextarea
  label="Project Biography"
  helperText="Brief summary of your project scope and objectives."
  placeholder="Write a description..."
  maxLength={300}
  showCount
  value={val}
  onChange={(e) => setVal(e.target.value)}
/>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standalone Textarea */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Standalone Textarea with Character Limit
              </span>
              <Textarea
                placeholder="Type your notes or comment..."
                maxLength={150}
                showCount
                value={textareaVal}
                onChange={(e) => setTextareaVal(e.target.value)}
              />
            </div>

            {/* FormTextarea */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Form-Integrated Textarea (`FormTextarea`)
              </span>
              <FormTextarea
                label="Organization Description"
                helperText="Provide a clear description of your team or project."
                placeholder="Write description..."
                maxLength={250}
                showCount
                value={textareaVal}
                onChange={(e) => setTextareaVal(e.target.value)}
              />
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 20: SKELETON & LOADING */}
      <DocSection
        title="20. Skeleton & Loading States"
        description="Komponen placeholder animasi (Skeleton) dengan preset shapes: teks, card, dan tabel."
        codeSnippet={`import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-40" />
<SkeletonText lines={3} />
<SkeletonCard />
<SkeletonTable rows={3} cols={4} />`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-6">
          <div className="space-y-3 border-b border-border/40 pb-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Basic Skeleton Shapes
            </span>
            <div className="flex items-center gap-4 pt-1">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1 max-w-xs">
                <Skeleton className="h-3.5 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-b border-border/40 pb-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              SkeletonText (lines=3)
            </span>
            <div className="max-w-md">
              <SkeletonText lines={3} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                SkeletonCard
              </span>
              <SkeletonCard />
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                SkeletonTable (rows=3, cols=4)
              </span>
              <SkeletonTable rows={3} cols={4} />
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 21: LABEL */}
      <DocSection
        title="21. Label Component"
        description="Komponen label form dengan variasi ukuran dan indikator required field."
        codeSnippet={`import { Label } from "@/components/ui/label";

<Label size="sm">Small Label</Label>
<Label size="default">Default Label</Label>
<Label size="lg">Large Label</Label>
<Label size="default" required>Required Field</Label>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60">
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-1">
              <Label size="sm">Small Label</Label>
              <div className="h-px bg-border/30 w-full" />
            </div>
            <div className="space-y-1">
              <Label size="default">Default Label</Label>
              <div className="h-px bg-border/30 w-full" />
            </div>
            <div className="space-y-1">
              <Label size="lg">Large Label</Label>
              <div className="h-px bg-border/30 w-full" />
            </div>
            <div className="space-y-1">
              <Label size="default" required>
                Required Field
              </Label>
              <div className="h-px bg-border/30 w-full" />
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 22: CHECKBOX */}
      <DocSection
        title="22. Checkbox Component"
        description="Komponen kotak centang (Checkbox) dengan label, description, ukuran varian, dan indeterminate state."
        codeSnippet={`import { Checkbox } from "@/components/ui/checkbox";

<Checkbox label="Accept terms" description="Agree to our Terms of Service." />
<Checkbox size="lg" label="Large Checkbox" defaultChecked />
<Checkbox indeterminate defaultChecked label="Indeterminate" />`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-5">
          <div className="space-y-3 border-b border-border/40 pb-5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Checkbox Sizes
            </span>
            <div className="flex items-center gap-8 pt-1">
              <Checkbox size="sm" defaultChecked label="Small" />
              <Checkbox size="default" defaultChecked label="Default" />
              <Checkbox size="lg" defaultChecked label="Large" />
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              With Description & States
            </span>
            <div className="space-y-4 pt-1 max-w-sm">
              <Checkbox
                label="Accept Terms of Service"
                description="You agree to our Terms of Service and Privacy Policy."
                defaultChecked
              />
              <Checkbox
                label="Subscribe to Newsletter"
                description="Receive weekly product updates and tips."
              />
              <Checkbox
                indeterminate
                defaultChecked
                label="Select All (Indeterminate)"
                description="Some child items are selected."
              />
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 23: RADIO BUTTON */}
      <DocSection
        title="23. Radio Button Component"
        description="Komponen Radio Button dalam RadioGroup dengan label, deskripsi, dan dukungan orientasi."
        codeSnippet={`import { RadioGroup, Radio } from "@/components/ui/radio";

<RadioGroup value={val} onValueChange={setVal}>
  <Radio value="compact" label="Compact" description="Smaller spacing." />
  <Radio value="comfortable" label="Comfortable" description="Default spacing." />
  <Radio value="spacious" label="Spacious" description="Larger spacing." />
</RadioGroup>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Vertical Layout (Default)
              </span>
              <RadioGroup value={radioVal} onValueChange={setRadioVal}>
                <Radio
                  value="compact"
                  label="Compact View"
                  description="Denser spacing for advanced users."
                />
                <Radio
                  value="comfortable"
                  label="Comfortable View"
                  description="Balanced spacing for everyday use."
                />
                <Radio
                  value="spacious"
                  label="Spacious View"
                  description="Extra breathing room between elements."
                />
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Horizontal Layout
              </span>
              <RadioGroup value={radioVal} onValueChange={setRadioVal} orientation="horizontal">
                <Radio value="compact" label="Compact" />
                <Radio value="comfortable" label="Comfortable" />
                <Radio value="spacious" label="Spacious" />
              </RadioGroup>
              <p className="text-[10px] text-muted-foreground font-semibold pt-2">
                Selected: <span className="text-primary font-bold capitalize">{radioVal}</span>
              </p>
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 24: SCROLL AREA */}
      <DocSection
        title="24. Scroll Area Component"
        description="Area scrollable dengan custom thin scrollbar yang elegan dan dukungan orientasi vertikal/horizontal."
        codeSnippet={`import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea maxHeight="200px">
  {longContent}
</ScrollArea>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Vertical Scroll (maxHeight=200px)
              </span>
              <ScrollArea maxHeight="200px" className="rounded-xl border border-border/40 p-3">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-border/20 last:border-b-0"
                  >
                    <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-xs font-semibold text-foreground/80">
                      List item #{i + 1} &mdash; Scrollable content row
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                Horizontal Scroll
              </span>
              <ScrollArea
                maxHeight="auto"
                orientation="horizontal"
                className="rounded-xl border border-border/40 p-3"
              >
                <div className="flex gap-3 w-max">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="shrink-0 h-24 w-32 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary"
                    >
                      Card {i + 1}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DocSection>

      {/* COMPONENT 26: RESPONSIVE GRID & FLEX LAYOUT */}
      <DocSection
        title="26. Responsive Grid & Flex Layout"
        description="Komponen layout Grid dan Flex yang auto-responsive tanpa perlu menulis breakpoint secara manual."
        codeSnippet={`import { Grid, Flex, VStack, HStack, Center, Spacer } from "@/components/ui/layout";

// Auto-responsive Grid (cols auto-scale across breakpoints)
<Grid cols={3} gap="md">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</Grid>

// Auto-fill Grid by minimum child width (CSS Grid auto-fill)
<Grid minChildWidth="200px" gap="md">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</Grid>

// Responsive Flex (column on mobile, row on desktop)
<Flex direction="responsive" gap="md" align="center">
  <div>Left</div>
  <div>Right</div>
</Flex>

// Vertical & Horizontal Stack shortcuts
<VStack gap="sm">{children}</VStack>
<HStack gap="md">{children}</HStack>

// Center utility
<Center className="h-40"><p>Centered Content</p></Center>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Grid cols=3 (auto-responsive: 1col mobile &rarr; 2col tablet &rarr; 3col desktop)
            </span>
            <Grid cols={3} gap="md">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-center text-sm font-bold text-primary"
                >
                  Grid Item {n}
                </div>
              ))}
            </Grid>
          </div>

          <div className="space-y-3 border-t border-border/40 pt-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Grid cols=4 (auto: 1 &rarr; 2 &rarr; 3 &rarr; 4 columns)
            </span>
            <Grid cols={4} gap="sm">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="rounded-xl bg-muted/50 border border-border/40 p-3 flex items-center justify-center text-xs font-bold text-muted-foreground"
                >
                  Item {n}
                </div>
              ))}
            </Grid>
          </div>

          <div className="space-y-3 border-t border-border/40 pt-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Grid minChildWidth=&quot;180px&quot; (CSS auto-fill, otomatis menyesuaikan kolom)
            </span>
            <Grid minChildWidth="180px" gap="md">
              {['Dashboard', 'Analytics', 'Reports', 'Settings', 'Users'].map((name) => (
                <div
                  key={name}
                  className="rounded-xl bg-card border border-border/60 p-4 shadow-2xs space-y-1"
                >
                  <p className="text-xs font-bold text-foreground">{name}</p>
                  <p className="text-[10px] text-muted-foreground">Auto-fill card</p>
                </div>
              ))}
            </Grid>
          </div>

          <div className="space-y-3 border-t border-border/40 pt-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Flex direction=&quot;responsive&quot; (column mobile &rarr; row desktop)
            </span>
            <Flex direction="responsive" gap="md" align="center">
              <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 p-4 text-xs font-bold text-primary text-center">
                Left Panel
              </div>
              <div className="flex-1 rounded-xl bg-muted/50 border border-border/40 p-4 text-xs font-bold text-muted-foreground text-center">
                Right Panel
              </div>
            </Flex>
          </div>

          <div className="space-y-3 border-t border-border/40 pt-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              VStack & HStack shortcuts
            </span>
            <Flex direction="responsive" gap="lg">
              <VStack gap="sm" className="flex-1">
                <span className="text-[10px] font-bold text-muted-foreground">
                  VStack (vertical)
                </span>
                {['Item A', 'Item B', 'Item C'].map((t) => (
                  <div
                    key={t}
                    className="rounded-lg bg-muted/40 border border-border/30 px-3 py-2 text-xs font-semibold text-foreground/80 w-full"
                  >
                    {t}
                  </div>
                ))}
              </VStack>
              <HStack gap="sm" className="flex-1 flex-wrap">
                <span className="text-[10px] font-bold text-muted-foreground w-full">
                  HStack (horizontal)
                </span>
                {['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4'].map((t) => (
                  <div
                    key={t}
                    className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-[10px] font-bold text-primary"
                  >
                    {t}
                  </div>
                ))}
              </HStack>
            </Flex>
          </div>

          <div className="space-y-3 border-t border-border/40 pt-6">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
              Center utility
            </span>
            <Center className="h-28 rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
              <p className="text-xs font-bold text-muted-foreground">Centered Content</p>
            </Center>
          </div>
        </div>
      </DocSection>

      <DocSection
        title="27. Aspect Ratio Component"
        description="Komponen pembungkus rasio aspek (Aspect Ratio) untuk menjaga proporsi konten secara konsisten di seluruh layar."
        codeSnippet={`import { AspectRatio } from "@/components/ui/aspect-ratio";

// Preset ratios
<AspectRatio ratio="video">   {/* 16/9 */}
<AspectRatio ratio="square">  {/* 1/1 */}
<AspectRatio ratio="photo">   {/* 4/3 */}
<AspectRatio ratio="portrait"> {/* 3/4 */}
<AspectRatio ratio="cinema">  {/* 21/9 */}

// Custom ratio
<AspectRatio ratio="5/2">
  <img src="..." className="object-cover w-full h-full" />
</AspectRatio>`}
      >
        <div className="p-6 rounded-2xl bg-card border border-border/60 space-y-6">
          <Grid cols={3} gap="md">
            {(['square', 'video', 'photo', 'portrait', 'cinema', 'tall'] as const).map((preset) => (
              <div key={preset} className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {preset} (
                  {preset === 'square'
                    ? '1/1'
                    : preset === 'video'
                      ? '16/9'
                      : preset === 'photo'
                        ? '4/3'
                        : preset === 'portrait'
                          ? '3/4'
                          : preset === 'cinema'
                            ? '21/9'
                            : '9/16'}
                  )
                </span>
                <AspectRatio
                  ratio={preset}
                  className="rounded-xl bg-linear-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary/60">{preset}</span>
                  </div>
                </AspectRatio>
              </div>
            ))}
          </Grid>
        </div>
      </DocSection>

      {/* 28. Progress Bar */}
      <DocSection
        title="28. Progress Bar Component"
        description="Flexible progress bar supporting size variants, color themes, value labels, and continuous loading animation."
        codeSnippet={`import { Progress } from '@/components/ui/progress';

{/* Standard Progress with Label & Percentage */}
<Progress value={65} showValue label="System Optimization" />

{/* Color Variants */}
<Progress value={80} variant="emerald" showValue label="Storage Used" />
<Progress value={45} variant="amber" showValue label="Memory Threshold" />
<Progress value={90} variant="rose" showValue label="CPU Warning" />
<Progress value={75} variant="gradient" showValue label="Download Progress" />

{/* Indeterminate Loading Bar */}
<Progress indeterminate variant="default" label="Syncing with server..." />`}
      >
        <div className="space-y-6 max-w-xl">
          <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/40">
            <Progress value={65} showValue label="System Optimization" />
            <Progress value={80} variant="emerald" showValue label="Storage Used" />
            <Progress value={45} variant="amber" showValue label="Memory Threshold" />
            <Progress value={90} variant="rose" showValue label="CPU Warning" />
            <Progress value={75} variant="gradient" showValue label="Download Progress" />
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
            <span className="text-xs font-bold text-foreground block">
              Indeterminate Loading Mode
            </span>
            <Progress indeterminate variant="default" label="Syncing data with cloud..." />
          </div>
        </div>
      </DocSection>
    </div>
  );
}

function DocSection({
  title,
  description,
  children,
  codeSnippet
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  codeSnippet: string;
}) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  return (
    <FadeIn className="rounded-xl border border-border/60 bg-card p-6 sm:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">{description}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 border border-border/40 shrink-0">
          <button
            onClick={() => setTab('preview')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'preview'
                ? 'bg-primary text-primary-foreground shadow-xs font-extrabold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setTab('code')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === 'code'
                ? 'bg-primary text-primary-foreground shadow-xs font-extrabold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>TypeScript Code</span>
          </button>
        </div>
      </div>

      {tab === 'preview' ? (
        <div className="pt-2">{children}</div>
      ) : (
        <CodeBlock
          code={codeSnippet}
          language="tsx"
          filename={`${title.split('.')[1]?.trim().split(' ')[0] || 'Component'}.tsx`}
        />
      )}
    </FadeIn>
  );
}
