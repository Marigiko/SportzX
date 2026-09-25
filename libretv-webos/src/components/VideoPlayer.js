const VideoPlayer = ({src, controls = false, autoPlay = false, playsInline = false}) => {
	return (
		<video src={src} controls={controls} autoPlay={autoPlay} playsInline={playsInline} style={{width: '100%', height: '100%', objectFit: 'fill'}} />
	);
};

export default VideoPlayer;
