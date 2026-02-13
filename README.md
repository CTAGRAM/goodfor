# GoodFor - Personalized Product Scanner & Wellness Assistant

GoodFor is an advanced mobile application built with **React Native (Expo)** that empowers users to make healthier choices by scanning food and beauty products. It provides personalized safety analysis based on individual and family health profiles, including allergies, dietary restrictions, and skin sensitivities.

## 🚀 Key Features

### 🔍 Intelligent Scanning
- **Barcode Scanning**: Instantly retrieve product data using OpenFoodFacts and OpenBeautyFacts APIs.
- **Safety Analysis**: Real-time evaluation of ingredients against user profiles.
- **Visual Scores**: Easy-to-understand ratings (Safe, Caution, Avoid) with color-coded badges.

### 👤 Personalized Profiles
- **Multi-Profile Support**: Manage profiles for the whole family (children, elderly, pets).
- **Health Constraints**: detailed tracking for:
    - **Allergies** (Nuts, Dairy, Gluten, etc.)
    - **Dietary Preferences** (Vegan, Keto, Halal, etc.)
    - **Health Conditions** (Hypertension, Diabetes)
    - **Skin Types & Concerns** (Sensitive, Acne-prone, Pregnancy-safe)

### 🌿 Advanced Insights
- **Nutri-Score & NOVA**: Nutritional quality and processing level indicators.
- **Environmental Impact**: Eco-Score, carbon footprint estimates, and recyclability info.
- **Additive Analysis**: Identification of harmful additives and their risks.
- **Better Alternatives**: Smart recommendations for healthier product swaps.

### 💬 AI Wellness Assistant
- **Context-Aware Chat**: Ask questions about products, nutrition, or health goals.
- **Smart Suggestions**: Auto-generated questions based on scanned products (e.g., "Is this safe for my toddler?").

## 🛠 Tech Stack

- **Frontend**: React Native, Expo Router, Lucide Icons
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Integration**: OpenAI (GPT-4o) for chat and advanced analysis
- **Data Sources**: OpenFoodFacts, OpenBeautyFacts
- **Monetization**: RevenueCat (Subscription management)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/CTAGRAM/goodfor.git
    cd goodfor
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file with your API keys:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
    ```

4.  **Run the App**
    ```bash
    npx expo start
    ```

## 📱 Screenshots

*(Add screenshots of Home, Scan, and Product Summary screens here)*

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

---

Built with ❤️ by [CTAGRAM](https://github.com/CTAGRAM)
