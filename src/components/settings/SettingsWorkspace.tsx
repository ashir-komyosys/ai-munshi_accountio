"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  Check,
  Copy,
  CreditCard,
  Database,
  Globe,
  HelpCircle,
  Lock,
  MessageCircle,
  Palette,
  RefreshCw,
  Shield,
  Sparkles,
  User as UserIcon,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/StatusStates";
import { Badge, Button, Card, Input, Modal, Select } from "@/components/ui/primitives";
import { resetDemoDatabase } from "@/database/seed";
import { formatPKR } from "@/lib/money";
import { services } from "@/services";
import { useUIStore } from "@/stores/uiStore";
import type { UserRole } from "@/types";

export type SettingsSection =
  | "business"
  | "profile"
  | "whatsapp"
  | "language"
  | "appearance"
  | "notifications"
  | "users"
  | "security"
  | "subscription"
  | "billing"
  | "help";

const SETTINGS_NAV: Array<{
  key: SettingsSection;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "business", href: "/app/settings/business", label: "Business Details", icon: Building2 },
  { key: "profile", href: "/app/settings/profile", label: "My Profile", icon: UserIcon },
  { key: "users", href: "/app/settings/users", label: "Users & Access", icon: Users },
  { key: "whatsapp", href: "/app/settings/whatsapp", label: "WhatsApp Connection", icon: MessageCircle },
  { key: "notifications", href: "/app/settings/notifications", label: "Notifications", icon: Bell },
  { key: "language", href: "/app/settings/language", label: "Language", icon: Globe },
  { key: "appearance", href: "/app/settings/appearance", label: "Appearance", icon: Palette },
  { key: "security", href: "/app/settings/security", label: "Security & Data", icon: Shield },
  { key: "subscription", href: "/app/settings/subscription", label: "Subscription", icon: Sparkles },
  { key: "billing", href: "/app/settings/billing", label: "Billing & Payment", icon: CreditCard },
  { key: "help", href: "/app/settings/help", label: "Help & FAQ", icon: HelpCircle },
];

