import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useDeviceContext } from "twrnc";

import { firebaseConfig, firebase } from "@/config/firebase";
import tw from "@/lib/tailwind";
import { AppRoutes } from "@/routes";

SplashScreen.preventAutoHideAsync();

export default function App() {
	// Initialize Firebase
	if (!firebase.getApps.length) {
		firebase.initializeApp(firebaseConfig);
	}

	useDeviceContext(tw);

	const [loaded, error] = useFonts({
		OpenRunde: require("@/assets/fonts/OpenRunde-Regular.otf"),
		OpenRundeMedium: require("@/assets/fonts/OpenRunde-Medium.otf"),
		OpenRundeSemibold: require("@/assets/fonts/OpenRunde-Semibold.otf"),
		OpenRundeBold: require("@/assets/fonts/OpenRunde-Bold.otf"),
	});

	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) SplashScreen.hideAsync();
	}, [loaded]);

	if (!loaded) return null;

	return (
		<SafeAreaProvider>
			<StatusBar style="dark" />
			<AppRoutes />
		</SafeAreaProvider>
	);
}
