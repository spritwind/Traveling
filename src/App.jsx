import { useState, useEffect, createContext, useContext } from 'react';
import { MapPin, Coffee, Utensils, ShoppingBag, Star, Heart, Share2, Check, ExternalLink, Ticket, Navigation, Loader, Smartphone, ChevronRight, AlertTriangle, Zap } from 'lucide-react';

// --- Geolocation Context ---
const LocationContext = createContext(null);

const LocationProvider = ({ children }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('您的瀏覽器不支援定位功能');
            return;
        }

        setIsLoading(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
                setIsLoading(false);
            },
            (error) => {
                let message = '無法取得位置';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = '請允許位置存取權限';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = '無法取得位置資訊';
                        break;
                    case error.TIMEOUT:
                        message = '位置請求逾時';
                        break;
                }
                setLocationError(message);
                setIsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // 快取 1 分鐘
            }
        );
    };

    return (
        <LocationContext.Provider value={{ userLocation, locationError, isLoading, requestLocation }}>
            {children}
        </LocationContext.Provider>
    );
};

const useLocation = () => useContext(LocationContext);

// --- Haversine 公式計算兩點距離 (公尺) ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371000; // 地球半徑 (公尺)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// --- 格式化距離顯示 ---
const formatDistance = (meters) => {
    if (meters === null) return null;
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
};

// --- 估算步行時間 (假設 5km/h = 83m/min) ---
const estimateWalkTime = (meters) => {
    if (meters === null) return null;
    const minutes = Math.round(meters / 83);
    if (minutes < 1) return '< 1 分鐘';
    if (minutes < 60) return `${minutes} 分鐘`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

// --- 精美天氣圖示 SVG 組件 ---
const WeatherSVG = ({ code, size = 24 }) => {
    // Open-Meteo WMO Weather interpretation codes
    // 0: Clear, 1-3: Partly cloudy, 45-48: Fog, 51-67: Drizzle/Rain, 71-77: Snow, 80-99: Showers/Thunderstorm

    if (code === 0) {
        // 晴天 - 太陽
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" fill="#FFB800" />
                <g stroke="#FFB800" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </g>
            </svg>
        );
    }

    if (code <= 3) {
        // 多雲 - 太陽+雲
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="8" r="4" fill="#FFB800" />
                <g stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="8" y1="1" x2="8" y2="2.5" />
                    <line x1="2.5" y1="5" x2="3.5" y2="6" />
                    <line x1="1" y1="8" x2="2.5" y2="8" />
                    <line x1="13.5" y1="5" x2="12.5" y2="6" />
                </g>
                <path d="M19.5 16.5C20.8807 16.5 22 15.3807 22 14C22 12.6193 20.8807 11.5 19.5 11.5C19.5 9.01472 17.4853 7 15 7C12.7909 7 10.9532 8.6 10.5516 10.7004C10.0389 10.5693 9.5 10.5 9 10.5C6.79086 10.5 5 12.2909 5 14.5C5 16.7091 6.79086 18.5 9 18.5H19.5" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="1.5" />
            </svg>
        );
    }

    if (code <= 48) {
        // 陰天/霧 - 雲
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M19.5 15C21.1569 15 22.5 13.6569 22.5 12C22.5 10.3431 21.1569 9 19.5 9C19.5 6.23858 17.2614 4 14.5 4C12.0147 4 9.96044 5.82823 9.55889 8.21062C8.93242 8.07251 8.27642 8 7.6 8C4.50721 8 2 10.5072 2 13.6C2 16.6928 4.50721 19.2 7.6 19.2H19.5" fill="#D1D5DB" stroke="#6B7280" strokeWidth="1.5" />
            </svg>
        );
    }

    if (code <= 67) {
        // 雨天 - 雲+雨滴
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M17 9C18.6569 9 20 7.65685 20 6C20 4.34315 18.6569 3 17 3C17 1.34315 15.2091 0 13 0C10.7909 0 9 1.79086 9 4C9 4.17157 9.01 4.34 9.028 4.505C8.37651 4.18041 7.64401 4 6.87 4C4.18315 4 2 6.18315 2 8.87C2 11.5569 4.18315 13.74 6.87 13.74H17" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1.5" transform="translate(1, 1)" />
                <g stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="8" y1="17" x2="8" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="23" />
                    <line x1="16" y1="17" x2="16" y2="20" />
                </g>
            </svg>
        );
    }

    if (code <= 77) {
        // 雪天 - 雲+雪花
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M17 8C18.6569 8 20 6.65685 20 5C20 3.34315 18.6569 2 17 2C17 0.343146 15.2091 -1 13 -1C10.7909 -1 9 0.790861 9 3C9 3.17157 9.01 3.34 9.028 3.505C8.37651 3.18041 7.64401 3 6.87 3C4.18315 3 2 5.18315 2 7.87C2 10.5569 4.18315 12.74 6.87 12.74H17" fill="#BFDBFE" stroke="#60A5FA" strokeWidth="1.5" transform="translate(1, 2)" />
                <g fill="#60A5FA">
                    <circle cx="7" cy="18" r="1.5" />
                    <circle cx="12" cy="20" r="1.5" />
                    <circle cx="17" cy="17" r="1.5" />
                    <circle cx="9" cy="22" r="1" />
                    <circle cx="15" cy="22" r="1" />
                </g>
            </svg>
        );
    }

    // 雷雨 - 雲+閃電
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path d="M17 7C18.6569 7 20 5.65685 20 4C20 2.34315 18.6569 1 17 1C17 -0.656854 15.2091 -2 13 -2C10.7909 -2 9 -0.209139 9 2C9 2.17157 9.01 2.34 9.028 2.505C8.37651 2.18041 7.64401 2 6.87 2C4.18315 2 2 4.18315 2 6.87C2 9.55685 4.18315 11.74 6.87 11.74H17" fill="#6B7280" stroke="#374151" strokeWidth="1.5" transform="translate(1, 3)" />
            <polygon points="13,13 10,18 12,18 10,23 16,16 13,16 15,13" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.5" />
        </svg>
    );
};

