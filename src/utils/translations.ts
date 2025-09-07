export const translations = {
  id: {
    // Navigation
    pos: 'Kasir',
    products: 'Produk',
    history: 'Riwayat',
    settings: 'Pengaturan',
    
    // POS
    cart: 'Keranjang',
    total: 'Total',
    payment: 'Pembayaran',
    checkout: 'Bayar',
    cash: 'Tunai',
    card: 'Kartu',
    crypto: 'Kripto',
    
    // Products
    name: 'Nama',
    price: 'Harga',
    stock: 'Stok',
    category: 'Kategori',
    addProduct: 'Tambah Produk',
    editProduct: 'Edit Produk',
    
    // Common
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Edit',
    add: 'Tambah',
    quantity: 'Jumlah',
    
    // Wallet
    connectWallet: 'Hubungkan Dompet',
    walletConnected: 'Dompet Terhubung',
    balance: 'Saldo',
    disconnect: 'Putuskan',
    connecting: 'Menghubungkan...',
    walletSettings: 'Pengaturan Dompet',
    
    // Receipt
    receipt: 'Struk',
    sendReceipt: 'Kirim Struk',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    
    // Payment
    paymentMethod: 'Metode Pembayaran',
    cashReceived: 'Uang Diterima',
    change: 'Kembalian',
    processPayment: 'Proses Pembayaran',
    paymentSuccess: 'Pembayaran Berhasil',
    paymentFailed: 'Pembayaran Gagal',
    
    // Crypto
    selectCurrency: 'Pilih Mata Uang',
    usdc: 'MIDEN_STABLE', // Tetap menggunakan nama properti yang sama untuk kompatibilitas
    cryptoPayment: 'Pembayaran Kripto',
    transactionHash: 'Hash Transaksi',
    confirmingPayment: 'Mengkonfirmasi Pembayaran...',
    
    // Business
    businessName: 'Nama Toko',
    businessAddress: 'Alamat Toko',
    businessPhone: 'Nomor Telepon',
    businessInfo: 'Informasi Toko',
    
    // Messages
    emptyCart: 'Keranjang Kosong',
    selectProducts: 'Pilih produk untuk memulai transaksi',
    noProducts: 'Belum ada produk',
    addFirstProduct: 'Tambahkan produk pertama Anda untuk mulai berjualan',
    noTransactions: 'Belum ada transaksi',
    transactionsWillAppear: 'Transaksi akan muncul di sini setelah Anda melakukan penjualan',
    
    // Settings
    language: 'Bahasa',
    currency: 'Mata Uang',
    notifications: 'Notifikasi',
    
    // Status
    completed: 'Selesai',
    pending: 'Pending',
    failed: 'Gagal',
    
    // Time
    today: 'Hari Ini',
    yesterday: 'Kemarin',
    thisWeek: '7 Hari Terakhir',
    thisMonth: '30 Hari Terakhir',
    allTime: 'Semua Waktu',

    // Wallet specific messages
    installMidenWallet: 'Silakan install Miden Wallet untuk melanjutkan',
    midenWalletRequired: 'Miden Wallet diperlukan untuk pembayaran crypto',
    walletConnectionFailed: 'Gagal menghubungkan dompet',
    walletNotFound: 'Dompet tidak ditemukan',
    connectingToWallet: 'Menghubungkan ke Miden Wallet...',
    walletDisconnected: 'Dompet terputus',
  },
  en: {
    // Navigation
    pos: 'POS',
    products: 'Products',
    history: 'History',
    settings: 'Settings',
    
    // POS
    cart: 'Cart',
    total: 'Total',
    payment: 'Payment',
    checkout: 'Checkout',
    cash: 'Cash',
    card: 'Card',
    crypto: 'Crypto',
    
    // Products
    name: 'Name',
    price: 'Price',
    stock: 'Stock',
    category: 'Category',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    quantity: 'Quantity',
    
    // Wallet
    connectWallet: 'Connect Wallet',
    walletConnected: 'Wallet Connected',
    balance: 'Balance',
    disconnect: 'Disconnect',
    connecting: 'Connecting...',
    walletSettings: 'Wallet Settings',
    
    // Receipt
    receipt: 'Receipt',
    sendReceipt: 'Send Receipt',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    
    // Payment
    paymentMethod: 'Payment Method',
    cashReceived: 'Cash Received',
    change: 'Change',
    processPayment: 'Process Payment',
    paymentSuccess: 'Payment Successful',
    paymentFailed: 'Payment Failed',
    
    // Crypto
    selectCurrency: 'Select Currency',
    usdc: 'MIDEN_STABLE', // Tetap menggunakan nama properti yang sama untuk kompatibilitas
    cryptoPayment: 'Crypto Payment',
    transactionHash: 'Transaction Hash',
    confirmingPayment: 'Confirming Payment...',
    
    // Business
    businessName: 'Business Name',
    businessAddress: 'Business Address',
    businessPhone: 'Phone Number',
    businessInfo: 'Business Information',
    
    // Messages
    emptyCart: 'Cart is Empty',
    selectProducts: 'Select products to start a transaction',
    noProducts: 'No products yet',
    addFirstProduct: 'Add your first product to start selling',
    noTransactions: 'No transactions yet',
    transactionsWillAppear: 'Transactions will appear here after you make sales',
    
    // Settings
    language: 'Language',
    currency: 'Currency',
    notifications: 'Notifications',
    
    // Status
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'Last 7 Days',
    thisMonth: 'Last 30 Days',
    allTime: 'All Time',

    // Wallet specific messages
    installMidenWallet: 'Please install Miden Wallet to continue',
    midenWalletRequired: 'Miden Wallet is required for crypto payments',
    walletConnectionFailed: 'Failed to connect wallet',
    walletNotFound: 'Wallet not found',
    connectingToWallet: 'Connecting to Miden Wallet...',
    walletDisconnected: 'Wallet disconnected',
  },
};

export const useTranslation = (language: 'id' | 'en') => {
  return (key: keyof typeof translations.id) => {
    return translations[language][key] || key;
  };
};