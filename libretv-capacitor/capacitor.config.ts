import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.libretv.app',
	appName: 'LibreTV',
	webDir: '../libretv-webos/dist_trimmed',
	backgroundColor: '#000000',
	android: {
		allowMixedContent: true,
		captureInput: true,
		backgroundColor: '#000000',
	},
	server: {
		androidScheme: 'https',
		allowNavigation: []
	}
};

export default config;