export function SettingsWorkspace({ section = "business" }: { section?: SettingsSection }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale, setLocale, theme, setTheme, session, setWhatsappConnected, setRole, logout } =
    useUIStore();

  const [resetOpen, setResetOpen] = useState(false);
  const [editingBiz, setEditingBiz] = useState(false);
  const [bizName, setBizName] = useState("");
  const [bizType, setBizType] = useState("");
  const [bizAddress, setBizAddress] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("staff");

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: business } = useQuery({
    queryKey: ["business"],
    queryFn: () => services.settings.getBusiness(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => services.settings.listUsers(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => services.subscription.listPlans(),
  });

  const { data: billing = [] } = useQuery({
    queryKey: ["billing"],
    queryFn: () => services.subscription.listBillingHistory(),
  });

  const updateBiz = useMutation({
    mutationFn: () =>
      services.settings.updateBusiness({ name: bizName, type: bizType, address: bizAddress }),
    onSuccess: () => {
      toast.success("Business details updated");
      queryClient.invalidateQueries({ queryKey: ["business"] });
      setEditingBiz(false);
    },
  });

  const inviteUser = useMutation({
    mutationFn: () =>
      services.settings.inviteDemoUser({
        name: inviteName,
        email: inviteEmail,
        phone: "+92 300 0000000",
        role: inviteRole,
      }),
    onSuccess: () => {
      toast.success("Demo user added");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setInviteOpen(false);
      setInviteName("");
      setInviteEmail("");
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) => services.subscription.upgradePlan(planId),
    onSuccess: (inv) => {
      toast.success(`Demo plan updated (${inv.invoiceNo})`);
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });

  const handleResetDemo = async () => {
    await resetDemoDatabase();
    queryClient.invalidateQueries();
    setResetOpen(false);
    toast.success("Demo database reset to initial Al Madina Yarn Traders fixtures");
  };

  const copyText = (label: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        subtitle="Apne account, business aur app preferences manage karein."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sub-Nav (Matches Screen 9) */}
        <Card className="p-2.5 space-y-1 h-fit">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  active
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </Card>

        {/* Right Panel */}
        <Card className="p-5 sm:p-6 lg:col-span-3 space-y-5">
          {section === "business" && business && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-bold">Business Details</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!editingBiz) {
                      setBizName(business.name);
                      setBizType(business.type);
                      setBizAddress(business.address);
                    }
                    setEditingBiz(!editingBiz);
                  }}
                >
                  {editingBiz ? "Cancel" : "Edit"}
                </Button>
              </div>
              {editingBiz ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    updateBiz.mutate();
                  }}
                  className="space-y-3 max-w-md"
                >
                  <Input value={bizName} onChange={(e) => setBizName(e.target.value)} required />
                  <Input value={bizType} onChange={(e) => setBizType(e.target.value)} required />
                  <Input value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} required />
                  <Button type="submit">Save Changes</Button>
                </form>
              ) : (
                <div className="divide-y divide-[var(--border-default)] text-sm">
                  {[
                    ["Business Name", business.name],
                    ["Business Type", business.type],
                    ["Currency", "PKR (Pakistani Rupee)"],
                    ["Financial Year", business.financialYear],
                    ["Address", business.address],
                  ].map(([k, v]) => (
                    <div key={k} className="py-3 flex justify-between gap-4">
                      <span className="text-[var(--text-secondary)]">{k}</span>
                      <span className="font-medium text-end">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {section === "profile" && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-bold">User Profile</h2>
              <div className="divide-y divide-[var(--border-default)] text-sm">
                <div className="py-3 flex justify-between">
                  <span className="text-[var(--text-secondary)]">Name</span>
                  <span className="font-semibold">{session.userName}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-[var(--text-secondary)]">Phone</span>
                  <span className="font-semibold">{session.userPhone}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-[var(--text-secondary)]">Email</span>
                  <span className="font-semibold">{session.userEmail}</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Active Demo Role</span>
                  <Select
                    value={session.role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-40"
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Administrator</option>
                    <option value="accountant">Accountant</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {section === "whatsapp" && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-bold">WhatsApp Connection (Demo)</h2>
              <div className="p-4 rounded-xl bg-[var(--brand-cream)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
                Real WhatsApp synchronization with the AI Munshi backend is not enabled in this
                standalone frontend demo.
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-default)]">
                <div>
                  <p className="font-semibold text-sm">{session.userPhone}</p>
                  <Badge tone={session.whatsappConnected ? "success" : "neutral"} className="mt-1">
                    {session.whatsappConnected ? "Connected (Simulated)" : "Disconnected"}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setWhatsappConnected(!session.whatsappConnected);
                    toast.success(
                      !session.whatsappConnected
                        ? "Simulated WhatsApp linked"
                        : "Simulated WhatsApp disconnected"
                    );
                  }}
                >
                  {session.whatsappConnected ? "Disconnect" : "Connect Demo"}
                </Button>
              </div>
            </div>
          )}

          {section === "language" && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-bold">Language & RTL</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={`p-4 rounded-xl border text-left cursor-pointer ${
                    locale === "en"
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                      : "border-[var(--border-default)]"
                  }`}
                >
                  <p className="font-bold text-sm">English (LTR)</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    English UI + Roman Urdu chat support
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("ur")}
                  className={`p-4 rounded-xl border text-left cursor-pointer ${
                    locale === "ur"
                      ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)]"
                      : "border-[var(--border-default)]"
                  }`}
                >
                  <p className="font-bold text-sm">اردو (RTL)</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Complete Urdu right-to-left interface
                  </p>
                </button>
              </div>
            </div>
          )}

          {section === "appearance" && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-bold">Appearance</h2>
              <div className="grid grid-cols-3 gap-3">
                {(["light", "dark", "system"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTheme(m)}
                    className={`p-4 rounded-xl border text-center capitalize cursor-pointer text-sm font-semibold ${
                      theme === m
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                        : "border-[var(--border-default)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div className="space-y-3">
              <h2 className="font-heading text-base font-bold">Notification Preferences</h2>
              {[
                "Payment & Khata Due Reminders",
                "Low-Stock Alerts",
                "New Transaction Confirmations",
                "Weekly Report Summaries",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border-default)] text-sm cursor-pointer"
                >
                  <span>{item}</span>
                  <input type="checkbox" defaultChecked className="accent-[var(--brand-primary)] h-4 w-4" />
                </label>
              ))}
            </div>
          )}

          {section === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-bold">Users & Access (Demo)</h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Production role enforcement will be handled by the backend.
                  </p>
                </div>
                <Button size="sm" onClick={() => setInviteOpen(true)}>
                  Add Demo User
                </Button>
              </div>
              <div className="divide-y divide-[var(--border-default)]">
                {users.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                    </div>
                    <Badge tone="brand" className="capitalize">
                      {u.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-bold">Security & Local Demo Data</h2>
              <div className="p-4 rounded-xl border border-[var(--border-default)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-[var(--brand-primary)]" />
                  <div>
                    <p className="font-semibold text-sm">Reset Local Demo Database</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Restore Al Madina Yarn Traders to its initial seeded state.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Reset Demo Data
                </Button>
              </div>
              <div className="p-4 rounded-xl border border-[var(--border-default)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-[var(--status-danger)]" />
                  <div>
                    <p className="font-semibold text-sm">Demo Session</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Sign out and return to the login screen.
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                >
                  Logout
                </Button>
              </div>
            </div>
          )}

          {section === "subscription" && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-bold">Subscription Plans (Demo)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`p-4 flex flex-col justify-between ${
                      plan.recommended ? "border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]/30" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-sm">{plan.name}</span>
                        {plan.recommended && <Badge tone="brand">Popular</Badge>}
                      </div>
                      <p className="text-xl font-bold mt-2 tabular-nums">
                        {plan.pricePKR === 0 ? "Free" : `${formatPKR(plan.pricePKR)}/mo`}
                      </p>
                      <ul className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check className="h-3.5 w-3.5 text-[var(--status-success)] shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      size="sm"
                      className="mt-4 w-full"
                      variant={plan.recommended ? "primary" : "outline"}
                      onClick={() => upgradeMutation.mutate(plan.id)}
                    >
                      Select Plan (Demo)
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {section === "billing" && (
            <div className="space-y-4">
              <h2 className="font-heading text-base font-bold">Billing & Demo Payment Instructions</h2>
              <Card className="p-4 bg-[var(--brand-cream)] space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Fictional Non-Payable Demo Bank Details</span>
                  <Badge tone="warning">Fictional Demo Only</Badge>
                </div>
                <p className="text-[var(--text-secondary)]">
                  These are fictional placeholder details for UI demonstration only. Do not send real
                  payments.
                </p>
                {[
                  ["Account Title", "Accountio Demo Tech (Pvt) Ltd"],
                  ["Bank Name", "Demo Islamic Bank Pakistan"],
                  ["Account Number", "0000-1234567890"],
                  ["IBAN", "PK00DEMO0000001234567890"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1.5 border-b border-[var(--border-default)]"
                  >
                    <span className="text-[var(--text-secondary)]">{label}</span>
                    <button
                      type="button"
                      onClick={() => copyText(label, value)}
                      className="flex items-center gap-1.5 font-mono font-semibold hover:text-[var(--brand-primary)] cursor-pointer"
                    >
                      <span>{value}</span>
                      {copiedField === label ? (
                        <Check className="h-3.5 w-3.5 text-[var(--status-success)]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </Card>

              <div>
                <h3 className="text-xs font-bold mb-2">Billing History</h3>
                {billing.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-[var(--border-default)]"
                  >
                    <span>
                      {b.date} — {b.planName} ({b.invoiceNo})
                    </span>
                    <span className="font-semibold tabular-nums">{formatPKR(b.amountPKR)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "help" && (
            <div className="space-y-4 text-sm">
              <h2 className="font-heading text-base font-bold">Help & AI Munshi Demo Guide</h2>
              <div className="space-y-3 text-xs text-[var(--text-secondary)] leading-relaxed">
                <p>
                  <strong>How to use AI Munshi:</strong> Go to <em>AI Munshi</em> and type natural
                  Roman Urdu or English sentences such as{" "}
                  <code>Ali Traders se 150,000 ka yarn khareeda, 50,000 cash diya</code>.
                </p>
                <p>
                  <strong>Demo Limitations:</strong> All data is persisted locally in your browser
                  via IndexedDB (Dexie.js). Voice recognition, OCR bill scanning, WhatsApp linking,
                  and payments are simulated in demo mode without external API keys.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset Demo Data?"
        description="This will restore all books, khatas, transactions, and inventory to the original Al Madina Yarn Traders demo data."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleResetDemo}>
            Confirm Reset
          </Button>
        </div>
      </Modal>

      <Modal open={inviteOpen} onOpenChange={setInviteOpen} title="Add Demo User">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteUser.mutate();
          }}
          className="space-y-3"
        >
          <Input
            placeholder="Full Name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <Select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
          >
            <option value="admin">Administrator</option>
            <option value="accountant">Accountant</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </Select>
          <Button type="submit" className="w-full">
            Add User
          </Button>
        </form>
      </Modal>
    </div>
  );
}
