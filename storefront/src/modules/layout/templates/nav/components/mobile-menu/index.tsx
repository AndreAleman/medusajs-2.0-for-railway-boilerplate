"use client"

import { useState } from "react"
import Link from "next/link"

interface MobileMenuProps {
  className?: string
}

export default function MobileMenu({ className = "" }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    { 
      label: "Shop", 
      href: "/categories",
      submenu: [
        { label: "Tubing", href: "/categories/tubing" },
        { label: "Valves", href: "/categories/valves" },
        { label: "Fittings", href: "/categories/fittings" },
        { label: "Industrial", href: "/categories/industrial" }
      ]
    },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "About Us", href: "/about" },
    { label: "Account", href: "/account" },
    { label: "Cart", href: "/cart" }
  ]

  return (
    <div className={className}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-36 left-0 right-0 bg-white border-t border-gray-100 z-50 max-h-[calc(100vh-144px)] overflow-y-auto">
            <nav className="py-6">
              {navigationItems.map((item) => (
                <div key={item.label} className="border-b border-gray-100 last:border-0">
                  <Link
                    href={item.href}
                    className="block px-6 py-4 text-lg font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Submenu for Shop */}
                  {item.submenu && (
                    <div className="bg-gray-50">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className="block px-12 py-3 text-base text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150"
                          onClick={() => setIsOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
