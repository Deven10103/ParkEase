# 🚗✨ParkEase

## Gateless Smart Parking Management App with Machine Vision📸🔍


### Project Description

**ParkEase** is an innovative Parking Management Application that leverages **Machine Vision** to automate license plate scanning — enabling a gateless parking experience. Cars can simply drive in without stopping at gates; a camera scans their license plate, and the number is extracted using Machine Learning.
This application also has the feature of dynamic price that the admin can disable if they like on a parking location.The dynamic price is calculated by different factors like in peak working hours the parking locations which are near some offices may increase,the prices may increase based on demand or weather conditions as well,

This real-world project combines cutting-edge technologies across **Machine Learning** and **Web Development** to build a fully functional smart parking system. Violators are automatically detected and reported to parking enforcement, enhancing security and operational efficiency.

The app features a comprehensive simulator built in Python using **YOLOv8** for license plate detection and uses a modern tech stack including:


- **Frontend:** ⚛️ Next.js, React
- **Backend:** 🐍 Python
- **Database:** 🍃 MongoDB
- **Machine Learning:** 🤖 YOLOv8 for real-time license plate recognition
- **Mapping:** 🗺️ Google Maps integration for location visualization




---

### 🚀 Setup Instructions

Follow these steps to get the ParkEase app running locally on your machine:

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/parkease.git
cd parkease
```

#### Install Dependencies
```bash
npm install
```
#### Set environment variables
Create a .env in the root directory and add the following variables (replace placeholders with your actual credentials):
```
# Google Maps API
NEXT_PUBLIC_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_MAPS_API_KEY_OLD=your_old_google_maps_api_key

# MongoDB
MONGODB_URI=your_mongodb_connection_uri

# Stripe
NEXT_PUBLIC_STRIPE_APPLICATION_ID=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Resend API
RESEND_API_KEY=your_resend_api_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGNUP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# Application Key
APP_KEY=your_app_key

# Email Configuration
GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password
VIOLATION_EMAIL=your_violation_email

# Weather API KEY From weatherapi.com
WEATHERAPI_KEY=your_weatherapi_key
```
#### Start the development server
```bash
npm run dev
```
🌐 Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to see ParkEase in action.
