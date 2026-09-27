import { Link } from "wouter";
import { Lock, Shield } from "lucide-react";
import { BrandLogo } from "./brand-logo";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo className="h-8 w-8" />
              <span className="text-lg font-semibold">Charitable</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Making philanthropy simple, transparent, and accessible for everyone.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Donors</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/browse" className="hover:text-foreground transition-colors">
                  Browse Nonprofits
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Nonprofits</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/for-nonprofits" className="hover:text-foreground transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/nonprofit/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Trust & Security</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Secured by Stripe</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>100% goes to nonprofits</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Charitable. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
