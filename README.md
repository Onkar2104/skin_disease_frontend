# 📱 Skin Disease Classification – Frontend (React Native)

This repository contains the **React Native (Expo) frontend** for the Skin Disease Classification system.  
The app allows users to upload skin images and receive **AI-powered disease predictions** from a backend API.

---

## 🚀 Project Overview

The mobile application serves as the **user-facing interface** of the system.

Users can:
- Capture or upload skin images
- Send images to the backend API
- View predicted skin disease
- View confidence score
- Use a clean and responsive mobile UI

---

## 🔗 Backend Repository

👉 **Django + AI/ML Backend API:**  
🔗 https://github.com/Onkar2104/skin_disease.git

> This frontend communicates with the backend via REST APIs for ML inference.

---

## 🎯 Key Features

- 📷 Image upload (camera & gallery)
- 🌐 REST API integration
- 📊 Disease prediction with confidence score
- 📱 Clean & responsive UI
- ⚡ Fast API response handling
- 🔐 Authentication-ready structure

---

## 🛠️ Tech Stack

- React Native
- Expo
- TypeScript
- Axios
- React Navigation
- Android & iOS support

---

## 📦 Project Structure

SKIN_DISEASE_FRONTEND/   
│   
├── app/                           # App routes & screens (Expo Router)   
│ ├── (tabs)/                      # Tab-based navigation   
│ │ ├── _layout.tsx   
│ │ ├── index.tsx   
│ │ └── explore.tsx   
│ │   
│ ├── auth/                        # Authentication screens   
│ ├── _layout.tsx                  # Root layout   
│ └── modal.tsx   
│   
├── assets/                        # Images, icons   
├── components/                    # Reusable UI components   
├── constants/                     # App constants   
├── hooks/                         # Custom hooks   
├── scripts/                       # Utility scripts  
│   
├── app.json                       # Expo configuration   
├── package.json                   # Dependencies       
├── tsconfig.json                  # TypeScript config    
├── expo-env.d.ts    
├── eslint.config.js  
├── .gitignore  
└── README.md  


---

## ⚙️ Installation & Setup

Follow the steps below to run the frontend locally.

---

### ✅ Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Expo CLI

1. Install Expo CLI:
```bash
npm install -g expo-cli
```
2. Clone the repository:
```bash
git clone https://github.com/Onkar2104/skin_disease_frontend.git
```

3. Install Dependencies
```bash
npm install
```

4. Run the app
```bash
npx expo start
```
Then:
  Press a → Android Emulator
  Press i → iOS Simulator
  Scan QR → Expo Go App (Mobile)

5. Access the app in your browser at:
```bash
  http://localhost:8000/api/predict/
```

---

### 🔮 Future Enhancements
- User authentication  
- Prediction history  
- Push notifications    
- Doctor consultation feature   
- Multi-language support  

---

### ⚠️ Disclaimer
It does not replace professional medical advice.

---

### 👨‍💻 Author
[Onkar Ijare](https://github.com/Onkar2104)

---
