/* eslint-disable react-hooks/set-state-in-effect */
import {useState} from 'react';

const HomeView = () => {
	return (
		<div style={{padding: '20px', textAlign: 'center', marginTop: '40px'}}>
			<h1 style={{color: '#00a4dc'}}>LibreTV</h1>
			<p style={{color: '#888'}}>Selecciona una categoría en la barra lateral para comenzar.</p>
		</div>
	);
};

export default HomeView;
