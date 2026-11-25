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
import { AccountioLogo, AiMunshiMascot } from "@/components/common/BrandAssets";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { GlobalSearchModal } from "@/components/layout/GlobalSearchModal";
import { Badge, Button } from "@/components/ui/primitives";
import { useDictionary } from "@/hooks/useDictionary";
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

  if (!session.isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-e border-[var(--border-default)] bg-[var(--bg-card)] transition-all duration-200 sticky top-0 h-screen z-30 no-print",
          sidebarCollapsed ? "w-[74px]" : "w-[236px]"
        )}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border-default)]">
          <Link href="/app/overview" aria-label="Accountio AI Home">
            <AccountioLogo collapsed={sidebarCollapsed} />
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            {sidebarCollapsed ? (
              isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--brand-primary)] text-white shadow-xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border-default)] space-y-2">
          {!sidebarCollapsed && (
            <div className="rounded-xl bg-[var(--brand-cream)] border border-[var(--border-default)] px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--brand-primary)]">
                  {t.app.demoMode}
                </span>
                <span className="h-2 w-2 rounded-full bg-[var(--status-success)]" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                Local IndexedDB Active
              </p>
            </div>
          )}
          <Link
            href="/app/settings/help"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Help & Support</span>}
          </Link>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 sticky top-0 z-20 bg-[var(--bg-card)]/95 backdrop-blur border-b border-[var(--border-default)] px-3 sm:px-6 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Book Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setBookMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-subtle)] text-xs sm:text-sm font-medium max-w-[210px] sm:max-w-[260px] cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-[var(--brand-primary)] shrink-0" />
                <span className="truncate">{activeBook?.name ?? "Select Book"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              </button>

              {bookMenuOpen && (
                <div className="absolute start-0 mt-1.5 w-64 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-md)] p-1.5 z-50">
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
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs cursor-pointer",
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
                </div>
              )}
            </div>

            <span
              className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)]"
              title="Simulated WhatsApp status in demo mode"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success)]" />
              {session.whatsappConnected ? t.app.whatsappConnected : t.app.whatsappDisconnected}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Global Search Trigger */}
            <button
              type="button"
              onClick={() => setGlobalSearchOpen(true)}
              aria-label="Global search"
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] hover:bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)] cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">{t.topbar.searchPlaceholder}</span>
              <kbd className="hidden xl:inline px-1.5 py-0.5 text-[10px] rounded bg-[var(--bg-subtle)] border border-[var(--border-default)]">
                Ctrl+K
              </kbd>
            </button>

            {/* Compact Global AI Munshi Launcher */}
            <Button
              size="sm"
              onClick={() => openMunshiDrawer()}
              className="hidden sm:inline-flex"
            >
              <AiMunshiMascot size={18} />
              <span>{t.topbar.askMunshi}</span>
            </Button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute end-0 mt-1.5 w-80 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-md)] p-3 z-50">
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
                          "block p-2 rounded-xl text-xs hover:bg-[var(--bg-subtle)]",
                          !n.read && "bg-[var(--brand-cream)]"
                        )}
                      >
                        <p className="font-semibold text-[var(--text-primary)]">{n.title}</p>
                        <p className="text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "ur" : "en")}
              aria-label="Switch language"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[var(--border-default)] hover:bg-[var(--bg-subtle)] text-xs font-medium cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <span>{locale === "en" ? "English" : "اردو"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* User Avatar */}
            <div className="relative">
              <button
                type="button"
                aria-label="User menu"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="h-8.5 w-8.5 rounded-full bg-[var(--brand-primary)] text-white text-xs font-bold flex items-center justify-center cursor-pointer"
              >
                {session.userName.slice(0, 1).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="absolute end-0 mt-1.5 w-56 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-card)] shadow-[var(--shadow-md)] p-2 z-50 text-xs">
                  <div className="px-2.5 py-2 border-b border-[var(--border-default)] mb-1">
                    <p className="font-semibold truncate">{session.userName}</p>
                    <p className="text-[var(--text-secondary)] capitalize">Role: {session.role}</p>
                  </div>
                  <Link
                    href="/app/settings/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-2.5 py-2 rounded-xl hover:bg-[var(--bg-subtle)]"
                  >
                    Profile & Account
                  </Link>
                  <Link
                    href="/app/settings/subscription"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-2.5 py-2 rounded-xl hover:bg-[var(--bg-subtle)]"
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
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] cursor-pointer mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t.topbar.logout}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 p-3 sm:p-6 pb-24 md:pb-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--bg-card)] border-t border-[var(--border-default)] flex items-center justify-around py-1.5 px-1 no-print"
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
                "flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-[10px] font-medium",
                active ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Slide-out Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[var(--bg-card)] h-full p-4 flex flex-col z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)]">
              <AccountioLogo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)]"
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
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
          </div>
        </div>
      )}

      {/* Global AI Munshi Contextual Drawer */}
      {munshiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/35" onClick={closeMunshiDrawer} />
          <div className="relative w-full max-w-md h-full bg-[var(--bg-app)] border-s border-[var(--border-default)] shadow-xl z-10 flex flex-col p-3">
            <div className="flex items-center justify-between mb-2 px-1">
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
            <div className="flex-1 min-h-0">
              <ChatInterface key={munshiContextPrompt ?? "drawer"} compact initialPrompt={munshiContextPrompt} />
            </div>
          </div>
        </div>
      )}

      <GlobalSearchModal />
    </div>
  );
}
