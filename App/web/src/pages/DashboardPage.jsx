import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inventoryRestApi } from "@/api/inventoryRest";
import { extractItems } from "@/lib/parseResponse";
import {
  LayoutDashboardIcon,
  PackageIcon,
  ChefHatIcon,
  DollarSignIcon,
  LeafIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ShoppingCartIcon,
  AlertTriangleIcon,
  TagIcon,
  ArchiveIcon,
  ClockIcon,
  CalendarIcon,
  CloudIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudLightningIcon,
  CloudDrizzleIcon,
  CloudFogIcon,
  SunIcon,
  CloudSunIcon,
  MapPinIcon,
} from "lucide-react";

const WMO_WEATHER = {
  0: { label: "Clear sky", Icon: SunIcon },
  1: { label: "Mostly clear", Icon: CloudSunIcon },
  2: { label: "Partly cloudy", Icon: CloudSunIcon },
  3: { label: "Overcast", Icon: CloudIcon },
  45: { label: "Foggy", Icon: CloudFogIcon },
  48: { label: "Icy fog", Icon: CloudFogIcon },
  51: { label: "Light drizzle", Icon: CloudDrizzleIcon },
  53: { label: "Drizzle", Icon: CloudDrizzleIcon },
  55: { label: "Heavy drizzle", Icon: CloudDrizzleIcon },
  61: { label: "Light rain", Icon: CloudRainIcon },
  63: { label: "Rain", Icon: CloudRainIcon },
  65: { label: "Heavy rain", Icon: CloudRainIcon },
  71: { label: "Light snow", Icon: CloudSnowIcon },
  73: { label: "Snow", Icon: CloudSnowIcon },
  75: { label: "Heavy snow", Icon: CloudSnowIcon },
  80: { label: "Rain showers", Icon: CloudRainIcon },
  81: { label: "Rain showers", Icon: CloudRainIcon },
  82: { label: "Heavy showers", Icon: CloudRainIcon },
  95: { label: "Thunderstorm", Icon: CloudLightningIcon },
  96: { label: "Thunderstorm", Icon: CloudLightningIcon },
  99: { label: "Severe storm", Icon: CloudLightningIcon },
};

function getWeatherInfo(code) {
  return WMO_WEATHER[code] || { label: "Unknown", Icon: CloudIcon };
}

const STATS = [
  {
    label: "Items Tracked",
    value: "284",
    delta: "+12 this week",
    icon: PackageIcon,
    color: "text-emerald-600",
    bg: "bg-gradient-to-br from-emerald-50 to-green-100",
    border: "border-emerald-200",
    cardBg: "bg-gradient-to-br from-white to-emerald-50/50",
  },
  {
    label: "Recipes Cooked",
    value: "47",
    delta: "+5 this month",
    icon: ChefHatIcon,
    color: "text-orange-600",
    bg: "bg-gradient-to-br from-orange-50 to-amber-100",
    border: "border-orange-200",
    cardBg: "bg-gradient-to-br from-white to-orange-50/50",
  },
  {
    label: "Money Saved",
    value: "$342",
    delta: "+$58 this month",
    icon: DollarSignIcon,
    color: "text-sky-600",
    bg: "bg-gradient-to-br from-sky-50 to-blue-100",
    border: "border-sky-200",
    cardBg: "bg-gradient-to-br from-white to-sky-50/50",
  },
  {
    label: "Food Waste Reduced",
    value: "73%",
    delta: "vs. national avg 40%",
    icon: LeafIcon,
    color: "text-teal-600",
    bg: "bg-gradient-to-br from-teal-50 to-emerald-100",
    border: "border-teal-200",
    cardBg: "bg-gradient-to-br from-white to-teal-50/50",
  },
];

function AnimatedNumber({ value, duration = 1200 }) {
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    const el = ref.current;
    if (!el) return;

    // Extract prefix (e.g. "$"), numeric part, and suffix (e.g. "%")
    const match = value.match(/^([^0-9]*)([0-9]+)(.*)$/);
    if (!match) { el.textContent = value; return; }
    const [, prefix, numStr, suffix] = match;
    const target = parseInt(numStr, 10);

    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = `${prefix}${Math.round(eased * target)}${suffix}`;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span ref={ref}>0</span>;
}

