import { useState, useEffect } from "react";
import {
  Crown,
  Zap,
  Building2,
  Check,
  ArrowRight,
  Sparkles,
  Users,
  FolderOpen,
  CheckSquare,
  HardDrive,
  StickyNote,
  MessageSquare,
  Video,
  Calendar,
  BarChart3,
  Infinity,
  Loader2,
  ChevronRight,
  Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { subscriptionService } from "@/services/subscriptionService";

// Plan icon + accent mapping
const planConfig = {
  free: {
    icon: Zap,
    accent: "from-slate-500 to-slate-600",
    accentLight: "from-slate-500/10 to-slate-600/5",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    border: "border-border",
    ring: "",
    btnClass: "bg-muted text-muted-foreground hover:bg-muted/80",
  },
  pro: {
    icon: Crown,
    accent: "from-blue-500 to-indigo-600",
    accentLight: "from-blue-500/10 to-indigo-600/5",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
    ring: "ring-2 ring-blue-500/20",
    btnClass:
      "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25",
  },
  enterprise: {
    icon: Building2,
    accent: "from-amber-500 to-orange-600",
    accentLight: "from-amber-500/10 to-orange-600/5",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
    ring: "ring-2 ring-amber-500/20",
    btnClass:
      "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/25",
  },
};

// Feature display config
const featureKeys = [
  {
    key: "max_employees",
    label: "Employees",
    icon: Users,
  },
  {
    key: "max_projects",
    label: "Projects",
    icon: FolderOpen,
  },
  {
    key: "max_tasks",
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    key: "max_storage_mb",
    label: "File Storage",
    icon: HardDrive,
    format: (v) => {
      if (v === -1) return "Unlimited";
      if (v >= 1024) return `${(v / 1024).toFixed(0)} GB`;
      return `${v} MB`;
    },
  },
  {
    key: "max_notes",
    label: "Notes",
    icon: StickyNote,
  },
];

const alwaysIncluded = [
  { label: "Chat", icon: MessageSquare },
  { label: "Unlimited Meetings", icon: Video },
  { label: "Leave Management", icon: Calendar },
  { label: "Analytics", icon: BarChart3 },
];

function formatLimit(val) {
  if (val === -1 || val === undefined) return "Unlimited";
  return val.toString();
}

export default function Subscription() {
  const { user } = useAuth();
  const toast = useToast();

  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");

  const roles = Array.isArray(user?.roles)
    ? user.roles
    : user?.role
      ? [user.role]
      : [];
  const isAdmin = roles.some(
    (r) => r?.toLowerCase?.() === "admin"
  );

  // Load Razorpay checkout script
  useEffect(() => {
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, currentData, usageData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getUsage(),
      ]);
      setPlans(plansData);
      setCurrentPlan(currentData);
      setUsage(usageData);
    } catch (err) {
      console.error("Error loading subscription data:", err);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName) => {
    if (!isAdmin) {
      toast.error("Only admins can manage subscriptions");
      return;
    }

    try {
      setUpgrading(planName);

      // Step 1: Create order on backend
      const orderData = await subscriptionService.createOrder(
        planName,
        billingCycle
      );

      // If it's a free plan downgrade, no payment needed
      if (orderData.free) {
        toast.success(
          `Successfully switched to ${orderData.plan.display_name}!`
        );
        await loadData();
        setUpgrading(null);
        return;
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "WorkHub",
        description: `${orderData.plan.display_name} Plan — ${billingCycle}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            const verifyResult = await subscriptionService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planName,
              billingCycle,
            });

            if (verifyResult.success) {
              toast.success(
                `Successfully upgraded to ${verifyResult.plan.display_name}! 🎉`
              );
              await loadData();
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast.error(
              "Payment was processed but verification failed. Please contact support."
            );
          } finally {
            setUpgrading(null);
          }
        },
        prefill: {
          email: user?.email || "",
          contact: "",
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: () => {
            setUpgrading(null);
            toast.error("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        toast.error(
          response.error?.description || "Payment failed. Please try again."
        );
        setUpgrading(null);
      });
      rzp.open();
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error(err.response?.data?.message || "Failed to initiate payment");
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">
            Loading subscription...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Subscription
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Choose the plan that best fits your organization's needs
          </p>
        </div>

        {/* Current plan badge */}
        {currentPlan && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">Current plan:</span>
            <span className="text-sm font-semibold text-foreground capitalize">
              {currentPlan.display_name || currentPlan.plan_name}
            </span>
          </div>
        )}
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              billingCycle === "monthly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const config = planConfig[plan.name] || planConfig.free;
          const PlanIcon = config.icon;
          const isCurrent = currentPlan?.plan_name === plan.name;
          const isPopular = plan.name === "pro";
          const price =
            billingCycle === "monthly"
              ? plan.price_monthly
              : plan.price_yearly;
          const monthlyEquiv =
            billingCycle === "yearly"
              ? Math.round(plan.price_yearly / 12)
              : plan.price_monthly;

          return (
            <div
              key={plan.id}
              className={`relative dashboard-card p-0 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                config.border
              } ${isCurrent ? config.ring : ""} ${
                isPopular ? "md:-mt-2 md:mb-0" : ""
              }`}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-bl-xl">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current plan indicator */}
              {isCurrent && (
                <div className="absolute top-0 left-0">
                  <div className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-br-xl flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Current
                  </div>
                </div>
              )}

              {/* Gradient header */}
              <div
                className={`p-6 pb-4 bg-gradient-to-br ${config.accentLight}`}
              >
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div
                    className={`p-2.5 rounded-xl bg-gradient-to-br ${config.accent}`}
                  >
                    <PlanIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {plan.display_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5">
                  {price === 0 || price === "0.00" ? (
                    <span className="text-4xl font-extrabold text-foreground tracking-tight">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-lg text-muted-foreground">₹</span>
                      <span className="text-4xl font-extrabold text-foreground tracking-tight">
                        {monthlyEquiv}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /month
                      </span>
                    </>
                  )}
                </div>
                {billingCycle === "yearly" && price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{price} billed yearly
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="p-6 pt-4 space-y-5">
                {/* Quota-based features */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Limits
                  </p>
                  {featureKeys.map((feat) => {
                    const val = plan.features?.[feat.key];
                    const FeatIcon = feat.icon;
                    const display = feat.format
                      ? feat.format(val)
                      : formatLimit(val);
                    const isUnlimited = val === -1;

                    return (
                      <div
                        key={feat.key}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <FeatIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {feat.label}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            isUnlimited
                              ? "text-green-600 dark:text-green-400"
                              : "text-foreground"
                          }`}
                        >
                          {isUnlimited ? (
                            <span className="flex items-center gap-1">
                              <Infinity className="w-4 h-4" />
                            </span>
                          ) : (
                            display
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Always included */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Always Included
                  </p>
                  {alwaysIncluded.map((feat) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div
                        key={feat.label}
                        className="flex items-center gap-2.5"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                          {feat.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <div className="pt-2">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-muted/60 text-muted-foreground cursor-default flex items-center justify-center gap-2 border border-border"
                    >
                      <Check className="w-4 h-4" />
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={upgrading === plan.name || !isAdmin}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${config.btnClass}`}
                    >
                      {upgrading === plan.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : plan.price_monthly === 0 ||
                        plan.price_monthly === "0.00" ? (
                        <>
                          Downgrade to Free
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Upgrade to {plan.display_name}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Section */}
      {usage && currentPlan && (
        <div className="max-w-5xl mx-auto">
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Current Usage
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Track your resource consumption against your plan limits
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureKeys.map((feat) => {
                const limit = currentPlan.features?.[feat.key];
                const usageKey =
                  feat.key === "max_employees"
                    ? "employees"
                    : feat.key === "max_projects"
                      ? "projects"
                      : feat.key === "max_tasks"
                        ? "tasks"
                        : feat.key === "max_notes"
                          ? "notes"
                          : feat.key === "max_storage_mb"
                            ? "storage_mb"
                            : null;

                if (!usageKey) return null;

                const current = usage[usageKey] || 0;
                const isUnlimited = limit === -1;
                const percentage = isUnlimited
                  ? 0
                  : limit > 0
                    ? Math.min((current / limit) * 100, 100)
                    : 0;
                const isNearLimit = !isUnlimited && percentage >= 80;
                const isAtLimit = !isUnlimited && percentage >= 100;

                const FeatIcon = feat.icon;
                const displayLimit = feat.format
                  ? feat.format(limit)
                  : formatLimit(limit);
                const displayCurrent =
                  feat.key === "max_storage_mb"
                    ? `${current} MB`
                    : current.toString();

                return (
                  <div
                    key={feat.key}
                    className="p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FeatIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {feat.label}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isAtLimit
                            ? "bg-red-500/10 text-red-500"
                            : isNearLimit
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                        }`}
                      >
                        {isUnlimited
                          ? "Unlimited"
                          : `${displayCurrent} / ${displayLimit}`}
                      </span>
                    </div>

                    {!isUnlimited && (
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAtLimit
                              ? "bg-red-500"
                              : isNearLimit
                                ? "bg-amber-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}

                    {isUnlimited && (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <Infinity className="w-3 h-3" />
                        <span>{displayCurrent} used</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Not admin notice */}
      {!isAdmin && (
        <div className="max-w-5xl mx-auto">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-3">
            <Star className="w-5 h-5 flex-shrink-0" />
            <span>
              Only the organization admin can manage subscriptions. Contact your
              admin to upgrade.
            </span>
          </div>
        </div>
      )}

      {/* Test Mode Notice */}
      <div className="max-w-5xl mx-auto">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <span>
            <strong className="text-foreground">Test Mode:</strong> Payments are
            processed through Razorpay in test mode. Use card{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">
              4111 1111 1111 1111
            </code>{" "}
            with any future expiry and CVV, or UPI{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">
              success@razorpay
            </code>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
