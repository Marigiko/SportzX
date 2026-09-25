const ChannelCard = ({channel, onClick}) => {
	return (
		<div
			onClick={onClick}
			style={{
				background: '#1a1a1a',
				borderRadius: 8,
				padding: 12,
				cursor: 'pointer',
				border: '1px solid #262626'
			}}
		>
			{channel.logo && <img src={channel.logo} alt="" style={{width: '100%', height: 60, objectFit: 'contain'}} />}
			<div style={{fontSize: 12, fontWeight: 600, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
				{channel.name}
			</div>
			{channel.country && <div style={{fontSize: 10, color: '#666'}}>{channel.country}</div>}
		</div>
	);
};

export default ChannelCard;
