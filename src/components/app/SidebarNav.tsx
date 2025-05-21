'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarNavProps {
  items: NavItem[];
  pathname: string | null;
  isCollapsed?: boolean;
  isMobile?: boolean;
}

export function SidebarNav({ items, pathname, isCollapsed, isMobile = false }: SidebarNavProps) {
  if (!items?.length) {
    return null;
  }

  return (
    <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4", isMobile && "px-4")}>
      <TooltipProvider delayDuration={0}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = item.href === pathname || (item.isActive && item.isActive(pathname || ''));

        const linkContent = (
          <>
            <Icon className={cn("h-4 w-4", isCollapsed && "h-5 w-5")} />
            <span className={cn(isCollapsed && "sr-only", isMobile && "text-base")}>{item.title}</span>
            {item.label && (
              <span className={cn("ml-auto", isCollapsed && "hidden", isActive && "text-primary-foreground")}>
                {item.label}
              </span>
            )}
          </>
        );

        const linkClasses = cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent",
          isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground",
          item.disabled && "cursor-not-allowed opacity-80",
          isCollapsed && "justify-center",
          isMobile && "py-3 text-base"
        );

        if (isCollapsed && !isMobile) {
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Link
                  href={item.disabled ? "#" : item.href}
                  className={linkClasses}
                  aria-disabled={item.disabled}
                >
                  {linkContent}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover text-popover-foreground">
                {item.title}
              </TooltipContent>
            </Tooltip>
          );
        }

        return (
          <Link
            key={index}
            href={item.disabled ? "#" : item.href}
            className={linkClasses}
            aria-disabled={item.disabled}
          >
            {linkContent}
          </Link>
        );
      })}
      </TooltipProvider>
    </nav>
  );
}
