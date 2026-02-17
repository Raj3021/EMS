import pool from "./db.js";
import bcrypt from "bcrypt";

async function testLogin(email, password) {
  try {
    console.log(`Testing login for: ${email} with password: ${password}`);

    // 1. Check if user exists
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (userResult.rowCount === 0) {
      console.log("❌ User NOT FOUND in database.");
      return;
    }

    console.log(`✅ User FOUND. ID: ${userResult.rows[0].id}, Active: ${userResult.rows[0].is_active}`);
    console.log(`   Stored Hash: ${userResult.rows[0].password_hash}`);

    // 2. Check password
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (isMatch) {
      console.log("✅ Password MATCHES!");
    } else {
      console.log("❌ Password DOES NOT MATCH.");
      
      // Try to hash the input password to see what it looks like
      const newHash = await bcrypt.hash(password, 12);
      console.log(`   Input password hash would be: ${newHash}`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

// REPLACE THESE WITH THE CREDENTIALS YOU ARE FAILING WITH
const email = "raj.s5@ahduni.edu.in"; 
const password = "password123"; 

testLogin(email, password);
