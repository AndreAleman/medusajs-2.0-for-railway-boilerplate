"use client"

import Link from "next/link"
import { useState, useRef } from "react"

const navigationItems = [
  { 
    label: "Shop", 
    href: "/store",
    submenu: [
      { 
        label: "Categories", 
        href: "/categories",
        submenu: [
          { label: "Tubing", href: "/categories/tubing" },
          { label: "Valves", href: "/categories/valves" },
          { label: "Fittings", href: "/categories/fittings" },
          { label: "Industrial", href: "/categories/industrial" }
        ]
      }
    ]
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "About Us", href: "/about" }
]

interface NavigationProps {
  className?: string
}

export default function NavigationMenu({ className = "" }: NavigationProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = (itemLabel: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setActiveDropdown(itemLabel)
  }

  const handleMouseLeave = () => {
    // Add delay before hiding dropdown
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
      setActiveSubDropdown(null)
    }, 200) // 200ms delay
  }

  const handleDropdownEnter = () => {
    // Clear timeout when entering dropdown
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  return (
    <nav className={`flex items-center space-x-8 ${className}`}>
      {navigationItems.map((item) => (
        <div 
          key={item.label}
          className="relative group"
          onMouseEnter={() => item.submenu && handleMouseEnter(item.label)}
          onMouseLeave={handleMouseLeave}
        >
          <Link
            href={item.href}
            className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2"
          >
            <span>{item.label}</span>
            {item.submenu && (
              <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </Link>
          
          {/* First Level Dropdown */}
          {item.submenu && activeDropdown === item.label && (
            <div 
              className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleMouseLeave}
            >
              {item.submenu.map((subItem) => (
                <div
                  key={subItem.label}
                  className="relative"
                  onMouseEnter={() => subItem.submenu && setActiveSubDropdown(subItem.label)}
                  onMouseLeave={() => !subItem.submenu && setActiveSubDropdown(null)}
                >
                  <Link
                    href={subItem.href}
                    className="flex items-center justify-between px-4 py-2 text-base text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                  >
                    <span>{subItem.label}</span>
                    {subItem.submenu && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                  </Link>
                  
                  {/* Second Level Dropdown (Sub-categories) */}
                  {subItem.submenu && activeSubDropdown === subItem.label && (
                    <div className="absolute top-0 left-full ml-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                      {subItem.submenu.map((subSubItem) => (
                        <Link
                          key={subSubItem.label}
                          href={subSubItem.href}
                          className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                        >
                          {subSubItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
