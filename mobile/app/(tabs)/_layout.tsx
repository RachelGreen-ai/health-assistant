import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/hooks/useLanguage';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index:        { active: 'home',              inactive: 'home-outline' },
  chat:         { active: 'chatbubble',        inactive: 'chatbubble-outline' },
  records:      { active: 'flask',             inactive: 'flask-outline' },
  appointments: { active: 'calendar',          inactive: 'calendar-outline' },
  prep:         { active: 'clipboard',         inactive: 'clipboard-outline' },
};

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgGrouped,
          borderTopColor: Colors.separator,
          borderTopWidth: 0.5,
          height: 82,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name] ?? { active: 'help', inactive: 'help-outline' };
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index"        options={{ title: t('home') }} />
      <Tabs.Screen name="chat"         options={{ title: t('chat') }} />
      <Tabs.Screen name="records"      options={{ title: t('records') }} />
      <Tabs.Screen name="appointments" options={{ title: t('appointments') }} />
      <Tabs.Screen name="prep"         options={{ title: t('prep') }} />
    </Tabs>
  );
}
