import { Tabs } from 'expo-router';
import { View, type ColorValue } from 'react-native';
import { colors } from '@rmmm/tokens';
import { Icon, nativeFonts, useTheme, type IconName } from '@rmmm/ui/native';

const tabIcon =
  (name: IconName) =>
  ({ color }: { color: ColorValue }) => <Icon name={name} color={String(color)} />;

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.background },
        headerTintColor: t.text,
        headerTitleStyle: { fontFamily: nativeFonts.headlineExtraBold },
        tabBarStyle: { backgroundColor: t.background, borderTopColor: t.border, height: 84 },
        tabBarActiveTintColor: t.focus,
        tabBarInactiveTintColor: t.textMuted,
        tabBarLabelStyle: { fontFamily: nativeFonts.bodyStrong, fontSize: 11 },
        sceneStyle: { backgroundColor: t.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Lookup', tabBarIcon: tabIcon('lookup') }} />
      <Tabs.Screen name="episodes" options={{ title: 'Episodes', tabBarIcon: tabIcon('play') }} />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarAccessibilityLabel: 'Report a story',
          tabBarIcon: () => (
            <View
              style={{
                width: 52,
                height: 52,
                marginTop: -18,
                borderRadius: 2,
                backgroundColor: colors.stampRed,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="submit" color={colors.paper} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="cases" options={{ title: 'Cases', tabBarIcon: tabIcon('case') }} />
      <Tabs.Screen name="me" options={{ title: 'Me', tabBarIcon: tabIcon('notify') }} />
    </Tabs>
  );
}
