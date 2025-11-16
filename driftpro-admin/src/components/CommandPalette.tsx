'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Item = { label: string; href: string; keywords?: string };

const ITEMS: Item[] = [
	{ label: 'Dashboard', href: '/dashboard', keywords: 'home overview' },
	{ label: 'Absence', href: '/dashboard/absence', keywords: 'fravær syk' },
	{ label: 'Vacation', href: '/dashboard/vacation', keywords: 'ferie calendar' },
	{ label: 'Inventory', href: '/dashboard/inventory', keywords: 'lager' },
	{ label: 'Settings', href: '/dashboard/settings', keywords: 'innstillinger' },
];

export default function CommandPalette() {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState('');

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const mac = navigator.platform.toUpperCase().includes('MAC');
			if ((mac && e.metaKey && e.key.toLowerCase() === 'k') || (!mac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
				e.preventDefault();
				setOpen((v) => !v);
			}
			if (e.key === 'Escape') setOpen(false);
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, []);

	const results = useMemo(() => {
		const s = q.trim().toLowerCase();
		if (!s) return ITEMS;
		return ITEMS.filter((i) =>
			i.label.toLowerCase().includes(s) || (i.keywords || '').toLowerCase().includes(s)
		);
	}, [q]);

	if (!open) return null;

	return (
		<div className="modal-overlay" onClick={() => setOpen(false)}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
				<div className="modal-header">
					<h2 className="modal-title">Command Palette</h2>
					<button className="modal-close" onClick={() => setOpen(false)}>×</button>
				</div>
				<div className="modal-body">
					<input
						autoFocus
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Type to search pages..."
						className="form-input"
					/>
					<div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
						{results.map((r) => (
							<Link key={r.href} href={r.href} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
								<div className="card" style={{ padding: 12 }}>
									{r.label}
								</div>
							</Link>
						))}
						{results.length === 0 && <div className="card" style={{ padding: 12 }}>No results</div>}
					</div>
				</div>
			</div>
		</div>
	);
}






