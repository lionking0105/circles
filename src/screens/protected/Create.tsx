import { zodResolver } from "@hookform/resolvers/zod";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useRef, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Dimensions,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	View,
	ScrollView,
	TextInput,
} from "react-native";
import Animated, {
	useAnimatedRef,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import * as z from "zod";

import { Alert, Button, Input, Text, ScreenIndicator } from "@/components/ui";
import { useCircle } from "@/hooks/useCircle";
import tw from "@/lib/tailwind";
import { ProtectedStackParamList } from "@/routes/protected";
import { useProfileStore, ProfileState } from "@/stores/profileStore";

type JoinProps = NativeStackScreenProps<ProtectedStackParamList, "Join">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function Create({ navigation }: JoinProps) {
	const { createCircle } = useCircle();
	const { profile }: ProfileState = useProfileStore();
	const scrollRef = useAnimatedRef<ScrollView>();
	const alertRef = useRef<any>(null);
	const translateX = useSharedValue(0);

	// The following two variables and functions are used to automatically focus the inputs.
	type TextInputRef = React.RefObject<TextInput>;
	const textInputRefs: TextInputRef[] = [
		useRef<TextInput>(null),
		useRef<TextInput>(null),
	];
	let currTextInput = 0;

	const openNextTextInput = () => {
		currTextInput += 1;
		textInputRefs[currTextInput]?.current?.focus();
	};

	const openPrevTextInput = () => {
		currTextInput -= 1;
		textInputRefs[currTextInput]?.current?.focus();
	};

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			translateX.value = event.contentOffset.x;
		},
	});

	const activeIndex = useDerivedValue(() => {
		return Math.round(translateX.value / SCREEN_WIDTH);
	});

	const handleScrollForward = useCallback(() => {
		if (activeIndex.value === 0) {
			trigger("name").then((isValid) => {
				if (isValid) {
					scrollRef.current?.scrollTo({
						x: SCREEN_WIDTH * (activeIndex.value + 1),
					});
					openNextTextInput();
				}
			});
		}
	}, []);

	const handleScrollBackward = useCallback(() => {
		if (activeIndex.value === 0) {
			navigation.goBack();
		}
		// Focus the previous text input
		openPrevTextInput();
		scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (activeIndex.value - 1) });
	}, []);

	const formSchema = z.object({
		name: z
			.string({
				required_error: "Oops! This circle requires a name.",
			})
			.trim()
			.min(1, "Oops! Circle name requires at least one character."),
	});

	const {
		control,
		getValues,
		handleSubmit,
		trigger,
		formState: { errors, isSubmitting },
	} = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	async function onSubmit (data: z.infer<typeof formSchema>) {
		try {
			const { name } = data;
			// TODO: Create circle on the backend using this name
			console.log("circle name: ", name);
			console.log("profile id: ", profile!.id);
			await createCircle(name, profile!.id).then(
				(invitationCode) => {
					console.log("New Invitation Code: ", invitationCode);
				},
			);

			handleScrollForward();
		} catch (error) {
			console.log(error);
			alertRef.current?.showAlert({
				title: "Oops!",
				// @ts-ignore
				message: error.message + ".",
				variant: "error",
			});
		}
	};

	return (
		<SafeAreaView style={tw`flex-1 bg-white`}>
			<Alert ref={alertRef} />
			<KeyboardAvoidingView
				style={tw`flex-1`}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<View
					style={tw`flex-row items-center justify-center gap-x-1 pt-4 pb-6 px-4 relative`}
				>
					<Pressable
						style={tw`absolute left-4 top-1.5`}
						hitSlop={24}
						onPress={() => {
							if (activeIndex.value === 0) {
								navigation.goBack();
							} else {
								handleScrollBackward();
							}
						}}
					>
						<Image
							source={require("@/assets/icons/arrow-left.svg")}
							style={tw`w-6 h-6`}
						/>
					</Pressable>
					{/* Map through two indicators*/}
					{[0, 1].map((index) => (
						<ScreenIndicator
							key={index.toString()}
							activeIndex={activeIndex}
							index={index}
						/>
					))}
				</View>
				<Animated.ScrollView
					ref={scrollRef as any}
					onScroll={scrollHandler}
					showsHorizontalScrollIndicator={false}
					scrollEnabled={false}
					scrollEventThrottle={8}
					horizontal
					pagingEnabled
					keyboardShouldPersistTaps="always"
					style={tw`flex-1`}
				>
					{/* Circle Name */}
					<View style={tw`w-[${SCREEN_WIDTH}px]`}>
						<View style={tw`flex-1 px-12`}>
							<Text variant="title1" weight="semibold" style={tw`mb-4`}>
								Circle Name
							</Text>
							<Text
								variant="callout"
								weight="semibold"
								style={tw`text-content-secondary mb-6`}
							>
								Enter the name of your circle.
							</Text>
							<Controller
								control={control}
								name="name"
								render={({ field: { onChange, value } }) => (
									<Input
										placeholder="Circle Name"
										ref={textInputRefs[0]}
										error={errors.name?.message}
										description="The name of your circle can always be changed in the future."
										value={value}
										onChangeText={onChange}
									/>
								)}
							/>
						</View>
						<View style={tw`px-12`}>
							<Button
								variant="primary"
								label="Create"
								style={tw`mb-4`}
								loading={isSubmitting}
								onPress={handleSubmit(onSubmit)}								
							/>
						</View>
					</View>
					{/* Invite Friends */}
					<View style={tw`w-[${SCREEN_WIDTH}px]`}>
						<View style={tw`flex-1 px-12`}>
							<Text variant="title1" weight="semibold" style={tw`mb-4`}>
								Invite Friends
							</Text>
							<Text
								variant="callout"
								weight="semibold"
								style={tw`text-content-secondary mb-6`}
							>
								Search for and invite your friends.
							</Text>
							{/* TODO Add Search Functionality here */}
							<TextInput
								ref={textInputRefs[1]}
								placeholder="Search"
								style={[
									tw`bg-gray-100 rounded-3 py-3 px-3 body text-content-primary`,
									{
										fontFamily: "OpenRundeSemibold",
									},
								]}
							/>
						</View>
						<View style={tw`px-12`}>
							<Button
								variant="primary"
								label="Send Invite"
								style={tw`mb-4`}
								loading={isSubmitting}
								onPress={() => console.log("Adding a friend")}
							/>
						</View>
					</View>
				</Animated.ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
