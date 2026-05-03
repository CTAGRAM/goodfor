# PROMPT: Build Beautiful Custom Home Screen Widgets in an Expo App (iOS + Android)

## CONTEXT FOR AI

You are helping build native home screen widgets for an **Expo-based React Native app** targeting **both iOS and Android**. The developer wants beautiful, custom-designed widgets that share data with the main app. Follow the instructions below precisely. Ask clarifying questions before writing code if any critical detail is missing.

---

## OVERVIEW OF THE WIDGET LANDSCAPE (2025–2026)

### iOS
- **Best approach (2026):** Use the official `expo-widgets` library (alpha, Expo SDK 53+). It lets you write widgets as **React components** using `@expo/ui` SwiftUI-mapped components — zero native Swift/Xcode code required.
- **Alternative approach:** Use `@bittingz/expo-widgets` with raw SwiftUI (Kotlin for Android). Requires writing Swift/Kotlin files manually.
- **Important:** Widgets are NOT available in Expo Go. You must use a **development build** (`npx expo run:ios`).

### Android
- Android widgets require **native Kotlin code** and XML layouts.
- `@bittingz/expo-widgets` handles Android via a config plugin — you write Kotlin `.kt` files and XML resource layouts.
- Data sharing between the app and Android widget happens via **SharedPreferences** through a native module bridge.

---

## APPROACH 1 — Official `expo-widgets` (iOS Only, Recommended for SDK 53+)

### Prerequisites
- Expo SDK 53 or higher
- macOS with Xcode 15+ (for iOS builds)
- Apple Developer account (for device/distribution builds)
- Node.js 18+

### Step 1: Install the library

```bash
npx expo install expo-widgets @expo/ui
```

### Step 2: Configure `app.json` / `app.config.js`

```json
{
  "expo": {
    "plugins": [
      [
        "expo-widgets",
        {
          "bundleIdentifier": "com.yourcompany.yourapp.widgets",
          "groupIdentifier": "group.com.yourcompany.yourapp",
          "widgets": [
            {
              "name": "StatsWidget",
              "displayName": "My Stats",
              "description": "Shows your daily stats at a glance",
              "supportedFamilies": ["systemSmall", "systemMedium", "systemLarge"]
            }
          ]
        }
      ]
    ]
  }
}
```

**Supported families:**
- `systemSmall` — 2×2 grid unit (most common)
- `systemMedium` — 4×2 grid unit
- `systemLarge` — 4×4 grid unit
- `accessoryCircular` — Lock screen circular widget
- `accessoryRectangular` — Lock screen rectangular widget

### Step 3: Create the Widget Component

Create a file e.g. `widgets/StatsWidget.tsx`:

```tsx
import { Text, VStack, HStack, Spacer } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  padding,
  background,
  cornerRadius,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, WidgetBase } from 'expo-widgets';

type Props = {
  streak: number;
  label: string;
  accent: string;
};

const StatsWidget = (p: WidgetBase<Props>) => {
  'widget';

  const isSmall = p.family === 'systemSmall';

  return (
    <VStack
      spacing={isSmall ? 6 : 12}
      modifiers={[
        background('black'),
        padding(16),
        cornerRadius(20),
      ]}
    >
      <Text modifiers={[font({ size: isSmall ? 28 : 40 })]}>🔥</Text>
      <Text
        modifiers={[
          font({ size: isSmall ? 36 : 56, weight: 'bold' }),
          foregroundStyle('white'),
        ]}
      >
        {p.streak}
      </Text>
      <Text
        modifiers={[
          font({ size: isSmall ? 12 : 16 }),
          foregroundStyle('#aaaaaa'),
        ]}
      >
        {p.label}
      </Text>
    </VStack>
  );
};

export default createWidget('StatsWidget', StatsWidget);
```

**Key rules for widget components:**
- Must include `'widget';` directive as the first line of the function body
- Must be self-contained (no network calls, hooks, or side effects at render time)
- Use only `@expo/ui/swift-ui` components — not React Native's `View`, `Text`, etc.
- Use modifiers from `@expo/ui/swift-ui/modifiers` for styling

### Step 4: Schedule a Timeline (from your main app)

In your main app (e.g. `App.tsx` or a screen):

