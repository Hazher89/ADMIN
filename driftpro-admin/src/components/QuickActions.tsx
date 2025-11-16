'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QuickActions() {
	const [open, setOpen] = useState(false);

	return (
		<div style={{ position: 'fixed', right: '1rem', bottom: '4.2rem', zIndex: 1000 }}>
			<button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
				⚡ Hurtig
			</button>
			{open && (
				<div className="card" style={{ marginTop: 8, padding: 8, minWidth: 220 }}>
					<div style={{ display: 'grid', gap: 6 }}>
						<Link href="/dashboard/vacation" className="btn btn-secondary">➕ Ny ferie</Link>
						<Link href="/dashboard/absence" className="btn btn-secondary">➕ Ny fravær</Link>
						<Link href="/dashboard/settings" className="btn btn-secondary">⚙️ Innstillinger</Link>
					</div>
				</div>
			)}
		</div>
	);
}






