CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    institution TEXT NOT NULL,
    invested_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    current_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    quantity DECIMAL(15, 4),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    profitability TEXT,
    risk TEXT,
    liquidity TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;

-- Household Policies (assuming get_household_user_ids() exists as created in other migrations)
DO $$ 
BEGIN 
  CREATE POLICY "Household can view investments" ON investments FOR SELECT USING (user_id = ANY(get_household_user_ids()));
  CREATE POLICY "Household can insert investments" ON investments FOR INSERT WITH CHECK (user_id = ANY(get_household_user_ids()));
  CREATE POLICY "Household can update investments" ON investments FOR UPDATE USING (user_id = ANY(get_household_user_ids())) WITH CHECK (user_id = ANY(get_household_user_ids()));
  CREATE POLICY "Household can delete investments" ON investments FOR DELETE USING (user_id = ANY(get_household_user_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ 
BEGIN 
  -- For transactions, they inherit access from the investment they belong to.
  -- To keep it simple, we allow if the user can access the investment.
  CREATE POLICY "Household can view investment transactions" ON investment_transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM investments i WHERE i.id = investment_id AND i.user_id = ANY(get_household_user_ids())));
  
  CREATE POLICY "Household can insert investment transactions" ON investment_transactions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM investments i WHERE i.id = investment_id AND i.user_id = ANY(get_household_user_ids())));
  
  CREATE POLICY "Household can update investment transactions" ON investment_transactions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM investments i WHERE i.id = investment_id AND i.user_id = ANY(get_household_user_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM investments i WHERE i.id = investment_id AND i.user_id = ANY(get_household_user_ids())));
  
  CREATE POLICY "Household can delete investment transactions" ON investment_transactions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM investments i WHERE i.id = investment_id AND i.user_id = ANY(get_household_user_ids())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