```tsx
import { scheduleWidgetTimeline, reloadAllWidgets } from 'expo-widgets';

// Schedule data to be shown in widget over time
await scheduleWidgetTimeline('StatsWidget', [
  {
    date: new Date(),
    props: {
      streak: 7,
      label: 'Day Streak',
      accent: '#ff6b35',
    },
  },
  {
    date: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    props: {
      streak: 8,
      label: 'Day Streak',
      accent: '#ff6b35',
    },
  },
]);

// Or force-reload all widgets immediately
await reloadAllWidgets();
```

### Step 5: Handle Widget Interactions (iOS 17+)

For interactive widgets with buttons:

```tsx
import { Button } from '@expo/ui/swift-ui';

// Inside widget component:
<Button
  label="Complete"
  target="markDone"
  onPress={() => ({ streak: p.streak + 1 })}
/>
```

Listen for widget interaction events in your main app:

```tsx
import { addWidgetInteractionListener } from 'expo-widgets';

useEffect(() => {
  const sub = addWidgetInteractionListener((event) => {
    console.log('Widget button tapped:', event.target, event.data);
    // Sync state back into your app
  });
  return () => sub.remove();
}, []);
```

### Step 6: Build and Test

```bash
# Run on iOS simulator
npx expo run:ios

# Or build for device
eas build --platform ios --profile development
```

To preview widget in simulator:
1. Run app on simulator
2. Long press home screen → "+" → search your app → add widget

---

## APPROACH 2 — `@bittingz/expo-widgets` (iOS + Android, More Control)

Use this when you need Android support OR want to write raw SwiftUI/Kotlin for maximum design control.

### Step 1: Install

```bash
npm install @bittingz/expo-widgets
```

### Step 2: Folder Structure

```
project-root/
├── widgets/
│   ├── ios/
│   │   ├── MyWidget.swift        ← SwiftUI widget code
│   │   └── Module.swift          ← Optional shared data model
│   └── android/
│       ├── main/
│       │   └── java/
│       │       └── com/yourapp/
│       │           └── MyWidget.kt   ← Kotlin widget provider
│       └── res/
│           ├── layout/
│           │   └── my_widget.xml     ← Android widget layout
│           └── xml/
│               └── my_widget_info.xml ← Widget metadata
```

### Step 3: `app.json` Config

```json
{
  "expo": {
    "plugins": [
      [
        "@bittingz/expo-widgets",
        {
          "ios": {
            "devTeamId": "YOUR_APPLE_DEV_TEAM_ID",
            "widgets": [
              {
                "name": "MyWidget",
                "displayName": "My Widget",
                "description": "A beautiful home screen widget",
                "supportedFamilies": ["systemSmall", "systemMedium"]
              }
            ]
          },
          "android": {
            "widgets": [
              {
                "name": "MyWidget"
              }
            ]
          }
        }
      ]
    ]
  }
}
```

### Step 4: iOS Widget — SwiftUI (`MyWidget.swift`)

```swift
import WidgetKit
import SwiftUI

struct MyWidgetEntry: TimelineEntry {
    let date: Date
    let title: String
    let value: Int
    let color: Color
}

struct MyWidgetEntryView: View {
    var entry: MyWidgetEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            // Beautiful gradient background
            LinearGradient(
                colors: [Color(hex: "1a1a2e"), Color(hex: "16213e")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 8) {
                if family != .systemSmall {
                    Text("MY APP")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.white.opacity(0.5))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Spacer()

                Text("\(entry.value)")
                    .font(.system(size: family == .systemSmall ? 48 : 72, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)

                Text(entry.title)
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))

                Spacer()

                // Accent bar
                RoundedRectangle(cornerRadius: 4)
                    .fill(entry.color)
                    .frame(height: 4)
                    .frame(maxWidth: family == .systemSmall ? 60 : .infinity)
            }
            .padding()
        }
        .containerBackground(.clear, for: .widget)
    }
}

struct MyWidget: Widget {
    let kind: String = "MyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MyWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("My Widget")
        .description("Shows your stats at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> MyWidgetEntry {
        MyWidgetEntry(date: Date(), title: "Today", value: 42, color: .purple)
    }

    func getSnapshot(in context: Context, completion: @escaping (MyWidgetEntry) -> Void) {
        // Read shared data from UserDefaults App Group
        let defaults = UserDefaults(suiteName: "group.com.yourapp")
        let value = defaults?.integer(forKey: "widgetValue") ?? 0
        let title = defaults?.string(forKey: "widgetTitle") ?? "Today"
        completion(MyWidgetEntry(date: Date(), title: title, value: value, color: .purple))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MyWidgetEntry>) -> Void) {
        let defaults = UserDefaults(suiteName: "group.com.yourapp")
        let value = defaults?.integer(forKey: "widgetValue") ?? 0
        let title = defaults?.string(forKey: "widgetTitle") ?? "Today"
        let entry = MyWidgetEntry(date: Date(), title: title, value: value, color: .purple)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// Color helper
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
```