// --- 天氣圖示組件 (使用 Open-Meteo 免費 API) ---
const WeatherIcon = ({ day, coords }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    // 計算目標日期 (2025/12/9 + day - 1)
    const getTargetDate = (dayNum) => {
        const baseDate = new Date(2025, 11, 9); // 2025年12月9日
        baseDate.setDate(baseDate.getDate() + dayNum - 1);
        return baseDate.toISOString().split('T')[0];
    };

    // 取得天氣描述
    const getWeatherDesc = (code) => {
        if (code === 0) return "晴";
        if (code <= 3) return "多雲";
        if (code <= 48) return "陰";
        if (code <= 67) return "雨";
        if (code <= 77) return "雪";
        return "雷雨";
    };

    // 取得背景漸層色
    const getWeatherGradient = (code) => {
        if (code === 0) return "from-amber-100 to-orange-100"; // 晴
        if (code <= 3) return "from-sky-100 to-blue-100"; // 多雲
        if (code <= 48) return "from-gray-200 to-slate-200"; // 陰
        if (code <= 67) return "from-blue-200 to-indigo-200"; // 雨
        if (code <= 77) return "from-blue-100 to-cyan-100"; // 雪
        return "from-gray-300 to-slate-300"; // 雷雨
    };

    useEffect(() => {
        const fetchWeather = async () => {
            if (!coords) {
                setLoading(false);
                return;
            }

            try {
                const targetDate = getTargetDate(day);
                // Open-Meteo 免費 API，不需要 API Key
                // 加入降水機率、風速等更多資訊
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia/Tokyo&start_date=${targetDate}&end_date=${targetDate}`
                );
                const data = await response.json();

                if (data.daily) {
                    setWeather({
                        code: data.daily.weather_code[0],
                        tempMax: Math.round(data.daily.temperature_2m_max[0]),
                        tempMin: Math.round(data.daily.temperature_2m_min[0]),
                        rainProb: data.daily.precipitation_probability_max?.[0] || 0,
                    });
                }
            } catch (error) {
                console.error('Weather fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, [day, coords]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white/60 shadow-sm">
                <Loader size={16} className="animate-spin text-gray-400" />
                <span className="text-xs text-gray-400">載入中...</span>
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white/60 shadow-sm">
                <span className="text-lg">🌤️</span>
                <span className="text-xs text-gray-500">--°C</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 bg-gradient-to-r ${getWeatherGradient(weather.code)} backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white/60 shadow-sm`}>
            <WeatherSVG code={weather.code} size={28} />
            <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-gray-800">{weather.tempMin}</span>
                    <span className="text-[10px] text-gray-500">~</span>
                    <span className="text-sm font-bold text-gray-800">{weather.tempMax}°</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600">{getWeatherDesc(weather.code)}</span>
                    {weather.rainProb > 0 && (
                        <span className="text-[10px] text-blue-600 font-medium">💧{weather.rainProb}%</span>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- USJ Guide Component ---
const USJGuide = () => {
    // 設施刺激程度與心臟病風險
    const rideIntensity = [
        { name: "庫巴挑戰書 (瑪利歐賽車)", icon: "🏎️", level: "低", heart: "✅ 適合", desc: "AR 互動射擊，無激烈動作", color: "green" },
        { name: "耀西冒險", icon: "🦖", level: "很低", heart: "✅ 適合", desc: "緩慢觀景車，老少皆宜", color: "green" },
        { name: "小小兵瘋狂乘車遊", icon: "🍌", level: "低", heart: "✅ 適合", desc: "模擬動感，無實際移動", color: "green" },
        { name: "哈利波特禁忌之旅", icon: "🧙", level: "中", heart: "⚠️ 注意", desc: "快速移動+翻轉，有些刺激", color: "yellow" },
        { name: "大白鯊", icon: "🦈", level: "低", heart: "✅ 適合", desc: "船遊+特效，有驚嚇但不激烈", color: "green" },
        { name: "蜘蛛人驚魂歷險記", icon: "🕷️", level: "中", heart: "⚠️ 注意", desc: "3D 模擬+墜落感", color: "yellow" },
        { name: "咚奇剛瘋狂礦車", icon: "🦍", level: "中高", heart: "⚠️ 注意", desc: "雲霄飛車類型，有俯衝", color: "orange" },
        { name: "飛天翼龍", icon: "🦅", level: "極高", heart: "❌ 不建議", desc: "懸吊式雲霄飛車，非常刺激", color: "red" },
        { name: "好萊塢美夢乘車遊", icon: "🎢", level: "極高", heart: "❌ 不建議", desc: "高速雲霄飛車，有倒退版", color: "red" },
        { name: "太空幻想列車", icon: "🚀", level: "高", heart: "❌ 不建議", desc: "室內雲霄飛車，旋轉+加速", color: "red" },
    ];

    const strategies = [
        {
            title: "📍 開園衝刺 (07:30-09:30)",
            icon: "🏃",
            tips: [
                "表定 09:00 開門，實際 08:00 左右常提早開",
                "務必 07:00-07:30 抵達門口排隊",
                "入園第一件事：APP 抽「任天堂區域入場整理券」",
                "如一開園沒限制，直接衝任天堂世界！",
                "優先排：庫巴挑戰書 (造景棒！值得排)",
                "礦車若排隊 >80 分可跳過，不太有趣"
            ]
        },
        {
            title: "🎯 聰明路線建議",
            icon: "🗺️",
            tips: [
                "一進場若瑪利歐管制/排很久 → 先衝小小兵",
                "小小兵一開園通常不用排！",
                "之後去大白鯊 (適合媽咪，不刺激)",
                "速通建議用在：庫巴挑戰書 + 哈利波特禁忌之旅",
                "小小兵也適合用速通",
                "傍晚人潮減少再去好萊塢美夢"
            ]
        },
        {
            title: "💡 單人通道 (Single Rider)",
            icon: "👤",
            tips: [
                "不介意分開坐可省 50-70% 時間",
                "瑪利歐賽車也有單人通道！",
                "適用：蜘蛛人、侏羅紀、飛天翼龍",
                "好萊塢美夢也有單人通道"
            ]
        },
        {
            title: "🎫 整理券/快速通關",
            icon: "🎟️",
            tips: [
                "整理券：免費但數量有限，APP 抽取",
                "快速通關：Express Pass ¥10,800-26,000+",
                "推薦速通用在：庫巴、禁忌之旅、小小兵",
                "咚奇剛礦車不太值得用速通"
            ]
        },
        {
            title: "🍽️ 用餐策略",
            icon: "🍔",
            tips: [
                "避開 11:30-13:00 尖峰時段",
                "可買餐車小吃：火雞腿、吉拿棒",
                "或 11:00 前提早用餐",
                "奇諾比奧餐廳需整理券才能入場"
            ]
        },
        {
            title: "⚠️ 媽咪注意事項",
            icon: "❤️",
            tips: [
                "太空幻想列車 (星際之旅) 類似雲霄飛車 ❌",
                "飛天翼龍、好萊塢美夢 太刺激 ❌",
                "推薦：小小兵、大白鯊、耀西、庫巴賽車 ✅",
                "哈利波特禁忌之旅 稍有刺激但還OK"
            ]
        }
    ];

    return (
        <div className="mb-8 animate-fade-in">
            {/* USJ APP Download Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-orange-500 p-2 rounded-xl text-white">
                        <Smartphone size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">USJ 官方 APP (必載！)</h3>
                        <p className="text-xs text-gray-500">即時排隊時間 & 整理券抽取</p>
                    </div>
                </div>
                <a
                    href="https://apps.apple.com/tw/app/universal-studios-japan/id547753987"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-black text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                    🍎 App Store 下載
                </a>
                <p className="text-[10px] text-gray-500 mt-2 text-center">入園前請先下載並註冊帳號</p>
            </div>

            {/* Important Notice */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-bold text-red-700 text-sm mb-1">⚠️ 入園注意事項</h4>
                        <ul className="text-xs text-red-600 space-y-1">
                            <li>• 週五人較多，建議 <b>07:00 前</b>到場</li>
                            <li>• 瑪利歐整理券可能 10 點前就發完</li>
                            <li>• 礦車排隊 80 分以內再去，否則跳過</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Ride Intensity Chart */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    ❤️ 設施刺激程度 & 心臟風險
                </h4>
                <div className="space-y-2">
                    {rideIntensity.map((ride, idx) => (
                        <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${
                            ride.color === 'green' ? 'bg-green-50' :
                            ride.color === 'yellow' ? 'bg-yellow-50' :
                            ride.color === 'orange' ? 'bg-orange-50' : 'bg-red-50'
                        }`}>
                            <span className="text-lg">{ride.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-xs text-gray-800 truncate">{ride.name}</div>
                                <div className="text-[10px] text-gray-500">{ride.desc}</div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className={`text-[10px] font-bold ${
                                    ride.color === 'green' ? 'text-green-600' :
                                    ride.color === 'yellow' ? 'text-yellow-600' :
                                    ride.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                    {ride.heart}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strategy Cards */}
            <div className="space-y-3">
                {strategies.map((strategy, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{strategy.icon}</span>
                            <h4 className="font-bold text-gray-800">{strategy.title}</h4>
                        </div>
                        <ul className="space-y-2">
                            {strategy.tips.map((tip, tipIdx) => (
                                <li key={tipIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <ChevronRight size={14} className="text-orange-400 mt-0.5 shrink-0" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Quick Reference */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mt-4">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-yellow-500" />
                    排隊時間參考 (80分以下值得排)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/70 rounded-lg p-2">
                        <div className="font-bold text-gray-700">🏎️ 庫巴挑戰書</div>
                        <div className="text-orange-500 font-bold">60-120 分 ⭐推薦</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2">
                        <div className="font-bold text-gray-700">🧙 禁忌之旅</div>
                        <div className="text-orange-500 font-bold">45-90 分 ⭐推薦</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2">
                        <div className="font-bold text-gray-700">🍌 小小兵</div>
                        <div className="text-green-500 font-bold">30-60 分 ⭐推薦</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-2">
                        <div className="font-bold text-gray-700">🦍 咚奇剛礦車</div>
                        <div className="text-gray-400 font-bold">120+ 分 (可跳過)</div>
                    </div>
                </div>
                <p className="text-[10px] text-blue-600 mt-2 text-center">* 實際時間請以 APP 為準</p>
            </div>
        </div>
    );
};

const App = () => {
    const [activeDay, setActiveDay] = useState(1);
    const [usjTab, setUsjTab] = useState('food'); // 'food' or 'guide'

    // 所有景點資料 (含經緯度)
    const itineraryData = [
        {
            day: 1,
            date: "12/09 (二)",
            location: "大阪・心齋橋/梅田",
            hotel: "大阪 PLAZA HOTEL (十三站)",
            hotelCoords: { lat: 34.7208, lng: 135.4729 },
            color: "from-pink-100 to-rose-100",
            spots: [
                {
                    name: "心齋橋・道頓堀",
                    desc: "大阪最熱鬧的購物美食天堂 (高評價新店更新！)",
                    recs: [
                        {
                            type: "coupon",
                            name: "道頓堀/心齋橋 藥妝優惠券",
                            desc: "點擊領取：松本清、大國藥妝、唐吉訶德、Bic Camera 等折價券 (最高17% OFF)。",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "必備",
                            mapQuery: "Dotonbori",
                            coords: { lat: 34.6687, lng: 135.5013 },
                            externalLink: "https://www.callingtaiwan.com.tw/%E6%97%A5%E6%9C%AC%E8%97%A5%E5%A6%9D%E5%84%AA%E6%83%A0%E5%88%B8/"
                        },
                        { type: "food", name: "Onigiri Gorichan (飯糰專賣)", desc: "⭐ 4.9分神店！現做飯糰專賣店，每顆都是現場手捏。必點：明太子、鮭魚、炸雞飯糰。早餐或輕食首選！", rating: 4.9, reviewCount: 850, priceLevel: "$", mapQuery: "Onigiri Gorichan Osaka", coords: { lat: 34.6712, lng: 135.5025 } },
                        { type: "food", name: "北村壽喜燒", desc: "⭐ 米其林一星！大阪最強壽喜燒，創業於1881年。和牛入口即化，配上生蛋液是極致享受。務必預約！", rating: 4.7, reviewCount: 2200, priceLevel: "$$$$", mapQuery: "Kitamura Sukiyaki Osaka", coords: { lat: 34.6695, lng: 135.5030 } },
                        { type: "food", name: "牛炸 Motomura 難波店", desc: "⭐ 5.0分滿分店！炸牛排外酥內嫩，可選熟度。沾山葵醬油或岩鹽都絕配，中午來排隊較少。", rating: 5.0, reviewCount: 480, priceLevel: "$$", mapQuery: "Gyukatsu Motomura Namba", coords: { lat: 34.6658, lng: 135.5018 } },
                        { type: "dessert", name: "Kajitsu no hana (果実の花)", desc: "🍓 4.8分水果聖代！新鮮當季水果，堆疊如藝術品。草莓季必訪，建議下午茶時段來。", rating: 4.8, reviewCount: 620, priceLevel: "$$$", mapQuery: "Kajitsu no hana Osaka", coords: { lat: 34.6720, lng: 135.5012 } },
                        { type: "coffee", name: "COLONY by EQI", desc: "☕ 4.8分精品咖啡！工業風空間，拿鐵拉花精美。心齋橋逛累了休息的好選擇。", rating: 4.8, reviewCount: 380, priceLevel: "$$", mapQuery: "COLONY by EQI Shinsaibashi", coords: { lat: 34.6735, lng: 135.5008 } },
                        { type: "snack", name: "甲賀流章魚燒 (美國村)", desc: "🐙 連續三年榮獲「米其林必比登」推薦！口感軟嫩，加上滿滿蔥花與特製美乃滋。", rating: 4.5, reviewCount: 3800, priceLevel: "$", mapQuery: "Kogaryu Takoyaki Americamura", coords: { lat: 34.6725, lng: 135.4985 } },
                        { type: "drug", name: "松本清 心齋橋店", desc: "💊 貨品最齊全，價格競爭力強 (記得用上方優惠券)。", rating: 4.0, reviewCount: 500, priceLevel: "$$", mapQuery: "Matsumoto Kiyoshi Shinsaibashi", coords: { lat: 34.6717, lng: 135.5014 } },
                        { type: "food", name: "北極星蛋包飯", desc: "🍳 蛋包飯創始店，在傳統日式老屋享用美味。", rating: 4.3, reviewCount: 4500, priceLevel: "$$", mapQuery: "Hokkyokusei Shinsaibashi Main Store", coords: { lat: 34.6693, lng: 135.5034 } },
                        { type: "food", name: "味乃家 (Ajinoya)", desc: "🥞 米其林必比登推薦，口感鬆軟的大阪燒。", rating: 4.4, reviewCount: 3100, priceLevel: "$$", mapQuery: "Ajinoya Okonomiyaki", coords: { lat: 34.6679, lng: 135.5025 } },
                        { type: "food", name: "一蘭拉麵 道頓堀店", desc: "🍜 台灣人最愛，豚骨湯頭客製化。", rating: 4.5, reviewCount: 12000, priceLevel: "$$", mapQuery: "Ichiran Ramen Dotonbori", coords: { lat: 34.6686, lng: 135.5008 } },
                        { type: "food", name: "元祖串炸達摩", desc: "🍢 大阪名物，外皮酥脆，禁止二次沾醬！", rating: 4.2, reviewCount: 3500, priceLevel: "$$", mapQuery: "Kushikatsu Daruma Dotonbori", coords: { lat: 34.6685, lng: 135.5017 } },
                        { type: "dessert", name: "HARBS 大丸心齋橋店", desc: "🍰 水果千層蛋糕，鮮奶油清爽不膩。", rating: 4.5, reviewCount: 1500, priceLevel: "$$", mapQuery: "HARBS Daimaru Shinsaibashi", coords: { lat: 34.6747, lng: 135.5010 } },
                        { type: "dessert", name: "PABLO", desc: "🧀 經典半熟起司塔，濃郁滑順的口感。", rating: 4.0, reviewCount: 1800, priceLevel: "$", mapQuery: "PABLO Shinsaibashi", coords: { lat: 34.6715, lng: 135.5012 } },
                        { type: "food", name: "美津の (Mizuno)", desc: "🥞 米其林必比登推薦大阪燒，排隊名店。", rating: 4.5, reviewCount: 3240, priceLevel: "$$", mapQuery: "Mizuno Osaka Dotonbori", coords: { lat: 34.6688, lng: 135.5023 } },
                        { type: "snack", name: "Rikuro 老爺爺起司蛋糕", desc: "🍰 剛出爐搖晃的蓬鬆起司蛋糕，必吃。", rating: 4.6, reviewCount: 8900, priceLevel: "$", mapQuery: "Rikuro Ojisan Namba", coords: { lat: 34.6656, lng: 135.5013 } },
                        { type: "shopping", name: "Parco 心齋橋", desc: "🛍️ 年輕潮流品牌、動漫周邊 (吉卜力、寶可夢)。", rating: 4.4, reviewCount: 1500, priceLevel: "$$$", mapQuery: "Shinsaibashi PARCO", coords: { lat: 34.6745, lng: 135.5007 } },
                        { type: "food", name: "和牛燒肉 六宮 難波心齋橋筋店", desc: "🥩 高品質和牛燒肉，價格合理 (建議先預約)。", rating: 4.5, reviewCount: 800, priceLevel: "$$$", mapQuery: "wagyu yakiniku rokunomiya nanba Shinsaibashisuji", coords: { lat: 34.6695, lng: 135.5018 }, externalLink: "https://maps.app.goo.gl/KmFcW1RdZ2Qz5HHj6" },
                        { type: "food", name: "燒肉屋 大牧場 道頓堀店", desc: "🥩 道頓堀人氣燒肉店，肉質新鮮 (建議先預約)。", rating: 4.4, reviewCount: 650, priceLevel: "$$$", mapQuery: "燒肉屋 大牧場 道頓堀店", coords: { lat: 34.6688, lng: 135.5018 }, externalLink: "https://maps.app.goo.gl/LadnJzYipRj87Jqz7" },
                        { type: "shopping", name: "驚安殿堂 唐吉訶德 道頓堀店", desc: "🛒 24小時營業！零食、藥妝、電器、伴手禮一次買齊，記得用優惠券。", rating: 4.3, reviewCount: 15000, priceLevel: "$$", mapQuery: "Don Quijote Dotonbori", coords: { lat: 34.6687, lng: 135.5020 } },
                        { type: "shopping", name: "唐吉訶德摩天輪 (惠比壽塔)", desc: "🎡 道頓堀地標！搭乘摩天輪欣賞大阪夜景，車廂內有冷氣。", rating: 4.4, reviewCount: 5600, priceLevel: "$$", mapQuery: "Don Quijote Ferris Wheel Dotonbori", coords: { lat: 34.6687, lng: 135.5020 } }
                    ]
                },
                {
                    name: "難波・千日前",
                    desc: "在地人也愛的排隊名店區",
                    recs: [
                        { type: "snack", name: "章魚燒道樂 Wanaka (千日前本店)", desc: "大阪人心中No.1！外皮薄脆內餡軟嫩，就在福太郎隔壁。", rating: 4.4, reviewCount: 4500, priceLevel: "$", mapQuery: "Takoyaki Wanaka Sennichimae", coords: { lat: 34.6663, lng: 135.5050 }, externalLink: "https://maps.app.goo.gl/RXb4wTEmXzL6ihCPA" },
                        { type: "food", name: "福太郎 本店 (Fukutaro)", desc: "Top1 大阪燒名店！必點蔥燒 (Negiyaki)，口感軟嫩。", rating: 4.2, reviewCount: 3300, priceLevel: "$$", mapQuery: "Fukutaro Okonomiyaki Main Store", coords: { lat: 34.6663, lng: 135.5048 } },
                        { type: "food", name: "鳥貴族 難波千日前店", desc: "高CP值連鎖居酒屋，均一價！必點貴族燒與釜飯。", rating: 4.0, reviewCount: 800, priceLevel: "$", mapQuery: "Torikizoku Namba Sennichimae", coords: { lat: 34.6658, lng: 135.5035 } }
                    ]
                },
                {
                    name: "梅田 (自由活動)",
                    desc: "時尚百貨與地下迷宮",
                    recs: [
                        { type: "dessert", name: "Harbs Diamor Osaka", desc: "傳說中的水果千層蛋糕，不甜不膩。", rating: 4.4, reviewCount: 1200, priceLevel: "$$", mapQuery: "Harbs Diamor Osaka", coords: { lat: 34.7025, lng: 135.4983 } },
                        { type: "food", name: "龜壽司 (Kame Sushi)", desc: "老字號高CP值壽司，當地人也愛。", rating: 4.5, reviewCount: 2800, priceLevel: "$$", mapQuery: "Kame Sushi Total Main Shop", coords: { lat: 34.7045, lng: 135.4991 } },
                        { type: "shopping", name: "LUCUA / LUCUA 1100", desc: "年輕女生最愛的服飾品牌集散地。", rating: 4.3, reviewCount: 4100, priceLevel: "$$", mapQuery: "LUCUA Osaka", coords: { lat: 34.7050, lng: 135.4960 } }
                    ]
                },
                {
                    name: "飯店周邊 (十三 Juso)",
                    desc: "在地美食激戰區",
                    recs: [
                        { type: "food", name: "Negiyaki Yamamoto", desc: "蔥燒大阪燒發源地，香氣十足。", rating: 4.4, reviewCount: 1100, priceLevel: "$$", mapQuery: "Negiyaki Yamamoto Main Store", coords: { lat: 34.7195, lng: 135.4735 } },
                        { type: "snack", name: "喜八洲總本舖", desc: "必買御手洗糰子，焦香醬甜。", rating: 4.5, reviewCount: 2300, priceLevel: "$", mapQuery: "Kiyasu Sohonpo Head Office", coords: { lat: 34.7202, lng: 135.4732 } }
                    ]
                }
            ]
        },
        {
            day: 2,
            date: "12/10 (三)",
            location: "京都・清水寺/嵐山/伏見",
            hotel: "Chisun Premium Kyoto Kujo",
            hotelCoords: { lat: 34.980512, lng: 135.763981 },
            color: "from-blue-100 to-indigo-100",
            spots: [
                {
                    name: "和服神社之旅 (行程指南)",
                    desc: "📍 新手必看！完整交通與換裝攻略",
                    recs: [
                        {
                            type: "coupon",
                            name: "📋 今日行程總覽 (可截圖)",
                            desc: "⏰ 07:30 出發 → 08:00 抵達清水寺 → 09:00 換和服 → 12:00 還和服 → 13:00 嵐山 → 16:30 伏見稻荷 → 18:30 回程。複製座標到 Google Maps 就能準確導航！",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "必看",
                            mapQuery: "Kiyomizu-dera",
                            coords: { lat: 34.994856, lng: 135.785046 },
                            externalLink: "https://maps.app.goo.gl/kiyomizudera"
                        },
                        {
                            type: "coupon",
                            name: "1️⃣ 飯店 → 公車站 (步行2分鐘)",
                            desc: "🚶 走出飯店大門 → 往左手邊走 (北方，往九條通大馬路) → 走到大馬路口不要過馬路 → 右轉沿人行道走幾十公尺 → 找「大石橋」站牌。確認方向：往「東福寺・清水寺・祇園」。",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "步驟1",
                            mapQuery: "Oishibashi Bus Stop Kyoto",
                            coords: { lat: 34.980350, lng: 135.761500 },
                            externalLink: "https://maps.app.goo.gl/oishibashi"
                        },
                        {
                            type: "coupon",
                            name: "2️⃣ 搭公車到清水寺 (15-20分鐘)",
                            desc: "🚌 搭乘：京都市營巴士 202 或 207 號 → 在「五條坂」下車。下車後往車行方向前方走，會看到大十字路口，從這裡上坡就是往清水寺方向。",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "步驟2",
                            mapQuery: "Gojozaka Bus Stop Kyoto",
                            coords: { lat: 34.994750, lng: 135.776250 },
                            externalLink: "https://maps.app.goo.gl/gojozaka"
                        },
                        { type: "shopping", name: "👘 梨花和服 清水寺店 (推薦！)", desc: "⭐ 位於前往清水寺的主幹道上，非常顯眼，最適合怕迷路的人！沿著五條坂上坡，遇到岔路走左邊比較熱鬧的那條 (松原通)，店鋪在左手邊。從公車站步行約 5 分鐘。", rating: 4.8, reviewCount: 2800, priceLevel: "$$", mapQuery: "Rikawafuku Kiyomizu", coords: { lat: 34.996195, lng: 135.778553 }, externalLink: "https://maps.app.goo.gl/rikawafuku" },
                        { type: "shopping", name: "👘 岡本和服 清水寺店", desc: "🏛️ 老字號名店！離清水寺最近但也最「裡面」，需走一段上坡。沿著五條坂上坡，遇到岔路走右邊較安靜的茶碗坂。從公車站步行約 8-10 分鐘 (上坡)。", rating: 4.6, reviewCount: 3500, priceLevel: "$$", mapQuery: "Okamoto Kimono Kiyomizu", coords: { lat: 34.995777, lng: 135.782333 }, externalLink: "https://maps.app.goo.gl/okamoto" },
                        { type: "shopping", name: "👘 てくてく京都 清水店", desc: "🚶 離公車站最近！適合不想穿便服走太遠的人。就在五條坂公車站下車處附近，店面外觀古樸有質感。從公車站步行僅 1-2 分鐘。", rating: 4.5, reviewCount: 1200, priceLevel: "$$", mapQuery: "TekuTeku Kyoto Kiyomizu", coords: { lat: 34.995295, lng: 135.776953 }, externalLink: "https://maps.app.goo.gl/tekuteku" },
                        {
                            type: "coupon",
                            name: "3️⃣ 清水寺 → 三年坂 (09:30-12:00)",
                            desc: "📸 換完和服後步行前往清水寺仁王門。逛完後沿著「三年坂」往下走，這裡是著名的階梯拍照點！石階搭配古老町家，穿和服拍照超美。",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "步驟3",
                            mapQuery: "Sannenzaka Kyoto",
                            coords: { lat: 34.995950, lng: 135.780500 },
                            externalLink: "https://maps.app.goo.gl/sannenzaka"
                        },
                        {
                            type: "coupon",
                            name: "4️⃣ 還和服 → 嵐山 (13:00-14:00)",
                            desc: "🚌 中午還和服後，走回「清水道」公車站 (北上方向) → 搭 207 號公車 → 在「四條大宮」下車 → 轉乘嵐電 (紫色路面電車) → 搭到終點站「嵐山站」。",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "步驟4",
                            mapQuery: "Randen Shijo Omiya Station",
                            coords: { lat: 35.003650, lng: 135.749250 },
                            externalLink: "https://maps.app.goo.gl/shijoomiya"
                        },
                        {
                            type: "coupon",
                            name: "5️⃣ 嵐山散策 (14:00-16:00)",
                            desc: "🎋 嵐電嵐山站出站後：渡月橋 (往左走3分鐘) → 竹林小徑 (往北走) → 野宮神社 (求良緣學業，在竹林裡)。傍晚 16:30 前離開前往伏見稻荷。",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "步驟5",
                            mapQuery: "Arashiyama Bamboo Grove",
                            coords: { lat: 35.017200, lng: 135.674500 },
                            externalLink: "https://maps.app.goo.gl/bamboogrove"
                        },
                        {
                            type: "coupon",
                            name: "6️⃣ 嵐山 → 伏見稻荷 (16:30-18:00)",
                            desc: "🚃 從竹林步道步行10分鐘到 JR 嵯峨嵐山站 → 搭 JR 山陰本線到「京都站」→ 站內轉乘 JR 奈良線 (第8-10月台) → 在「JR 稻荷站」下車。出站正對面就是紅色大鳥居！",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "步驟6",
                            mapQuery: "JR Inari Station",
                            coords: { lat: 34.966900, lng: 135.770200 },
                            externalLink: "https://maps.app.goo.gl/jrinari"
                        },
                        {
                            type: "coupon",
                            name: "🏠 回程：稻荷 → 飯店",
                            desc: "🚃 從「JR 稻荷站」搭 JR 回「京都站」。若還有體力可逛京都站，或搭地鐵烏丸線一站到「九條站」，步行回飯店。辛苦了！",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "回程",
                            mapQuery: "Kujo Station Kyoto",
                            coords: { lat: 34.983200, lng: 135.759100 },
                            externalLink: "https://maps.app.goo.gl/kujostation"
                        }
                    ]
                },
                {
                    name: "清水寺・二三年坂・祇園",
                    desc: "世界遺產與古老坡道，米其林老店林立",
                    recs: [
                        { type: "food", name: "奧丹 清水店 (Okutan)", desc: "🏛️ 創業380年湯豆腐始祖！在優美日式庭園中享用京都名物湯豆腐，口感綿密，體驗京都飲食文化經典。", rating: 3.9, reviewCount: 1800, priceLevel: "$$$", mapQuery: "Okutan Kiyomizu", coords: { lat: 34.9979, lng: 135.7807 } },
                        { type: "dessert", name: "藤菜美 三年坂本店", desc: "🍡 三年坂必吃！現烤醬油糰子沾鹹甜醬汁，配上冰抹茶「洛水」，走累了最好的休息點。", rating: 4.4, reviewCount: 1200, priceLevel: "$", mapQuery: "Fujinami Sannenzaka Kyoto", coords: { lat: 34.9966, lng: 135.7810 } },
                        { type: "coffee", name: "星巴克 京都二寧坂茶屋店", desc: "☕ 全球唯一榻榻米星巴克！改建自百年町家老屋，在日式老屋喝咖啡的獨特氛圍 (需排隊)。", rating: 4.4, reviewCount: 8500, priceLevel: "$$", mapQuery: "Starbucks Kyoto Ninenzaka Yasaka Chaya", coords: { lat: 34.9998, lng: 135.7803 } },
                        { type: "food", name: "葫蘆 (ひさご)", desc: "🍳 高台寺旁必吃親子丼！半熟滑嫩雞蛋配上山椒粉，京都親子丼名店，通常需排隊。", rating: 4.1, reviewCount: 2200, priceLevel: "$$", mapQuery: "Hisago Kyoto", coords: { lat: 35.0013, lng: 135.7792 } },
                        { type: "coffee", name: "% ARABICA 京都東山", desc: "☕ 網紅咖啡始祖！拿鐵極致順滑，白色建築在古街中格外醒目。", rating: 4.2, reviewCount: 5500, priceLevel: "$$", mapQuery: "% ARABICA Kyoto Higashiyama", coords: { lat: 34.9986, lng: 135.7811 } }
                    ]
                },
                {
                    name: "嵐山・竹林・渡月橋",
                    desc: "米其林密集區域，建議午餐在此享用",
                    recs: [
                        { type: "coupon", name: "📍 嵐電嵐山站", desc: "🚃 從四條大宮搭嵐電到這！出站後往左走 3 分鐘即到渡月橋，往北走進入竹林小徑。車站有行李寄放。", rating: 5.0, reviewCount: 99999, priceLevel: "起點", mapQuery: "Randen Arashiyama Station", coords: { lat: 35.015800, lng: 135.677500 }, externalLink: "https://maps.app.goo.gl/randenarashiyama" },
                        { type: "coupon", name: "📍 渡月橋", desc: "🌉 嵐山地標！全長 155 公尺，橫跨桂川。建議在橋上拍照，背景是嵐山群山。秋天紅葉季節絕美。", rating: 5.0, reviewCount: 99999, priceLevel: "必去", mapQuery: "Togetsukyo Bridge", coords: { lat: 35.013500, lng: 135.677800 }, externalLink: "https://maps.app.goo.gl/togetsukyo" },
                        { type: "coupon", name: "📍 竹林小徑", desc: "🎋 嵐山最著名景點！兩旁高聳竹林，穿和服拍照絕美。從車站往北走約 5 分鐘進入。建議早上或傍晚人較少。", rating: 5.0, reviewCount: 99999, priceLevel: "必去", mapQuery: "Arashiyama Bamboo Grove", coords: { lat: 35.017200, lng: 135.674500 }, externalLink: "https://maps.app.goo.gl/bamboogrove" },
                        { type: "coupon", name: "📍 野宮神社", desc: "⛩️ 位於竹林中！求良緣、學業的神社。黑色木鳥居很特別，是日本最古老的鳥居樣式。", rating: 5.0, reviewCount: 99999, priceLevel: "必去", mapQuery: "Nonomiya Shrine", coords: { lat: 35.017800, lng: 135.674200 }, externalLink: "https://maps.app.goo.gl/nonomiya" },
                        { type: "coupon", name: "📍 JR 嵯峨嵐山站 (往伏見)", desc: "🚃 前往伏見稻荷的轉乘站！從竹林步道步行約 10 分鐘。搭 JR 山陰本線到京都站，轉 JR 奈良線到稻荷站。", rating: 5.0, reviewCount: 99999, priceLevel: "轉乘", mapQuery: "JR Saga-Arashiyama Station", coords: { lat: 35.018600, lng: 135.681200 }, externalLink: "https://maps.app.goo.gl/sagaarashiyama" },
                        { type: "food", name: "廣川鰻魚飯 (Hirokawa)", desc: "⭐ 米其林一星！嵐山最強美食，關西風烤鰻魚外酥內嫩，醬汁濃郁。強烈建議事先網路預約！", rating: 4.3, reviewCount: 3200, priceLevel: "$$$", mapQuery: "Unagi Hirokawa Arashiyama", coords: { lat: 35.0169, lng: 135.6772 } },
                        { type: "food", name: "鯛匠 HANANA", desc: "🐟 米其林必比登！必吃鯛魚茶泡飯，三種吃法：生魚片沾胡麻醬、配飯吃、淋熱茶做茶泡飯。", rating: 4.2, reviewCount: 2800, priceLevel: "$$", mapQuery: "Taisho Hanana Arashiyama", coords: { lat: 35.0152, lng: 135.6776 } },
                        { type: "snack", name: "中村屋可樂餅 (Nakamuraya)", desc: "🥔 老牌肉舖的現炸可樂餅！牛肉可樂餅約100多日圓，炸得酥脆熱燙，嵐山散步必備平價美食。", rating: 4.2, reviewCount: 2500, priceLevel: "$", mapQuery: "Nakamuraya Korokke Arashiyama", coords: { lat: 35.0163, lng: 135.6803 } },
                        { type: "coffee", name: "% ARABICA 京都嵐山", desc: "☕ 世界級網紅咖啡！純白建築坐落桂川畔，買杯拿鐵坐河岸欣賞渡月橋與山景，最Chill體驗。", rating: 4.2, reviewCount: 6800, priceLevel: "$$", mapQuery: "% ARABICA Kyoto Arashiyama", coords: { lat: 35.0135, lng: 135.6764 } },
                        { type: "coffee", name: "eX cafe 嵐山本店", desc: "🍵 自己動手烤糰子！日式庭園風咖啡廳，抹茶與甜點都很有水準。", rating: 4.3, reviewCount: 2200, priceLevel: "$$", mapQuery: "eX cafe Arashiyama", coords: { lat: 35.0162, lng: 135.6745 } }
                    ]
                },
                {
                    name: "伏見稻荷大社",
                    desc: "千本鳥居，特色美食：稻荷壽司",
                    recs: [
                        { type: "coupon", name: "📍 JR 稻荷站", desc: "🚃 從京都站搭 JR 奈良線，只要 1-2 站！出站正對面就是伏見稻荷大社的紅色大鳥居，完全不用找路。", rating: 5.0, reviewCount: 99999, priceLevel: "起點", mapQuery: "JR Inari Station", coords: { lat: 34.966900, lng: 135.770200 }, externalLink: "https://maps.app.goo.gl/jrinari" },
                        { type: "coupon", name: "⛩️ 伏見稻荷大社 (大鳥居)", desc: "🦊 24小時開放！千本鳥居入口。建議傍晚 16:30-18:00 來，光線最美且人較少。走完全程約 2-3 小時，走到四ツ辻約 1 小時。", rating: 5.0, reviewCount: 99999, priceLevel: "必去", mapQuery: "Fushimi Inari Taisha", coords: { lat: 34.967150, lng: 135.772700 }, externalLink: "https://maps.app.goo.gl/fushimiinari" },
                        { type: "food", name: "祢ざめ家 (Nezameya)", desc: "🏛️ 470年歷史老店！傳說名字由豐臣秀吉所賜，招牌烤鰻魚與稻荷壽司，歷史地位無可取代。", rating: 2.9, reviewCount: 1500, priceLevel: "$$", mapQuery: "Nezameya Fushimi Inari", coords: { lat: 34.9678, lng: 135.7708 } },
                        { type: "food", name: "手打烏龍麵 Kendonya", desc: "🍜 高評價手打烏龍！麵條Q彈有勁，比神社門口觀光店更受好評，價格公道。", rating: 4.5, reviewCount: 850, priceLevel: "$", mapQuery: "Kendonya Udon Fushimi", coords: { lat: 34.9683, lng: 135.7683 } },
                        { type: "coffee", name: "Vermillion - cafe", desc: "☕ 澳式森林系咖啡廳！老闆曾在墨爾本生活，露台座位面對森林池塘，參拜後休息首選。", rating: 4.5, reviewCount: 1200, priceLevel: "$$", mapQuery: "Vermillion cafe Fushimi Inari", coords: { lat: 34.9684, lng: 135.7741 } },
                        { type: "snack", name: "寶玉堂", desc: "🦊 傳統狐狸煎餅創始店！稻荷神社參拜必買伴手禮。", rating: 4.5, reviewCount: 600, priceLevel: "$", mapQuery: "Hogyokudo Fushimi Inari", coords: { lat: 34.9671, lng: 135.7726 } }
                    ]
                },
                {
                    name: "飯店周邊 (京都九條)",
                    desc: "步行可達的購物與消夜選擇",
                    recs: [
                        { type: "drug", name: "唐吉訶德 京都Avanti店", desc: "🛒 營業至午夜24:00！位於Avanti百貨2樓，藥妝零食電器一站購足，回飯店前補貨首選。", rating: 3.7, reviewCount: 1800, priceLevel: "$$", mapQuery: "Don Quijote Kyoto Avanti", coords: { lat: 34.9832, lng: 135.7588 } },
                        { type: "shopping", name: "AEON MALL KYOTO", desc: "🏬 大型購物中心！1樓超市 KOHYO 營業至22:00，買水果消夜日本酒。也有無印良品與Uniqlo。", rating: 4.0, reviewCount: 5200, priceLevel: "$$", mapQuery: "AEON Mall Kyoto", coords: { lat: 34.9855, lng: 135.7590 } },
                        { type: "food", name: "大黑拉麵 (ラーメン大黒)", desc: "🍜 在地老店消夜！價格超親民(約500-600日圓)，經典豚骨醬油，當地人愛的高CP值選擇。", rating: 4.2, reviewCount: 650, priceLevel: "$", mapQuery: "Ramen Daikoku Kyoto Kujo", coords: { lat: 34.9788, lng: 135.7615 } },
                        { type: "food", name: "殿田食堂 (Tonoda)", desc: "🍛 老字號食堂！必吃「たぬきうどん」勾芡烏龍麵或親子丼，充滿昭和風情的溫暖家常味。", rating: 4.1, reviewCount: 420, priceLevel: "$", mapQuery: "Tonoda Shokudo Kyoto", coords: { lat: 34.9795, lng: 135.7620 } }
                    ]
                }
            ]
        },
        {
            day: 3,
            date: "12/11 (四)",
            location: "宇治・大阪本町",
            hotel: "HOTEL androoms 大阪本町",
            hotelCoords: { lat: 34.6834, lng: 135.5011 },
            color: "from-green-100 to-emerald-100",
            spots: [
                {
                    name: "宇治 (平等院)",
                    desc: "抹茶的故鄉，高評價咖啡與甜點密集區",
                    recs: [
                        { type: "coffee", name: "Uji-biyori (宇治日和)", desc: "⭐ 4.9分神店！宇治最高評價咖啡廳，自家烘焙咖啡與抹茶甜點。店內充滿復古昭和氛圍，座位不多建議早點來。", rating: 4.9, reviewCount: 320, priceLevel: "$$", mapQuery: "Uji-biyori", coords: { lat: 34.892069, lng: 135.808319 } },
                        { type: "food", name: "Soma (宇治麵包)", desc: "🥐 4.8分人氣麵包店！在地人也排隊的職人麵包，推薦抹茶紅豆麵包與可頌。離平等院步行約10分鐘。", rating: 4.8, reviewCount: 450, priceLevel: "$", mapQuery: "Soma Bakery Uji", coords: { lat: 34.891316, lng: 135.801880 } },
                        { type: "coffee", name: "Matcha Roastery", desc: "🍵 4.7分抹茶專門店！使用石臼現磨抹茶，香氣濃郁。必點：抹茶提拉米蘇、抹茶拿鐵。", rating: 4.7, reviewCount: 280, priceLevel: "$$", mapQuery: "Matcha Roastery Uji", coords: { lat: 34.890079, lng: 135.804206 } },
                        { type: "dessert", name: "中村藤吉 本店", desc: "🏛️ 宇治必吃名店！150年老舖，招牌生茶果凍與抹茶蕎麥麵。常需排隊30-60分鐘。", rating: 4.5, reviewCount: 5200, priceLevel: "$$", mapQuery: "Nakamura Tokichi Honten", coords: { lat: 34.8891, lng: 135.8078 } },
                        { type: "dessert", name: "中村藤吉 平等院店", desc: "🍵 本店分店！位置更近平等院，排隊人潮較少。同樣有生茶果凍與竹筒甜點。", rating: 4.4, reviewCount: 1800, priceLevel: "$$", mapQuery: "Nakamura Tokichi Byodoin", coords: { lat: 34.891513, lng: 135.806610 } },
                        { type: "dessert", name: "通圓茶屋", desc: "🏛️ 850年歷史！日本現存最古老茶屋，豐臣秀吉也曾光顧。必點：抹茶團子、煎茶。宇治橋旁絕佳位置。", rating: 4.3, reviewCount: 1500, priceLevel: "$$", mapQuery: "Tsuen Chaya Uji", coords: { lat: 34.893290, lng: 135.807276 } },
                        { type: "dessert", name: "三星園 上林三入本店", desc: "🍨 450年抹茶老舖！可現場體驗手刷抹茶，抹茶冰淇淋濃郁不甜膩。位於平等院表參道。", rating: 4.4, reviewCount: 980, priceLevel: "$$", mapQuery: "Sansenen Uji", coords: { lat: 34.891091, lng: 135.806306 } },
                        { type: "dessert", name: "伊藤久右衛門", desc: "🍵 抹茶巴菲聖代專門店，季節限定款必點。也有抹茶蕎麥麵。", rating: 4.4, reviewCount: 3100, priceLevel: "$$", mapQuery: "Itohkyuemon Uji Main Store", coords: { lat: 34.8895, lng: 135.8037 } },
                        { type: "food", name: "地雞家心 (Kokoro)", desc: "🍗 宇治當地人推薦的雞肉料理與燒鳥，價格實惠。", rating: 4.5, reviewCount: 450, priceLevel: "$$", mapQuery: "Jidoriya Kokoro Uji", coords: { lat: 34.8898, lng: 135.8002 } }
                    ]
                },
                {
                    name: "大阪本町 (飯店周邊)",
                    desc: "靭公園周邊高質感咖啡與餐酒館",
                    recs: [
                        { type: "coffee", name: "NOTEQUAL COFFEE", desc: "⭐ 4.9分神店！本町最高評價咖啡廳，自家烘焙精品咖啡。極簡工業風空間，咖啡師專業度極高。", rating: 4.9, reviewCount: 280, priceLevel: "$$", mapQuery: "NOTEQUAL COFFEE Osaka", coords: { lat: 34.680871, lng: 135.503591 } },
                        { type: "food", name: "Bar TSUBAME", desc: "🍷 4.6分高評價餐酒館！日式洋食風格，氣氛極佳。適合晚餐約會，建議預約。", rating: 4.6, reviewCount: 420, priceLevel: "$$$", mapQuery: "Bar TSUBAME Osaka", coords: { lat: 34.684137, lng: 135.495642 } },
                        { type: "food", name: "MY NEIGHBOR", desc: "🍝 靭公園旁的義式小館，義大利麵與燉飯評價很高。午餐套餐CP值高。", rating: 4.4, reviewCount: 350, priceLevel: "$$", mapQuery: "MY NEIGHBOR Utsubo Osaka", coords: { lat: 34.683356, lng: 135.493722 } },
                        { type: "food", name: "UTSUBO BAKERY", desc: "🥐 4.4分人氣麵包店！靭公園旁，推薦可頌與丹麥麵包。適合買來公園野餐。", rating: 4.4, reviewCount: 380, priceLevel: "$", mapQuery: "UTSUBO BAKERY Osaka", coords: { lat: 34.685277, lng: 135.496231 } },
                        { type: "drug", name: "大國藥妝 本町店", desc: "💊 24小時營業！飯店步行可達，夜間補貨方便。價格比心齋橋便宜 (記得用優惠券)。", rating: 4.0, reviewCount: 650, priceLevel: "$$", mapQuery: "Daikoku Drug Honmachi", coords: { lat: 34.682704, lng: 135.501468 } },
                        { type: "food", name: "中華蕎麥 葛 (Kazura)", desc: "🍜 超人氣泡沫系雞白湯拉麵，高分名店。", rating: 4.6, reviewCount: 1800, priceLevel: "$", mapQuery: "Chuka Soba Kazura", coords: { lat: 34.6823, lng: 135.5025 } },
                        { type: "coffee", name: "Wad Omotenashi Cafe", desc: "🍵 極簡日式茶屋，非常有質感的刨冰與茶。", rating: 4.7, reviewCount: 650, priceLevel: "$$", mapQuery: "Wad Omotenashi Cafe", coords: { lat: 34.6798, lng: 135.5028 } },
                        { type: "shopping", name: "Standard Products", desc: "🛒 大創的高級副牌，簡約生活雜貨。", rating: 4.3, reviewCount: 200, priceLevel: "$", mapQuery: "Standard Products Shinsaibashi", coords: { lat: 34.6730, lng: 135.5012 } }
                    ]
                }
            ]
        },
        {
            day: 4,
            date: "12/12 (五)",
            location: "大阪環球影城 USJ",
            hotel: "HOTEL androoms 大阪本町",
            hotelCoords: { lat: 34.6834, lng: 135.5011 },
            color: "from-yellow-100 to-orange-100",
            spots: [
                {
                    name: "USJ 園區內餐廳",
                    desc: "人氣餐廳 Top 5 (部分需整理券)",
                    recs: [
                        { type: "food", name: "奇諾比奧咖啡店 (Kinopio's Cafe)", desc: "🍄 人氣斷層第一！必點瑪利歐培根起司漢堡、超級蘑菇披薩碗、問號磚塊提拉米蘇。需整理券，入園就掃碼預約！", rating: 4.8, reviewCount: 8500, priceLevel: "$$$", mapQuery: "Kinopio's Cafe USJ", coords: { lat: 34.6663, lng: 135.4323 } },
                        { type: "food", name: "三根掃帚 (Three Broomsticks)", desc: "🍗 哈利波特區氣氛與美味兼具！必點烤雞拼盤、牧羊人派。戶外座位可欣賞霍格華茲城堡倒影。", rating: 4.6, reviewCount: 6200, priceLevel: "$$", mapQuery: "Three Broomsticks USJ", coords: { lat: 34.6680, lng: 135.4318 } },
                        { type: "food", name: "園畔護柵 (Park Side Grille)", desc: "🥩 園內最好吃的正式西餐！必點熟成牛排、安格斯牛肉。想好好休息享受高級服務的首選。", rating: 4.5, reviewCount: 2800, priceLevel: "$$$", mapQuery: "Park Side Grille USJ", coords: { lat: 34.6654, lng: 135.4320 } },
                        { type: "food", name: "史努比外景咖啡廳", desc: "🍔 親子友善首選！史努比造型漢堡餐、史努比包子超可愛，適合拍照打卡。", rating: 4.3, reviewCount: 1800, priceLevel: "$$", mapQuery: "Snoopy Backlot Cafe USJ", coords: { lat: 34.6670, lng: 135.4335 } },
                        { type: "food", name: "路易紐約披薩餅舖", desc: "🍕 高CP值速食！瑪格麗特披薩、四種起司披薩。座位多出餐快，不想排太久的好選擇。", rating: 4.2, reviewCount: 2100, priceLevel: "$$", mapQuery: "Louie's N.Y. Pizza Parlor USJ", coords: { lat: 34.6658, lng: 135.4328 } }
                    ]
                },
                {
                    name: "USJ 園區內小食",
                    desc: "邊走邊吃人氣點心 Top 5",
                    recs: [
                        { type: "snack", name: "龜殼披薩餃 (Koopa Calzone)", desc: "🐢 耀西小吃島必買！綠色龜殼造型，內餡是拿坡里義大利麵與起司，鹹香好吃。", rating: 4.5, reviewCount: 3200, priceLevel: "$", mapQuery: "Yoshi's Snack Island USJ", coords: { lat: 34.6665, lng: 135.4325 } },
                        { type: "snack", name: "奶油啤酒 (Butterbeer)", desc: "🍺 哈利波特區經典必喝！推薦買冰沙版本 (Frozen) 比較不甜膩，無酒精。", rating: 4.7, reviewCount: 12000, priceLevel: "$$", mapQuery: "Butterbeer Cart USJ", coords: { lat: 34.6680, lng: 135.4318 } },
                        { type: "snack", name: "小小兵餅乾三明治", desc: "🍌 口味隨季節更換 (香蕉冰淇淋、草莓等)，巨大且拍照效果極佳！", rating: 4.4, reviewCount: 4500, priceLevel: "$", mapQuery: "Minion Park USJ", coords: { lat: 34.6672, lng: 135.4340 } },
                        { type: "dessert", name: "瑪利歐帽子鬆餅", desc: "🎩 瑪利歐咖啡店限定！造型精緻夾心鬆餅 (草莓/葡萄起司)，沒抽到整理券也能過乾癮。", rating: 4.3, reviewCount: 2800, priceLevel: "$$", mapQuery: "Mario Cafe Store USJ", coords: { lat: 34.6660, lng: 135.4345 } },
                        { type: "snack", name: "火雞腿 (Turkey Leg)", desc: "🦃 侏羅紀公園區經典！肉大塊多汁，補充體力首選。", rating: 4.2, reviewCount: 3500, priceLevel: "$$", mapQuery: "Jurassic Park USJ", coords: { lat: 34.6675, lng: 135.4310 } }
                    ]
                },
                {
                    name: "USJ City Walk (園區外)",
                    desc: "結束後的晚餐選擇 Top 5",
                    recs: [
                        { type: "food", name: "大阪章魚燒博物館", desc: "🐙 一次吃遍大阪名店！內有會津屋元祖章魚燒、甲賀流、十八番等 5-6 家名店，不用跑市區。", rating: 4.5, reviewCount: 5800, priceLevel: "$", mapQuery: "Takoyaki Museum Universal CityWalk", coords: { lat: 34.6655, lng: 135.4352 } },
                        { type: "food", name: "Shake Shack", desc: "🍔 來自紐約的經典漢堡，肉質鮮嫩多汁，薯條濃郁。玩累了一天吃到會覺得復活！", rating: 4.4, reviewCount: 4200, priceLevel: "$$", mapQuery: "Shake Shack Universal CityWalk", coords: { lat: 34.6657, lng: 135.4350 } },
                        { type: "snack", name: "551 蓬萊 (HORAI)", desc: "🥟 大阪靈魂美食！豬肉包和燒賣必買，適合買回飯店當宵夜，經常大排長龍。", rating: 4.6, reviewCount: 6800, priceLevel: "$", mapQuery: "551 Horai Universal City", coords: { lat: 34.6655, lng: 135.4355 } },
                        { type: "food", name: "Bubba Gump 阿甘蝦餐廳", desc: "🦐 以電影《阿甘正傳》為主題，擅長各種蝦料理。窗邊可看園區夜景，適合家庭聚餐。", rating: 4.3, reviewCount: 2800, priceLevel: "$$$", mapQuery: "Bubba Gump Shrimp Universal CityWalk Osaka", coords: { lat: 34.6658, lng: 135.4348 } },
                        { type: "food", name: "京都勝牛", desc: "🥩 想吃熱騰騰白飯與炸物的好選擇！炸牛排外酥內嫩，醬料豐富。", rating: 4.4, reviewCount: 2200, priceLevel: "$$", mapQuery: "Kyoto Katsugyu Universal CityWalk", coords: { lat: 34.6656, lng: 135.4353 } }
                    ]
                }
            ]
        },
        {
            day: 5,
            date: "12/13 (六)",
            location: "關西機場・返台",
            hotel: "溫暖的家",
            hotelCoords: null,
            color: "from-slate-100 to-gray-200",
            spots: [
                {
                    name: "T1 2F 美食街 (安檢前)",
                    desc: "所有旅客皆可進入，送機者也OK",
                    recs: [
                        { type: "food", name: "551 HORAI 蓬萊", desc: "🥟 大阪必吃靈魂美食！現蒸豬肉包 (豚まん) 皮厚餡多汁。⚠️ 注意：肉製品無法帶回台灣，只能現場吃或帶回飯店。另有冷凍燒賣可買。", rating: 4.1, reviewCount: 2800, priceLevel: "$", mapQuery: "551 Horai Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 }, externalLink: "https://maps.app.goo.gl/pxn5bqcZjGf8Y7Ur9" },
                        { type: "food", name: "道頓堀 神座拉麵", desc: "🍜 大阪人氣拉麵！特色是加入大量白菜的清甜湯頭，口味清爽不油膩。離開日本前想喝熱湯的好選擇。", rating: 3.7, reviewCount: 650, priceLevel: "$", mapQuery: "Kamukura Ramen Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 }, externalLink: "https://maps.app.goo.gl/Ub6qKmcHe3j5uM7r5" },
                        { type: "snack", name: "章魚昌 (Takomasa)", desc: "🐙 創業1979年老字號。除了現吃，冷凍章魚燒是知名伴手禮！(評分較低因機場價格偏高，但仍具代表性)", rating: 2.9, reviewCount: 420, priceLevel: "$", mapQuery: "Takomasa Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 }, externalLink: "https://maps.app.goo.gl/tE4nQ3YhqfTvNnGj6" }
                    ]
                },
                {
                    name: "T1 2F 出境區 (安檢後)",
                    desc: "僅限出國旅客，整修後精華區域",
                    recs: [
                        { type: "coffee", name: "Café Dior by Anne-Sophie Pic", desc: "✨ 全球首間機場 Dior 咖啡廳！由法國米其林三星女主廚監修，精緻甜點與拉花拿鐵。極致奢華的候機體驗，值得打卡！", rating: 4.5, reviewCount: 380, priceLevel: "$$$", mapQuery: "Cafe Dior Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 }, externalLink: "https://maps.app.goo.gl/C5oYY3J9tFRKvdwT9" },
                        { type: "food", name: "OnigiriBurger", desc: "🍙 4.7分高評價新美食！日式飯糰與美式漢堡結合，使用優質海苔與米飯。神戶牛口味超受歡迎！", rating: 4.7, reviewCount: 520, priceLevel: "$$", mapQuery: "OnigiriBurger Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 }, externalLink: "https://maps.app.goo.gl/2QRkjkC9qc8kWQbW9" },
                        { type: "food", name: "壽司處 西屋 (Nishiya)", desc: "🍣 大阪天滿壽司老店分店。上飛機前吃正宗握壽司的好選擇，雖評分普通但品質穩定。", rating: 3.4, reviewCount: 280, priceLevel: "$$$", mapQuery: "Nishiya Sushi Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 }, externalLink: "https://maps.app.goo.gl/HfEBnUvNvfYpT5gf9" }
                    ]
                },
                {
                    name: "T2 航廈 (樂桃專用)",
                    desc: "廉航旅客適用 (國內/國際線)",
                    recs: [
                        { type: "food", name: "Japan Traveling Restaurant", desc: "🍳 由大阪燒名店 BOTEJYU 營運！不僅有大阪燒，還集結日本各地知名鄉土料理，選擇多樣。廉航旅客的好選擇。", rating: 3.2, reviewCount: 180, priceLevel: "$$", mapQuery: "Japan Traveling Restaurant Kansai Airport T2", coords: { lat: 34.4272, lng: 135.2302 }, externalLink: "https://maps.app.goo.gl/pJGc9VkDqWQQR5Dn9" }
                    ]
                },
                {
                    name: "必買伴手禮 (免稅店)",
                    desc: "KIX DUTY FREE - T1 2F 管制區內最大",
                    recs: [
                        { type: "shopping", name: "呼吸巧克力 (關西限定)", desc: "🍫 提拉米蘇口味最經典！關西限定伴手禮，入口即化的空氣感巧克力。送禮自用兩相宜。", rating: 4.5, reviewCount: 3200, priceLevel: "$$", mapQuery: "KIX Duty Free Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 } },
                        { type: "shopping", name: "Frantz 神戶草莓松露巧克力", desc: "🍓 紅色盒子經典包裝！整顆草莓乾包在巧克力裡，酸甜平衡。神戶名產，送禮超體面。", rating: 4.6, reviewCount: 2800, priceLevel: "$$", mapQuery: "KIX Duty Free Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 } },
                        { type: "shopping", name: "赤福 (Akafuku)", desc: "🍡 伊勢神宮名產紅豆麻糬！保存期限極短 (2-3天)，機場買最方便。軟糯紅豆餡是經典日本味。", rating: 4.4, reviewCount: 1500, priceLevel: "$", mapQuery: "KIX Duty Free Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 } },
                        { type: "shopping", name: "Bâton d'or (Pocky界的LV)", desc: "🥢 高級版Pocky！只有關西買得到，使用發酵奶油，口感層次豐富。送禮極佳，常缺貨請早買。", rating: 4.7, reviewCount: 4200, priceLevel: "$$", mapQuery: "KIX Duty Free Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 } },
                        { type: "shopping", name: "ROYCE' 巧克力洋芋片", desc: "🍟 北海道超人氣！鹹甜絕配，機場依然是熱銷冠軍。建議買保冷袋保存。", rating: 4.6, reviewCount: 5800, priceLevel: "$$", mapQuery: "KIX Duty Free Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 } },
                        { type: "shopping", name: "白色戀人", desc: "🍪 北海道經典！白巧克力夾心餅乾，送禮永不出錯的選擇。", rating: 4.5, reviewCount: 8900, priceLevel: "$$", mapQuery: "KIX Duty Free Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 } }
                    ]
                },
                {
                    name: "藥妝最後補貨",
                    desc: "⚠️ 液體超過100ml需安檢前買並託運",
                    recs: [
                        { type: "drug", name: "Cocokara Fine (安檢前・最大)", desc: "💊 T1 2F 北側麥當勞旁，營業 07:00-22:00。機場最大間！若有大量液體藥妝 (化妝水等) 要買，請在這裡買完塞進行李箱託運。", rating: 4.0, reviewCount: 850, priceLevel: "$$", mapQuery: "Cocokara Fine Kansai Airport T1", coords: { lat: 34.4347, lng: 135.2441 }, externalLink: "https://maps.app.goo.gl/v8QDr7xPqwjYG5gB9" },
                        { type: "drug", name: "Cocokara Fine (安檢後)", desc: "💊 T1 2F 國際線出境區南側，營業 06:30-00:15。位於管制區內，適合補買小東西或非液體藥妝 (100ml以下OK)。", rating: 3.8, reviewCount: 420, priceLevel: "$$", mapQuery: "Cocokara Fine Kansai Airport Departure", coords: { lat: 34.4347, lng: 135.2441 } },
                        { type: "drug", name: "Cocokara Fine (T2 安檢前)", desc: "💊 T2 國際線大廳，營業 05:45-末班機。廉航旅客的最後補貨站！", rating: 3.5, reviewCount: 180, priceLevel: "$$", mapQuery: "Cocokara Fine Kansai Airport T2", coords: { lat: 34.4272, lng: 135.2302 } }
                    ]
                },
                {
                    name: "機場地圖與資訊",
                    desc: "出發前先看好位置，省時省力",
                    recs: [
                        {
                            type: "coupon",
                            name: "關西機場官方樓層地圖",
                            desc: "📍 T1 航廈完整樓層圖，包含美食街、免稅店、藥妝店位置。建議截圖保存！",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "必看",
                            mapQuery: "Kansai International Airport",
                            coords: { lat: 34.4347, lng: 135.2441 },
                            externalLink: "https://www.kansai-airport.or.jp/tw/map/t1"
                        },
                        {
                            type: "coupon",
                            name: "T2 航廈地圖 (樂桃)",
                            desc: "📍 T2 航廈樓層圖，適用樂桃等廉航旅客。",
                            rating: 5.0,
                            reviewCount: 99999,
                            priceLevel: "必看",
                            mapQuery: "Kansai International Airport T2",
                            coords: { lat: 34.4272, lng: 135.2302 },
                            externalLink: "https://www.kansai-airport.or.jp/tw/map/t2"
                        }
                    ]
                }
            ]
        }
    ];

    const currentItinerary = itineraryData.find(d => d.day === activeDay);

    return (
        <LocationProvider>
            <div className="min-h-screen pb-20 max-w-md mx-auto bg-[#FAFAFA] shadow-2xl relative overflow-hidden font-sans">
                {/* Header */}
                <div className={`pt-12 pb-6 px-6 bg-gradient-to-br ${currentItinerary.color} rounded-b-[40px] shadow-sm transition-all duration-500`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-600 tracking-widest border border-white/40">
                            君&媽咪の京阪之旅 2025
                        </span>
                        <div className="flex items-center gap-2">
                            <WeatherIcon day={activeDay} coords={currentItinerary.hotelCoords} />
                            <LocationButton />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">{currentItinerary.location}</h1>
                    <p className="text-gray-600 font-medium opacity-80 flex items-center gap-1">
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded mr-1">Day {activeDay}</span>
                        {currentItinerary.date}
                    </p>

                    {/* Hotel Info Mini Card */}
                    <div className="mt-6 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-white/50 flex items-start gap-3">
                        <div className="bg-gray-800 p-2 rounded-full text-white mt-0.5">
                            <MapPin size={14} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Accommodation</p>
                            <p className="text-sm font-bold text-gray-800 leading-tight">{currentItinerary.hotel}</p>
                        </div>
                    </div>
                </div>

                {/* Day Selector */}
                <div className="flex gap-3 overflow-x-auto px-6 py-6 no-scrollbar snap-x">
                    {itineraryData.map((d) => (
                        <button
                            key={d.day}
                            onClick={() => setActiveDay(d.day)}
                            className={`snap-center shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-2xl border transition-all duration-300 ${
                                activeDay === d.day
                                ? 'bg-gray-800 text-white border-gray-800 shadow-lg scale-105'
                                : 'bg-white text-gray-400 border-gray-100'
                            }`}
                        >
                            <span className="text-xs font-medium">Day</span>
                            <span className="text-xl font-bold">{d.day}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 animate-fade-in pb-16">
                    {/* Day 4 (USJ) Tab Switcher */}
                    {activeDay === 4 && (
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setUsjTab('food')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                    usjTab === 'food'
                                        ? 'bg-orange-500 text-white shadow-lg'
                                        : 'bg-white text-gray-500 border border-gray-200'
                                }`}
                            >
                                🍔 美食推薦
                            </button>
                            <button
                                onClick={() => setUsjTab('guide')}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                                    usjTab === 'guide'
                                        ? 'bg-orange-500 text-white shadow-lg'
                                        : 'bg-white text-gray-500 border border-gray-200'
                                }`}
                            >
                                🎢 排隊攻略
                            </button>
                        </div>
                    )}

                    {/* Show USJ Guide or regular spots */}
                    {activeDay === 4 && usjTab === 'guide' ? (
                        <USJGuide />
                    ) : (
                        currentItinerary.spots.map((spot, index) => (
                            <SpotSection key={index} spot={spot} />
                        ))
                    )}
                </div>

                {/* Footer / Floating Info */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl rounded-full px-6 py-3 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-gray-600">旅途愉快 Have a nice trip!</span>
                    </div>
                </div>
            </div>
        </LocationProvider>
    );
};

// --- Location Button Component ---
const LocationButton = () => {
    const { userLocation, locationError, isLoading, requestLocation } = useLocation();

    return (
        <button
            onClick={requestLocation}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${
                userLocation
                    ? 'bg-green-500 text-white'
                    : locationError
                        ? 'bg-red-100 text-red-500'
                        : 'bg-white/60 text-gray-600 hover:bg-white/80'
            }`}
            title={userLocation ? '已取得位置' : locationError || '點擊取得位置'}
        >
            {isLoading ? (
                <Loader size={16} className="animate-spin" />
            ) : (
                <Navigation size={16} className={userLocation ? 'fill-current' : ''} />
            )}
        </button>
    );
};

// --- Sub Components ---

const TypeIcon = ({ type }) => {
    switch(type) {
        case 'food': return <div className="p-1.5 bg-orange-100 text-orange-500 rounded-full"><Utensils size={14} /></div>;
        case 'dessert':
        case 'snack': return <div className="p-1.5 bg-pink-100 text-pink-500 rounded-full"><Coffee size={14} /></div>;
        case 'shopping': return <div className="p-1.5 bg-purple-100 text-purple-500 rounded-full"><ShoppingBag size={14} /></div>;
        case 'drug': return <div className="p-1.5 bg-blue-100 text-blue-500 rounded-full"><Heart size={14} /></div>;
        case 'coffee': return <div className="p-1.5 bg-amber-100 text-amber-600 rounded-full"><Coffee size={14} /></div>;
        case 'coupon': return <div className="p-1.5 bg-red-100 text-red-500 rounded-full animate-bounce"><Ticket size={14} /></div>;
        default: return <div className="p-1.5 bg-gray-100 text-gray-500 rounded-full"><Star size={14} /></div>;
    }
};

const DistanceBadge = ({ coords }) => {
    const { userLocation } = useLocation();

    if (!userLocation || !coords) return null;

    const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        coords.lat,
        coords.lng
    );

    const formattedDistance = formatDistance(distance);
    const walkTime = estimateWalkTime(distance);

    return (
        <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <Navigation size={10} className="fill-current" />
            <span>{formattedDistance}</span>
            <span className="text-blue-400">•</span>
            <span className="text-blue-500">{walkTime}</span>
        </div>
    );
};

const RecCard = ({ item }) => {
    const [copied, setCopied] = useState(false);

    const googleMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`;

    const handleNav = () => {
        if (item.externalLink) {
             window.open(item.externalLink, '_blank');
        } else {
             window.open(googleMapUrl, '_blank');
        }
    };

    const handleShare = async () => {
        try {
            const shareText = item.externalLink
                ? `${item.name} - ${item.desc}\n優惠券連結: ${item.externalLink}`
                : `${item.name} - ${item.desc}\n${googleMapUrl}`;

            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const formatReviews = (count) => {
        if (count > 10000) return `(${Math.floor(count/10000)}w+)`;
        return count > 1000 ? `(${count/1000}k)` : `(${count})`;
    };

    const isCoupon = item.type === 'coupon';
    const cardBg = isCoupon ? "bg-red-50 border-red-100" : "bg-white border-gray-100";

    return (
        <div className={`${cardBg} p-4 rounded-2xl border shadow-sm flex flex-col gap-2 mb-3 relative overflow-hidden group`}>
             <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-3xl -z-0"></div>

            <div className="flex justify-between items-start z-10">
                <div className="flex gap-2 items-center">
                    <TypeIcon type={item.type} />
                    <div className="flex flex-col">
                        <h4 className={`font-bold text-base leading-tight ${isCoupon ? "text-red-600" : "text-gray-800"}`}>{item.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-800">{item.rating}</span>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        size={10}
                                        className={`${i < Math.floor(item.rating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">{formatReviews(item.reviewCount)}</span>
                            <span className="text-[10px] text-gray-300 mx-1">•</span>
                            <span className="text-[10px] text-gray-500 font-medium">{item.priceLevel}</span>
                        </div>
                        {/* Distance Badge */}
                        <div className="mt-1">
                            <DistanceBadge coords={item.coords} />
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed pl-9 z-10">
                {item.desc}
            </p>

            <div className="flex justify-end mt-2 gap-2 z-10">
                <button
                    onClick={handleShare}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    {copied ? <Check size={12} /> : <Share2 size={12} />}
                    {copied ? '已複製' : '分享'}
                </button>

                <button
                    onClick={handleNav}
                    className={`flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all shadow-md ${isCoupon ? 'bg-red-500 shadow-red-200' : 'bg-blue-600 shadow-blue-200'}`}
                >
                    {isCoupon ? <Ticket size={12} /> : <ExternalLink size={12} />}
                    {isCoupon ? '領取優惠券' : 'Google Maps'}
                </button>
            </div>
        </div>
    );
};

const SpotSection = ({ spot }) => {
    return (
        <div className="mb-8 relative pl-6 border-l-2 border-dashed border-gray-300 ml-3">
            <div className="absolute -left-2.5 top-0 w-5 h-5 bg-gray-800 rounded-full border-4 border-white shadow-sm z-10"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">{spot.name}</h3>
            <p className="text-sm text-gray-400 mb-4">{spot.desc}</p>

            <div className="flex flex-col gap-1">
                {spot.recs.map((rec, idx) => (
                    <RecCard key={idx} item={rec} />
                ))}
            </div>
        </div>
    );
};

export default App;
