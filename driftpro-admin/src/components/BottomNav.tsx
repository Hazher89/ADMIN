'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV: Array<{ href: string; label: string }> = [
	{ href: '/dashboard', label: 'Oversikt' },
	{ href: '/dashboard/absence', label: 'Fravær' },
	{ href: '/dashboard/vacation', label: 'Ferie' },
	{ href: '/dashboard/settings', label: 'Innst.' },
];

export default function BottomNav() {
	const pathname = usePathname();
	return (
		<nav
			className="bottom-nav"
			style={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				background: 'var(--card-background)',
				backdropFilter: 'blur(10px)',
				WebkitBackdropFilter: 'blur(10px)',
				borderTop: '1px solid var(--gray-200)',
				display: 'flex',
				justifyContent: 'space-around',
				padding: '10px 8px',
				zIndex: 800,
			}}
		>
			{NAV.map((n) => {
				const active = pathname.startsWith(n.href);
				return (
					<Link key={n.href} href={n.href} style={{ textDecoration: 'none', color: active ? 'var(--primary)' : 'var(--gray-600)', fontWeight: 600 }}>
						{n.label}
					</Link>
				);
			})}
		</nav>
	);
}






