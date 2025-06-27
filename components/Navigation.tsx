"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, FileText, Plus, User } from "lucide-react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";

export default function Navigation() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/cases", label: "Cases", icon: Briefcase },
    { href: "/cases/new", label: "New Case", icon: Plus },
  ];

  return (
    <nav className="bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8" />
              <span className="font-bold text-xl">Chrono</span>
            </Link>
            
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        px-3 py-2 rounded-md text-sm font-medium
                        flex items-center space-x-2
                        transition-colors duration-200
                        ${
                          isActive
                            ? "bg-gray-800 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                <span className="text-sm text-gray-300">{user.emailAddresses[0]?.emailAddress}</span>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors">
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}