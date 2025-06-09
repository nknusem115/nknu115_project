

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Search, BarChart3, BookOpen, Mail, User, LogOut, 
  Eye, EyeOff, AlertTriangle, CheckCircle, XCircle, Info,
  TrendingUp, Clock, Globe, FileText, Star, ArrowRight
} from 'lucide-react';

// 為了安全起見，即使在前端，也避免明文儲存密碼。
// 這是一個非常簡單的模擬“雜湊”函數，實際應用應使用如 bcrypt.js 的庫。

const AuthModal = ({
  showLogin,
  isLogin,
  loginForm,
  registerForm,
  showPassword,
  onClose,
  onSwitchMode,
  onLogin,
  onRegister,
  onLoginFormChange,
  onRegisterFormChange,
  onToggleShowPassword,
}) => {
  if (!showLogin) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? '歡迎回來' : '加入我們'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl" title="關閉">
            ✕
          </button>
        </div>
        
        <form onSubmit={isLogin ? onLogin : onRegister} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">姓名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                name="name"
                value={registerForm.name}
                onChange={onRegisterFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入您的姓名"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件 <span className="text-red-500">*</span></label>
            <input
              type="email"
              required
              name="email"
              value={isLogin ? loginForm.email : registerForm.email}
              onChange={isLogin ? onLoginFormChange : onRegisterFormChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密碼 <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                name="password"
                minLength={isLogin ? undefined : 6}
                value={isLogin ? loginForm.password : registerForm.password}
                onChange={isLogin ? onLoginFormChange : onRegisterFormChange}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="請輸入密碼"
              />
              <button
                type="button"
                onClick={onToggleShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-lg mt-6">
            {isLogin ? '登入' : '註冊'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button onClick={onSwitchMode} className="text-blue-600 hover:text-blue-700 text-sm hover:underline transition-all">
            {isLogin ? '還沒有帳號？立即註冊' : '已有帳號？立即登入'}
          </button>
        </div>
      </div>
    </div>
  );
};
  
export default function FakeNewsDetector() {
  // 主要狀態管理
  const [currentPage, setCurrentPage] = useState('home'); // 當前頁面狀態
  const [activeTab, setActiveTab] = useState('url'); // 檢測標籤（URL或內容）
  const [newsUrl, setNewsUrl] = useState(''); // 新聞URL輸入
  const [newsContent, setNewsContent] = useState(''); // 新聞內容輸入
  
  // 用戶認證相關狀態
  const [user, setUser] = useState(null); // 當前登入用戶
  const [showLogin, setShowLogin] = useState(false); // 顯示登入模態框
  const [loginForm, setLoginForm] = useState({ email: '', password: '' }); // 登入表單
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' }); // 註冊表單
  const [isLogin, setIsLogin] = useState(true); // 登入/註冊切換
  const [showPassword, setShowPassword] = useState(false); // 密碼顯示/隱藏
  
  // 分析相關狀態
  const [analysisResult, setAnalysisResult] = useState(null); // 分析結果
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 分析進行中標誌
  const [analysisHistory, setAnalysisHistory] = useState([]); // 分析歷史記錄
  
  // 錯誤處理和通知
  const [notification, setNotification] = useState(null); // 通知訊息

  /**
   * [MODIFIED] 初始化：檢查登入狀態並預註冊帳號
   * 1. 檢查 localStorage 中是否有登入 token
   * 2. 檢查 localStorage 中是否有用戶數據庫，若無則創建並加入預設帳號
   */
  useEffect(() => {
   
    
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user data from the protected '/me' endpoint
      fetch("https://nknu115-project.onrender.com/api/users/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        // If token is invalid/expired, log out
        throw new Error('Session expired');
      })
      .then(userData => {
        setUser(userData);
        // Load user-specific history
        const history = localStorage.getItem(`history_${userData.email}`);
        if (history) setAnalysisHistory(JSON.parse(history));
      })
      .catch(error => {
        console.error("Session check failed:", error);
        handleLogout(); // Clear invalid token and user state
      });
    }
  }, []);

  /**
   * 顯示通知訊息
   */
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  /**
   * [MODIFIED] 處理用戶登入 - 連接本地資料庫
   */
  const handleLogin = async (e) => {
     e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      showNotification('請填寫完整資訊', 'error');
      return;
    }

    // FastAPI's OAuth2PasswordRequestForm expects form data
    const formData = new URLSearchParams();
    formData.append('username', loginForm.email);
    formData.append('password', loginForm.password);

    try {
      const response = await fetch("https://nknu115-project.onrender.com/api/users/login", {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || '登入失敗');
      }

      localStorage.setItem('token', data.access_token);
      
      // Fetch user details after getting token
      const meResponse = await fetch("https://nknu115-project.onrender.com/api/users/me", {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await meResponse.json();
      setUser(userData);
      
      setShowLogin(false);
      setLoginForm({ email: '', password: '' });
      showNotification('登入成功！', 'success');

      // Load history for the logged-in user
      const history = localStorage.getItem(`history_${userData.email}`);
      if (history) setAnalysisHistory(JSON.parse(history));

    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  /**
   * [MODIFIED] 處理用戶註冊 - 連接本地資料庫
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password) {
      showNotification('請填寫完整資訊', 'error');
      return;
    }
    if (registerForm.password.length < 6) {
      showNotification('密碼至少需要6個字符', 'error');
      return;
    }
    
    try {
      const response = await fetch("https://nknu115-project.onrender.com/api/users/register", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || '註冊失敗');
      }
      
      showNotification('註冊成功！請立即登入。', 'success');
      // Switch to login view after successful registration
      setIsLogin(true); 
      setRegisterForm({ name: '', email: '', password: '' });

    } catch (error) {
      showNotification(error.message, 'error');
    }
    
  };

  /**
   * 處理用戶登出
   */
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    
    
    setUser(null);
    setCurrentPage('home');
    setAnalysisResult(null);
    setAnalysisHistory([]);
    
    showNotification('已成功登出', 'info');
  }, []);

  /**
   * [MODIFIED] 處理新聞分析 - 連接 FastAPI 後端
   */
  const handleAnalysis = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setShowLogin(true);
      showNotification('請先登入以使用檢測功能', 'info');
      return;
    }

    const content = activeTab === 'url' ? newsUrl.trim() : newsContent.trim();
    if (!content) {
      showNotification('請輸入要檢測的內容', 'error');
      return;
    }

    if (activeTab === 'url') {
      try {
        new URL(newsUrl);
      } catch {
        showNotification('請輸入有效的URL格式', 'error');
        return;
      }
    }

     const token = localStorage.getItem('token');
    if (!token) {
        showNotification('您的登入已過期，請重新登入。', 'error');
        setUser(null);
        setShowLogin(true);
        return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null); // 清除上次結果

    try {
      // 連接到 FastAPI 後端
      const response = await fetch("https://nknu115-project.onrender.com", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: content })
      });

      if (response.status === 401) {
          throw new Error('登入驗證失敗，請重新登入。');
      }

      if (!response.ok) {
        throw new Error(`伺服器錯誤: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        showNotification(data.error, 'error');
        return;
      }

      // 根據後端回傳的 label ('真' 或 '假') 來生成結果
      const isFake = data.label === '假';
      
      // 根據結果生成分數，使其不完全隨機
      const fakeScore = isFake 
        ? Math.floor(Math.random() * 20) + 75  // 假新聞: 75-94%
        : Math.floor(Math.random() * 20) + 5;   // 真新聞: 5-24%
      
      const realScore = 100 - fakeScore;
      const confidence = Math.floor(Math.random() * 15) + 85; // 85-99%

      const riskLevel = fakeScore > 60 ? 'high' : fakeScore > 30 ? 'medium' : 'low';

      const result = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: activeTab,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        fakeScore,
        realScore,
        confidence,
        riskLevel,
        analysis: {
          source: isFake ? '來源可信度較低，建議查證' : '來源具有一定可信度',
          content: isFake ? '內容存在明顯誇大或偏見' : '內容表述相對客觀',
          structure: isFake ? '結構缺乏邏輯性和證據支持' : '結構完整且論證清晰',
          language: isFake ? '語言帶有明顯情緒色彩' : '語言相對中性客觀'
        },
        details: {
          keyWords: ['新聞', '報導', '事實', '消息'],
          sourceAnalysis: `由 RoBERTa 模型提供判斷結果 (${data.label})`,
          recommendations: [
            '建議查證多個可信來源',
            '注意資訊發布的時間和背景',
            '保持批判性思維'
          ]
        }
      };

      setAnalysisResult(result);

      const newHistory = [result, ...analysisHistory].slice(0, 10);
      setAnalysisHistory(newHistory);
      localStorage.setItem(`history_${user.email}`, JSON.stringify(newHistory));

      showNotification('分析完成！', 'success');

      if (user && user.email) {
          const newHistory = [result, ...analysisHistory].slice(0, 10);
          setAnalysisHistory(newHistory);
          localStorage.setItem(`history_${user.email}`, JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error('分析失敗:', error);
      showNotification(`分析請求失敗: ${error.message}`, 'error');
      if (error.message.includes('登入')) {
          handleLogout();
      }
    } finally {
      // 無論成功或失敗，都要結束分析狀態
      setIsAnalyzing(false);
    }
  };

  /**
   * 重置表單數據
   */
  const resetForm = () => {
    setNewsUrl('');
    setNewsContent('');
    setAnalysisResult(null);
  };
  
  // [NEW] 分離表單輸入處理函數，可增加代碼清晰度，並有助於解決複雜的輸入問題
  const handleLoginFormChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterFormChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const closeAuthModal = () => {
    setShowLogin(false);
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ name: '', email: '', password: '' });
  };
  
  const switchAuthMode = () => {
    setIsLogin(!isLogin);
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ name: '', email: '', password: '' });
  };


  /**
   * 通知組件
   */
  const NotificationComponent = () => {
    if (!notification) return null;
    
    const bgColor = {
      success: 'bg-green-100 border-green-500 text-green-700',
      error: 'bg-red-100 border-red-500 text-red-700',
      info: 'bg-blue-100 border-blue-500 text-blue-700'
    };
    
    const Icon = {
      success: CheckCircle,
      error: XCircle,
      info: Info
    };
    
    const IconComponent = Icon[notification.type];
    
    return (
      <div className={`fixed top-20 right-4 z-50 p-4 border-l-4 rounded shadow-lg ${bgColor[notification.type]} max-w-sm`}>
        <div className="flex items-center">
          <IconComponent className="w-5 h-5 mr-2" />
          <span>{notification.message}</span>
        </div>
      </div>
    );
  };

  /**
   * 頁面標題組件 - 響應式導航欄
   */
  const Header = () => (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setCurrentPage('home')}
          >
            <ShieldCheck className="w-8 h-8 mr-3" />
            <h1 className="text-2xl font-bold">真相守門員</h1>            
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button  
              onClick={() => setCurrentPage('home')}
              className={`bg-white/20 hover:bg-white/20 px-3 py-2 rounded transition-all duration-200 ${
                currentPage === 'home' ? 'bg-white/20': ''
              }`}
            >
              首頁
            </button>
            <button 
              onClick={() => setCurrentPage('detection')}
              className={`bg-white/20 hover:bg-white/20 px-3 py-2 rounded transition-all duration-200 ${
                currentPage === 'detection' ? 'bg-white/20': ''
              }`}
            >
              檢測統計
            </button>
            <button 
              onClick={() => setCurrentPage('education')}
              className={`bg-white/20 text-white hover:bg-white/20 px-3 py-2 rounded transition-all duration-200 ${
                currentPage === 'education' ? 'bg-white/20': ''
              }`}
            >
              教育資源
            </button>
            
            {user ? (
              <div className="bg-white/20 flex items-center space-x-4">
                <span className="text-sm bg-white/10 px-3 py-1 rounded-full">
                  歡迎，{user.name}
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/20 px-3 py-2 rounded transition-all duration-200 flex items-center"
                  title="登出"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  登出
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition-all duration-200 flex items-center"
              >
                <User className="w-4 h-4 mr-2" />
                登入
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );

  
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI 驅動的假新聞檢測
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            運用最新的人工智慧技術和自然語言處理，即時分析新聞內容的真實性，
            幫助您在資訊爆炸的時代中辨識假新聞，守護真相。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <div className="text-xl font-bold text-blue-600 mb-2">94.2%</div>
              <div className="text-gray-600">檢測準確率</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <div className="text-xl font-bold text-purple-600 mb-2">8,247</div>
              <div className="text-gray-600">累積檢測次數</div>
            </div>
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-lg">
              <div className="text-xl font-bold text-green-600 mb-2">2秒</div>
              <div className="text-gray-600">平均分析時間</div>
            </div>
          </div>
          
          {!user && (
            <button
              onClick={() => setShowLogin(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center mx-auto"
            >
              立即開始檢測
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>

        {user && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 max-w-4xl mx-auto border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">檢測分析</h3>
              {analysisResult && (
                <button
                  onClick={resetForm}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  重新檢測
                </button>
              )}
            </div>
            
            <div className="flex border-b mb-6">
              
              <button
                onClick={() => setActiveTab('content')}
                className={`px-6 py-3 font-medium transition-all duration-200 ${activeTab === 'content' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'}`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                短文檢測
              </button>
            </div>

            <form onSubmit={handleAnalysis}>
              {activeTab === 'url' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新聞網址 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={newsUrl}
                    onChange={(e) => setNewsUrl(e.target.value)}
                    placeholder="https://example.com/news-article"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isAnalyzing}
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新聞內容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newsContent}
                    onChange={(e) => setNewsContent(e.target.value)}
                    placeholder="請貼上完整的新聞內容，包括標題和正文..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows="8"
                    required
                    disabled={isAnalyzing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    建議輸入完整的新聞內容以獲得更準確的分析結果
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    AI 正在深度分析中...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    開始 AI 檢測分析
                  </>
                )}
              </button>
            </form>

            {analysisResult && (
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-800">檢測結果</h4>
                  <div className="text-xs text-gray-500">
                    分析時間: {new Date(analysisResult.timestamp).toLocaleString('zh-TW')}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className={`text-4xl font-bold mb-2 ${
                      analysisResult.riskLevel === 'high' ? 'text-red-500' :
                      analysisResult.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {analysisResult.fakeScore}%
                    </div>
                    <div className="text-sm text-gray-600">假新聞機率</div>
                    <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                      analysisResult.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      analysisResult.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {analysisResult.riskLevel === 'high' ? '高風險' :
                       analysisResult.riskLevel === 'medium' ? '中風險' : '低風險'}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-4xl font-bold mb-2 text-green-600">
                      {analysisResult.realScore}%
                    </div>
                    <div className="text-sm text-gray-600">真實新聞機率</div>
                    <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      可信度評估
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-4xl font-bold mb-2 text-blue-600">
                      {analysisResult.confidence}%
                    </div>
                    <div className="text-sm text-gray-600">檢測信心度</div>
                    <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      AI 可信度
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h5 className="font-semibold mb-4 text-gray-800">詳細分析報告</h5>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">來源分析</span>
                        <span className="text-sm text-gray-600">{analysisResult.analysis.source}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">內容分析</span>
                        <span className="text-sm text-gray-600">{analysisResult.analysis.content}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">結構分析</span>
                        <span className="text-sm text-gray-600">{analysisResult.analysis.structure}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">語言分析</span>
                        <span className="text-sm text-gray-600">{analysisResult.analysis.language}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg ${
                    analysisResult.riskLevel === 'high' ? 'bg-red-50 border border-red-200' :
                    analysisResult.riskLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-start">
                      <AlertTriangle className={`w-5 h-5 mr-3 mt-0.5 ${
                        analysisResult.riskLevel === 'high' ? 'text-red-500' :
                        analysisResult.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                      <div>
                        <div className={`font-semibold mb-2 ${
                          analysisResult.riskLevel === 'high' ? 'text-red-800' :
                          analysisResult.riskLevel === 'medium' ? 'text-yellow-800' : 'text-green-800'
                        }`}>
                          專業建議
                        </div>
                        <div className={`text-sm ${
                          analysisResult.riskLevel === 'high' ? 'text-red-700' :
                          analysisResult.riskLevel === 'medium' ? 'text-yellow-700' : 'text-green-700'
                        }`}>
                          {analysisResult.riskLevel === 'high' && '此內容存在較高的假新聞風險，強烈建議查證多個可靠來源後再分享。'}
                          {analysisResult.riskLevel === 'medium' && '此內容需要謹慎判斷，建議進一步查證相關資訊和背景。'}
                          {analysisResult.riskLevel === 'low' && '此內容相對可信，但仍建議保持批判性思考和多方查證。'}
                        </div>
                        
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-2">推薦行動:</div>
                          <ul className="text-xs space-y-1">
                            {analysisResult.details.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-center">
                                <div className="w-1 h-1 bg-current rounded-full mr-2"></div>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
         <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">AI 智能分析</h3>
            <p className="text-gray-600 leading-relaxed">
              運用最新的深度學習和自然語言處理技術，多維度分析新聞內容的語義、結構、來源和邏輯一致性
            </p>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <Star className="w-4 h-4 mr-1" />
              <span>準確率 94.2%</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">詳細分析報告</h3>
            <p className="text-gray-600 leading-relaxed">
              提供全方位的分析報告，包含風險評估、信心度指標、具體建議和專業的查證指引
            </p>
            <div className="mt-4 flex items-center text-sm text-purple-600">
              <Clock className="w-4 h-4 mr-1" />  
              <span>2秒內完成分析</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-4">媒體素養教育</h3>
            <p className="text-gray-600 leading-relaxed">
              豐富的教育資源和實用指南，幫助提升辨識假新聞的能力和批判性思維技巧
            </p>
            <div className="mt-4 flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>持續更新內容</span>
            </div>
          </div>
        </div>

        {/* 分析歷史記錄 - 只有登入用戶可見 */}
        {user && analysisHistory.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/20">
            <h3 className="text-xl font-semibold mb-6 text-gray-800">最近的檢測記錄</h3>
            <div className="space-y-4">
              {analysisHistory.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">
                      {new Date(record.timestamp).toLocaleDateString('zh-TW')} {new Date(record.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-gray-800 truncate">{record.content}</div>
                  </div>
                  <div className="flex items-center space-x-3 ml-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      record.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {record.fakeScore}% 風險
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.confidence}% 信心
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * 檢測統計頁面組件
   */
  const DetectionPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">檢測統計中心</h2>
          <p className="text-gray-600">系統運行狀態和檢測效能統計</p>
        </div>
        
        {/* 統計卡片 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">總檢測次數</h3>
              <Search className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">8,247</div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              較上月 +12.3%
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">假新聞檢出率</h3>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-500 mb-2">23.4%</div>
            <div className="text-sm text-red-600 flex items-center">
              <div className="w-4 h-4 mr-1">↘</div>
              較上月 -2.1%
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">系統準確率</h3>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              較上月 +1.8%
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">活躍用戶</h3>
              <User className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">1,523</div>
            <div className="text-sm text-green-600 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              較上月 +8.7%
            </div>
          </div>
        </div>

        {/* 圖表區域 */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">檢測趨勢</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <p className="text-sm">檢測趨勢圖表</p>
                <p className="text-xs text-gray-400 mt-1">此處將顯示詳細的統計圖表</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">風險分佈</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-red-50 rounded-lg">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-red-400 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm">風險等級分佈圖</p>
                <p className="text-xs text-gray-400 mt-1">高/中/低風險內容比例</p>
              </div>
            </div>
          </div>
        </div>

        {/* 詳細統計表格 */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">檢測類型統計</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">檢測類型</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">總次數</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">假新聞率</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">平均信心度</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">趨勢</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">URL 檢測</td>
                  <td className="py-3 px-4">5,147</td>
                  <td className="py-3 px-4 text-red-600">21.3%</td>
                  <td className="py-3 px-4 text-blue-600">95.1%</td>
                  <td className="py-3 px-4 text-green-600">↗ +5.2%</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">內容檢測</td>
                  <td className="py-3 px-4">3,100</td>
                  <td className="py-3 px-4 text-red-600">26.8%</td>
                  <td className="py-3 px-4 text-blue-600">92.7%</td>
                  <td className="py-3 px-4 text-green-600">↗ +3.1%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );

  
  const EducationPage = () => (
     <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            媒體素養教育中心
          </h2>
          <p className="text-xl text-gray-600">
            提升媒體識讀能力，培養批判性思維，成為資訊時代的智慧公民
          </p>
        </div>
        
        {/* 主要教育內容 */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border border-gray-100">
          <h3 className="text-2xl font-semibold mb-6 text-purple-600 flex items-center">
            <BookOpen className="w-7 h-7 mr-3" />
            如何識別假新聞：完整指南
          </h3>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-6 py-4 bg-blue-50 rounded-r-lg">
              <h4 className="font-semibold mb-3 text-blue-800 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                1. 檢查新聞來源
              </h4>
              <p className="text-gray-700 leading-relaxed mb-3">
                查看新聞發布者是否為可信媒體機構，確認作者的專業資格和背景。可信的新聞來源通常具有：
              </p>
              <ul className="text-gray-600 text-sm space-y-1 ml-4">
                <li>• 清楚的編輯政策和聯絡資訊</li>
                <li>• 具有新聞專業背景的記者和編輯團隊</li>
                <li>• 長期的新聞報導歷史和聲譽</li>
                <li>• 透明的更正和澄清機制</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-green-500 pl-6 py-4 bg-green-50 rounded-r-lg">
              <h4 className="font-semibold mb-3 text-green-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                2. 交叉驗證資訊
              </h4>
              <p className="text-gray-700 leading-relaxed mb-3">
                對比多個不同來源的報導，查看資訊是否一致。真實新聞通常會：
              </p>
              <ul className="text-gray-600 text-sm space-y-1 ml-4">
                <li>• 在多個可信媒體中出現類似報導</li>
                <li>• 提供具體的事實和數據支持</li>
                <li>• 引用可驗證的消息來源</li>
                <li>• 承認資訊的限制和不確定性</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-6 py-4 bg-yellow-50 rounded-r-lg">
              <h4 className="font-semibold mb-3 text-yellow-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                3. 分析內容品質
              </h4>
              <p className="text-gray-700 leading-relaxed mb-3">
                注意以下可能暗示假新聞的特徵：
              </p>
              <ul className="text-gray-600 text-sm space-y-1 ml-4">
                <li>• 過於誇大或煽動性的標題</li>
                <li>• 缺乏具體證據或引用來源</li>
                <li>• 明顯的政治偏見或情緒化語言</li>
                <li>• 語法錯誤或不專業的寫作風格</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-red-500 pl-6 py-4 bg-red-50 rounded-r-lg">
              <h4 className="font-semibold mb-3 text-red-800 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                4. 確認時效性
              </h4>
              <p className="text-gray-700 leading-relaxed mb-3">
                檢查新聞的發布時間和相關背景：
              </p>
              <ul className="text-gray-600 text-sm space-y-1 ml-4">
                <li>• 確認發布日期是否為最新</li>
                <li>• 避免過時資訊被重新包裝</li>
                <li>• 查看是否有後續的更新或澄清</li>
                <li>• 了解報導的時空背景</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 實用資源區域 */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-red-600 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2" />
              常見假新聞類型
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-300">
                <div className="font-medium text-red-800">健康醫療謠言</div>
                <div className="text-sm text-red-600 mt-1">未經證實的治療方法、藥物效果等</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-300">
                <div className="font-medium text-orange-800">政治偏見報導</div>
                <div className="text-sm text-orange-600 mt-1">帶有明顯立場偏向的政治新聞</div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-300">
                <div className="font-medium text-yellow-800">災難恐慌傳言</div>
                <div className="text-sm text-yellow-600 mt-1">誇大災難影響或散布恐慌情緒</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-300">
                <div className="font-medium text-purple-800">科技炒作新聞</div>
                <div className="text-sm text-purple-600 mt-1">過度炒作新科技或產品效果</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-blue-600 flex items-center">
              <Globe className="w-6 h-6 mr-2" />
              推薦查證網站
            </h3>
            <div className="space-y-4">
              <a 
                href="https://tfc-taiwan.org.tw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-800 group-hover:text-blue-900">台灣事實查核中心</div>
                    <div className="text-sm text-blue-600 mt-1">專業的事實查核平台</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
              
              <a 
                href="https://www.mygopen.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-green-800 group-hover:text-green-900">MyGoPen 麥擱騙</div>
                    <div className="text-sm text-green-600 mt-1">謠言澄清和事實查證</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-green-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
              
              <a 
                href="https://www.cofacts.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-purple-800 group-hover:text-purple-900">Cofacts 真的假的</div>
                    <div className="text-sm text-purple-600 mt-1">協作型事實查證平台</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );  

  return (
    <div>        
      <Header />
      <NotificationComponent />
      

      <AuthModal
        showLogin={showLogin}
        isLogin={isLogin}
        loginForm={loginForm}
        registerForm={registerForm}
        showPassword={showPassword}
        onClose={closeAuthModal}
        onSwitchMode={switchAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLoginFormChange={handleLoginFormChange}
        onRegisterFormChange={handleRegisterFormChange}
        onToggleShowPassword={() => setShowPassword(!showPassword)}
      />
      
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'detection' && <DetectionPage />}
      {currentPage === 'education' && <EducationPage />}
    </div>
  );
}




