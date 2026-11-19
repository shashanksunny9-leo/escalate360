import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Escalate360 | Intelligent Escalation Management', description: 'A prototype escalation governance portal.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
