"use client";

import { ChevronDown } from "lucide-react";
import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

type FormSectionGroupContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  claimDefault: (id: string) => void;
};

const FormSectionGroupContext =
  createContext<FormSectionGroupContextValue | null>(null);

export function FormSectionGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const claimedDefault = useRef(false);

  return (
    <FormSectionGroupContext.Provider
      value={{
        openId,
        setOpenId,
        claimDefault: (id) => {
          if (claimedDefault.current) return;
          claimedDefault.current = true;
          setOpenId(id);
        },
      }}
    >
      <div className={cn("stagger-in space-y-3", className)}>{children}</div>
    </FormSectionGroupContext.Provider>
  );
}

type FormSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
};

export function FormSection({
  title,
  description,
  defaultOpen = false,
  children,
  columns = 2,
  className,
}: FormSectionProps) {
  const group = useContext(FormSectionGroupContext);
  const sectionId = useId();
  const panelId = `${sectionId}-panel`;
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const open = group ? group.openId === sectionId : localOpen;

  useLayoutEffect(() => {
    if (group && defaultOpen) group.claimDefault(sectionId);
  }, [group, defaultOpen, sectionId]);

  function toggle() {
    if (group) {
      group.setOpenId(open ? null : sectionId);
      return;
    }
    setLocalOpen((current) => !current);
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm transition-[box-shadow,border-color] duration-300 ease-out",
        open && "border-border shadow-md",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 space-y-0.5">
          <p className="font-semibold tracking-tight text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "border-t border-border px-4 pb-4 pt-4 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
              open
                ? "translate-y-0 opacity-100 delay-75"
                : "-translate-y-1 opacity-0 delay-0",
            )}
          >
            <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
