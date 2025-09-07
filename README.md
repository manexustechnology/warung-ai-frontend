# Frontend Warung AI - Miden Wallet Integration

## 📋 Description

Frontend Warung AI is a modern Point of Sale (POS) application integrated with **Miden Wallet Extension Google Chrome**. This application allows users to:

- 🛒 **Point of Sale (POS)** - Modern cashier system with shopping cart
- 🏪 **Marketplace** - Buy and sell products platform
- 📦 **Product Management** - Manage product catalog easily
- 💰 **DeFi Integration** - Lending, staking, and yield farming
- 📊 **Transaction History** - Complete tracking of all transactions
- 🔗 **Miden Wallet** - Secure connection with Miden blockchain

## 🚀 Key Features

### **1. Point of Sale (POS)**
- Interactive shopping cart
- Multiple payment methods (Cash, Card, Crypto)
- Real-time calculation
- Receipt generation
- WhatsApp/Telegram integration

### **2. Marketplace**
- Complete product catalog
- Search and filter products
- Product categories
- Inventory management

### **3. DeFi Integration**
- **MIDEN Lending Pool** (6.5% APY)
- **USDC Lending Pool** (4.2% APY)
- **MIDEN Staking Pool** (8.5% APY)
- **MIDEN Yield Farming** (12.5% APY)
- Risk assessment tools
- Real-time APY calculation

### **4. Miden Wallet Integration**
- Chrome Extension support
- Real-time balance display
- Secure transaction signing
- Auto-reconnection
- Development mode with mock data

## 🛠️ Technologies Used

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications
- **Date-fns** - Date utilities
- **QRCode** - QR Code generation

## 📦 Prerequisites

Before starting, make sure you have installed:

- **Node.js** (version 18 or newer)
- **npm** or **yarn**
- **Miden Wallet Extension** (Google Chrome)
- **Git** (for cloning repository)

## 🔧 Dependencies Installation

### **Step 1: Clone Repository**
```bash
git clone <repository-url>
cd miden-warung-ai/frontend
```

### **Step 2: Install Dependencies**
```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### **Step 3: Install Miden Wallet Extension**
1. Open Google Chrome
2. Visit Chrome Web Store
3. Search for "Miden Wallet" or install from official link
4. Add to Chrome and activate extension

## 🚀 Running Frontend Locally

### **Step 1: Start Development Server**
```bash
# Using npm
npm run dev

# Or using yarn
yarn dev
```

### **Step 2: Open Browser**
- Application will run at: `http://localhost:5173`
- Hot reload automatically active
- Console log for debugging

### **Step 3: Connect Miden Wallet**
1. Click **"Connect"** button in header
2. Select **"Miden Wallet Extension"**
3. Approve connection in extension popup
4. Wallet address and balance will appear

## 🔧 Configuration

### **Environment Variables**
Create `.env.local` file in frontend root:

```bash
# Miden Network Configuration
VITE_MIDEN_NETWORK=testnet
VITE_MIDEN_RPC_URL=https://testnet.miden.io
VITE_MIDEN_EXPLORER_URL=https://explorer.testnet.miden.io

# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# Development Mode
VITE_DEV_MODE=true
VITE_MOCK_WALLET=true
```

### **Vite Configuration**
File `vite.config.ts` is configured for:
- React support
- TypeScript support
- Tailwind CSS
- Hot reload
- Port 5173

## 📱 Application Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Layout/         # Header, Sidebar, Footer
│   │   ├── POS/            # Point of Sale components
│   │   ├── DeFi/           # DeFi integration
│   │   └── Test/           # Test components (hidden)
│   ├── utils/              # Utility functions
│   │   ├── midenFixed.ts   # Miden wallet integration
│   │   └── translations.ts # Multi-language support
│   ├── store/              # Zustand state management
│   ├── config/             # Configuration files
│   └── App.tsx             # Main App component
├── public/                 # Static assets
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind CSS config
```

## 🧪 Testing

### **Test Menus (Hidden by Default)**
Test menus are hidden by default. To show them:

```bash
# Set environment variable
export REACT_APP_SHOW_TEST_MENUS=true

# Or edit frontend/src/config/maintenance.ts
showTestMenus: true
```

### **Available Tests**
- **Simple Test** - Basic wallet connection
- **Debug Test** - Detailed debugging info
- **Safe Test** - Safe connection testing
- **Robust Test** - Error handling testing
- **Final Test** - Complete functionality test
- **Disconnect Test** - Disconnect functionality

## 🔗 Miden Wallet Integration

### **Chrome Extension Communication**
- **Content Script** - Bridge between web app and extension
- **Background Script** - Handle wallet operations
- **Message Passing** - Secure communication
- **Auto-reconnection** - Persistent connection

### **Supported Operations**
- ✅ **Connect/Disconnect** - Wallet connection
- ✅ **Get Balance** - Real-time balance
- ✅ **Get Address** - Wallet address
- ✅ **Sign Transaction** - Transaction signing
- ✅ **Get Storage** - Extension storage access

### **Development Mode**
- Mock wallet data for development
- Fake balance and address
- Simulated transaction responses
- No real blockchain interaction

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Wallet Not Detected**
```bash
# Make sure extension is active
# Refresh page (Ctrl + F5)
# Check console for errors
```

#### **2. Build Error**
```bash
# Clear cache
npm run build -- --force
# Or
yarn build --force
```

#### **3. Hot Reload Not Working**
```bash
# Restart dev server
npm run dev
# Or
yarn dev
```

#### **4. TypeScript Errors**
```bash
# Check types
npm run build
# Or
yarn build
```

### **Debug Mode**
Enable debug mode in browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📚 Additional Documentation

- **API Documentation** - Backend API endpoints
- **Miden Wallet Guide** - Extension usage
- **DeFi Integration** - Pool management
- **Test Menus Guide** - Testing functionality

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - See LICENSE file for details.

## 🆘 Support

- **Issues** - GitHub Issues
- **Discord** - Miden Community
- **Documentation** - Miden Docs

---

**Status**: ✅ **Frontend ready to use with Miden Wallet Integration!**

**Last Updated**: September 2024