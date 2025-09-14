"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"

const navigationItems = [
  { 
    label: "Shop", 
    href: "/store",
    submenu: [
      { 
        label: "Tubing", 
        href: "/categories/tubing",
        submenu: [
          { label: "Short Tubes", href: "/categories/tubing/short-tubes" },
          { label: "Long Tubes", href: "/categories/tubing/long-tubes" },
          { label: "Flexible Tubes", href: "/categories/tubing/flexible-tubes" }
        ]
      },
      { 
        label: "Valves", 
        href: "/categories/valves",
        submenu: [
          { label: "Ball Valves", href: "/categories/valves/ball-valves" },
          { label: "Gate Valves", href: "/categories/valves/gate-valves" }
        ]
      },
      { 
        label: "Fittings", 
        href: "/categories/fittings",
        submenu: [
          { label: "Steel Fittings", href: "/categories/fittings/steel-fittings" },
          { label: "Brass Fittings", href: "/categories/fittings/brass-fittings" }
        ]
      },
      { 
        label: "Industrial", 
        href: "/categories/industrial"
        // No submenu for this one
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
  
  // Timeout refs for delays
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
      if (subDropdownTimeoutRef.current) clearTimeout(subDropdownTimeoutRef.current)
    }
  }, [])

  const handleMainMenuEnter = (itemLabel: string) => {
    // Clear any pending timeouts
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    if (subDropdownTimeoutRef.current) {
      clearTimeout(subDropdownTimeoutRef.current)
      subDropdownTimeoutRef.current = null
    }
    setActiveDropdown(itemLabel)
  }

  const handleMainMenuLeave = () => {
    // Set timeout to close all dropdowns after 500ms
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
      setActiveSubDropdown(null)
    }, 500)
  }

  const handleSubMenuEnter = (subItemLabel: string) => {
    // Clear any pending close timeout
    if (subDropdownTimeoutRef.current) {
      clearTimeout(subDropdownTimeoutRef.current)
      subDropdownTimeoutRef.current = null
    }
    setActiveSubDropdown(subItemLabel)
  }

  const handleSubMenuLeave = () => {
    // Set timeout to close sub-dropdown after 400ms
    subDropdownTimeoutRef.current = setTimeout(() => {
      setActiveSubDropdown(null)
    }, 400)
  }

  const handleDropdownContainerEnter = () => {
    // Clear timeouts when entering dropdown area
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    if (subDropdownTimeoutRef.current) {
      clearTimeout(subDropdownTimeoutRef.current)
      subDropdownTimeoutRef.current = null
    }
  }

  return (
    <nav className={`flex items-center space-x-8 ${className}`}>
      {navigationItems.map((item) => (
        <div 
          key={item.label}
          className="relative group"
          onMouseEnter={() => item.submenu && handleMainMenuEnter(item.label)}
          onMouseLeave={() => item.submenu && handleMainMenuLeave()}
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
          
          {/* First Level Dropdown - Direct categories */}
          {item.submenu && activeDropdown === item.label && (
            <div 
              className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 transition-all duration-200 ease-in-out"
              onMouseEnter={handleDropdownContainerEnter}
              onMouseLeave={handleMainMenuLeave}
            >
              {item.submenu.map((subItem) => (
                <div
                  key={subItem.label}
                  className="relative"
                  onMouseEnter={() => subItem.submenu && handleSubMenuEnter(subItem.label)}
                  onMouseLeave={() => subItem.submenu && handleSubMenuLeave()}
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
                  
                  {/* Second Level Dropdown - Sub-categories */}
                  {subItem.submenu && activeSubDropdown === subItem.label && (
                    <div 
                      className="absolute top-0 left-full ml-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 transition-all duration-200 ease-in-out"
                      onMouseEnter={() => handleSubMenuEnter(subItem.label)}
                      onMouseLeave={handleSubMenuLeave}
                    >
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
