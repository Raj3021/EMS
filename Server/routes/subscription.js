import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /subscription/plans - Get all available plans
router.get("/plans", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, display_name, description, price_monthly, price_yearly, currency, features, sort_order
       FROM subscription_plans
       WHERE is_active = true
       ORDER BY sort_order ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.status(500).json({ message: "Failed to fetch plans" });
  }
});

// GET /subscription/current - Get tenant's current subscription
router.get("/current", authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;

    const result = await pool.query(
      `SELECT ts.*, sp.name as plan_name, sp.display_name, sp.price_monthly, sp.price_yearly, sp.features
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE ts.tenant_id = $1`,
      [tenantId]
    );

    if (result.rowCount === 0) {
      // No subscription record - return free plan info
      const freePlan = await pool.query(
        `SELECT * FROM subscription_plans WHERE name = 'free'`
      );
      return res.json({
        plan_name: "free",
        display_name: "Free",
        status: "active",
        features: freePlan.rows[0]?.features || {},
        price_monthly: 0,
        price_yearly: 0,
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching current subscription:", err);
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
});

// POST /subscription/create-order - Create a Razorpay order for the selected plan
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { tenantId, roles } = req.user;
    const { planName, billingCycle = "monthly" } = req.body;

    // Only admin can upgrade
    const isAdmin = roles?.some(
      (r) => r?.toLowerCase?.() === "admin"
    );
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can manage subscriptions" });
    }

    // Get the plan
    const planResult = await pool.query(
      `SELECT * FROM subscription_plans WHERE name = $1 AND is_active = true`,
      [planName]
    );

    if (planResult.rowCount === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = planResult.rows[0];

    // Free plan: directly downgrade, no payment needed
    if (parseFloat(plan.price_monthly) === 0) {
      const upsertResult = await pool.query(
        `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
         VALUES ($1, $2, 'active', 'monthly', CURRENT_TIMESTAMP, NULL)
         ON CONFLICT (tenant_id)
         DO UPDATE SET plan_id = $2, status = 'active', billing_cycle = 'monthly',
                       current_period_start = CURRENT_TIMESTAMP,
                       current_period_end = NULL,
                       updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [tenantId, plan.id]
      );

      await pool.query(
        `UPDATE tenants SET current_plan = $1 WHERE id = $2`,
        [planName, tenantId]
      );

      return res.json({
        free: true,
        success: true,
        plan: {
          name: plan.name,
          display_name: plan.display_name,
          features: plan.features,
        },
      });
    }

    // Calculate amount in paise (Razorpay uses smallest currency unit)
    const amount =
      billingCycle === "yearly"
        ? Math.round(parseFloat(plan.price_yearly) * 100)
        : Math.round(parseFloat(plan.price_monthly) * 100);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount,
      currency: plan.currency || "INR",
      receipt: `sub_${tenantId.slice(-8)}_${Date.now()}`,
      notes: {
        tenant_id: tenantId,
        plan_name: planName,
        billing_cycle: billingCycle,
      },
    });

    console.log("📦 Razorpay order created:", order.id);

    res.json({
      free: false,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan: {
        name: plan.name,
        display_name: plan.display_name,
        description: plan.description,
      },
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Failed to create payment order" });
  }
});

// POST /subscription/verify-payment - Verify Razorpay payment and activate subscription
router.post("/verify-payment", authMiddleware, async (req, res) => {
  try {
    const { tenantId, roles } = req.user;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      billingCycle = "monthly",
    } = req.body;

    // Only admin
    const isAdmin = roles?.some(
      (r) => r?.toLowerCase?.() === "admin"
    );
    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can manage subscriptions" });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Payment signature verification failed");
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    console.log("✅ Payment signature verified for:", razorpay_payment_id);

    // Get plan details
    const planResult = await pool.query(
      `SELECT * FROM subscription_plans WHERE name = $1 AND is_active = true`,
      [planName]
    );

    if (planResult.rowCount === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = planResult.rows[0];
    const periodInterval = billingCycle === "yearly" ? "365 days" : "30 days";

    // Upsert subscription
    const upsertResult = await pool.query(
      `INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
       VALUES ($1, $2, 'active', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '${periodInterval}')
       ON CONFLICT (tenant_id)
       DO UPDATE SET plan_id = $2, status = 'active', billing_cycle = $3,
                     current_period_start = CURRENT_TIMESTAMP,
                     current_period_end = CURRENT_TIMESTAMP + INTERVAL '${periodInterval}',
                     updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tenantId, plan.id, billingCycle]
    );

    // Update tenants table
    await pool.query(
      `UPDATE tenants SET current_plan = $1 WHERE id = $2`,
      [planName, tenantId]
    );

    // Record payment
    const amount =
      billingCycle === "yearly"
        ? parseFloat(plan.price_yearly)
        : parseFloat(plan.price_monthly);

    await pool.query(
      `INSERT INTO payment_history (tenant_id, subscription_id, amount, currency, status, razorpay_payment_id, razorpay_order_id, razorpay_signature, payment_method, description)
       VALUES ($1, $2, $3, $4, 'captured', $5, $6, $7, 'razorpay', $8)`,
      [
        tenantId,
        upsertResult.rows[0].id,
        amount,
        plan.currency || "INR",
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        `Upgraded to ${plan.display_name} (${billingCycle})`,
      ]
    );

    console.log(`🎉 Tenant ${tenantId} upgraded to ${planName}`);

    res.json({
      success: true,
      subscription: upsertResult.rows[0],
      plan: {
        name: plan.name,
        display_name: plan.display_name,
        features: plan.features,
      },
    });
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

// GET /subscription/usage - Get current usage vs limits
router.get("/usage", authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;

    const [employees, projects, tasks, notes, files] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM employees WHERE tenant_id = $1 AND is_active = true`, [tenantId]),
      pool.query(`SELECT COUNT(*) FROM projects WHERE tenant_id = $1`, [tenantId]),
      pool.query(`SELECT COUNT(*) FROM tasks WHERE tenant_id = $1`, [tenantId]),
      pool.query(`SELECT COUNT(*) FROM notes WHERE tenant_id = $1`, [tenantId]),
      pool.query(`SELECT COALESCE(SUM(size), 0) as total_bytes FROM files WHERE tenant_id = $1`, [tenantId]),
    ]);

    res.json({
      employees: parseInt(employees.rows[0].count),
      projects: parseInt(projects.rows[0].count),
      tasks: parseInt(tasks.rows[0].count),
      notes: parseInt(notes.rows[0].count),
      storage_bytes: parseInt(files.rows[0].total_bytes),
      storage_mb: Math.round(parseInt(files.rows[0].total_bytes) / (1024 * 1024) * 100) / 100,
    });
  } catch (err) {
    console.error("Error fetching usage:", err);
    res.status(500).json({ message: "Failed to fetch usage" });
  }
});

// GET /subscription/history - Get payment history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;

    const result = await pool.query(
      `SELECT ph.*, sp.display_name as plan_name
       FROM payment_history ph
       LEFT JOIN tenant_subscriptions ts ON ph.subscription_id = ts.id
       LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
       WHERE ph.tenant_id = $1
       ORDER BY ph.created_at DESC
       LIMIT 20`,
      [tenantId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching payment history:", err);
    res.status(500).json({ message: "Failed to fetch payment history" });
  }
});

export default router;
