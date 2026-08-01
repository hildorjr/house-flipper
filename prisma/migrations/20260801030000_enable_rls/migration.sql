-- Block PostgREST access with the public publishable key.
-- No policies are added: the application connects as the table owner through
-- Prisma, which bypasses RLS, and never queries these tables over PostgREST.

ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Property" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ExpenseCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RecurringExpenseRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Loan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LoanInstallment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Contact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DealAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DealAnalysisItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."RenovationPreset" ENABLE ROW LEVEL SECURITY;
