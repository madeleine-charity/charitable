import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Show, SignInButton, UserButton } from "@clerk/react";
import { useAccount } from "@/lib/account";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Feed" },
  { href: "/browse", label: "Discover" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/for-nonprofits", label: "For Nonprofits" },
];

function AccountLinks({ onNavigate, className }: { onNavigate?: () => void; className: string }) {
  const { data: account } = useAccount();
  return (
    <>
      {account?.nonprofit && (
        <Link href="/nonprofit/dashboard" onClick={onNavigate} className={className} data-testid="link-dashboard">
          Dashboard
        </Link>
      )}
      {account?.isAdmin && (
        <Link href="/admin" onClick={onNavigate} className={className} data-testid="link-admin">
          Admin
        </Link>
      )}
    </>
  );
}

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">Charitable</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
              data-testid={`link-nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {link.label}
            </Link>
          ))}
          <Show when="signed-in">
            <AccountLinks className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary" />
          </Show>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" data-testid="button-sign-in">Sign in</Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Link href="/browse" className="hidden sm:block">
            <Button data-testid="button-start-donating">Start Donating</Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-medium transition-colors hover:text-primary py-2 ${
                  location === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
                data-testid={`link-mobile-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </Link>
            ))}
            <Show when="signed-in">
              <AccountLinks
                onNavigate={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2"
              />
            </Show>
            <Link href="/browse" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full mt-2" data-testid="button-mobile-start-donating">
                Start Donating
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
