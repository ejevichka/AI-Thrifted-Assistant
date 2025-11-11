"use client";

import { cn } from "@/utils/cn";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import Link from "next/link";

export const ActiveLink = (props: { href: string; children: ReactNode }) => {
  const pathname = usePathname();
  return (
    <Link
      href={props.href}
      className={cn(
        "px-6 py-3 whitespace-nowrap flex items-center gap-2 font-sans text-body-sm font-medium uppercase tracking-wider transition-all duration-400 ease-row border-b-1 border-transparent hover:border-row-black",
        pathname === props.href && "border-row-black text-row-black",
        pathname !== props.href && "text-row-gray-600"
      )}
    >
      {props.children}
    </Link>
  );
};
