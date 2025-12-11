'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Sun, Moon, ChevronDown, LogOut } from 'lucide-react';
import DriftProLogo from '@/components/DriftProLogo';

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
							marginRight: isMobile ? '-0.125rem' : '-0.25rem',
							filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.4))'
						}}
					>
						<DriftProLogo 
							variant="icon" 
							size={isMobile ? 28 : 40}
							className=""
						/>
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
			<style jsx global>{`
				/* DriftPro Logo Animations for Topbar */
				@keyframes dp-logo-rotate {
					0% { transform: rotate(0deg) scale(1); }
					25% { transform: rotate(90deg) scale(1.02); }
					50% { transform: rotate(180deg) scale(1); }
					75% { transform: rotate(270deg) scale(1.02); }
					100% { transform: rotate(360deg) scale(1); }
				}
				
				@keyframes dp-bg-pulse {
					0%, 100% { opacity: 0.1; transform: scale(1); }
					50% { opacity: 0.2; transform: scale(1.05); }
				}
				
				@keyframes dp-ripple-expand {
					0% { transform: scale(0.8); opacity: 0.3; stroke-width: 2; }
					50% { transform: scale(1.2); opacity: 0.1; stroke-width: 1; }
					100% { transform: scale(1.6); opacity: 0; stroke-width: 0.5; }
				}
				
				@keyframes dp-burst-spring {
					0%, 100% { transform: scale(1); opacity: 0.3; }
					25% { transform: scale(1.3); opacity: 0.6; }
					50% { transform: scale(0.9); opacity: 0.4; }
					75% { transform: scale(1.2); opacity: 0.7; }
				}
				
				@keyframes dp-burst-dot-bounce {
					0%, 100% { transform: scale(1); opacity: 0.8; }
					50% { transform: scale(1.5); opacity: 1; }
				}
				
				@keyframes dp-ring-outer-rotate {
					from { stroke-dashoffset: 0; transform: rotate(0deg); }
					to { stroke-dashoffset: -14; transform: rotate(360deg); }
				}
				
				@keyframes dp-ring-middle-rotate {
					from { stroke-dashoffset: 0; transform: rotate(0deg); }
					to { stroke-dashoffset: -10; transform: rotate(-360deg); }
				}
				
				@keyframes dp-core-outer-pulse {
					0%, 100% { transform: scale(1); opacity: 0.95; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.4)); }
					25% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)); }
					50% { transform: scale(1.12); opacity: 1; filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8)); }
					75% { transform: scale(1.05); opacity: 0.98; filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.5)); }
				}
				
				@keyframes dp-core-inner-pulse {
					0%, 100% { transform: scale(1); opacity: 1; }
					25% { transform: scale(1.12); opacity: 0.98; }
					50% { transform: scale(1.18); opacity: 0.95; }
					75% { transform: scale(1.08); opacity: 0.97; }
				}
				
				@keyframes dp-core-pulse {
					0%, 100% { transform: scale(1); opacity: 0.95; }
					25% { transform: scale(1.3); opacity: 0.9; }
					50% { transform: scale(1.5); opacity: 0.8; }
					75% { transform: scale(1.2); opacity: 0.85; }
				}
				
				@keyframes dp-element-float {
					0%, 100% { transform: translateY(0px) translateX(0px) scale(1) rotate(0deg); opacity: 0.9; }
					20% { transform: translateY(-4px) translateX(2px) scale(1.06) rotate(2deg); opacity: 1; }
					40% { transform: translateY(-6px) translateX(0px) scale(1.1) rotate(0deg); opacity: 1; }
					60% { transform: translateY(-3px) translateX(-2px) scale(1.05) rotate(-2deg); opacity: 0.95; }
					80% { transform: translateY(-1px) translateX(1px) scale(1.02) rotate(1deg); opacity: 0.92; }
				}
				
				@keyframes dp-element-glow-pulse {
					0%, 100% { opacity: 0.2; transform: scale(1); }
					33% { opacity: 0.35; transform: scale(1.15); }
					66% { opacity: 0.45; transform: scale(1.25); }
				}
				
				@keyframes dp-element-dot-pulse {
					0%, 100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.3)); }
					25% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.5)); }
					50% { transform: scale(1.25); opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.7)); }
					75% { transform: scale(1.1); opacity: 0.95; filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6)); }
				}
				
				@keyframes dp-element-core-pulse {
					0%, 100% { transform: scale(1); opacity: 1; }
					25% { transform: scale(1.4); opacity: 0.95; }
					50% { transform: scale(1.6); opacity: 0.9; }
					75% { transform: scale(1.3); opacity: 0.92; }
				}
				
				@keyframes dp-element-indicator-orbit {
					0% { transform: rotate(0deg) translateX(2.5px) rotate(0deg) scale(1); opacity: 0.7; }
					25% { transform: rotate(90deg) translateX(2.5px) rotate(-90deg) scale(1.2); opacity: 1; }
					50% { transform: rotate(180deg) translateX(2.5px) rotate(-180deg) scale(1); opacity: 0.9; }
					75% { transform: rotate(270deg) translateX(2.5px) rotate(-270deg) scale(1.15); opacity: 1; }
					100% { transform: rotate(360deg) translateX(2.5px) rotate(-360deg) scale(1); opacity: 0.7; }
				}
				
				@keyframes dp-data-particle-move {
					0% { transform: translate(0, 0) scale(0.8); opacity: 0.6; }
					20% { transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -4px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -4px)) scale(1.1); opacity: 0.9; }
					40% { transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -8px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -8px)) scale(1.3); opacity: 1; }
					60% { transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -12px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -12px)) scale(1.2); opacity: 0.95; }
					80% { transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -16px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -16px)) scale(1); opacity: 0.8; }
					100% { transform: translate(calc(cos(var(--angle, 0) * 3.14159 / 180) * -20px), calc(sin(var(--angle, 0) * 3.14159 / 180) * -20px)) scale(0.7); opacity: 0.4; }
				}
				
				@keyframes dp-element-connection-flow {
					0% { stroke-dashoffset: 0; opacity: 0.15; }
					50% { stroke-dashoffset: -6; opacity: 0.3; }
					100% { stroke-dashoffset: -12; opacity: 0.15; }
				}
				
				@keyframes dp-flow-path-pulse {
					0%, 100% { stroke-opacity: 0.2; stroke-width: 0.6; }
					33% { stroke-opacity: 0.35; stroke-width: 0.75; }
					66% { stroke-opacity: 0.45; stroke-width: 0.9; }
				}
				
				@keyframes dp-flow-particle-move {
					0% { transform: translate(0, 0) scale(0.7); opacity: 0.5; }
					20% { transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 3px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 3px)) scale(1); opacity: 0.9; }
					40% { transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 6px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 6px)) scale(1.2); opacity: 1; }
					60% { transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 9px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 9px)) scale(1.1); opacity: 0.95; }
					80% { transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 12px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 12px)) scale(0.9); opacity: 0.7; }
					100% { transform: translate(calc(cos(var(--flow-angle, 0) * 3.14159 / 180) * 16px), calc(sin(var(--flow-angle, 0) * 3.14159 / 180) * 16px)) scale(0.6); opacity: 0.3; }
				}
				
				@keyframes dp-sparkle-orbit {
					0% { transform: rotate(0deg) translateX(7px) rotate(0deg) scale(1); opacity: 0.7; }
					25% { transform: rotate(90deg) translateX(7px) rotate(-90deg) scale(1.4); opacity: 1; }
					50% { transform: rotate(180deg) translateX(7px) rotate(-180deg) scale(1); opacity: 0.9; }
					75% { transform: rotate(270deg) translateX(7px) rotate(-270deg) scale(1.3); opacity: 1; }
					100% { transform: rotate(360deg) translateX(7px) rotate(-360deg) scale(1); opacity: 0.7; }
				}
				
				.dp-logo-container {
					animation: dp-logo-rotate 20s linear infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-bg {
					animation: dp-bg-pulse 3s ease-in-out infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-ring-outer {
					animation: dp-ring-outer-rotate 8s linear infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-ring-middle {
					animation: dp-ring-middle-rotate 6s linear infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-core-outer {
					animation: dp-core-outer-pulse 2s ease-in-out infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-core-inner {
					animation: dp-core-inner-pulse 1.5s ease-in-out infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-core-pulse {
					animation: dp-core-pulse 1.2s ease-in-out infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-floating-element {
					animation: dp-element-float 2.5s ease-in-out infinite;
				}
				
				.dp-element-glow {
					animation: dp-element-glow-pulse 2s ease-in-out infinite;
				}
				
				.dp-element-dot {
					animation: dp-element-dot-pulse 1.8s ease-in-out infinite;
				}
				
				.dp-element-core {
					animation: dp-element-core-pulse 1.5s ease-in-out infinite;
				}
				
				.dp-element-indicator {
					animation: dp-element-indicator-orbit 3s linear infinite;
				}
				
				.dp-data-particle {
					animation: dp-data-particle-move 2s ease-in-out infinite;
				}
				
				.dp-element-connection {
					animation: dp-element-connection-flow 2s linear infinite;
				}
				
				.dp-flow-path {
					animation: dp-flow-path-pulse 2s ease-in-out infinite;
				}
				
				.dp-flow-particle {
					animation: dp-flow-particle-move 2.5s ease-in-out infinite;
				}
				
				.dp-sparkle {
					animation: dp-sparkle-orbit 4s linear infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-ripple {
					animation: dp-ripple-expand 2s ease-out infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-burst-line {
					animation: dp-burst-spring 1.5s ease-in-out infinite;
					transform-origin: 32px 32px;
				}
				
				.dp-burst-dot {
					animation: dp-burst-dot-bounce 1.2s ease-in-out infinite;
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


