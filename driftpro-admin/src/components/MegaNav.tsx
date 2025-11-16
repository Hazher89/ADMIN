'use client';

import Link from 'next/link';

export default function MegaNav() {
	return (
		<nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
			<Link className="btn btn-secondary" href="/dashboard">Oversikt</Link>
			<Link className="btn btn-secondary" href="/dashboard/absence">Fravær</Link>
			<Link className="btn btn-secondary" href="/dashboard/vacation">Ferie</Link>
			<Link className="btn btn-secondary" href="/dashboard/inventory">Lager</Link>
			<Link className="btn btn-secondary" href="/dashboard/settings">Innstillinger</Link>
		</nav>
	);
}






