import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { authCard } from './authStyles';
import {
  Building2,
  Calendar,
  Package,
  Shield,
  type LucideIcon,
} from 'lucide-react';

interface Highlight {
  icon: LucideIcon;
  title: string;
  detail: string;
}

const DEFAULT_HIGHLIGHTS: Highlight[] = [
  {
    icon: Building2,
    title: 'Rooms & labs',
    detail: 'Reserve campus spaces with conflict-free scheduling.',
  },
  {
    icon: Package,
    title: 'Shared equipment',
    detail: 'Borrow gear with optional multi-step approvals.',
  },
  {
    icon: Calendar,
    title: 'Your schedule',
    detail: 'Track reservations and checkouts in one place.',
  },
  {
    icon: Shield,
    title: 'Department access',
    detail: 'Role-aware workspaces for students and staff.',
  },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  cardTitle: string;
  cardSubtitle?: string;
  highlights?: Highlight[];
  backTo?: { label: string; to: string };
}

export function AuthLayout({
  children,
  cardTitle,
  cardSubtitle,
  highlights = DEFAULT_HIGHLIGHTS,
  backTo,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0f1a] text-white">
      {/* Mesh gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_10%_-10%,rgba(99,102,241,0.45),transparent_50%),radial-gradient(ellipse_70%_50%_at_90%_20%,rgba(139,92,246,0.35),transparent_45%),radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(14,165,233,0.2),transparent_50%)]"
      />
      {/* Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div aria-hidden className="pointer-events-none absolute -top-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-[100px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-violet-600/15 blur-[80px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-12 lg:flex-row lg:items-center lg:gap-14 lg:px-8">
        {/* Brand panel */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-10 max-w-xl lg:mb-0 lg:flex-1"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/50 ring-1 ring-white/20">
              <Building2 size={24} strokeWidth={2.25} aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                University platform
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-white via-indigo-100 to-violet-200 bg-clip-text text-transparent">
                  Campus Spaces
                </span>
              </h1>
            </div>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-slate-400 sm:text-xl">
            Reserve labs, manage shared equipment, and keep every department workspace organized.
          </p>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {highlights.map(({ icon: Icon, title, detail }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="flex gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/20">
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-md shrink-0"
        >
          <div className={authCard}>
            {backTo && (
              <Link
                to={backTo.to}
                className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 transition hover:text-white"
              >
                ← {backTo.label}
              </Link>
            )}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-white">{cardTitle}</h2>
              {cardSubtitle && (
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{cardSubtitle}</p>
              )}
            </div>
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-slate-600 lg:text-left">
            For authorized campus use. Follow your institution&apos;s data policies.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
