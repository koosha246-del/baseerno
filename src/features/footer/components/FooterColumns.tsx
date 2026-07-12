import { footerLinkGroups } from "../constants";
import { cn } from "@/lib/utils";

/**
 * FooterColumns — the 3-column link grid in the footer.
 */
export function FooterColumns({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-8 sm:grid-cols-3", className)}>
      {footerLinkGroups.map((group) => (
        <div key={group.id} className="flex flex-col gap-3">
          <h3 className="font-display text-sm font-bold text-fg-primary">
            {group.title}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-fg-secondary transition-colors duration-base ease-luxury hover:text-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
