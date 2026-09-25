/* eslint-disable react-hooks/set-state-in-effect, no-undef */
import {useState, useCallback, useMemo, useEffect, useRef} from 'react';
import PlayerView from '../views/PlayerView';
import Channels from '../data/final_channels.json';

const ALL_CHANNELS = Object.values(Channels).flat();
const CATEGORIES = Object.keys(Channels).sort();
const COUNTRIES = [...new Set(ALL_CHANNELS.map(ch => ch.country).filter(Boolean))].sort();

const styles = {
	app: {display: 'flex', height: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: "'Segoe UI', Roboto, sans-serif", overflow: 'hidden'},
	sidebar: {width: 220, backgroundColor: '#111111', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', flexShrink: 0},
	sidebarHeader: {padding: '20px 16px 12px', borderBottom: '1px solid #222'},
	sidebarTitle: {fontSize: 18, fontWeight: 'bold', color: '#00a4dc', margin: 0},
	sidebarSub: {fontSize: 11, color: '#666', marginTop: 4},
	categoryList: {flex: 1, overflowY: 'auto', padding: '8px 0'},
	catItem: {padding: '8px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 6, margin: '0 8px', transition: 'background 0.15s'},
	catItemActive: {background: '#00a4dc', color: '#fff'},
	catName: {fontSize: 13, fontWeight: 'normal'},
	catCount: {fontSize: 10, color: '#888', background: '#222', padding: '2px 6px', borderRadius: 10},
	catCountActive: {color: '#fff', background: 'rgba(255,255,255,0.2)'},
	main: {flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'},
	topbar: {background: 'linear-gradient(135deg, #0a1628 0%, #112240 100%)', padding: '16px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 5},
	topTitle: {fontSize: 22, fontWeight: 'bold', margin: 0, color: '#fff'},
	topSub: {fontSize: 12, color: '#8cb8d8', marginTop: 2},
	searchRow: {display: 'flex', gap: 10, marginTop: 12},
	searchBox: {flex: 1, padding: '10px 16px', fontSize: 14, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none'},
	countrySelect: {padding: '10px 14px', fontSize: 13, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', outline: 'none', cursor: 'pointer', minWidth: 130},
	content: {flex: 1, overflowY: 'auto', padding: '16px 24px'},
	sectionTitle: {fontSize: 14, color: '#aaa', margin: '8px 0', textTransform: 'uppercase', letterSpacing: 1},
	grid: {display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10},
	card: {background: '#1a1a1a', borderRadius: 8, padding: 12, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #262626'},
	cardHover: {background: '#252525', borderColor: '#00a4dc', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,164,220,0.2)'},
	focusRing: {outline: '2px solid #00a4dc', outlineOffset: '2px'},
	cardLogo: {width: '100%', height: 60, borderRadius: 4, objectFit: 'contain', background: '#0d0d0d', marginBottom: 8},
	cardName: {fontSize: 12, fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'},
	cardMeta: {fontSize: 10, color: '#666', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center'},
	cardCountry: {background: '#333', padding: '1px 5px', borderRadius: 3}
};

const App = () => {
	const [selectedCat, setSelectedCat] = useState('Sports');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCountry, setSelectedCountry] = useState('');
	const [selectedChannel, setSelectedChannel] = useState(null);

	const channels = useMemo(() => {
		let base = selectedCat === 'All' ? ALL_CHANNELS : (Channels[selectedCat] || []);
		if (selectedCountry) {
			base = base.filter(ch => ch.country === selectedCountry);
		}
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			base = base.filter(ch => ch.name.toLowerCase().includes(q) || (ch.country && ch.country.toLowerCase().includes(q)));
		}
		return base;
	}, [selectedCat, searchQuery, selectedCountry]);

	const handlePlay = useCallback((channel) => {
		setSelectedChannel(channel);
	}, []);

	const handleBack = useCallback(() => {
		setSelectedChannel(null);
	}, []);

	const handleAppKey = useCallback((ev) => {
		if (ev.keyCode === 4 || ev.keyCode === 27 || ev.keyCode === 10009 || ev.keyCode === 461) {
			ev.preventDefault();
		}
	}, []);

	useEffect(() => {
		window.addEventListener('keydown', handleAppKey);
		return () => window.removeEventListener('keydown', handleAppKey);
	}, [handleAppKey]);

	if (selectedChannel) {
		return <PlayerView stream={selectedChannel} onBack={handleBack} />;
	}

	return (
		<div style={styles.app}>
			<aside style={styles.sidebar}>
				<div style={styles.sidebarHeader}>
					<h2 style={styles.sidebarTitle}>LibreTV</h2>
					<p style={styles.sidebarSub}>{ALL_CHANNELS.length.toLocaleString()} canales en vivo</p>
				</div>
				<div style={styles.categoryList}>
					<div
						tabIndex={0}
						style={{...styles.catItem, ...(selectedCat === 'All' ? styles.catItemActive : {})}}
						onClick={() => setSelectedCat('All')}
						onKeyDown={(e) => { if (e.keyCode === 13 || e.keyCode === 23) { e.preventDefault(); setSelectedCat('All'); }}}
						onFocus={(e) => { e.currentTarget.style.outline = '2px solid #00a4dc'; e.currentTarget.style.outlineOffset = '2px'; }}
						onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
					>
						<span style={styles.catName}>Todos</span>
						<span style={{...styles.catCount, ...(selectedCat === 'All' ? styles.catCountActive : {})}}>{ALL_CHANNELS.length}</span>
					</div>
					{CATEGORIES.map(cat => (
						<div
							key={cat}
							tabIndex={0}
							style={{...styles.catItem, ...(selectedCat === cat ? styles.catItemActive : {})}}
							onClick={() => setSelectedCat(cat)}
							onKeyDown={(e) => { if (e.keyCode === 13 || e.keyCode === 23) { e.preventDefault(); setSelectedCat(cat); }}}
							onFocus={(e) => { e.currentTarget.style.outline = '2px solid #00a4dc'; e.currentTarget.style.outlineOffset = '2px'; }}
							onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
						>
							<span style={styles.catName}>{cat}</span>
							<span style={{...styles.catCount, ...(selectedCat === cat ? styles.catCountActive : {})}}>
								{Channels[cat].length}
							</span>
						</div>
					))}
				</div>
			</aside>

			<main style={styles.main}>
				<header style={styles.topbar}>
					<h1 style={styles.topTitle}>{selectedCat === 'All' ? 'Todos los canales' : selectedCat}</h1>
					<p style={styles.topSub}>{channels.length} canales disponibles{selectedCountry ? ` en ${selectedCountry}` : ''}</p>
					<div style={styles.searchRow}>
						<input
							tabIndex={0}
							type="text"
							placeholder="Buscar..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							style={styles.searchBox}
						/>
						<select
							tabIndex={0}
							value={selectedCountry}
							onChange={(e) => setSelectedCountry(e.target.value)}
							style={styles.countrySelect}
						>
							<option value="">Todos los paises</option>
							{COUNTRIES.map(c => (
								<option key={c} value={c}>{c}</option>
							))}
						</select>
					</div>
				</header>

				<div style={styles.content}>
					<div style={styles.grid}>
						{channels.map((channel, index) => (
							<div
								key={index}
								tabIndex={0}
								style={styles.card}
								onClick={() => handlePlay(channel)}
								onKeyDown={(e) => { if (e.keyCode === 13 || e.keyCode === 23) { e.preventDefault(); handlePlay(channel); }}}
								onMouseEnter={(e) => {e.currentTarget.style.background='#252525';e.currentTarget.style.borderColor='#00a4dc';e.currentTarget.style.transform='translateY(-2px)';}}
								onMouseLeave={(e) => {e.currentTarget.style.background='#1a1a1a';e.currentTarget.style.borderColor='#262626';e.currentTarget.style.transform='none';}}
								onFocus={(e) => { e.currentTarget.style.background='#252525'; e.currentTarget.style.borderColor='#00a4dc'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.outline = '2px solid #00a4dc'; e.currentTarget.style.outlineOffset = '2px'; }}
								onBlur={(e) => { e.currentTarget.style.background='#1a1a1a'; e.currentTarget.style.borderColor='#262626'; e.currentTarget.style.transform='none'; e.currentTarget.style.outline = 'none'; }}
							>
								{channel.logo ? (
									<img src={channel.logo} alt="" style={styles.cardLogo} />
								) : (
									<div style={styles.cardLogo}></div>
								)}
								<div style={styles.cardName}>{channel.name}</div>
								<div style={styles.cardMeta}>
									{channel.country && <span style={styles.cardCountry}>{channel.country}</span>}
									<span>{channel.group}</span>
								</div>
							</div>
						))}
					</div>
					{channels.length === 0 && (
						<div style={{textAlign: 'center', padding: 60, color: '#555'}}>
							No se encontraron canales
						</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default App;
