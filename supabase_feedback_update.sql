-- Voer uit in Supabase > SQL Editor
-- Voegt een reden-kolom toe aan artikel_feedback voor negatieve feedback

ALTER TABLE artikel_feedback
  ADD COLUMN IF NOT EXISTS reden TEXT CHECK (
    reden IS NULL OR reden IN (
      'niet relevant',
      'te technisch',
      'al bekend',
      'te oppervlakkig',
      'onduidelijk geschreven',
      'anders'
    )
  );
