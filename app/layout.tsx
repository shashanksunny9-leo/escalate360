import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Escalate360 | Service First', description: 'Guided Service First escalation experience' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
