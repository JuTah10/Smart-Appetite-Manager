import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboardIcon,
  PackageIcon,
  ChefHatIcon,
  DollarSignIcon,
  LeafIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  SparklesIcon,
} from "lucide-react";

const STATS = [
  {
    label: "Items Tracked",
    value: "1,247",
    delta: "+38 this week",
    icon: PackageIcon,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    label: "Recipes Cooked",
    value: "312",
    delta: "+12 this month",
    icon: ChefHatIcon,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    label: "Money Saved",
    value: "$867",
    delta: "+$142 this month",
    icon: DollarSignIcon,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
  {
    label: "Food Waste Reduced",
    value: "73%",
    delta: "vs. national avg 40%",
    icon: LeafIcon,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
];

const WEEKLY_ACTIVITY = [
  { day: "Mon", meals: 3 },
  { day: "Tue", meals: 2 },
  { day: "Wed", meals: 3 },
  { day: "Thu", meals: 2 },
  { day: "Fri", meals: 3 },
  { day: "Sat", meals: 4 },
  { day: "Sun", meals: 3 },
];

const TOP_INGREDIENTS = [
  { name: "Chicken breast", uses: 24, pct: 92, color: "bg-amber-500" },
  { name: "Rice", uses: 21, pct: 81, color: "bg-orange-500" },
  { name: "Eggs", uses: 19, pct: 73, color: "bg-yellow-500" },
  { name: "Olive oil", uses: 18, pct: 69, color: "bg-amber-600" },
  { name: "Garlic", uses: 16, pct: 62, color: "bg-orange-600" },
];

const RECENT_MEALS = [
  { name: "Chicken Stir-Fry", when: "Today", badges: ["Quick", "High Protein"], badgeColor: "bg-emerald-100 text-emerald-700" },
  { name: "Pasta Carbonara", when: "Yesterday", badges: ["Comfort Food"], badgeColor: "bg-orange-100 text-orange-700" },
  { name: "Greek Salad", when: "2 days ago", badges: ["Vegetarian", "Low Cal"], badgeColor: "bg-sky-100 text-sky-700" },
  { name: "Beef Tacos", when: "3 days ago", badges: ["Family Favorite"], badgeColor: "bg-amber-100 text-amber-700" },
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
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {d.meals}
          </span>
          <div className="w-full relative">
            <div
              className="w-full rounded-lg bg-gradient-to-t from-amber-500 to-amber-400 transition-all shadow-sm"
              style={{ height: `${(d.meals / max) * 80}px` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {d.day}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[radial-gradient(circle_at_top_left,_rgba(254,243,199,0.9),_#fff_48%),linear-gradient(135deg,_rgba(255,251,235,0.85),_rgba(255,255,255,1))]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50 via-yellow-50 to-white overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3 max-w-2xl">
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                  <LayoutDashboardIcon className="w-3 h-3 mr-1" />
                  Dashboard
                </Badge>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                  Your kitchen at a glance
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Track your meals, save money, and reduce food waste — all powered
                  by AI.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => navigate("/inventory")}
                  className="gap-1.5"
                >
                  <PackageIcon className="w-3.5 h-3.5" />
                  Inventory
                </Button>
                <Button
                  onClick={() => navigate("/recipes")}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Find Recipes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className={s.border}>
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {s.label}
                      </p>
                      <p className="text-2xl font-bold">{s.value}</p>
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

        {/* Middle row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Weekly activity */}
          <Card className="border-amber-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly Meals</CardTitle>
              <p className="text-xs text-muted-foreground">
                Meals cooked per day
              </p>
            </CardHeader>
            <CardContent>
              <BarChart data={WEEKLY_ACTIVITY} />
              <div className="flex justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                <span>
                  Total: <span className="font-semibold text-foreground">20 meals</span>
                </span>
                <span>
                  Avg: <span className="font-semibold text-foreground">2.9/day</span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Top ingredients */}
          <Card className="border-amber-200/60">
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

        {/* Bottom row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Recent meals */}
          <Card className="border-amber-200/60">
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

          {/* Achievements */}
          <Card className="border-amber-200/60">
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
                          ? "bg-amber-100 text-amber-600"
                          : "bg-orange-100 text-orange-500"
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
                        className="text-xs border-amber-300 text-amber-600"
                      >
                        {a.progress}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <Card className="border-amber-200/60 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-lg">Ready to get cooking?</p>
                <p className="text-sm text-muted-foreground">
                  Check your pantry, discover recipes, or plan your next grocery
                  run.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/inventory")}
                  className="gap-1.5"
                >
                  View Inventory
                </Button>
                <Button
                  onClick={() => navigate("/shopping")}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Smart Shopping
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
