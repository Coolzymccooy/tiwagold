// Custom entry: install crypto.getRandomValues BEFORE any app code loads.
// Hermes/React Native has no global crypto.getRandomValues, which @noble/curves
// requires to generate the P-256 signed-intent key when a user taps Approve.
// Without this, every approval fails with "crypto.getRandomValues must be defined".
import "react-native-get-random-values";
import "expo-router/entry";
