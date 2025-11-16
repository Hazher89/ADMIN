'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Sun, Moon, ChevronDown, LogOut } from 'lucide-react';

export default function Topbar() {
	const { user, userProfile, logout } = useAuth();
	const router = useRouter();
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [theme, setTheme] = useState<'light' | 'dark'>('dark');
	const [mounted, setMounted] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Check if mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Handle theme
	useEffect(() => {
		setMounted(true);
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
		const initialTheme = savedTheme || 'dark';
		setTheme(initialTheme);
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', initialTheme);
		}
	}, []);

	useEffect(() => {
		if (!mounted) return;
		if (typeof document === 'undefined') return;
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}, [theme, mounted]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		};

		if (showUserMenu) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showUserMenu]);
	
	return (
		<header className="header" style={{ position: 'sticky', top: 0, zIndex: 900, width: '100%', padding: isMobile ? '0.25rem 0' : '0.5rem 0', background: 'var(--card-background)', borderBottom: isMobile ? '0.5px solid var(--border-color)' : '1px solid var(--border-color)' }}>
			<div className="header-content" style={{ display: 'flex', gap: isMobile ? 6 : 12, alignItems: 'center', flexWrap: 'nowrap', justifyContent: 'space-between', width: '100%', paddingLeft: isMobile ? '0.75rem' : '1rem', paddingRight: isMobile ? '0.75rem' : '1rem', paddingTop: isMobile ? '0.125rem' : '0.25rem', paddingBottom: isMobile ? '0.125rem' : '0.25rem', minHeight: isMobile ? '48px' : 'auto' }}>
				{/* Logo Section - Left */}
				<div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.5rem', flexShrink: 0 }}>
					{/* Live Animated Icon */}
					<div 
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: isMobile ? '1.75rem' : '2.5rem',
							height: isMobile ? '1.75rem' : '2.5rem',
							flexShrink: 0,
							marginRight: isMobile ? '-0.125rem' : '-0.25rem'
						}}
					>
					<svg
						viewBox="0 0 64 64"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						style={{
							width: '100%',
							height: '100%',
							filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))'
						}}
					>
						<defs>
							<linearGradient id="iconGradientTopbar" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stopColor="#22d3ee" />
								<stop offset="50%" stopColor="#0ea5e9" />
								<stop offset="100%" stopColor="#06b6d4" />
							</linearGradient>
							<linearGradient id="innerGradientTopbar" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" stopColor="#06b6d4" />
								<stop offset="100%" stopColor="#0891b2" />
							</linearGradient>
						</defs>
						
						{/* Outer rotating ring */}
						<circle
							cx="32"
							cy="32"
							r="28"
							fill="none"
							stroke="url(#iconGradientTopbar)"
							strokeWidth="1.5"
							strokeDasharray="4 4"
							opacity="0.6"
							style={{
								animation: 'rotate-ring 8s linear infinite',
								transformOrigin: '32px 32px'
							}}
						/>
						
						{/* Middle rotating ring - reverse */}
						<circle
							cx="32"
							cy="32"
							r="24"
							fill="none"
							stroke="url(#iconGradientTopbar)"
							strokeWidth="1"
							strokeDasharray="3 3"
							opacity="0.4"
							style={{
								animation: 'rotate-ring-reverse 6s linear infinite',
								transformOrigin: '32px 32px'
							}}
						/>
						
						{/* Rounded square background with pulse */}
						<rect
							x="8"
							y="8"
							width="48"
							height="48"
							rx="12"
							ry="12"
							fill="url(#iconGradientTopbar)"
							opacity="0.95"
							style={{
								animation: 'pulse-icon 3s ease-in-out infinite'
							}}
						/>
						
						{/* Inner operations gear - rotating */}
						<g style={{
							animation: 'rotate-gear 10s linear infinite',
							transformOrigin: '32px 32px'
						}}>
							<circle cx="32" cy="32" r="18" fill="white" opacity="0.95" />
							<circle cx="32" cy="32" r="8" fill="url(#innerGradientTopbar)" />
							
							{/* Gear teeth - 8 directional points with animation */}
							{[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
								const rad = (angle * Math.PI) / 180;
								const x1 = 32 + Math.cos(rad) * 14;
								const y1 = 32 + Math.sin(rad) * 14;
								const x2 = 32 + Math.cos(rad) * 18;
								const y2 = 32 + Math.sin(rad) * 18;
								
								return (
									<line
										key={i}
										x1={x1}
										y1={y1}
										x2={x2}
										y2={y2}
										stroke="url(#iconGradientTopbar)"
										strokeWidth="2.5"
										strokeLinecap="round"
										style={{
											animation: `pulse-tooth 2s ease-in-out infinite`,
											animationDelay: `${i * 0.1}s`
										}}
									/>
								);
							})}
						</g>
						
						{/* Operations flow lines - animated */}
						<line
							x1="4"
							y1="32"
							x2="20"
							y2="32"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
							opacity="0.8"
							style={{
								animation: 'flow-line 2s ease-in-out infinite'
							}}
						/>
						<line
							x1="44"
							y1="32"
							x2="60"
							y2="32"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
							opacity="0.8"
							style={{
								animation: 'flow-line 2s ease-in-out infinite',
								animationDelay: '0.5s'
							}}
						/>
						
						{/* Floating particles */}
						{[0, 60, 120, 180, 240, 300].map((angle, i) => {
							const rad = (angle * Math.PI) / 180;
							const radius = 26;
							const x = 32 + Math.cos(rad) * radius;
							const y = 32 + Math.sin(rad) * radius;
							
							return (
								<circle
									key={i}
									cx={x}
									cy={y}
									r="1.5"
									fill="url(#iconGradientTopbar)"
									opacity="0.6"
									style={{
										animation: `float-particle 4s ease-in-out infinite`,
										animationDelay: `${i * 0.3}s`
									}}
								/>
							);
						})}
					</svg>
				</div>
				
					{!isMobile && (
						<a className="logo" href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginLeft: '-0.25rem' }}>
							<span style={{
								background: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 40%, #06b6d4 100%)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text',
								filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))',
								animation: 'text-glow 3s ease-in-out infinite',
								position: 'relative',
								fontSize: '1.125rem',
								fontWeight: '600'
							}}>DriftPro</span>
						</a>
					)}
				</div>

				{/* Center - Search (Hidden on mobile) */}
				{!isMobile && (
					<div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
						<GlobalSearch />
					</div>
				)}

				{/* Right Section - Notifications and User */}
				<div style={{ display: 'flex', gap: isMobile ? 8 : 12, alignItems: 'center', flexShrink: 0, marginRight: 0 }}>
					<NotificationBell />
					<div style={{ position: 'relative' }} ref={menuRef}>
						<div 
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: isMobile ? '0.375rem' : '0.5rem',
								padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem',
								background: showUserMenu ? 'var(--gray-100)' : 'var(--card-background)',
								border: '1px solid var(--border-color)',
								borderRadius: 'var(--radius-full)',
								cursor: 'pointer',
								transition: 'all var(--transition-normal)'
							}}
							onClick={() => setShowUserMenu(!showUserMenu)}
							onMouseEnter={(e) => {
								if (!showUserMenu && !isMobile) {
									e.currentTarget.style.background = 'var(--gray-100)';
								}
							}}
							onMouseLeave={(e) => {
								if (!showUserMenu && !isMobile) {
									e.currentTarget.style.background = 'var(--card-background)';
								}
							}}
						>
							<div style={{
								width: isMobile ? '32px' : '28px',
								height: isMobile ? '32px' : '28px',
								borderRadius: '50%',
								background: 'var(--gradient-primary)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'white',
								fontSize: isMobile ? '0.875rem' : '0.75rem',
								fontWeight: '600',
								flexShrink: 0
							}}>
								{userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
							</div>
							{!isMobile && (
								<div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
									<div style={{
										fontSize: '0.8125rem',
										fontWeight: '500',
										color: 'var(--text-color)',
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis'
									}}>
										{userProfile?.displayName || 'Bruker'}
									</div>
									<div style={{
										fontSize: '0.6875rem',
										color: 'var(--gray-500)',
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis'
									}}>
										{userProfile?.role || 'Bruker'}
									</div>
								</div>
							)}
							{!isMobile && (
								<ChevronDown 
									size={16} 
									style={{ 
										color: 'var(--gray-500)',
										transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
										transition: 'transform 0.2s'
									}} 
								/>
							)}
						</div>

						{/* User Dropdown Menu */}
						{showUserMenu && (
							<div style={{
								position: 'absolute',
								top: 'calc(100% + 0.5rem)',
								right: isMobile ? '-0.75rem' : 0,
								background: 'var(--card-background)',
								border: '1px solid var(--border-color)',
								borderRadius: 'var(--radius-lg)',
								boxShadow: 'var(--shadow-xl)',
								minWidth: isMobile ? 'calc(100vw - 1.5rem)' : '200px',
								maxWidth: isMobile ? 'calc(100vw - 1.5rem)' : '300px',
								zIndex: 1000,
								overflow: 'hidden',
								animation: 'fadeIn 0.2s ease'
							}}>
								{/* Settings */}
								<button
									onClick={() => {
										router.push('/dashboard/settings');
										setShowUserMenu(false);
									}}
									style={{
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										padding: '0.75rem 1rem',
										background: 'transparent',
										border: 'none',
										cursor: 'pointer',
										color: 'var(--text-color)',
										fontSize: '0.875rem',
										transition: 'all 0.2s',
										textAlign: 'left'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = 'var(--gray-100)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'transparent';
									}}
								>
									<Settings size={18} style={{ color: 'var(--gray-500)' }} />
									<span>Innstillinger</span>
								</button>

								{/* Divider */}
								<div style={{
									height: '1px',
									background: 'var(--border-color)',
									margin: '0.25rem 0'
								}}></div>

								{/* Theme Toggle */}
								{mounted && (
									<button
										onClick={() => {
											setTheme(prev => {
												const newTheme = prev === 'light' ? 'dark' : 'light';
												return newTheme;
											});
										}}
										style={{
											width: '100%',
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
											padding: '0.75rem 1rem',
											background: 'transparent',
											border: 'none',
											cursor: 'pointer',
											color: 'var(--text-color)',
											fontSize: '0.875rem',
											transition: 'all 0.2s',
											textAlign: 'left'
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.background = 'var(--gray-100)';
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.background = 'transparent';
										}}
									>
										{theme === 'light' ? (
											<Moon size={18} style={{ color: 'var(--gray-500)' }} />
										) : (
											<Sun size={18} style={{ color: 'var(--gray-500)' }} />
										)}
										<span>{theme === 'light' ? 'Mørk modus' : 'Lys modus'}</span>
									</button>
								)}

								{/* Divider */}
								<div style={{
									height: '1px',
									background: 'var(--border-color)',
									margin: '0.25rem 0'
								}}></div>

								{/* Logout */}
								<button
									onClick={() => {
										setShowUserMenu(false);
										setShowLogoutModal(true);
									}}
									style={{
										width: '100%',
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										padding: '0.75rem 1rem',
										background: 'transparent',
										border: 'none',
										cursor: 'pointer',
										color: 'var(--danger)',
										fontSize: '0.875rem',
										transition: 'all 0.2s',
										textAlign: 'left'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'transparent';
									}}
								>
									<LogOut size={18} style={{ color: 'var(--danger)' }} />
									<span>Logg ut</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Logout Confirmation Modal */}
			{showLogoutModal && (
				<div 
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 2000,
						backdropFilter: 'blur(4px)'
					}}
					onClick={() => setShowLogoutModal(false)}
				>
					<div 
						style={{
							background: 'var(--card-background)',
							borderRadius: 'var(--radius-xl)',
							boxShadow: 'var(--shadow-xl)',
							maxWidth: isMobile ? 'calc(100vw - 2rem)' : '400px',
							width: isMobile ? 'calc(100vw - 2rem)' : '90%',
							border: '1px solid var(--border-color)'
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div style={{
							padding: isMobile ? '1rem' : '1.5rem',
							borderBottom: '1px solid var(--border-color)',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center'
						}}>
							<h3 style={{
								fontSize: isMobile ? 'var(--font-size-base)' : 'var(--font-size-lg)',
								fontWeight: '600',
								color: 'var(--text-color)'
							}}>
								Bekreft utlogging
							</h3>
							<button
								onClick={() => setShowLogoutModal(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '1.5rem',
									color: 'var(--gray-400)',
									cursor: 'pointer',
									padding: '0.25rem',
									lineHeight: 1
								}}
							>
								×
							</button>
						</div>
						<div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
							<p style={{ 
								marginBottom: isMobile ? '1rem' : '1.5rem', 
								color: 'var(--text-color)',
								lineHeight: '1.6',
								fontSize: isMobile ? '0.875rem' : '1rem'
							}}>
								Er du sikker på at du vil logge ut? Du må logge inn på nytt for å få tilgang til systemet.
							</p>
							<div style={{ 
								display: 'flex', 
								gap: isMobile ? '0.75rem' : '1rem', 
								justifyContent: 'flex-end',
								flexDirection: isMobile ? 'column' : 'row'
							}}>
								<button
									onClick={() => setShowLogoutModal(false)}
									style={{
										padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
										borderRadius: 'var(--radius-md)',
										border: '1px solid var(--border-color)',
										background: 'var(--card-background)',
										color: 'var(--text-color)',
										cursor: 'pointer',
										fontSize: isMobile ? '0.9375rem' : '0.875rem',
										fontWeight: '500',
										transition: 'all 0.2s',
										width: isMobile ? '100%' : 'auto'
									}}
									onMouseEnter={(e) => {
										if (!isMobile) {
											e.currentTarget.style.background = 'var(--gray-100)';
										}
									}}
									onMouseLeave={(e) => {
										if (!isMobile) {
											e.currentTarget.style.background = 'var(--card-background)';
										}
									}}
									onTouchStart={(e) => {
										e.currentTarget.style.background = 'var(--gray-100)';
									}}
									onTouchEnd={(e) => {
										e.currentTarget.style.background = 'var(--card-background)';
									}}
								>
									Avbryt
								</button>
								<button
									onClick={async () => {
										try {
											await logout();
											setShowLogoutModal(false);
											router.push('/login');
										} catch (error) {
											console.error('Error during logout:', error);
										}
									}}
									style={{
										padding: isMobile ? '0.75rem 1rem' : '0.5rem 1rem',
										borderRadius: 'var(--radius-md)',
										border: 'none',
										background: 'var(--danger)',
										color: 'white',
										cursor: 'pointer',
										fontSize: isMobile ? '0.9375rem' : '0.875rem',
										fontWeight: '500',
										transition: 'all 0.2s',
										width: isMobile ? '100%' : 'auto'
									}}
									onMouseEnter={(e) => {
										if (!isMobile) {
											e.currentTarget.style.background = '#dc2626';
										}
									}}
									onMouseLeave={(e) => {
										if (!isMobile) {
											e.currentTarget.style.background = 'var(--danger)';
										}
									}}
									onTouchStart={(e) => {
										e.currentTarget.style.background = '#dc2626';
									}}
									onTouchEnd={(e) => {
										e.currentTarget.style.background = 'var(--danger)';
									}}
								>
									Logg ut
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
			<style jsx>{`
				@keyframes rotate-ring {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}

				@keyframes rotate-ring-reverse {
					from {
						transform: rotate(360deg);
					}
					to {
						transform: rotate(0deg);
					}
				}

				@keyframes rotate-gear {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}

				@keyframes pulse-icon {
					0%, 100% {
						opacity: 0.95;
						transform: scale(1);
					}
					50% {
						opacity: 1;
						transform: scale(1.02);
					}
				}

				@keyframes pulse-tooth {
					0%, 100% {
						opacity: 1;
						stroke-width: 2.5;
					}
					50% {
						opacity: 0.7;
						stroke-width: 3;
					}
				}

				@keyframes flow-line {
					0%, 100% {
						opacity: 0.6;
						stroke-dasharray: 0 20;
					}
					50% {
						opacity: 1;
						stroke-dasharray: 20 0;
					}
				}

				@keyframes float-particle {
					0%, 100% {
						transform: translate(0, 0) scale(1);
						opacity: 0.6;
					}
					50% {
						transform: translate(2px, -2px) scale(1.3);
						opacity: 1;
					}
				}

				@keyframes text-glow {
					0%, 100% {
						filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.4)) drop-shadow(0 0 12px rgba(6, 182, 212, 0.2));
						opacity: 1;
					}
					50% {
						filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 18px rgba(6, 182, 212, 0.3));
						opacity: 1;
					}
				}

				@keyframes fadeIn {
					from {
						opacity: 0;
						transform: translateY(-10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</header>
	);
}


