#!/usr/bin/env bash
set -euo pipefail
INPUT="$(cat)"

FILE_PATH="$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')"
CONTENT="$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // empty')"

if [[ -z "$CONTENT" ]]; then
  exit 0
fi

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

case "$FILE_PATH" in
  *legacy-web/*) exit 0 ;;
esac

BANNED_IMPORTS=(
  "from ['\"]react-dom['\"]"
  "from ['\"]react-dom/[^'\"]+['\"]"
  "from ['\"]react-router-dom['\"]"
  "from ['\"]react-router['\"]"
  "from ['\"]vite['\"]"
  "from ['\"]@vitejs/[^'\"]+['\"]"
  "from ['\"]motion['\"]"
  "from ['\"]motion/[^'\"]+['\"]"
  "from ['\"]framer-motion['\"]"
  "from ['\"]recharts['\"]"
  "from ['\"]tailwindcss['\"]"
  "from ['\"]@tailwindcss/[^'\"]+['\"]"
  "from ['\"]tailwind-merge['\"]"
  "from ['\"]sonner['\"]"
  "from ['\"]lucide-react['\"]"
  "require\(['\"]react-dom['\"]\)"
  "require\(['\"]react-router-dom['\"]\)"
)

REPLACEMENTS=(
  "react-dom -> remove entirely (RN renders via react-native)"
  "react-dom/* -> remove entirely (RN renders via react-native)"
  "react-router-dom -> use expo-router"
  "react-router -> use expo-router"
  "vite -> we ship Expo, not Vite"
  "@vitejs/* -> we ship Expo, not Vite"
  "motion -> use react-native-reanimated"
  "motion/* -> use react-native-reanimated"
  "framer-motion -> use react-native-reanimated"
  "recharts -> use victory-native or react-native-svg-charts"
  "tailwindcss -> use src/design/tokens.ts"
  "@tailwindcss/* -> use src/design/tokens.ts"
  "tailwind-merge -> not needed; compose style objects"
  "sonner -> use burnt or a custom Reanimated toast"
  "lucide-react -> use lucide-react-native"
  "react-dom (require) -> remove entirely"
  "react-router-dom (require) -> use expo-router"
)

for i in "${!BANNED_IMPORTS[@]}"; do
  pattern="${BANNED_IMPORTS[$i]}"
  if printf '%s' "$CONTENT" | grep -Eq "$pattern"; then
    echo "Blocked: wrong-stack import in $FILE_PATH" >&2
    echo "  matched: $pattern" >&2
    echo "  fix:     ${REPLACEMENTS[$i]}" >&2
    exit 2
  fi
done

DOM_PRIMITIVES=(
  "<div[ />]"
  "<span[ />]"
  "<button[ />]"
  "<input[ />]"
  "<a [^>]*href"
  "onClick="
)

DOM_FIX=(
  "<div> -> <View>"
  "<span> -> <Text> (all text must be inside <Text>)"
  "<button> -> <Pressable>"
  "<input> -> <TextInput>"
  "<a href> -> <Pressable> + router.push (expo-router)"
  "onClick -> onPress on <Pressable>"
)

for i in "${!DOM_PRIMITIVES[@]}"; do
  pattern="${DOM_PRIMITIVES[$i]}"
  if printf '%s' "$CONTENT" | grep -Eq "$pattern"; then
    echo "Blocked: DOM primitive in $FILE_PATH" >&2
    echo "  matched: $pattern" >&2
    echo "  fix:     ${DOM_FIX[$i]}" >&2
    exit 2
  fi
done

exit 0
