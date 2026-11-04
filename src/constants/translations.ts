export type Language = 'en' | 'tr';

export const TRANSLATIONS = {
  en: {
    // Brand Rule: App name is NEVER translated
    appName: 'Skin Diary',

    // Tab Navigation
    tabRoutine: 'Routine',
    tabCabinet: 'Cabinet',
    tabDiary: 'Diary',

    // Routine Screen
    routineTitle: 'Skincare Routine',
    morningRoutine: 'Morning Routine',
    eveningRoutine: 'Evening Routine',
    routineCompletedBtn: 'Routine Completed! Log Skin',
    stepsCompleted: 'steps completed',
    allStepsDone: 'All steps completed for this ritual ✨',

    // Cabinet Screen
    cabinetTitle: 'Skincare Cabinet',
    addProduct: 'Add Product',
    newProductTitle: 'New Skincare Product',
    productName: 'Product Name',
    category: 'Category',
    openedDate: 'Opened Date',
    saveProduct: 'Save to Cabinet',
    cancel: 'Cancel',
    emptyCabinet: 'No products in your cabinet yet.',
    openedLabel: 'Opened',

    // Categories
    catCleanser: 'Cleanser',
    catToner: 'Toner',
    catSerum: 'Serum',
    catMoisturizer: 'Moisturizer',
    catSunscreen: 'Sunscreen',
    catMasks: 'Masks & Treatments',
    catFacialOil: 'Facial Oil',

    // Diary Screen
    howDoesSkinFeel: 'How does your skin feel today?',
    howDoesSkinFeelOn: 'How does your skin feel on',
    saveTodayLog: 'Save Today’s Log',
    saveLogFor: 'Save Log for',
    allHistory: 'All Recorded History',
    noLogsYet: 'No Skin Logs Yet',
    startTrackingPrompt: 'Tap any emoji above to start tracking your daily skin evolution.',
    dailyInsight: 'Daily Insight',
    noEntryForDate: 'No skin entry recorded for this date.',
    jumpToToday: 'Today',

    // Settings Screen
    settingsTitle: 'Settings',
    done: 'Done',
    profileManagement: 'PROFILE MANAGEMENT',
    name: 'NAME',
    email: 'EMAIL',
    save: 'Save',
    savedAlert: 'Saved ✨',
    nameUpdated: 'Your profile name has been updated.',
    uploadPhoto: 'Upload Profile Photo',
    editPhoto: 'Edit Profile Photo',
    removePhoto: 'Remove Photo',
    chooseAvatar: 'Choose Cute Avatar',
    chooseGallery: 'Choose from Gallery',
    takePhoto: 'Take a Photo',
    appSettings: 'APP SETTINGS',
    appearance: 'Dark Mode',
    appearanceSubDark: 'Dark theme active',
    appearanceSubLight: 'Light cream theme active',
    language: 'Language',
    languageSub: 'Choose interface language',
    logOut: 'Log Out',
    logOutConfirm: 'Are you sure you want to log out of Skin Diary?',
    versionInfo: 'Version 1.0.0 • Mindful Skincare Rituals',

    // Auth Screens
    signIn: 'Sign In',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    signInSubtitle: 'Sign in to your mindful skincare ritual',
    signUpSubtitle: 'Begin your personalized, mindful skin ritual',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    logIn: 'Log In',
    quickDemo: '✨ Quick Demo Sign-In (Zeynep)',
    yourName: 'YOUR NAME',
  },
  tr: {
    // Brand Rule: App name is NEVER translated
    appName: 'Skin Diary',

    // Tab Navigation
    tabRoutine: 'Rutin',
    tabCabinet: 'Dolap',
    tabDiary: 'Günlük',

    // Routine Screen
    routineTitle: 'Cilt Bakım Rutini',
    morningRoutine: 'Sabah Rutini',
    eveningRoutine: 'Akşam Rutini',
    routineCompletedBtn: 'Rutin Tamamlandı! Cildi Kaydet',
    stepsCompleted: 'adım tamamlandı',
    allStepsDone: 'Bu ritüel için tüm adımlar tamamlandı ✨',

    // Cabinet Screen
    cabinetTitle: 'Cilt Bakım Dolabı',
    addProduct: 'Ürün Ekle',
    newProductTitle: 'Yeni Cilt Bakım Ürünü',
    productName: 'Ürün Adı',
    category: 'Kategori',
    openedDate: 'Açılış Tarihi',
    saveProduct: 'Dolaba Kaydet',
    cancel: 'İptal',
    emptyCabinet: 'Dolabınızda henüz ürün bulunmuyor.',
    openedLabel: 'Açılış',

    // Categories
    catCleanser: 'Temizleyici',
    catToner: 'Tonik',
    catSerum: 'Serum',
    catMoisturizer: 'Nemlendirici',
    catSunscreen: 'Güneş Kremi',
    catMasks: 'Maske ve Bakımlar',
    catFacialOil: 'Yüz Yağı',

    // Diary Screen
    howDoesSkinFeel: 'Bugün cildin nasıl hissediyor?',
    howDoesSkinFeelOn: 'Tarihindeki cilt hissi:',
    saveTodayLog: 'Bugünün Kaydını Kaydet',
    saveLogFor: 'Tarihi İçin Kaydet:',
    allHistory: 'Tüm Kayıt Geçmişi',
    noLogsYet: 'Henüz Cilt Kaydı Yok',
    startTrackingPrompt: 'Günlük cilt değişimini takip etmek için yukarıdaki emojilerden birini seçin.',
    dailyInsight: 'Günlük Değerlendirme',
    noEntryForDate: 'Bu tarih için henüz bir kayıt bulunmuyor.',
    jumpToToday: 'Bugün',

    // Settings Screen
    settingsTitle: 'Ayarlar',
    done: 'Tamam',
    profileManagement: 'PROFİL YÖNETİMİ',
    name: 'İSİM',
    email: 'E-POSTA',
    save: 'Kaydet',
    savedAlert: 'Kaydedildi ✨',
    nameUpdated: 'Profil isminiz güncellendi.',
    uploadPhoto: 'Profil Fotoğrafı Yükle',
    editPhoto: 'Profil Fotoğrafını Düzenle',
    removePhoto: 'Fotoğrafı Kaldır',
    chooseAvatar: 'Sevimli Avatar Seç',
    chooseGallery: 'Galeriden Seç',
    takePhoto: 'Fotoğraf Çek',
    appSettings: 'UYGULAMA AYARLARI',
    appearance: 'Karanlık Mod',
    appearanceSubDark: 'Karanlık tema aktif',
    appearanceSubLight: 'Açık krem tema aktif',
    language: 'Dil',
    languageSub: 'Arayüz dilini seçin',
    logOut: 'Çıkış Yap',
    logOutConfirm: 'Skin Diary uygulamasından çıkış yapmak istediğinize emin misiniz?',
    versionInfo: 'Versiyon 1.0.0 • Bilinçli Cilt Bakım Ritüelleri',

    // Auth Screens
    signIn: 'Giriş Yap',
    signUp: 'Kayıt Ol',
    createAccount: 'Hesap Oluştur',
    signInSubtitle: 'Bilinçli cilt bakım ritüelinize giriş yapın',
    signUpSubtitle: 'Kişiselleştirilmiş, bilinçli cilt ritüelinize başlayın',
    dontHaveAccount: 'Hesabınız yok mu?',
    alreadyHaveAccount: 'Zaten hesabınız var mı?',
    logIn: 'Giriş Yap',
    quickDemo: '✨ Hızlı Demo Girişi (Zeynep)',
    yourName: 'İSMİNİZ',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;
