-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- RLS (Row Level Security) Policies für den videos bucket
CREATE POLICY "Videos sind öffentlich lesbar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos'
  -- Jeder kann Videos lesen
);

-- Nur authentifizierte User können Videos hochladen
CREATE POLICY "Authentifizierte User können Videos hochladen"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'videos'
  AND auth.role() = 'authenticated'
);

-- Nur Video-Ersteller können ihre Videos löschen
CREATE POLICY "Nur Ersteller können Videos löschen"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos'
  AND owner = auth.uid()
); 