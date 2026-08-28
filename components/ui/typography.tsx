'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const typographyVariants = cva('text-foreground font-sans transition-colors', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl leading-tight sm:leading-tight md:leading-none text-foreground',
      h2: 'scroll-m-20 text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl leading-snug sm:leading-tight text-foreground transition-colors first:mt-0',
      h3: 'scroll-m-20 text-lg font-bold tracking-tight sm:text-xl md:text-2xl lg:text-3xl leading-snug text-foreground',
      h4: 'scroll-m-20 text-base font-bold tracking-tight sm:text-lg md:text-xl text-foreground',
      p: 'text-xs sm:text-sm md:text-base leading-relaxed font-normal text-foreground/90',
      lead: 'text-sm sm:text-base md:text-lg lg:text-xl font-medium text-muted-foreground leading-relaxed sm:leading-relaxed',
      large: 'text-sm sm:text-base md:text-lg font-bold text-foreground',
      small: 'text-[11px] sm:text-xs md:text-sm font-semibold text-muted-foreground leading-none',
      muted: 'text-[11px] sm:text-xs md:text-sm text-muted-foreground font-normal',
      blockquote:
        'border-l-2 sm:border-l-4 border-primary pl-3 sm:pl-4 italic text-xs sm:text-sm md:text-base text-muted-foreground font-medium',
      code: 'relative rounded-md bg-muted/80 px-[0.35rem] py-[0.15rem] font-mono text-[10px] sm:text-xs md:text-sm font-semibold text-foreground border border-border/50'
    }
  },
  defaultVariants: {
    variant: 'p'
  }
});

type ElementType = keyof React.JSX.IntrinsicElements;

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof typographyVariants> {
  as?: ElementType;
}

const defaultElementMap: Record<
  NonNullable<VariantProps<typeof typographyVariants>['variant']>,
  ElementType
> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  p: 'p',
  lead: 'p',
  large: 'p',
  small: 'small',
  muted: 'p',
  blockquote: 'blockquote',
  code: 'code'
};

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = 'p', as, children, ...props }, ref) => {
    const Component = (as ||
      (variant ? defaultElementMap[variant] : 'p') ||
      'p') as React.ElementType;

    return (
      <Component ref={ref} className={cn(typographyVariants({ variant }), className)} {...props}>
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';

export function TypographyH1(props: TypographyProps) {
  return <Typography variant="h1" {...props} />;
}

export function TypographyH2(props: TypographyProps) {
  return <Typography variant="h2" {...props} />;
}

export function TypographyH3(props: TypographyProps) {
  return <Typography variant="h3" {...props} />;
}

export function TypographyH4(props: TypographyProps) {
  return <Typography variant="h4" {...props} />;
}

export function TypographyP(props: TypographyProps) {
  return <Typography variant="p" {...props} />;
}

export function TypographyLead(props: TypographyProps) {
  return <Typography variant="lead" {...props} />;
}

export function TypographyLarge(props: TypographyProps) {
  return <Typography variant="large" {...props} />;
}

export function TypographySmall(props: TypographyProps) {
  return <Typography variant="small" {...props} />;
}

export function TypographyMuted(props: TypographyProps) {
  return <Typography variant="muted" {...props} />;
}

export function TypographyBlockquote(props: TypographyProps) {
  return <Typography variant="blockquote" {...props} />;
}

export function TypographyCode(props: TypographyProps) {
  return <Typography variant="code" {...props} />;
}
