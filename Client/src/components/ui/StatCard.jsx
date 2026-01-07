import React from "react";

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  variant = "default",
}) {
  if (variant === "gradient") {
    return (
      <div className="stat-card-gradient animate-fade-in">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>

            {change && (
              <p className="text-sm mt-2 opacity-80">
                <span className="bg-white/20 px-2 py-0.5 rounded-full">
                  {change}
                </span>
              </p>
            )}
          </div>

          <div className="p-3 bg-white/20 rounded-xl">
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>

          {change && <p className="text-sm text-success mt-2">{change}</p>}
        </div>

        <div className="p-3 bg-primary/10 rounded-xl">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
