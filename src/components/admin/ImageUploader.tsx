import { useRef, useState } from "react";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export function ImageUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Only image files are allowed");
    if (file.size > MAX_BYTES) return toast.error("Image must be 5MB or smaller");

    setUploading(true);
    setProgress(10);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (error) {
      setUploading(false);
      setProgress(0);
      toast.error(`Upload failed: ${error.message}`);
      return;
    }
    setProgress(80);

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setProgress(100);
    setUploading(false);
    onChange(data.publicUrl);
    toast.success("Image uploaded");
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  if (value) {
    return (
      <div className="mt-1 relative inline-block group">
        <img src={value} alt="Product" className="w-full max-w-xs h-40 object-cover rounded-lg border border-border" />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 h-7 w-7 p-0 opacity-90"
          aria-label="Remove image"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragOver ? "border-brand-orange bg-brand-orange/5" : "border-border hover:border-brand-orange/60"
      } ${uploading ? "pointer-events-none opacity-70" : ""}`}
    >
      <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} className="hidden" />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
          <div className="w-full max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-brand-orange transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">Uploading…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-brand-orange" />
          </div>
          <p className="text-sm font-medium text-brand-navy">Drop image or click to upload</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> PNG, JPG, WEBP, GIF · up to 5MB
          </p>
        </div>
      )}
    </div>
  );
}
