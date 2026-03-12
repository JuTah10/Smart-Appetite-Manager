import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  NavigationIcon,
  TrophyIcon,
  DollarSignIcon,
  StoreIcon,
  MapPinIcon,
  TargetIcon,
} from "lucide-react";

const FACTOR_META = {
  price: { label: "Price", icon: DollarSignIcon, color: "text-green-600" },
  convenience: { label: "Convenience", icon: StoreIcon, color: "text-blue-600" },
  coverage: { label: "Coverage", icon: TargetIcon, color: "text-purple-600" },
  distance: { label: "Distance", icon: MapPinIcon, color: "text-orange-600" },
};

function ScoreBar({ label, score, icon: Icon, color }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
      <span className="w-20 text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 text-right font-medium tabular-nums">{pct}%</span>
    </div>
  );
}

/**
 * Card showing a scored shopping route with factor breakdown.
 *
 * @param {object} props
 * @param {object} props.route - A route object from plan_optimal_route top_routes
 * @param {boolean} [props.isBest] - Whether this is the #1 route
 */
export function RouteScoreCard({ route, isBest = false }) {
  const scores = route.factor_scores || {};

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${
        isBest
          ? "border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200"
          : "border-gray-200"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">
                Route #{route.rank}
              </h3>
              {isBest && (
                <Badge className="bg-emerald-500 text-white text-[10px] shrink-0">
                  <TrophyIcon className="w-3 h-3 mr-0.5" />
                  Best Route
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {route.store_count} store{route.store_count !== 1 ? "s" : ""} &middot;{" "}
              {route.coverage} coverage &middot;{" "}
              {route.route_distance_km > 0
                ? `${route.route_distance_km} km travel`
                : "distance N/A"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-bold text-emerald-700">
              ${route.total_cost.toFixed(2)}
            </span>
            <p className="text-[10px] text-muted-foreground">
              Score: {(route.weighted_score * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Score Bars */}
        <div className="space-y-1.5">
          {Object.entries(FACTOR_META).map(([key, meta]) => (
            <ScoreBar
              key={key}
              label={meta.label}
              score={scores[key] || 0}
              icon={meta.icon}
              color={meta.color}
            />
          ))}
        </div>

        {/* Store Breakdown */}
        {route.store_breakdown && route.store_breakdown.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            {route.store_breakdown.map((sb, idx) => (
              <div key={`sb-${idx}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{sb.store}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    ${sb.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="ml-2 mt-0.5 space-y-0.5">
                  {sb.items.map((item, i) => (
                    <div
                      key={`sb-item-${i}`}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <span className="truncate">{item.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.sale_story && (
                          <Badge
                            variant="outline"
                            className="text-[9px] text-orange-700 border-orange-200 bg-orange-50 py-0"
                          >
                            {item.sale_story}
                          </Badge>
                        )}
                        <span className="font-medium">{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Missing items */}
        {route.missing_items && route.missing_items.length > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
            Not on sale: {route.missing_items.join(", ")}
          </p>
        )}

        {/* Directions for stores */}
        {route.store_breakdown && (
          <div className="flex flex-wrap gap-2 pt-1">
            {route.store_breakdown
              .filter((sb) => sb.coords)
              .map((sb, idx) => (
                <a
                  key={`dir-${idx}`}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sb.store)}&near=${sb.coords.lat},${sb.coords.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <NavigationIcon className="w-3 h-3" />
                  {sb.store}
                </a>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
