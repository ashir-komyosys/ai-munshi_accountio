"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Package,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { AccountioLogo, AiMunshiMascot } from "@/components/common/BrandAssets";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { AnimatedDrawer } from "@/components/motion/AnimatedDrawer";
import { AnimatedDropdown } from "@/components/motion/AnimatedDropdown";
import { AnimatedPage } from "@/components/motion/AnimatedPage";
import { SlidingIndicator } from "@/components/motion/SlidingIndicator";
import { Badge, Button } from "@/components/ui/primitives";
import { useDictionary } from "@/hooks/useDictionary";
import { snappySpring } from "@/lib/motion/transitions";
import { cn } from "@/lib/utils";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, locale, isRtl } = useDictionary();

  const {
    theme,
    sidebarCollapsed,
    mobileNavOpen,
    munshiDrawerOpen,
    munshiContextPrompt,
    activeBookId,
    session,
    setLocale,
    setTheme,
    toggleSidebar,
    setMobileNavOpen,
    setGlobalSearchOpen,
    openMunshiDrawer,
    closeMunshiDrawer,
    setActiveBookId,
    logout,
  } = useUIStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bookMenuOpen, setBookMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const reduced = useReducedMotion();

  // Frontend demo route guard
  useEffect(() => {
    if (!session.isAuthenticated) {
      router.replace("/login");
    }
  }, [session.isAuthenticated, router]);

  const { data: books = [] } = useQuery({
    queryKey: ["books"],
    queryFn: () => services.books.listBooks(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", activeBookId],
    queryFn: () => services.notifications.listNotifications(activeBookId),
  });

  const markAllRead = useMutation({
    mutationFn: () => services.notifications.markAllRead(activeBookId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", activeBookId] }),
  });

  const activeBook = books.find((b) => b.id === activeBookId) ?? books[0];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { href: "/app/overview", label: t.nav.overview, icon: LayoutDashboard },
    { href: "/app/munshi", label: t.nav.munshi, icon: MessageSquare },
    { href: "/app/books", label: t.nav.books, icon: BookOpen },
    { href: "/app/khatas", label: t.nav.khatas, icon: Users },
    { href: "/app/transactions", label: t.nav.transactions, icon: ArrowLeftRight },
    { href: "/app/inventory", label: t.nav.inventory, icon: Package },
    { href: "/app/cash-bank", label: t.nav.cashBank, icon: Landmark },
    { href: "/app/reports", label: t.nav.reports, icon: BarChart3 },
    { href: "/app/documents", label: t.nav.documents, icon: FileText },
    { href: "/app/settings", label: t.nav.settings, icon: Settings },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const isMunshiRoute = pathname === "/app/munshi";

  if (!session.isAuthenticated) return null;

  return (
    <div
      className={cn(
        "flex bg-[var(--bg-app)] text-[var(--text-primary)]",
        isMunshiRoute ? "h-dvh overflow-hidden" : "min-h-screen"
      )}
    >
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 68 : 216 }}
        transition={reduced ? { duration: 0 } : snappySpring}
        className="hidden md:flex flex-col shrink-0 border-e border-[var(--border-default)] bg-[var(--bg-card)] sticky top-0 h-dvh z-30 no-print overflow-hidden"
      >
        <div className="h-14 px-3.5 flex items-center justify-between border-b border-[var(--border-default)] shrink-0">
          <Link href="/app/overview" aria-label="Accountio AI Home" className="min-w-0">
            <AccountioLogo collapsed={sidebarCollapsed} />
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer shrink-0 transition-colors"
          >
            {sidebarCollapsed ? (
              isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <LayoutGroup id="desktop-sidebar-nav">
          <nav
            onMouseLeave={() => setHoveredNav(null)}
            className="sidebar-scrollbar flex-1 min-h-0 min-w-0 overflow-y-scroll overflow-x-hidden overscroll-contain p-2 space-y-0.5"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isHovered = hoveredNav === item.href && !active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  onMouseEnter={() => setHoveredNav(item.href)}
                  onFocus={() => setHoveredNav(item.href)}
                  onBlur={() => setHoveredNav(null)}
                  className={cn(
                    "relative flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap",
                    active
                      ? "text-white"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                >
                  {isHovered && (
                    <SlidingIndicator
                      layoutId="sidebar-hover-pill"
                      className="bg-[var(--brand-cream)] border border-[var(--border-default)]/70"
                    />
                  )}
                  {active && (
                    <SlidingIndicator
                      layoutId="sidebar-active-pill"
                      className="bg-[var(--brand-primary)] shadow-xs"
                    />
                  )}
                  <Icon className="relative z-10 h-[17px] w-[17px] shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="relative z-10 truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </LayoutGroup>

        <div className="p-2.5 border-t border-[var(--border-default)] space-y-1.5 shrink-0">
          {!sidebarCollapsed && (
            <div className="rounded-xl bg-[var(--brand-cream)] border border-[var(--border-default)] px-2.5 py-1.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-[var(--brand-primary)] block leading-tight">
                  {t.app.demoMode}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] block truncate">
                  Local IndexedDB
                </span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[var(--status-success)] shrink-0" />
            </div>
          )}
          <Link
            href="/app/settings/help"
            title={sidebarCollapsed ? "Help & Support" : undefined}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] whitespace-nowrap",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Help & Support</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top Navbar */}
        <header className="h-14 shrink-0 sticky top-0 z-20 bg-[var(--bg-card)]/95 backdrop-blur border-b border-[var(--border-default)] px-2.5 sm:px-5 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-1.5 rounded-xl hover:bg-[var(--bg-subtle)] cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Book Switcher */}
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => setBookMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-subtle)] text-xs sm:text-[13px] font-medium max-w-[155px] sm:max-w-[240px] whitespace-nowrap cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--brand-primary)] shrink-0" />
                <span className="truncate">{activeBook?.name ?? "Select Book"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              </button>

              <AnimatedDropdown
                open={bookMenuOpen}
                align="start"
                className="absolute start-0 mt-1.5 w-64 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-md)] p-1.5 z-50"
              >
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Switch Accounting Book
                </p>
                {books.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setActiveBookId(b.id);
                      setBookMenuOpen(false);
                      queryClient.invalidateQueries();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs cursor-pointer transition-colors",
                      b.id === activeBookId
                        ? "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-semibold"
                        : "hover:bg-[var(--bg-subtle)]"
                    )}
                  >
                    <span className="truncate">{b.name}</span>
                    <Badge tone={b.status === "active" ? "success" : "neutral"}>
                      {b.status}
                    </Badge>
                  </button>
                ))}
                <div className="border-t border-[var(--border-default)] mt-1 pt-1">
                  <Link
                    href="/app/books"
                    onClick={() => setBookMenuOpen(false)}
                    className="block px-2.5 py-1.5 text-xs font-medium text-[var(--brand-primary)] hover:underline"
                  >
                    Manage all books →
                  </Link>
                </div>
              </AnimatedDropdown>
            </div>

            <span
              className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] whitespace-nowrap shrink-0"
              title="Simulated WhatsApp status in demo mode"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success)] shrink-0" />
              {session.whatsappConnected ? t.app.whatsappConnected : t.app.whatsappDisconnected}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Global Search Trigger */}
            <button
              type="button"
              onClick={() => setGlobalSearchOpen(true)}
              aria-label="Global search"
              className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)] whitespace-nowrap cursor-pointer shrink-0"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">{t.topbar.searchPlaceholder}</span>
              <kbd className="hidden xl:inline px-1.5 py-0.5 text-[10px] rounded bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                Ctrl+K
              </kbd>
            </button>

            {/* Compact Global AI Munshi Launcher — hidden when already on /app/munshi */}
            {!isMunshiRoute && (
              <Button
                size="sm"
                onClick={() => openMunshiDrawer()}
                className="hidden sm:inline-flex whitespace-nowrap shrink-0"
              >
                <AiMunshiMascot size={18} />
                <span>{t.topbar.askMunshi}</span>
              </Button>
            )}

            {/* Notifications */}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-1.5 sm:p-2 rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] cursor-pointer"
              >
                <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                )}
              </button>
              <AnimatedDropdown
                open={notifOpen}
                align="end"
                className="absolute end-0 mt-1.5 w-80 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-md)] p-3 z-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">{t.topbar.notifications}</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllRead.mutate()}
                      className="text-[11px] text-[var(--brand-primary)] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href ?? "/app/overview"}
                      onClick={() => {
                        services.notifications.markAsRead(n.id);
                        setNotifOpen(false);
                      }}
                      className={cn(
                        "block p-2 rounded-xl text-xs hover:bg-[var(--bg-subtle)] transition-colors",
                        !n.read && "bg-[var(--brand-cream)]"
                      )}
                    >
                      <p className="font-semibold text-[var(--text-primary)]">{n.title}</p>
                      <p className="text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                    </Link>
                  ))}
                </div>
              </AnimatedDropdown>
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "ur" : "en")}
              aria-label="Switch language"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-subtle)] text-xs font-medium whitespace-nowrap cursor-pointer shrink-0"
            >
              <Globe className="h-3.5 w-3.5 text-[var(--text-secondary)] shrink-0" />
              <span className="hidden sm:inline">{locale === "en" ? "English" : "اردو"}</span>
              <span className="sm:hidden">{locale === "en" ? "EN" : "اردو"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] cursor-pointer shrink-0"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 sm:h-4.5 sm:w-4.5" /> : <Moon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />}
            </button>

            {/* User Avatar */}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="User menu"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="h-8 w-8 rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                {session.userName.slice(0, 1).toUpperCase()}
              </button>
              <AnimatedDropdown
                open={userMenuOpen}
                align="end"
                className="absolute end-0 mt-1.5 w-56 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-md)] p-2 z-50 text-xs"
              >
                <div className="px-2.5 py-2 border-b border-[var(--border-default)] mb-1">
                  <p className="font-semibold truncate">{session.userName}</p>
                  <p className="text-[var(--text-secondary)] capitalize">Role: {session.role}</p>
                </div>
                <Link
                  href="/app/settings/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-2.5 py-2 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Profile & Account
                </Link>
                <Link
                  href="/app/settings/subscription"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-2.5 py-2 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Subscription & Billing
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] cursor-pointer mt-1 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t.topbar.logout}</span>
                </button>
              </AnimatedDropdown>
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main
          className={cn(
            "flex-1 max-w-[1440px] w-full mx-auto",
            isMunshiRoute
              ? "min-h-0 flex flex-col p-2 sm:p-3.5 pb-[calc(3.5rem+0.5rem)] md:pb-3.5 overflow-hidden"
              : "p-3 sm:p-6 pb-24 md:pb-8"
          )}
        >
          <AnimatedPage
            key={pathname}
            className={isMunshiRoute ? "flex-1 min-h-0 flex flex-col" : undefined}
          >
            {children}
          </AnimatedPage>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <LayoutGroup id="mobile-bottom-nav">
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-[var(--bg-card)] border-t border-[var(--border-default)] flex items-center justify-around px-1 no-print"
        >
          {[
            { href: "/app/overview", label: t.nav.overview, icon: LayoutDashboard },
            { href: "/app/munshi", label: t.nav.munshi, icon: MessageSquare },
            { href: "/app/khatas", label: t.nav.khatas, icon: Users },
            { href: "/app/transactions", label: "Entries", icon: ArrowLeftRight },
            { href: "/app/reports", label: t.nav.reports, icon: BarChart3 },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-medium transition-colors",
                  active ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"
                )}
              >
                {active && (
                  <SlidingIndicator
                    layoutId="mobile-nav-active-pill"
                    className="bg-[var(--brand-primary-soft)]"
                  />
                )}
                <Icon className="relative z-10 h-4.5 w-4.5" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      {/* Mobile Slide-out Drawer */}
      <AnimatedDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        side="start"
        isRtl={isRtl}
        className="md:hidden w-72 max-w-[85vw] bg-[var(--bg-card)] p-4 shadow-xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
          <AccountioLogo />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </AnimatedDrawer>

      {/* Global AI Munshi Contextual Drawer */}
      <AnimatedDrawer
        open={munshiDrawerOpen}
        onClose={closeMunshiDrawer}
        side="end"
        isRtl={isRtl}
        className="w-full max-w-md bg-[var(--bg-app)] border-s border-[var(--border-default)] shadow-xl p-3"
      >
        <div className="flex items-center justify-between mb-2 px-1 shrink-0">
          <span className="font-heading text-sm font-bold">Ask AI Munshi</span>
          <button
            type="button"
            aria-label="Close AI Munshi drawer"
            onClick={closeMunshiDrawer}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatInterface key={munshiContextPrompt ?? "drawer"} compact initialPrompt={munshiContextPrompt} />
        </div>
      </AnimatedDrawer>

      <GlobalSearchModal />
    </div>
  );
}