const WEEKLY_ACTIVITY = [
  { week: "Feb 3", meals: 8 },
  { week: "Feb 10", meals: 5 },
  { week: "Feb 17", meals: 10 },
  { week: "Feb 24", meals: 7 },
  { week: "Mar 3", meals: 9 },
  { week: "Mar 10", meals: 6 },
];

const TOP_INGREDIENTS = [
  { name: "Chicken breast", uses: 24, pct: 92, color: "bg-emerald-500" },
  { name: "Rice", uses: 21, pct: 81, color: "bg-emerald-500" },
  { name: "Eggs", uses: 19, pct: 73, color: "bg-emerald-500" },
  { name: "Olive oil", uses: 18, pct: 69, color: "bg-emerald-500" },
  { name: "Garlic", uses: 16, pct: 62, color: "bg-emerald-500" },
];

const RECENT_MEALS = [
  { name: "Chicken Stir-Fry", when: "Today", badges: ["Quick", "High Protein"], badgeColor: "bg-amber-50 text-amber-700 border border-amber-200" },
  { name: "Pasta Carbonara", when: "Yesterday", badges: ["Comfort Food"], badgeColor: "bg-orange-50 text-orange-600 border border-orange-200" },
  { name: "Greek Salad", when: "2 days ago", badges: ["Vegetarian", "Low Cal"], badgeColor: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  { name: "Beef Tacos", when: "3 days ago", badges: ["Family Favorite"], badgeColor: "bg-orange-50 text-orange-700 border border-orange-200" },
];

const ACHIEVEMENTS = [
  { title: "Meal Prep Pro", desc: "Planned 7 meals in a week", done: true },
  { title: "Zero Waste Week", desc: "No expired items for 7 days", done: true },
  { title: "Budget Master", desc: "Saved $100+ in a month", done: true },
  { title: "Recipe Explorer", desc: "Cooked 50 unique recipes", done: false, progress: "42/50" },
];

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.meals), 1);
  return (
    <div className="flex items-end gap-3 h-32">
      {data.map((d) => (
        <div key={d.week} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {d.meals}
          </span>
          <div className="w-full relative">
            <div
              className="w-full rounded-lg bg-gradient-to-t from-orange-500 to-orange-400 transition-all shadow-sm"
              style={{ height: `${(d.meals / max) * 80}px` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {d.week}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const weatherFetched = useRef(false);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Weather (Open-Meteo, no API key needed) — default to Toronto
  useEffect(() => {
    if (weatherFetched.current) return;
    weatherFetched.current = true;
    const lat = 45.4215;
    const lon = -75.6972;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
      .then((r) => r.json())
      .then((data) => {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
          city: "Ottawa",
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    inventoryRestApi.list().then((result) => {
      if (!cancelled) setInventoryItems(extractItems(result));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const inventorySnapshot = useMemo(() => {
    const total = inventoryItems.length;
    const categories = new Set(inventoryItems.map((i) => i.category || "Other")).size;
    const outOfStock = inventoryItems.filter((i) => Number(i.quantity) <= 0).length;
    const lowStock = inventoryItems.filter((i) => {
      const qty = Number(i.quantity);
      return qty > 0 && qty <= 2;
    }).length;
    return [
      { label: "Total Items", value: String(total), icon: PackageIcon, color: "text-emerald-600", bg: "bg-emerald-100" },
      { label: "Categories", value: String(categories), icon: TagIcon, color: "text-emerald-600", bg: "bg-emerald-100" },
      { label: "Out of Stock", value: String(outOfStock), icon: AlertTriangleIcon, color: "text-amber-600", bg: "bg-amber-100" },
      { label: "Low Stock", value: String(lowStock), icon: ArchiveIcon, color: "text-red-500", bg: "bg-red-100" },
    ];
  }, [inventoryItems]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[radial-gradient(circle_at_top_left,_rgba(241,245,249,0.9),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(226,232,240,0.6),_transparent_45%),linear-gradient(to_bottom,_rgba(248,250,252,0.8),_#fff)]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <Card className="dash-animate dash-delay-1 border-slate-200/60 bg-gradient-to-br from-slate-50/80 via-gray-50/40 to-white overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <Badge className="bg-gradient-to-r from-gray-800 to-slate-700 text-white hover:from-gray-900 hover:to-slate-800">
                  <LayoutDashboardIcon className="w-3 h-3 mr-1" />
                  Dashboard
                </Badge>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                  Your kitchen at a glance
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Track your meals, save money, and reduce food waste — all powered
                  by SAM.
                </p>
              </div>
              <div className="shrink-0 flex flex-row md:flex-col items-start md:items-end gap-3 md:gap-2 md:text-right">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-2xl font-bold tabular-nums tracking-tight">
                    {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span className="text-sm">
                    {now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                {weather && (() => {
                  const { label, Icon: WeatherIcon } = getWeatherInfo(weather.code);
                  return (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <WeatherIcon className="w-4 h-4" />
                      <span className="text-sm">
                        {weather.temp}°C · {label}
                      </span>
                      {weather.city && (
                        <>
                          <MapPinIcon className="w-3 h-3 ml-1" />
                          <span className="text-xs">{weather.city}</span>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stat cards */}
        <div className="dash-animate dash-delay-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className={`${s.border} ${s.cardBg}`}>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {s.label}
                      </p>
                      <p className="text-2xl font-bold"><AnimatedNumber value={s.value} /></p>
                    </div>
                    <div className={`${s.bg} p-2 rounded-lg`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUpIcon className={`w-3 h-3 ${s.color}`} />
                    <p className={`text-xs font-medium ${s.color}`}>
                      {s.delta}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Inventory Section */}
        <section className="dash-animate dash-delay-3 rounded-xl border bg-gradient-to-br from-emerald-50/60 via-green-50/30 to-white p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-100 p-1.5 rounded-lg">
                <PackageIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-lg font-semibold">Inventory</h2>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/inventory")}
              className="gap-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-sm"
            >
              <PackageIcon className="w-3.5 h-3.5" />
              View Inventory
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Current Inventory</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Pantry overview
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {inventorySnapshot.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-white p-3"
                      >
                        <div className={`${s.bg} p-2 rounded-lg`}>
                          <Icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-lg font-bold leading-none"><AnimatedNumber value={s.value} duration={900} /></p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Most Used Ingredients</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Based on last 30 days
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3.5">
                  {TOP_INGREDIENTS.map((ing) => (
                    <div key={ing.name} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{ing.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {ing.uses} uses
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ing.color} transition-all`}
                          style={{ width: `${ing.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recipes Section */}
        <section className="dash-animate dash-delay-4 rounded-xl border bg-gradient-to-br from-orange-50/60 via-amber-50/30 to-white p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-1.5 rounded-lg">
                <ChefHatIcon className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold">Recipes</h2>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/recipes")}
              className="gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
            >
              <ChefHatIcon className="w-3.5 h-3.5" />
              Discover Recipes
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cooking History</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Meals cooked per week
                </p>
              </CardHeader>
              <CardContent>
                <BarChart data={WEEKLY_ACTIVITY} />
                <div className="flex justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span>
                    Total: <span className="font-semibold text-foreground">45 meals</span>
                  </span>
                  <span>
                    Avg: <span className="font-semibold text-foreground">7.5/week</span>
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Meals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {RECENT_MEALS.map((meal) => (
                    <div
                      key={meal.name}
                      className="flex items-center justify-between py-2.5 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {meal.when}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {meal.badges.map((b) => (
                          <span
                            key={b}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meal.badgeColor}`}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Shopping Section */}
        <section className="dash-animate dash-delay-5 rounded-xl border bg-gradient-to-br from-sky-50/60 via-blue-50/30 to-white p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-sky-100 p-1.5 rounded-lg">
                <ShoppingCartIcon className="w-4 h-4 text-sky-600" />
              </div>
              <h2 className="text-lg font-semibold">Shopping</h2>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/shopping")}
              className="gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-sm"
            >
              <ShoppingCartIcon className="w-3.5 h-3.5" />
              Smart Shopping
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {ACHIEVEMENTS.map((a) => (
                  <div
                    key={a.title}
                    className="flex items-center gap-3 py-2.5 border-b last:border-0"
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        a.done
                          ? "bg-sky-100 text-sky-600"
                          : "bg-sky-50 text-sky-400"
                      }`}
                    >
                      {a.done ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-4 h-4"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                    {a.progress && (
                      <Badge
                        variant="outline"
                        className="text-xs border-sky-300 text-sky-600"
                      >
                        {a.progress}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
