/* eslint-disable react-hooks/set-state-in-effect */
import {useEffect, useState, useRef, useCallback} from 'react';
import Hls from 'hls.js';

const IS_WEBOS = typeof window !== 'undefined' && !!window.webOSPlatformInfo;

const styles = {
	container: {width: '100%', height: '100%', background: '#000', position: 'relative', overflow: 'hidden'},
	center: {display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, color: '#fff', textAlign: 'center', padding: 20},
	video: {width: '100%', height: '100%', objectFit: 'fill', background: '#000', display: 'block'},
	loading: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: '#000', zIndex: 10, color: '#fff'},
	topBar: {position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(rgba(0,0,0,0.9), transparent)', padding: '14px 20px', zIndex: 5},
	backBtn: {padding: '8px 16px', background: 'rgba(0,0,0,0.8)', color: '#fff', border: '1px solid #555', borderRadius: 6, fontSize: 14, cursor: 'pointer', fontWeight: 'bold'},
	channelName: {fontSize: 14, fontWeight: 'bold', color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.9)', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'},
	controls: {position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', padding: '30px 20px 12px', zIndex: 5},
	progressWrap: {width: '100%', marginBottom: 8},
	progressBar: {width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, cursor: 'pointer', position: 'relative'},
	progressFill: {height: '100%', background: '#00a4dc', borderRadius: 2},
	progressHandle: {position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 14, background: '#00a4dc', borderRadius: '50%', boxShadow: '0 0 8px rgba(0,164,220,0.6)'},
	controlRow: {display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'},
	playBtn: {background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer', minWidth: 40},
	ccBtn: {background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 'bold'},
	ccBtnActive: {background: '#00a4dc', borderColor: '#00a4dc'},
	timeDisplay: {fontSize: 12, color: '#eee', fontVariantNumeric: 'tabular-nums'},
	volGroup: {display: 'flex', alignItems: 'center', gap: 6},
	volSlider: {width: 60, cursor: 'pointer', height: 4},
	fsBtn: {background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', marginLeft: 'auto'}
};

const PlayerView = ({stream, onBack}) => {
	const videoRef = useRef(null);
	const hlsRef = useRef(null);
	const containerRef = useRef(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [playing, setPlaying] = useState(false);
	const [volume, setVolume] = useState(1);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [showControls, setShowControls] = useState(true);
	const [subtitleTracks, setSubtitleTracks] = useState([]);
	const [subtitleTrack, setSubtitleTrack] = useState(-1);
	const hideTimeoutRef = useRef(null);
	const loadTimerRef = useRef(null);

	const doPlayPause = useCallback(() => {
		const v = videoRef.current;
		if (!v) return;
		if (v.paused) v.play().catch(() => {});
		else v.pause();
	}, []);

	const doVolume = useCallback((e) => {
		const val = parseFloat(e.target.value);
		setVolume(val);
		if (videoRef.current) videoRef.current.volume = val;
	}, []);

	const doSeek = useCallback((e) => {
		const v = videoRef.current;
		if (!v || !duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		v.currentTime = pct * duration;
	}, [duration]);

	const doFullscreen = useCallback(() => {
		const el = containerRef.current;
		if (!el) return;
		if (document.fullscreenElement) document.exitFullscreen();
		else el.requestFullscreen().catch(() => {});
	}, []);

	const resetHideTimer = useCallback(() => {
		setShowControls(true);
		if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
		hideTimeoutRef.current = setTimeout(() => {
			if (videoRef.current && !videoRef.current.paused) setShowControls(false);
		}, 5000);
	}, []);

	const handleCCToggle = useCallback(() => {
		if (subtitleTracks.length === 0) return;
		const next = subtitleTrack >= subtitleTracks.length - 1 ? -1 : subtitleTrack + 1;
		setSubtitleTrack(next);
		const video = videoRef.current;
		if (!video) return;
		for (let i = 0; i < video.textTracks.length; i++) {
			video.textTracks[i].mode = (i === next) ? 'showing' : 'hidden';
		}
		if (hlsRef.current) {
			hlsRef.current.subtitleTrack = next;
		}
		if (next >= 0) resetHideTimer();
	}, [subtitleTrack, subtitleTracks, resetHideTimer]);

	const detectSubtitleTracks = useCallback((videoEl, hls) => {
		const tracks = [];
		if (hls && hls.subtitleTracks && hls.subtitleTracks.length > 0) {
			hls.subtitleTracks.forEach(t => tracks.push(t.name || t.lang || 'Sub'));
		} else if (videoEl.textTracks && videoEl.textTracks.length > 0) {
			for (let i = 0; i < videoEl.textTracks.length; i++) {
				if (videoEl.textTracks[i].kind === 'subtitles' || videoEl.textTracks[i].kind === 'captions') {
					tracks.push(videoEl.textTracks[i].label || videoEl.textTracks[i].language || `Sub ${i + 1}`);
				}
			}
		}
		setSubtitleTracks(tracks);
		setSubtitleTrack(-1);
		for (let i = 0; i < videoEl.textTracks.length; i++) {
			videoEl.textTracks[i].mode = 'hidden';
		}
	}, []);

	const handleKey = useCallback((ev) => {
		const v = videoRef.current;
		if (!v) return;
		switch (ev.keyCode) {
			case 13: case 23: ev.preventDefault(); doPlayPause(); break;
			case 37: case 21: ev.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10); break;
			case 39: case 22: ev.preventDefault(); v.currentTime = Math.min(v.duration || 0, v.currentTime + 10); break;
			case 38: case 19: ev.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); break;
			case 40: case 20: ev.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); break;
			case 70: ev.preventDefault(); doFullscreen(); break;
			case 67: ev.preventDefault(); handleCCToggle(); break;
			case 27: case 4: case 10009: case 461: ev.preventDefault(); onBack(); return;
			case 179: ev.preventDefault(); doPlayPause(); break;
			case 178: ev.preventDefault(); v.pause(); break;
			case 176: case 177: ev.preventDefault(); break;
			default: break;
		}
		resetHideTimer();
	}, [onBack, doPlayPause, doFullscreen, resetHideTimer, handleCCToggle]);

	const handleMouseMove = useCallback(() => {
		resetHideTimer();
	}, [resetHideTimer]);

	const handleUserActivity = useCallback(() => {
		resetHideTimer();
	}, [resetHideTimer]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !stream?.url) return;
		setLoading(true);
		setError(null);
		setCurrentTime(0);
		setDuration(0);
		if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

		if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
		loadTimerRef.current = setTimeout(() => {
			if (loading) {
				setError('Timeout: el stream no respondio en 15s');
				setLoading(false);
			}
		}, 15000);

		const url = stream.url;
		const nativeHls = video.canPlayType('application/vnd.apple.mpegurl');

		if (!IS_WEBOS && Hls.isSupported() && (url.includes('.m3u8') || url.includes('/live/'))) {
			const hls = new Hls({enableWorker: true, lowLatencyMode: true, backBufferLength: 90, renderNatively: true});
			hlsRef.current = hls;
			hls.loadSource(url);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				if (loadTimerRef.current) { clearTimeout(loadTimerRef.current); loadTimerRef.current = null; }
				setLoading(false);
				video.play().catch(() => {});
			});
			hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
				detectSubtitleTracks(video, hls);
			});
			hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, () => {
				setSubtitleTrack(hls.subtitleTrack);
			});
			hls.on(Hls.Events.ERROR, (_, d) => {
				if (d.fatal) {
					if (loadTimerRef.current) { clearTimeout(loadTimerRef.current); loadTimerRef.current = null; }
					setError(`Error de stream: ${d.type}`);
					setLoading(false);
				}
			});
		} else {
			video.src = url;
			const onLoaded = () => {
				if (loadTimerRef.current) { clearTimeout(loadTimerRef.current); loadTimerRef.current = null; }
				setLoading(false);
				video.play().catch(() => {});
				detectSubtitleTracks(video, null);
			};
			const onError = () => {
				if (loadTimerRef.current) { clearTimeout(loadTimerRef.current); loadTimerRef.current = null; }
				setError(nativeHls ? 'Error de stream' : 'Formato no soportado');
				setLoading(false);
			};
			video.addEventListener('loadedmetadata', onLoaded, {once: true});
			video.addEventListener('error', onError, {once: true});
			if (video.textTracks) video.textTracks.onchange = () => detectSubtitleTracks(video, null);
		}

		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		const onTime = () => setCurrentTime(video.currentTime);
		const onDur = () => setDuration(video.duration || 0);
		video.addEventListener('playing', onPlay);
		video.addEventListener('pause', onPause);
		video.addEventListener('timeupdate', onTime);
		video.addEventListener('durationchange', onDur);
		return () => {
			if (loadTimerRef.current) { clearTimeout(loadTimerRef.current); loadTimerRef.current = null; }
			video.removeEventListener('playing', onPlay);
			video.removeEventListener('pause', onPause);
			video.removeEventListener('timeupdate', onTime);
			video.removeEventListener('durationchange', onDur);
			if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
		};
	}, [stream]);

	useEffect(() => {
		hideTimeoutRef.current = setTimeout(() => {
			if (videoRef.current && !videoRef.current.paused) setShowControls(false);
		}, 5000);
		return () => {
			if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
		};
	}, [stream]);

	useEffect(() => {
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [handleKey]);

	const fmt = (s) => {
		if (!s || !isFinite(s)) return '0:00';
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	};

	if (error) {
		return (
			<div style={styles.container}>
				<div style={styles.center}>
					<p style={{fontSize: 18, marginBottom: 8}}>⚠️ {error}</p>
					<p style={{fontSize: 13, color: '#888', marginBottom: 20}}>{stream?.name}</p>
					<button onClick={onBack} style={{padding: '12px 28px', background: '#00a4dc', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16}}>← Volver al Inicio</button>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} style={styles.container} onMouseMove={handleMouseMove} onClick={handleUserActivity}>
			<div style={{...styles.topBar, opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none', transition: 'opacity 0.4s'}}>
				<button style={styles.backBtn} onClick={onBack}>← Volver</button>
				<span style={styles.channelName}>{stream?.name}</span>
				<div style={{width: 70}} />
			</div>

			{loading && (
				<div style={styles.loading}>
					<div style={{fontSize: 32, marginBottom: 12}}>⏳</div>
					<div style={{fontSize: 16}}>{stream?.name}</div>
					<div style={{fontSize: 12, color: '#aaa', marginTop: 8}}>Cargando stream...</div>
				</div>
			)}

			<video ref={videoRef} style={styles.video} controls={false} autoPlay playsInline />

			{!loading && (
				<div style={{...styles.controls, opacity: showControls ? 1 : 0, pointerEvents: showControls ? 'auto' : 'none', transition: 'opacity 0.4s'}}>
					<div style={styles.progressWrap} onClick={doSeek}>
						<div style={styles.progressBar}>
							<div style={{...styles.progressFill, width: duration ? `${(currentTime / duration) * 100}%` : '0%'}} />
							<div style={{...styles.progressHandle, left: duration ? `${(currentTime / duration) * 100}%` : '0%'}} />
						</div>
					</div>
					<div style={styles.controlRow}>
						<button style={styles.playBtn} onClick={doPlayPause}>{playing ? '⏸' : '▶'}</button>
						<span style={styles.timeDisplay}>{fmt(currentTime)} / {fmt(duration)}</span>
						<div style={styles.volGroup}>
							<span style={{fontSize: 13}}>🔊</span>
							<input type="range" min="0" max="1" step="0.05" value={volume} onChange={doVolume} style={styles.volSlider} />
						</div>
						<button style={styles.fsBtn} onClick={doFullscreen}>⛶ Full</button>
						{subtitleTracks.length > 0 && (
							<button
								style={{...styles.ccBtn, ...(subtitleTrack >= 0 ? styles.ccBtnActive : {})}}
								onClick={handleCCToggle}
								title="Subtitulos"
							>
								CC{subtitleTrack >= 0 ? ` ${subtitleTrack + 1}` : ''}
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default PlayerView;
