import { useEffect, useState } from "react";
import { Download, Smartphone, Apple, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

type DeviceKind = "android" | "ios" | "desktop";

function detectDevice(): DeviceKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return "desktop";
}

export function DownloadAppButton() {
  const [apkUrl, setApkUrl] = useState<string>("");
  const [version, setVersion] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [modalKind, setModalKind] = useState<DeviceKind>("desktop");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_public_settings");
      const row = Array.isArray(data) ? data[0] : data;
      if (row?.apk_download_url) setApkUrl(row.apk_download_url);
      if (row?.apk_version) setVersion(row.apk_version);
    })();
  }, []);

  if (!apkUrl) return null;

  const handleClick = () => {
    const device = detectDevice();
    if (device === "android") {
      // Direct download
      window.location.href = apkUrl;
      return;
    }
    setModalKind(device);
    setOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        variant="outline"
        className="w-full border-primary/40 text-primary hover:bg-primary/10"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Android App{version ? ` · v${version}` : ""}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground mt-1">
        Available for Android · iOS users see install instructions
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalKind === "ios" ? <Apple className="h-5 w-5" /> : <QrCode className="h-5 w-5" />}
              {modalKind === "ios" ? "Install on iPhone" : "Scan to download"}
            </DialogTitle>
            <DialogDescription>
              {modalKind === "ios"
                ? "iOS doesn't allow APK files. Install EntreVault as a Home Screen app instead."
                : "Open your phone camera and scan this QR code to download the APK."}
            </DialogDescription>
          </DialogHeader>

          {modalKind === "ios" ? (
            <ol className="space-y-2 text-sm text-foreground/90 list-decimal pl-5">
              <li>Open this site in <strong>Safari</strong>.</li>
              <li>Tap the <strong>Share</strong> icon at the bottom.</li>
              <li>Choose <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> — EntreVault will appear like a normal app.</li>
            </ol>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={apkUrl} size={200} />
              </div>
              <a
                href={apkUrl}
                className="text-xs text-primary hover:underline break-all text-center"
                target="_blank"
                rel="noreferrer"
              >
                Or open the link directly
              </a>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Smartphone className="h-3 w-3" /> EntreVault {version && `v${version}`}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
