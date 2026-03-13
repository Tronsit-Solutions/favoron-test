-- Manual fix: Create missing referral for Willy Lehrer
INSERT INTO referrals (referrer_id, referred_id, reward_amount, referred_reward_amount, status)
VALUES ('5e3c944e-9130-4ea7-8165-b8ec9d5abf6f', '26986ca0-a182-482e-92e5-10977ce570fc', 20, 20, 'pending');

-- Update referrer_name on Willy's profile
UPDATE profiles SET referrer_name = 'Administrador Favorón'
WHERE id = '26986ca0-a182-482e-92e5-10977ce570fc';