### Step 5: Android Widget Layout (`res/layout/my_widget.xml`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/widget_background"
    android:padding="16dp"
    android:gravity="center">

    <TextView
        android:id="@+id/widget_value"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="0"
        android:textColor="#FFFFFF"
        android:textSize="48sp"
        android:fontFamily="sans-serif-medium" />

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Today"
        android:textColor="#AAAAAA"
        android:textSize="13sp"
        android:layout_marginTop="4dp" />

    <View
        android:layout_width="60dp"
        android:layout_height="4dp"
        android:layout_marginTop="12dp"
        android:background="@drawable/accent_bar" />

</LinearLayout>
```

### Step 6: Android Widget Provider (`MyWidget.kt`)

```kotlin
package com.yourapp

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.content.SharedPreferences

class MyWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val prefs: SharedPreferences = context.getSharedPreferences("RNWidgetData", Context.MODE_PRIVATE)
        val value = prefs.getInt("widgetValue", 0)
        val title = prefs.getString("widgetTitle", "Today") ?: "Today"

        val views = RemoteViews(context.packageName, R.layout.my_widget)
        views.setTextViewText(R.id.widget_value, value.toString())
        views.setTextViewText(R.id.widget_title, title)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
```

### Step 7: Share Data from React Native → Widget

**iOS (UserDefaults App Group):**

```tsx
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const GROUP_ID = 'group.com.yourapp';

await SharedGroupPreferences.setItem('widgetValue', 42, GROUP_ID);
await SharedGroupPreferences.setItem('widgetTitle', 'Day Streak', GROUP_ID);
```

**Android (SharedPreferences via Native Module):**

Create `android/app/src/main/java/com/yourapp/RNSharedModule.kt`:

```kotlin
package com.yourapp

import com.facebook.react.bridge.*
import android.content.Context
import android.appwidget.AppWidgetManager
import android.content.ComponentName

class RNSharedModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "RNShared"

    @ReactMethod
    fun setItem(key: String, value: ReadableMap, promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences("RNWidgetData", Context.MODE_PRIVATE)
        val editor = prefs.edit()

        if (value.hasKey("intValue")) editor.putInt(key, value.getInt("intValue"))
        if (value.hasKey("stringValue")) editor.putString(key, value.getString("stringValue"))
        editor.apply()

        // Notify widget to refresh
        val manager = AppWidgetManager.getInstance(reactApplicationContext)
        val ids = manager.getAppWidgetIds(ComponentName(reactApplicationContext, MyWidget::class.java))
        val intent = android.content.Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        reactApplicationContext.sendBroadcast(intent)

        promise.resolve(null)
    }
}
```

Expose in your JS via a custom hook:

```tsx
import { NativeModules, Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';

const GROUP_ID = 'group.com.yourapp';

export async function syncWidgetData(data: { value: number; title: string }) {
  if (Platform.OS === 'ios') {
    await SharedGroupPreferences.setItem('widgetValue', data.value, GROUP_ID);
    await SharedGroupPreferences.setItem('widgetTitle', data.title, GROUP_ID);
  } else {
    await NativeModules.RNShared.setItem('widgetValue', { intValue: data.value });
    await NativeModules.RNShared.setItem('widgetTitle', { stringValue: data.title });
  }
}
```

---

## DESIGN BEST PRACTICES FOR BEAUTIFUL WIDGETS

### iOS Design Principles
1. **Use dark backgrounds** — deep navy, pure black, or dark gradients look premium
2. **Large bold numbers** — use SF Rounded or SF Pro Bold at 40–72pt for key metrics
3. **Accent colors** — single pop color (neon green, electric blue, vivid orange) against dark bg
4. **Minimal text** — no more than 2–3 text elements per widget
5. **Use `.containerBackground(.clear, for: .widget)`** for edge-to-edge gradient designs
6. **Adapt layouts for all 3 sizes** — check `@Environment(\.widgetFamily)`
7. **Use WidgetKit's `AccessoryWidget`** format for Lock Screen widgets (monochrome only)

### Android Design Principles
1. **Use `@drawable/widget_background`** — create a rounded rect shape drawable (radius 24dp)
2. **Respect Material You** — consider using dynamic color with `MaterialYou` API (Android 12+)
3. **Minimum widget size** — `minWidth="180dp"` and `minHeight="110dp"` in `appwidget-provider`
4. **Use RemoteViews** — only supported views: `TextView`, `ImageView`, `LinearLayout`, `FrameLayout`, `ProgressBar`, `Button`, `Chronometer`
5. **Widget padding** — always add 8dp system padding + your own inner padding (16dp recommended)

### Beautiful Color Palettes for Dark Widgets
```
Deep Space:    #0a0a0f → #1a1a2e (bg), #e94560 (accent)
Midnight:      #0d1117 → #161b22 (bg), #58a6ff (accent)
Forest Night:  #0f1923 → #1a2a1a (bg), #39d353 (accent)
Amber Glow:    #1a1200 → #2a1f00 (bg), #f0a500 (accent)
```

---

## LIVE ACTIVITIES (iOS 16.1+ Dynamic Island)

Available only via `expo-widgets` (official library). Define layout slots:

```tsx
import { createLiveActivity } from 'expo-widgets';
import { HStack, Text, VStack } from '@expo/ui/swift-ui';

type LiveProps = { eta: number; status: string; driverName: string };

const DeliveryActivity = (p: LiveProps) => {
  'widget';
  // ... layout using @expo/ui components
};

export default createLiveActivity('Delivery', {
  lockScreen: DeliveryActivity,
  dynamicIslandCompact: { leading: LeadingView, trailing: TrailingView },
  dynamicIslandExpanded: ExpandedView,
  dynamicIslandMinimal: MinimalView,
});
```

Start/update from app:

```tsx
import { startActivity, updateActivity, endActivity } from 'expo-widgets';

const id = await startActivity('Delivery', { eta: 25, status: 'On the way', driverName: 'Alex' });
await updateActivity(id, { eta: 10, status: 'Almost there', driverName: 'Alex' });
await endActivity(id);
```

---

## COMMON ERRORS & FIXES

| Error | Fix |
|-------|-----|
| `Widget not appearing in simulator` | Long press home → Edit → add widget manually |
| `App Group not working` | Ensure same Group ID in app.json AND in Swift code; rebuild with `npx expo run:ios` |
| `R unresolved reference (Android)` | Add `package com.yourapp.R` at top of Kotlin file, delete `/android` folder, rebuild |
| `expo-widgets not found in Expo Go` | Use dev build (`npx expo run:ios`), not Expo Go |
| `Widget data not updating` | Check that timeline is being rescheduled; call `reloadAllWidgets()` after data change |
| `SwiftUI preview crash` | Target must be set to the widget target in Xcode (not the main app) |
| `Android widget blank on first install` | Add `onEnabled()` override in AppWidgetProvider to handle first-time setup |

---

## RECOMMENDED PACKAGES

| Package | Purpose | Platform |
|---------|---------|----------|
| `expo-widgets` | Official React-based widgets (alpha) | iOS |
| `@bittingz/expo-widgets` | Native SwiftUI/Kotlin widgets | iOS + Android |
| `react-native-shared-group-preferences` | Share data app ↔ widget | iOS |
| `@bacons/apple-targets` | Advanced Xcode target management | iOS |
| `expo-linking` | Deep-link from widget tap into app | Both |
| `@expo/ui` | SwiftUI-mapped React components | iOS (widgets) |

---

## BUILD COMMANDS REFERENCE

```bash
# Development build (required, not Expo Go)
npx expo run:ios
npx expo run:android

# Prebuild (generate native folders without running)
npx expo prebuild --platform ios
npx expo prebuild --platform android

# EAS Build (cloud, production)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Clear cache and rebuild
npx expo run:ios --clean
```

---

## CHECKLIST BEFORE SUBMITTING

- [ ] Widget tested in all supported sizes (small, medium, large)
- [ ] Data syncing from app to widget working
- [ ] Deep link from widget tap navigates to correct screen in app
- [ ] Widget updates correctly when app data changes
- [ ] Tested on real device (not just simulator) for iOS
- [ ] App Group entitlements added to both app AND widget targets
- [ ] Android widget XML follows RemoteViews limitations
- [ ] Widget respects dark/light mode (iOS accessory widgets are always monochrome)
- [ ] Timeline refresh rate is reasonable (iOS limits: ~40–70 refreshes per day)