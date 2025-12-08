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

// --- 天氣圖示組件 (使用 Open-Meteo 免費 API) ---
const WeatherIcon = ({ day, coords }) => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    // 每天的地標 emoji
    const landmarks = {
        1: "🏯", // 大阪城
        2: "⛩️", // 京都鳥居
        3: "🍵", // 宇治抹茶
        4: "🎢", // USJ
        5: "✈️", // 機場
    };

    // 天氣代碼對應 emoji
    const getWeatherEmoji = (code) => {
        if (code === 0) return "☀️";
        if (code <= 3) return "🌤️";
        if (code <= 48) return "☁️";
        if (code <= 67) return "🌧️";
        if (code <= 77) return "🌨️";
        if (code <= 99) return "⛈️";
        return "🌤️";
    };

    // 計算目標日期 (2024/12/9 + day - 1)
    const getTargetDate = (dayNum) => {
        const baseDate = new Date(2024, 11, 9); // 12月9日
        baseDate.setDate(baseDate.getDate() + dayNum - 1);
        return baseDate.toISOString().split('T')[0];
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
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&start_date=${targetDate}&end_date=${targetDate}`
                );
                const data = await response.json();

                if (data.daily) {
                    setWeather({
                        code: data.daily.weather_code[0],
                        tempMax: Math.round(data.daily.temperature_2m_max[0]),
                        tempMin: Math.round(data.daily.temperature_2m_min[0]),
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

    const landmark = landmarks[day] || "📍";

    if (loading) {
        return (
            <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-full border border-white/50">
                <span className="text-base">{landmark}</span>
                <Loader size={12} className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (!weather) {
        return (
            <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-full border border-white/50">
                <span className="text-base">{landmark}🌤️</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-full border border-white/50">
            <span className="text-base">{landmark}{getWeatherEmoji(weather.code)}</span>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-700 leading-none">{weather.tempMin}-{weather.tempMax}°C</span>
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
                    desc: "大阪最熱鬧的購物美食天堂 (必吃清單更新！)",
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
                        { type: "snack", name: "甲賀流章魚燒 (美國村)", desc: "連續三年榮獲「米其林必比登」推薦！口感軟嫩，加上滿滿蔥花與特製美乃滋。", rating: 4.5, reviewCount: 3800, priceLevel: "$", mapQuery: "Kogaryu Takoyaki Americamura", coords: { lat: 34.6725, lng: 135.4985 } },
                        { type: "drug", name: "松本清 心齋橋店", desc: "貨品最齊全，價格競爭力強 (記得用上方優惠券)。", rating: 4.0, reviewCount: 500, priceLevel: "$$", mapQuery: "Matsumoto Kiyoshi Shinsaibashi", coords: { lat: 34.6717, lng: 135.5014 } },
                        { type: "food", name: "北極星蛋包飯", desc: "蛋包飯創始店，在傳統日式老屋享用美味。", rating: 4.3, reviewCount: 4500, priceLevel: "$$", mapQuery: "Hokkyokusei Shinsaibashi Main Store", coords: { lat: 34.6693, lng: 135.5034 } },
                        { type: "food", name: "味乃家 (Ajinoya)", desc: "米其林必比登推薦，口感鬆軟的大阪燒。", rating: 4.4, reviewCount: 3100, priceLevel: "$$", mapQuery: "Ajinoya Okonomiyaki", coords: { lat: 34.6679, lng: 135.5025 } },
                        { type: "food", name: "一蘭拉麵 道頓堀店", desc: "台灣人最愛，豚骨湯頭客製化。", rating: 4.5, reviewCount: 12000, priceLevel: "$$", mapQuery: "Ichiran Ramen Dotonbori", coords: { lat: 34.6686, lng: 135.5008 } },
                        { type: "food", name: "元祖串炸達摩", desc: "大阪名物，外皮酥脆，禁止二次沾醬！", rating: 4.2, reviewCount: 3500, priceLevel: "$$", mapQuery: "Kushikatsu Daruma Dotonbori", coords: { lat: 34.6685, lng: 135.5017 } },
                        { type: "dessert", name: "HARBS 大丸心齋橋店", desc: "水果千層蛋糕，鮮奶油清爽不膩。", rating: 4.5, reviewCount: 1500, priceLevel: "$$", mapQuery: "HARBS Daimaru Shinsaibashi", coords: { lat: 34.6747, lng: 135.5010 } },
                        { type: "dessert", name: "PABLO", desc: "經典半熟起司塔，濃郁滑順的口感。", rating: 4.0, reviewCount: 1800, priceLevel: "$", mapQuery: "PABLO Shinsaibashi", coords: { lat: 34.6715, lng: 135.5012 } },
                        { type: "food", name: "美津の (Mizuno)", desc: "米其林必比登推薦大阪燒，排隊名店。", rating: 4.5, reviewCount: 3240, priceLevel: "$$", mapQuery: "Mizuno Osaka Dotonbori", coords: { lat: 34.6688, lng: 135.5023 } },
                        { type: "snack", name: "Rikuro 老爺爺起司蛋糕", desc: "剛出爐搖晃的蓬鬆起司蛋糕，必吃。", rating: 4.6, reviewCount: 8900, priceLevel: "$", mapQuery: "Rikuro Ojisan Namba", coords: { lat: 34.6656, lng: 135.5013 } },
                        { type: "shopping", name: "Parco 心齋橋", desc: "年輕潮流品牌、動漫周邊 (吉卜力、寶可夢)。", rating: 4.4, reviewCount: 1500, priceLevel: "$$$", mapQuery: "Shinsaibashi PARCO", coords: { lat: 34.6745, lng: 135.5007 } },
                        { type: "food", name: "和牛燒肉 六宮 難波心齋橋筋店", desc: "高品質和牛燒肉，價格合理 (建議先預約)。", rating: 4.5, reviewCount: 800, priceLevel: "$$$", mapQuery: "wagyu yakiniku rokunomiya nanba Shinsaibashisuji", coords: { lat: 34.6695, lng: 135.5018 }, externalLink: "https://maps.app.goo.gl/KmFcW1RdZ2Qz5HHj6" },
                        { type: "food", name: "燒肉屋 大牧場 道頓堀店", desc: "道頓堀人氣燒肉店，肉質新鮮 (建議先預約)。", rating: 4.4, reviewCount: 650, priceLevel: "$$$", mapQuery: "燒肉屋 大牧場 道頓堀店", coords: { lat: 34.6688, lng: 135.5018 }, externalLink: "https://maps.app.goo.gl/LadnJzYipRj87Jqz7" },
                        { type: "shopping", name: "驚安殿堂 唐吉訶德 道頓堀店", desc: "24小時營業！零食、藥妝、電器、伴手禮一次買齊，記得用優惠券。", rating: 4.3, reviewCount: 15000, priceLevel: "$$", mapQuery: "Don Quijote Dotonbori", coords: { lat: 34.6687, lng: 135.5020 } },
                        { type: "shopping", name: "唐吉訶德摩天輪 (惠比壽塔)", desc: "道頓堀地標！搭乘摩天輪欣賞大阪夜景，車廂內有冷氣。", rating: 4.4, reviewCount: 5600, priceLevel: "$$", mapQuery: "Don Quijote Ferris Wheel Dotonbori", coords: { lat: 34.6687, lng: 135.5020 } }
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
                    desc: "抹茶的故鄉",
                    recs: [
                        { type: "dessert", name: "中村藤吉 本店", desc: "宇治必吃！生茶果凍與抹茶蕎麥麵。", rating: 4.5, reviewCount: 5200, priceLevel: "$$", mapQuery: "Nakamura Tokichi Honten", coords: { lat: 34.8891, lng: 135.8078 } },
                        { type: "dessert", name: "伊藤久右衛門", desc: "抹茶巴菲聖代，季節限定款必點。", rating: 4.4, reviewCount: 3100, priceLevel: "$$", mapQuery: "Itohkyuemon Uji Main Store", coords: { lat: 34.8895, lng: 135.8037 } },
                        { type: "food", name: "地雞家心 (Kokoro)", desc: "宇治當地人推薦的雞肉料理與燒鳥。", rating: 4.5, reviewCount: 450, priceLevel: "$$", mapQuery: "Jidoriya Kokoro Uji", coords: { lat: 34.8898, lng: 135.8002 } }
                    ]
                },
                {
                    name: "大阪本町 (飯店周邊)",
                    desc: "商務區隱藏美食",
                    recs: [
                        { type: "food", name: "中華蕎麥 葛 (Kazura)", desc: "超人氣泡沫系雞白湯拉麵，高分名店。", rating: 4.6, reviewCount: 1800, priceLevel: "$", mapQuery: "Chuka Soba Kazura", coords: { lat: 34.6823, lng: 135.5025 } },
                        { type: "coffee", name: "Wad Omotenashi Cafe", desc: "極簡日式茶屋，非常有質感的刨冰與茶。", rating: 4.7, reviewCount: 650, priceLevel: "$$", mapQuery: "Wad Omotenashi Cafe", coords: { lat: 34.6798, lng: 135.5028 } },
                        { type: "shopping", name: "Standard Products", desc: "大創的高級副牌，簡約生活雜貨。", rating: 4.3, reviewCount: 200, priceLevel: "$", mapQuery: "Standard Products Shinsaibashi", coords: { lat: 34.6730, lng: 135.5012 } }
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
                    name: "關西機場",
                    desc: "最後衝刺",
                    recs: [
                        { type: "shopping", name: "免稅店 (Fa-So-La)", desc: "購買白色戀人、Tokyo Banana、Royce巧克力。", rating: 4.0, reviewCount: 1200, priceLevel: "$$", mapQuery: "Kansai Airport Duty Free", coords: { lat: 34.4347, lng: 135.2441 } },
                        { type: "food", name: "Pote-Rico (Calbee+)", desc: "現炸薯條棒，外脆內軟。", rating: 4.3, reviewCount: 800, priceLevel: "$", mapQuery: "Calbee+ Kansai Airport", coords: { lat: 34.4347, lng: 135.2441 } }
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
