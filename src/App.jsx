import React, { useState } from 'react';
import { MapPin, Coffee, Utensils, ShoppingBag, Star, Calendar, Heart, Share2, Check, ExternalLink, Ticket } from 'lucide-react';

const App = () => {
    const [activeDay, setActiveDay] = useState(1);

    const itineraryData = [
        {
            day: 1,
            date: "12/09 (二)",
            location: "大阪・心齋橋/梅田",
            hotel: "大阪 PLAZA HOTEL (十三站)",
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
                            externalLink: "https://www.callingtaiwan.com.tw/%E6%97%A5%E6%9C%AC%E8%97%A5%E5%A6%9D%E5%84%AA%E6%83%A0%E5%88%B8/"
                        },
                        { type: "snack", name: "甲賀流章魚燒 (美國村)", desc: "連續三年榮獲「米其林必比登」推薦！口感軟嫩，加上滿滿蔥花與特製美乃滋。", rating: 4.5, reviewCount: 3800, priceLevel: "$", mapQuery: "Kogaryu Takoyaki Americamura" },
                        { type: "drug", name: "松本清 心齋橋店", desc: "貨品最齊全，價格競爭力強 (記得用上方優惠券)。", rating: 4.0, reviewCount: 500, priceLevel: "$$", mapQuery: "Matsumoto Kiyoshi Shinsaibashi" },
                        { type: "food", name: "北極星蛋包飯", desc: "蛋包飯創始店，在傳統日式老屋享用美味。", rating: 4.3, reviewCount: 4500, priceLevel: "$$", mapQuery: "Hokkyokusei Shinsaibashi Main Store" },
                        { type: "food", name: "味乃家 (Ajinoya)", desc: "米其林必比登推薦，口感鬆軟的大阪燒。", rating: 4.4, reviewCount: 3100, priceLevel: "$$", mapQuery: "Ajinoya Okonomiyaki" },
                        { type: "food", name: "一蘭拉麵 道頓堀店", desc: "台灣人最愛，豚骨湯頭客製化。", rating: 4.5, reviewCount: 12000, priceLevel: "$$", mapQuery: "Ichiran Ramen Dotonbori" },
                        { type: "food", name: "元祖串炸達摩", desc: "大阪名物，外皮酥脆，禁止二次沾醬！", rating: 4.2, reviewCount: 3500, priceLevel: "$$", mapQuery: "Kushikatsu Daruma Dotonbori" },
                        { type: "dessert", name: "HARBS 大丸心齋橋店", desc: "水果千層蛋糕，鮮奶油清爽不膩。", rating: 4.5, reviewCount: 1500, priceLevel: "$$", mapQuery: "HARBS Daimaru Shinsaibashi" },
                        { type: "dessert", name: "PABLO", desc: "經典半熟起司塔，濃郁滑順的口感。", rating: 4.0, reviewCount: 1800, priceLevel: "$", mapQuery: "PABLO Shinsaibashi" },
                        { type: "food", name: "美津の (Mizuno)", desc: "米其林必比登推薦大阪燒，排隊名店。", rating: 4.5, reviewCount: 3240, priceLevel: "$$", mapQuery: "Mizuno Osaka Dotonbori" },
                        { type: "snack", name: "Rikuro 老爺爺起司蛋糕", desc: "剛出爐搖晃的蓬鬆起司蛋糕，必吃。", rating: 4.6, reviewCount: 8900, priceLevel: "$", mapQuery: "Rikuro Ojisan Namba" },
                        { type: "shopping", name: "Parco 心齋橋", desc: "年輕潮流品牌、動漫周邊 (吉卜力、寶可夢)。", rating: 4.4, reviewCount: 1500, priceLevel: "$$$", mapQuery: "Shinsaibashi PARCO" },
                        { type: "food", name: "和牛燒肉 六宮 難波心齋橋筋店", desc: "高品質和牛燒肉，價格合理 (建議先預約)。", rating: 4.5, reviewCount: 800, priceLevel: "$$$", mapQuery: "wagyu yakiniku rokunomiya nanba Shinsaibashisuji", externalLink: "https://maps.app.goo.gl/KmFcW1RdZ2Qz5HHj6" },
                        { type: "food", name: "燒肉屋 大牧場 道頓堀店", desc: "道頓堀人氣燒肉店，肉質新鮮 (建議先預約)。", rating: 4.4, reviewCount: 650, priceLevel: "$$$", mapQuery: "燒肉屋 大牧場 道頓堀店", externalLink: "https://maps.app.goo.gl/LadnJzYipRj87Jqz7" },
                        { type: "shopping", name: "驚安殿堂 唐吉訶德 道頓堀店", desc: "24小時營業！零食、藥妝、電器、伴手禮一次買齊，記得用優惠券。", rating: 4.3, reviewCount: 15000, priceLevel: "$$", mapQuery: "Don Quijote Dotonbori" },
                        { type: "shopping", name: "唐吉訶德摩天輪 (惠比壽塔)", desc: "道頓堀地標！搭乘摩天輪欣賞大阪夜景，車廂內有冷氣。", rating: 4.4, reviewCount: 5600, priceLevel: "$$", mapQuery: "Don Quijote Ferris Wheel Dotonbori" }
                    ]
                },
                {
                    name: "難波・千日前 (新增)",
                    desc: "在地人也愛的排隊名店區",
                    recs: [
                        { type: "snack", name: "章魚燒道樂 Wanaka (千日前本店)", desc: "大阪人心中No.1！外皮薄脆內餡軟嫩，就在福太郎隔壁。", rating: 4.4, reviewCount: 4500, priceLevel: "$", mapQuery: "Takoyaki Wanaka Sennichimae", externalLink: "https://maps.app.goo.gl/RXb4wTEmXzL6ihCPA" },
                        { type: "food", name: "福太郎 本店 (Fukutaro)", desc: "Top1 大阪燒名店！必點蔥燒 (Negiyaki)，口感軟嫩。", rating: 4.2, reviewCount: 3300, priceLevel: "$$", mapQuery: "Fukutaro Okonomiyaki Main Store" },
                        { type: "food", name: "鳥貴族 難波千日前店", desc: "高CP值連鎖居酒屋，均一價！必點貴族燒與釜飯。", rating: 4.0, reviewCount: 800, priceLevel: "$", mapQuery: "Torikizoku Namba Sennichimae" }
                    ]
                },
                {
                    name: "梅田 (自由活動)",
                    desc: "時尚百貨與地下迷宮",
                    recs: [
                        { type: "dessert", name: "Harbs Diamor Osaka", desc: "傳說中的水果千層蛋糕，不甜不膩。", rating: 4.4, reviewCount: 1200, priceLevel: "$$", mapQuery: "Harbs Diamor Osaka" },
                        { type: "food", name: "龜壽司 (Kame Sushi)", desc: "老字號高CP值壽司，當地人也愛。", rating: 4.5, reviewCount: 2800, priceLevel: "$$", mapQuery: "Kame Sushi Total Main Shop" },
                        { type: "shopping", name: "LUCUA / LUCUA 1100", desc: "年輕女生最愛的服飾品牌集散地。", rating: 4.3, reviewCount: 4100, priceLevel: "$$", mapQuery: "LUCUA Osaka" }
                    ]
                },
                {
                    name: "飯店周邊 (十三 Juso)",
                    desc: "在地美食激戰區",
                    recs: [
                        { type: "food", name: "Negiyaki Yamamoto", desc: "蔥燒大阪燒發源地，香氣十足。", rating: 4.4, reviewCount: 1100, priceLevel: "$$", mapQuery: "Negiyaki Yamamoto Main Store" },
                        { type: "snack", name: "喜八洲總本舖", desc: "必買御手洗糰子，焦香醬甜。", rating: 4.5, reviewCount: 2300, priceLevel: "$", mapQuery: "Kiyasu Sohonpo Head Office" }
                    ]
                }
            ]
        },
        {
            day: 2,
            date: "12/10 (三)",
            location: "京都・清水寺/嵐山/伏見",
            hotel: "Chisun Premium Kyoto Kujo",
            color: "from-blue-100 to-indigo-100",
            spots: [
                {
                    name: "清水寺 & 二三年坂",
                    desc: "世界遺產與古老坡道",
                    recs: [
                        { type: "coffee", name: "% ARABICA Kyoto Higashiyama", desc: "網紅咖啡始祖，拿鐵極致順滑。", rating: 4.4, reviewCount: 3500, priceLevel: "$$", mapQuery: "% ARABICA Kyoto Higashiyama" },
                        { type: "food", name: "奧丹清水 (Okutan)", desc: "380年歷史的湯豆腐老店，庭園極美。", rating: 4.3, reviewCount: 1200, priceLevel: "$$$", mapQuery: "Okutan Kiyomizu" },
                        { type: "dessert", name: "藤菜美 三年坂本店", desc: "洛水與蕨餅，口感冰涼軟糯。", rating: 4.5, reviewCount: 800, priceLevel: "$", mapQuery: "Fujinami Sannenzaka" }
                    ]
                },
                {
                    name: "嵐山",
                    desc: "竹林與渡月橋",
                    recs: [
                        { type: "food", name: "史提克 奧茲卡 (Steak Otsuka)", desc: "A5黑毛和牛牛排，需預約或早排隊。", rating: 4.7, reviewCount: 950, priceLevel: "$$$", mapQuery: "Steak Otsuka Arashiyama" },
                        { type: "dessert", name: "中村屋可樂餅", desc: "嵐山散步美食，肉舖現炸可樂餅。", rating: 4.4, reviewCount: 1500, priceLevel: "$", mapQuery: "Nakamuraya Arashiyama" },
                        { type: "coffee", name: "eX cafe 嵐山", desc: "自己動手烤糰子，日式庭園風。", rating: 4.3, reviewCount: 1800, priceLevel: "$$", mapQuery: "eX cafe Arashiyama" }
                    ]
                },
                {
                    name: "伏見稻荷大社",
                    desc: "千本鳥居",
                    recs: [
                        { type: "coffee", name: "Vermillion - cafe", desc: "鳥居參拜後的森林系咖啡廳。", rating: 4.6, reviewCount: 600, priceLevel: "$$", mapQuery: "Vermillion - cafe." },
                        { type: "snack", name: "寶玉堂", desc: "傳統狐狸煎餅創始店。", rating: 4.5, reviewCount: 400, priceLevel: "$", mapQuery: "Hogyokudo" }
                    ]
                }
            ]
        },
        {
            day: 3,
            date: "12/11 (四)",
            location: "宇治・大阪本町",
            hotel: "HOTEL androoms 大阪本町",
            color: "from-green-100 to-emerald-100",
            spots: [
                {
                    name: "宇治 (平等院)",
                    desc: "抹茶的故鄉",
                    recs: [
                        { type: "dessert", name: "中村藤吉 本店", desc: "宇治必吃！生茶果凍與抹茶蕎麥麵。", rating: 4.5, reviewCount: 5200, priceLevel: "$$", mapQuery: "Nakamura Tokichi Honten" },
                        { type: "dessert", name: "伊藤久右衛門", desc: "抹茶巴菲聖代，季節限定款必點。", rating: 4.4, reviewCount: 3100, priceLevel: "$$", mapQuery: "Itohkyuemon Uji Main Store" },
                        { type: "food", name: "地雞家心 (Kokoro)", desc: "宇治當地人推薦的雞肉料理與燒鳥。", rating: 4.5, reviewCount: 450, priceLevel: "$$", mapQuery: "Jidoriya Kokoro Uji" }
                    ]
                },
                {
                    name: "大阪本町 (飯店周邊)",
                    desc: "商務區隱藏美食",
                    recs: [
                        { type: "food", name: "中華蕎麥 葛 (Kazura)", desc: "超人氣泡沫系雞白湯拉麵，高分名店。", rating: 4.6, reviewCount: 1800, priceLevel: "$", mapQuery: "Chuka Soba Kazura" },
                        { type: "coffee", name: "Wad Omotenashi Cafe", desc: "極簡日式茶屋，非常有質感的刨冰與茶。", rating: 4.7, reviewCount: 650, priceLevel: "$$", mapQuery: "Wad Omotenashi Cafe" },
                        { type: "shopping", name: "Standard Products", desc: "大創的高級副牌，簡約生活雜貨。", rating: 4.3, reviewCount: 200, priceLevel: "$", mapQuery: "Standard Products Shinsaibashi" }
                    ]
                }
            ]
        },
        {
            day: 4,
            date: "12/12 (五)",
            location: "大阪環球影城 USJ",
            hotel: "HOTEL androoms 大阪本町",
            color: "from-yellow-100 to-orange-100",
            spots: [
                {
                    name: "USJ 園區內",
                    desc: "推薦預約與排隊美食",
                    recs: [
                        { type: "food", name: "Kinopio's Cafe", desc: "瑪利歐賽車漢堡，氣氛滿分 (需整理券)。", rating: 4.2, reviewCount: 1500, priceLevel: "$$$", mapQuery: "Kinopio's Cafe USJ" },
                        { type: "snack", name: "奶油啤酒 (Butterbeer)", desc: "哈利波特園區必喝，無酒精。", rating: 4.5, reviewCount: 3000, priceLevel: "$$", mapQuery: "Three Broomsticks USJ" },
                        { type: "food", name: "Park Side Grille", desc: "園區內較高級的牛排館，適合好好休息。", rating: 4.0, reviewCount: 600, priceLevel: "$$$", mapQuery: "Park Side Grille USJ" }
                    ]
                },
                {
                    name: "USJ City Walk (園區外)",
                    desc: "結束後的晚餐選擇",
                    recs: [
                        { type: "food", name: "SHAKE SHACK", desc: "來自紐約的經典漢堡，穩定好吃。", rating: 4.4, reviewCount: 2200, priceLevel: "$$", mapQuery: "Shake Shack Daimaru Shinsaibashi" },
                        { type: "snack", name: "551 Horai", desc: "大阪名物豬肉包，回飯店當宵夜最棒。", rating: 4.3, reviewCount: 1800, priceLevel: "$", mapQuery: "551 Horai Universal City" }
                    ]
                }
            ]
        },
        {
            day: 5,
            date: "12/13 (六)",
            location: "關西機場・返台",
            hotel: "溫暖的家",
            color: "from-slate-100 to-gray-200",
            spots: [
                {
                    name: "關西機場",
                    desc: "最後衝刺",
                    recs: [
                        { type: "shopping", name: "免稅店 (Fa-So-La)", desc: "購買白色戀人、Tokyo Banana、Royce巧克力。", rating: 4.0, reviewCount: 1200, priceLevel: "$$", mapQuery: "Kansai Airport Duty Free" },
                        { type: "food", name: "Pote-Rico (Calbee+)", desc: "現炸薯條棒，外脆內軟。", rating: 4.3, reviewCount: 800, priceLevel: "$", mapQuery: "Calbee+ Kansai Airport" }
                    ]
                }
            ]
        }
    ];

    const currentItinerary = itineraryData.find(d => d.day === activeDay);

    return (
        <div className="min-h-screen pb-20 max-w-md mx-auto bg-[#FAFAFA] shadow-2xl relative overflow-hidden font-sans">
            {/* Header */}
            <div className={`pt-12 pb-6 px-6 bg-gradient-to-br ${currentItinerary.color} rounded-b-[40px] shadow-sm transition-all duration-500`}>
                <div className="flex justify-between items-center mb-4">
                    <span className="bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-600 tracking-widest border border-white/40">
                        君&媽咪の京阪之旅 2025
                    </span>
                    <div className="w-8 h-8 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Calendar size={16} className="text-gray-600" />
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
                {currentItinerary.spots.map((spot, index) => (
                    <SpotSection key={index} spot={spot} />
                ))}
            </div>

            {/* Footer / Floating Info */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl rounded-full px-6 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-600">旅途愉快 Have a nice trip!</span>
                </div>
            </div>
        </div>
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
                        <div className="flex items-center gap-1 mt-0.5">
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
