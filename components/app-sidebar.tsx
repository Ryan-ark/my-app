"use client"

import * as React from "react"
import {
  Fish,
  GalleryVerticalEnd,
  LayoutDashboard,
  Sparkles
} from "lucide-react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useEffect, useState, useMemo } from "react"

// Teams data
const teams = [
  {
    name: "AquaLink",
    logo: GalleryVerticalEnd,
    plan: "Monitoring",
  }
]

// Base navigation data
const baseNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    items: [
      {
        title: "Sensor Overview",
        url: "/dashboard",
      }
    ],
  },
  {
    title: "AI Assistant",
    url: "/ai-assistant",
    icon: Sparkles,
    items: [
      {
        title: "Aqua Intelligence",
        url: "/ai-assistant",
      }
    ],
  },
  {
    title: "Feed Fish",
    url: "/feed-fish",
    icon: Fish,
    items: [
      {
        title: "Feeding Schedule",
        url: "/feed-fish",
      }
    ],
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isMobile, setIsMobile] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()
  
  // Default user data for loading state
  const userData = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "Loading...",
    avatar: session?.user?.image
  }
  
  // Generate nav items with dynamic active state based on current path
  const navItems = useMemo(() => {
    return baseNavItems.map(item => ({
      ...item,
      isActive: pathname.startsWith(item.url)
    }))
  }, [pathname])
  
  useEffect(() => {
    // Check if window is defined (for SSR)
    if (typeof window !== "undefined") {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 1024)
      }
      
      // Initial check
      checkIsMobile()
      
      // Add event listener
      window.addEventListener("resize", checkIsMobile)
      
      // Clean up
      return () => window.removeEventListener("resize", checkIsMobile)
    }
  }, [])
  
  return (
    <Sidebar 
      collapsible={isMobile ? "offcanvas" : "icon"}
      className="shadow-sm"
      {...props}
    >
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
