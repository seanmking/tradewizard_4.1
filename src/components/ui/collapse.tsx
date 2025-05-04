import * as Accordion from '@radix-ui/react-accordion';
import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface CollapseProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
}

export function Collapse({
  children,
  type = 'single',
  collapsible = false,
  defaultValue,
}: CollapseProps) {
  return (
    <Accordion.Root
      type={type}
      collapsible={collapsible}
      defaultValue={defaultValue}
      className="space-y-2"
    >
      {children}
    </Accordion.Root>
  );
}

export interface CollapseItemProps {
  value: string;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function CollapseItem({
  value,
  header,
  children,
}: CollapseItemProps) {
  return (
    <Accordion.Item value={value} className="border rounded-lg overflow-hidden">
      <Accordion.Header>
        <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200">
          {header}
          <ChevronDown className="transition-transform data-[state=open]:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="px-4 py-2">
        {children}
      </Accordion.Content>
    </Accordion.Item>
  );
}
