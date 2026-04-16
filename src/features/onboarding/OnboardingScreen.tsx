import { useCallback, useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COPY } from "@/content/copy";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { duration, easing, palette, radius, spacing } from "@/design/tokens";
import { PaginationDots } from "./components/PaginationDots";
import { useOnboarding } from "./hooks";
import { ONBOARDING_SLIDES } from "./selectors";

const SWIPE_DISTANCE_THRESHOLD = 0.2;
const SWIPE_VELOCITY_THRESHOLD = 400;

export function OnboardingScreen() {
  const {
    state,
    isFirstSlide,
    isLastSlide,
    totalSlides,
    next,
    back,
    skip,
    goTo,
  } = useOnboarding();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(-state.slideIndex * width);

  const animateTo = useCallback(
    (index: number) => {
      const target = -index * width;
      if (reducedMotion) {
        translateX.value = target;
        return;
      }
      translateX.value = withTiming(target, {
        duration: duration.base,
        easing: Easing.bezier(...easing.gentle),
      });
    },
    [reducedMotion, translateX, width],
  );

  useEffect(() => {
    animateTo(state.slideIndex);
  }, [animateTo, state.slideIndex]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onUpdate((event) => {
      "worklet";
      translateX.value = -state.slideIndex * width + event.translationX;
    })
    .onEnd((event) => {
      "worklet";
      const distance = event.translationX;
      const velocity = event.velocityX;
      const shouldAdvance =
        distance < -width * SWIPE_DISTANCE_THRESHOLD ||
        velocity < -SWIPE_VELOCITY_THRESHOLD;
      const shouldGoBack =
        distance > width * SWIPE_DISTANCE_THRESHOLD ||
        velocity > SWIPE_VELOCITY_THRESHOLD;

      let targetIndex = state.slideIndex;
      if (shouldAdvance && state.slideIndex < totalSlides - 1) {
        targetIndex = state.slideIndex + 1;
      } else if (shouldGoBack && state.slideIndex > 0) {
        targetIndex = state.slideIndex - 1;
      }

      if (targetIndex !== state.slideIndex) {
        runOnJS(goTo)(targetIndex);
      } else {
        translateX.value = withTiming(-state.slideIndex * width, {
          duration: duration.fast,
          easing: Easing.bezier(...easing.snap),
        });
      }
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const footerStyle = {
    paddingBottom: insets.bottom + spacing.lg,
  };

  return (
    <Screen padded={false}>
      <View style={styles.root}>
        <View style={styles.headerRow}>
          <Text variant="caption" tone="muted" weight="medium">
            {COPY.onboarding.pagination.pageOf
              .replace("{current}", String(state.slideIndex + 1))
              .replace("{total}", String(totalSlides))}
          </Text>
          {!isLastSlide ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={COPY.onboarding.cta.skip}
              onPress={skip}
              hitSlop={12}
              style={styles.skipButton}
            >
              <Text variant="caption" tone="muted" weight="semibold">
                {COPY.onboarding.cta.skip}
              </Text>
            </PressableScale>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        <GestureDetector gesture={panGesture}>
          <View style={styles.pager}>
            <Animated.View
              style={[
                styles.track,
                { width: width * totalSlides },
                trackStyle,
              ]}
            >
              {ONBOARDING_SLIDES.map((slide) => (
                <View key={slide.id} style={[styles.slide, { width }]}>
                  <GlassCard style={styles.card}>
                    <Text variant="caption" tone="accent" weight="semibold">
                      {slide.eyebrow.toUpperCase()}
                    </Text>
                    <Text variant="display" weight="bold">
                      {slide.title}
                    </Text>
                    <Text variant="body" tone="muted">
                      {slide.body}
                    </Text>
                  </GlassCard>
                </View>
              ))}
            </Animated.View>
          </View>
        </GestureDetector>

        <View style={[styles.footer, footerStyle]}>
          <PaginationDots
            total={totalSlides}
            activeIndex={state.slideIndex}
            reducedMotion={reducedMotion}
          />
          <View style={styles.ctaRow}>
            {!isFirstSlide ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={back}
                style={styles.secondary}
              >
                <Text variant="title" weight="semibold" align="center">
                  Back
                </Text>
              </PressableScale>
            ) : (
              <View style={styles.secondaryPlaceholder} />
            )}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={
                isLastSlide
                  ? COPY.onboarding.cta.getStarted
                  : COPY.onboarding.cta.next
              }
              onPress={next}
              style={styles.primary}
            >
              <Text variant="title" weight="semibold" align="center">
                {isLastSlide
                  ? COPY.onboarding.cta.getStarted
                  : COPY.onboarding.cta.next}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipPlaceholder: {
    width: spacing.xl,
  },
  pager: {
    flex: 1,
    overflow: "hidden",
  },
  track: {
    flex: 1,
    flexDirection: "row",
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  footer: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  secondary: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
  },
  secondaryPlaceholder: {
    flex: 1,
  },
  primary: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
  },
});
