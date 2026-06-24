import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  // Configure Axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Handle global axios interceptors to catch maintenance mode (503) or token expiration (401)
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          if (error.response.status === 503 && error.response.data.isMaintenance) {
            setIsMaintenance(true);
            setMaintenanceMsg(error.response.data.message || 'Under Maintenance');
          }
          if (error.response.status === 401 && user) {
            // Token expired or invalid
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [user]);

  // Load profile on initialization if token exists
  useEffect(() => {
    const loadProfile = async () => {
      // First check if maintenance mode is active by fetching settings
      try {
        const settingsRes = await axios.get('/api/admin/settings');
        if (settingsRes.data.success && settingsRes.data.settings?.maintenanceMode) {
          // If maintenance mode is active, check if current user is admin
          // (if they have token, attempt profile load). Otherwise trigger maintenance immediately.
          if (!token) {
            setIsMaintenance(true);
            setMaintenanceMsg(settingsRes.data.settings.maintenanceMessage);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Safe to ignore: it will trigger maintenance interceptor if 503 is returned
      }

      if (token) {
        try {
          const res = await axios.get('/api/auth/profile');
          if (res.data.success) {
            setUser(res.data.user);
            setLang(res.data.user.preferredLanguage || 'en');
            localStorage.setItem('lang', res.data.user.preferredLanguage || 'en');
          }
        } catch (error) {
          console.error('Error loading profile:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, [token]);

  // Log in user
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        setLang(res.data.user.preferredLanguage || 'en');
        localStorage.setItem('lang', res.data.user.preferredLanguage || 'en');
        setIsMaintenance(false); // Reset maintenance on login
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  // Register user
  const register = async (name, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        setLang('en');
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed.'
      };
    }
  };

  // Log out
  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  // Toggle Language
  const changeLanguage = async (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    if (user) {
      try {
        await axios.put('/api/auth/language', { language: newLang });
        setUser({ ...user, preferredLanguage: newLang });
      } catch (e) {
        console.error('Failed to save language preference on backend:', e);
      }
    }
  };

  // Translations dictionary for bilingual support
  const t = (key) => {
    const dictionary = {
      en: {
        appName: 'FixMyArea',
        tagline: 'Community Infrastructure Reporting',
        home: 'Home',
        reportIssue: 'Report Issue',
        feed: 'Community Feed',
        map: 'Interactive Map',
        myReports: 'My Reports',
        notifications: 'Notifications',
        profile: 'Profile',
        admin: 'Admin Panel',
        employee: 'Employee Panel',
        logout: 'Log Out',
        login: 'Log In',
        register: 'Register',
        loading: 'Loading system...',
        welcome: 'Welcome to FixMyArea',
        heroText: 'Report public infrastructure issues in your neighborhood and track their resolution in real time.',
        quickReport: 'Report An Issue Now',
        exploreMap: 'Explore Interactive Map',
        statistics: 'Tamil Nadu Impact Overview',
        totalReports: 'Total Reports',
        resolvedIssues: 'Resolved Issues',
        activeIssues: 'Active Issues',
        districtsCovered: 'Districts Seeding',
        latestVerified: 'Latest Verified Infrastructure Issues',
        noIssues: 'No public reports available in your area.',
        submittedBy: 'Submitted by',
        anonymous: 'Anonymous Citizen',
        status: 'Status',
        severity: 'Severity',
        category: 'Category',
        date: 'Date',
        comments: 'Comments',
        details: 'View Details',
        emergency: 'Emergency Report',
        upvote: 'Upvote',
        follow: 'Follow'
      },
      ta: {
        appName: 'பிக்ஸ்மைஏரியா',
        tagline: 'சமூக உள்கட்டமைப்பு புகாரளிப்பு',
        home: 'முகப்பு',
        reportIssue: 'புகாரளிக்கவும்',
        feed: 'சமூக செய்திகள்',
        map: 'ஊடாடும் வரைபடம்',
        myReports: 'எனது புகார்கள்',
        notifications: 'அறிவிப்புகள்',
        profile: 'சுயவிவரம்',
        admin: 'நிர்வாகக் குழு',
        employee: 'பணியாளர் குழு',
        logout: 'வெளியேறு',
        login: 'உள்நுழைய',
        register: 'பதிவு செய்க',
        loading: 'ஏற்றப்படுகிறது...',
        welcome: 'பிக்ஸ்மைஏரியா-விற்கு வரவேற்கிறோம்',
        heroText: 'உங்கள் சுற்றுப்புறத்தில் உள்ள பொது உள்கட்டமைப்பு சிக்கல்களைப் புகாரளித்து, அவற்றின் தீர்வை உடனுக்குடன் கண்காணிக்கவும்.',
        quickReport: 'உடனடியாக புகாரளிக்கவும்',
        exploreMap: 'வரைபடத்தை ஆராயுங்கள்',
        statistics: 'தமிழ்நாடு தாக்க கண்ணோட்டம்',
        totalReports: 'மொத்த புகார்கள்',
        resolvedIssues: 'தீர்க்கப்பட்ட சிக்கல்கள்',
        activeIssues: 'செயலில் உள்ள சிக்கல்கள்',
        districtsCovered: 'பார்வையில் உள்ள மாவட்டங்கள்',
        latestVerified: 'சமீபத்திய சரிபார்க்கப்பட்ட புகார்கள்',
        noIssues: 'உங்கள் பகுதியில் பொது புகார்கள் எதுவும் இல்லை.',
        submittedBy: 'புகாரளித்தவர்',
        anonymous: 'பெயர் குறிப்பிடாத குடிமகன்',
        status: 'நிலைமை',
        severity: 'தீவிரம்',
        category: 'வகை',
        date: 'தேதி',
        comments: 'கருத்துகள்',
        details: 'விவரங்களைப் பார்க்க',
        emergency: 'அவசர புகார்',
        upvote: 'ஆதரவு',
        follow: 'பின்தொடர்'
      }
    };
    return dictionary[lang]?.[key] || key;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      lang,
      isMaintenance,
      maintenanceMsg,
      setIsMaintenance,
      login,
      register,
      logout,
      changeLanguage,
      t
    }}>
      {children}
    </AuthContext.Provider>
  );
};
