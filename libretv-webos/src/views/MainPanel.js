const MainPanel = ({children}) => {
	return (
		<div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
			{children}
		</div>
	);
};

export default MainPanel;
