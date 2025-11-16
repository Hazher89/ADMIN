'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
	open: boolean;
	onClose: () => void;
}

const NAV: Array<{ href: string; label: string }> = [
	{ href: '/dashboard', label: 'Oversikt' },
	{ href: '/dashboard/absence', label: 'Fravær' },
	{ href: '/dashboard/vacation', label: 'Ferie' },
	{ href: '/dashboard/inventory', label: 'Lager' },
	{ href: '/dashboard/employees', label: 'Ansatte' },
	{ href: '/dashboard/settings', label: 'Innstillinger' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
	const pathname = usePathname();
	const [hover, setHover] = useState<string | null>(null);

	return (
		<div
			className={`sidebar ${open ? 'open' : ''}`}
			style={{
				position: 'fixed',
				top: 0,
			right: 0,
				height: '100vh',
				width: 280,
				background: 'var(--sidebar-bg)',
				color: 'var(--sidebar-text)',
				boxShadow: 'var(--shadow-lg)',
				zIndex: 1000,
				transform: open ? 'translateX(0)' : 'translateX(100%)',
				transition: 'transform var(--transition-normal)',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px' }}>
				<div style={{ fontWeight: 700 }}>DriftPro</div>
				<button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 10px' }}>Lukk</button>
			</div>
			<nav style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
				{NAV.map((item) => {
					const active = pathname.startsWith(item.href);
					return (
						<Link key={item.href} href={item.href} onClick={onClose} style={{ textDecoration: 'none' }}>
							<div
								onMouseEnter={() => setHover(item.href)}
								onMouseLeave={() => setHover(null)}
								className={active ? 'sidebar-item-active' : ''}
								style={{
									padding: '10px 12px',
									borderRadius: 10,
									background: active ? 'var(--primary)' : hover === item.href ? 'rgba(255,255,255,0.06)' : 'transparent',
									color: active ? '#fff' : 'var(--sidebar-text)',
									border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.08)'
								}}
							>
								{item.label}
							</div>
						</Link>
					);
				})}
			</nav>
		</div>
	);
}


