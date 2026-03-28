import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const UZMANLAR = ["Ertuğrul GÜNEY (C Sınıfı İGU)", "Yavuz CANPOLAT (A Sınıfı İGU)"];
const HEKİMLER = ["Fahri Gurur POLAT", "Zehra Esra TEMELTAŞ"];
const KİŞİLER = ["Berke", "Bahadır", "Bora", "Şafak", "Akad", "Semra"];
const FATURA_DURUMLAR = ["Kesilecek", "Kesildi", "Eksik Kesildi", "Düzeltilecek", "Tamamlandı", "İptal"];
const EVRAK_TURLER = ["Eksik Evrak", "Hatalı Evrak", "Güncellenmesi Gereken", "İmza Eksik", "Diğer"];
const EVRAK_DURUMLAR = ["Beklemede", "İşlemde", "Tamamlandı"];
const TURUNCU = "#E85C0D";

const DURUM_RENK = {
  "Kesilecek": "#6B7280", "Kesildi": "#3B82F6", "Eksik Kesildi": "#EF4444",
  "Düzeltilecek": "#F59E0B", "Tamamlandı": "#10B981",
  "Beklemede": "#6B7280", "İşlemde": "#F59E0B",
  "Yapılmadı": "#EF4444", "Yapıldı": "#10B981", "İptal": "#6B7280",
};

const LOGO_SRC = "/logo.png";

const fmtTarih = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getMusteriGecmis = () => JSON.parse(localStorage.getItem("musteri_gecmis") || "[]");
const addMusteriGecmis = (isim) => {
  const list = getMusteriGecmis();
  if (!list.includes(isim)) localStorage.setItem("musteri_gecmis", JSON.stringify([isim, ...list].slice(0, 100)));
};
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const getSesFormat = () => {
  if (isIOS()) return { mimeType: "audio/mp4", ext: "mp4" };
  if (MediaRecorder.isTypeSupported("audio/webm")) return { mimeType: "audio/webm", ext: "webm" };
  return { mimeType: "audio/mp4", ext: "mp4" };
};

// Tema renkleri
const TEMA = {
  dark: {
    bg: "#111111", bg2: "#1A1A1A", bg3: "#222222", bg4: "#1A1A1A",
    border: "#E85C0D30", border2: "#3A3A3A", border3: "#2A2A2A",
    text: "#F8FAFC", text2: "#CBD5E1", text3: "#94A3B8", text4: "#64748B",
    logoBg: "#ffffff",
    inputBg: "#383838", inputBorder: "#E85C0D50",
    kartBg: "#1E293B", kartBorder: "#E85C0D30",
    modalBg: "#1A1A1A",
    secBtn: "#334155",
  },
  light: {
    bg: "#F1F5F9", bg2: "#FFFFFF", bg3: "#FFFFFF", bg4: "#F8FAFC",
    border: "#E85C0D40", border2: "#E2E8F0", border3: "#E2E8F0",
    text: "#0F172A", text2: "#475569", text3: "#64748B", text4: "#94A3B8",
    logoBg: "#ffffff",
    inputBg: "#F8FAFC", inputBorder: "#E85C0D30",
    kartBg: "#FFFFFF", kartBorder: "#E85C0D25",
    modalBg: "#FFFFFF",
    secBtn: "#E2E8F0",
  }
};

export default function App() {
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "dark");
  const [sekme, setSekme] = useState("fatura");
  const [kayitlar, setKayitlar] = useState([]);
  const [modal, setModal] = useState(null);
  const [secili, setSecili] = useState(null);
  const [tamamlananAcik, setTamamlananAcik] = useState(false);
  const [toast, setToast] = useState(null);
  const t = TEMA[tema];

  const toggleTema = () => {
    const yeni = tema === "dark" ? "light" : "dark";
    setTema(yeni);
    localStorage.setItem("tema", yeni);
  };

  const showToast = (msg, tip = "ok") => { setToast({ msg, tip }); setTimeout(() => setToast(null), 3500); };

  const yukle = async () => {
    const { data } = await supabase.from("isler").select("*").order("created_at", { ascending: false });
    setKayitlar(data || []);
  };

  useEffect(() => {
    yukle();
    const ch = supabase.channel("isler_ch")
      .on("postgres_changes", { event: "*", schema: "public", table: "isler" }, yukle)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const guncelle = async (id, data) => {
    await supabase.from("isler").update(data).eq("id", id);
    showToast("Güncellendi ✓"); yukle();
  };
  const sil = async (id) => {
    if (!window.confirm("Bu kaydı silmek istiyor musun?")) return;
    await supabase.from("isler").delete().eq("id", id);
    setModal(null); setSecili(null); showToast("Silindi."); yukle();
  };

  const aktifKayitlar = kayitlar.filter(k => k.tip === sekme && !k.tamamlandi);
  const tamamlananlar = kayitlar.filter(k => k.tamamlandi);

  return (
    <div style={{ background: t.bg, minHeight: "100vh", color: t.text, fontFamily: "'DM Sans','Segoe UI',sans-serif", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      {toast && <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", whiteSpace: "nowrap", background: toast.tip === "hata" ? "#EF4444" : "#10B981" }}>{toast.msg}</div>}

      {/* HEADER */}
      <div style={{ background: t.bg2, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: tema === "light" ? "0 1px 4px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.4)", position: "sticky", top: 0, zIndex: 400 }}>
        <div style={{ background: "#ffffff", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><img src={LOGO_SRC} alt="Pragmatik" style={{ height: 40, objectFit: "contain" }} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: t.text }}>ISG TAKİP</div>
          <div style={{ fontSize: 10, color: t.text3 }}>İş Sağlığı ve Güvenliği</div>
        </div>
        <button onClick={() => setTamamlananAcik(true)} style={{ background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
          ✅ {tamamlananlar.length}
        </button>
        <button onClick={toggleTema} style={{ background: t.bg3, border: "1px solid " + t.border2, color: t.text2, width: 34, height: 34, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {tema === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      {/* SEKMELER */}
      <div style={{ display: "flex", background: t.bg2, borderBottom: "1px solid " + t.border3 }}>
        {[{ id: "fatura", label: "💰 Fatura" }, { id: "atama", label: "👤 Atama" }, { id: "evrak", label: "📁 Evrak" }].map(tab => {
          const count = kayitlar.filter(k => k.tip === tab.id && !k.tamamlandi).length;
          const aktif = sekme === tab.id;
          return (
            <button key={tab.id} style={{ flex: 1, padding: "12px 4px", background: "none", border: "none", borderBottom: aktif ? "2px solid " + TURUNCU : "2px solid transparent", color: aktif ? TURUNCU : t.text3, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
              onClick={() => setSekme(tab.id)}>
              {tab.label} {count > 0 && <span style={{ background: TURUNCU, color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 6px" }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* LİSTE */}
      <div style={{ flex: 1, padding: "12px 12px 80px" }}>
        {aktifKayitlar.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: t.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{sekme === "fatura" ? "💰" : sekme === "atama" ? "👤" : "📁"}</div>
            <div>Henüz kayıt yok</div>
            <div style={{ fontSize: 13, color: t.text4, marginTop: 4 }}>Sağ alttaki + ile ekle</div>
          </div>
        )}
        {aktifKayitlar.map(k => (
          <KayitKart key={k.id} kayit={k} t={t}
            onDetay={() => { setSecili(k); setModal("detay"); }}
            onTamamla={() => guncelle(k.id, { tamamlandi: true })}
            onKisiAta={(kisi) => guncelle(k.id, { atanan_kisi: kisi })}
            onDuzenle={() => { setSecili(k); setModal("duzenle"); }}
          />
        ))}
      </div>

      <button style={{ position: "fixed", bottom: 24, left: "max(16px, calc(50% - 224px))", width: 56, height: 56, background: "#1D6F42", border: "none", borderRadius: "50%", color: "#fff", fontSize: 26, cursor: "pointer", boxShadow: "0 4px 24px rgba(29,111,66,0.6)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, zIndex: 500 }}
        onClick={() => window.open("https://docs.google.com/spreadsheets/d/1EtSGEE0J8ASqWxV47uNOlmoz2grPutz6s3raErGf_O8/edit?usp=sharing", "_blank")}>📊</button>
      <button style={{ position: "fixed", bottom: 24, right: "max(16px, calc(50% - 224px))", width: 56, height: 56, background: TURUNCU, border: "none", borderRadius: "50%", color: "#fff", fontSize: 32, cursor: "pointer", boxShadow: "0 4px 24px rgba(232,92,13,0.6)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, zIndex: 500 }}
        onClick={() => setModal("ekle")}>+</button>

      {modal === "ekle" && <EkleModal sekme={sekme} onClose={() => setModal(null)} showToast={showToast} onYukle={yukle} t={t} />}
      {modal === "detay" && secili && <DetayModal kayit={secili} onClose={() => { setModal(null); setSecili(null); }} onGuncelle={guncelle} onSil={sil} onYukle={yukle} showToast={showToast} t={t} />}
      {modal === "duzenle" && secili && <DuzenleModal kayit={secili} onClose={() => { setModal(null); setSecili(null); }} onYukle={yukle} showToast={showToast} t={t} />}
      {tamamlananAcik && <TamamlananlarModal kayitlar={tamamlananlar} onClose={() => setTamamlananAcik(false)} onGeriAl={(id) => guncelle(id, { tamamlandi: false })} onSil={sil} t={t} />}
    </div>
  );
}

function KayitKart({ kayit, t, onDetay, onTamamla, onKisiAta, onDuzenle }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [kisiMenuAcik, setKisiMenuAcik] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDrag = useRef(false);
  const ESIK = 60;

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; startY.current = e.touches[0].clientY; isDrag.current = false; setDragging(true); };
  const onTouchMove = (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!isDrag.current && Math.abs(dy) > Math.abs(dx)) { setDragging(false); return; }
    if (Math.abs(dx) > 8) { isDrag.current = true; e.preventDefault(); }
    if (!isDrag.current) return;
    setOffset(Math.max(-160, Math.min(120, dx)));
  };
  const onTouchEnd = () => { setDragging(false); if (offset < -ESIK) setOffset(-160); else if (offset > ESIK) setOffset(120); else setOffset(0); };
  const kapat = () => { setOffset(0); setKisiMenuAcik(false); };

  return (
    <div style={{ position: "relative", marginBottom: 10, borderRadius: 10 }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-between", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#3B82F6", width: 120, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => { kapat(); onDuzenle(); }}>
          <div style={{ textAlign: "center", color: "#fff" }}><div style={{ fontSize: 22 }}>✏️</div><div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>Düzenle</div></div>
        </div>
        <div style={{ display: "flex", width: 160 }}>
          <div style={{ background: "#8B5CF6", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => setKisiMenuAcik(v => !v)}>
            <div style={{ textAlign: "center", color: "#fff" }}><div style={{ fontSize: 22 }}>👤</div><div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>Kişi Ata</div></div>
          </div>
          <div style={{ background: "#10B981", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => { kapat(); onTamamla(); }}>
            <div style={{ textAlign: "center", color: "#fff" }}><div style={{ fontSize: 22 }}>✅</div><div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>Tamamla</div></div>
          </div>
        </div>
      </div>
      {kisiMenuAcik && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: t.bg3, border: "1px solid " + TURUNCU + "40", borderRadius: 10, zIndex: 200, minWidth: 150, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
          {KİŞİLER.map(k => (
            <div key={k} style={{ padding: "11px 16px", cursor: "pointer", color: kayit.atanan_kisi === k ? TURUNCU : t.text, fontSize: 14, borderBottom: "1px solid " + t.border2, fontWeight: kayit.atanan_kisi === k ? 700 : 400 }}
              onClick={() => { onKisiAta(kayit.atanan_kisi === k ? null : k); setKisiMenuAcik(false); kapat(); }}>
              {kayit.atanan_kisi === k ? "✓ " : "  "}{k}
            </div>
          ))}
          <div style={{ padding: "10px 16px", cursor: "pointer", color: "#EF4444", fontSize: 13 }} onClick={() => { onKisiAta(null); setKisiMenuAcik(false); kapat(); }}>Kişiyi Kaldır</div>
        </div>
      )}
      <div style={{ background: t.kartBg, borderRadius: 10, padding: 14, cursor: "pointer", border: "1px solid " + t.kartBorder, transform: "translateX(" + offset + "px)", transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)", position: "relative", zIndex: 1, userSelect: "none" }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={() => { if (Math.abs(offset) < 10 && !kisiMenuAcik) onDetay(); }}>
        {kayit.atanan_kisi && <div style={{ background: TURUNCU + "15", border: "1px solid " + TURUNCU + "40", color: TURUNCU, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, marginBottom: 6, display: "inline-block" }}>👤 {kayit.atanan_kisi} üstlendi</div>}
        {(() => { const saat = (Date.now() - new Date(kayit.created_at)) / 3600000; return saat > 36 ? <div style={{ background: "#EF444415", border: "1px solid #EF444440", color: "#EF4444", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, marginBottom: 6, display: "inline-block", marginLeft: kayit.atanan_kisi ? 6 : 0 }}>⚠️ Gecikti ({Math.floor(saat)}s)</div> : null; })()}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text, flex: 1, marginRight: 8 }}>{kayit.musteri}</div>
          <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", background: DURUM_RENK[kayit.durum] || "#6B7280" }}>{kayit.durum}</div>
        </div>
        {kayit.tip === "atama" && <div style={{ display: "flex", gap: 12, fontSize: 12, color: t.text2, marginBottom: 4 }}>{kayit.uzman && <span>🔧 {kayit.uzman.split("(")[0].trim()}</span>}{kayit.hekim && <span>🩺 {kayit.hekim}</span>}</div>}
        {kayit.tip === "fatura" && kayit.tutar && <div style={{ fontSize: 12, color: t.text2, marginBottom: 4 }}>💸 {kayit.tutar}</div>}
        {kayit.tip === "evrak" && kayit.evrak_tur && <div style={{ fontSize: 12, color: t.text2, marginBottom: 4 }}>📋 {kayit.evrak_tur}</div>}
        {kayit.aciklama && <div style={{ color: t.text3, fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{kayit.aciklama.slice(0, 70)}{kayit.aciklama.length > 70 ? "..." : ""}</div>}
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: t.text4, marginTop: 6, flexWrap: "wrap" }}>
          {kayit.fotolar?.length > 0 && <span>📷 {kayit.fotolar.length}</span>}
          {kayit.ses_kayd && <span>🎙 Ses</span>}
          <span>{fmtTarih(kayit.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function DetayModal({ kayit, t, onClose, onGuncelle, onSil, onYukle, showToast }) {
  const [durum, setDurum] = useState(kayit.durum);
  const [yukleniyor, setYukleniyor] = useState(false);
  const fotoRef = useRef();
  const durumlar = kayit.tip === "fatura" ? FATURA_DURUMLAR : kayit.tip === "evrak" ? EVRAK_DURUMLAR : ["Yapılmadı", "Yapıldı"];

  const fotoSil = async (url) => {
    const yeni = (kayit.fotolar || []).filter(f => f !== url);
    await supabase.from("isler").update({ fotolar: yeni }).eq("id", kayit.id);
    showToast("Fotoğraf silindi"); onYukle(); onClose();
  };
  const fotoEkle = async (e) => {
    const dosyalar = Array.from(e.target.files); if (!dosyalar.length) return;
    setYukleniyor(true);
    const urls = [...(kayit.fotolar || [])];
    for (const f of dosyalar) {
      const ad = Date.now() + "_" + Math.random().toString(36).slice(2) + "_" + f.name;
      const { error } = await supabase.storage.from("fotolar").upload(ad, f);
      if (!error) { const { data } = supabase.storage.from("fotolar").getPublicUrl(ad); urls.push(data.publicUrl); }
    }
    await supabase.from("isler").update({ fotolar: urls }).eq("id", kayit.id);
    showToast("Fotoğraf eklendi ✓"); setYukleniyor(false); onYukle(); onClose();
  };

  const inpStyle = { width: "100%", background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 8, padding: "10px 12px", color: t.text, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.modalBg, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", borderTop: "2px solid " + TURUNCU }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, display: "flex", justifyContent: "space-between" }}>{kayit.musteri}<button style={{ background: "none", border: "none", color: t.text3, fontSize: 20, cursor: "pointer" }} onClick={onClose}>✕</button></div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, display: "inline-block", background: DURUM_RENK[kayit.durum] || "#6B7280" }}>{kayit.durum}</div>
          {kayit.atanan_kisi && <span style={{ background: TURUNCU + "15", border: "1px solid " + TURUNCU + "40", color: TURUNCU, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, marginLeft: 8 }}>👤 {kayit.atanan_kisi}</span>}
        </div>
        {kayit.tip === "atama" && (kayit.uzman || kayit.hekim) && (
          <div style={{ background: t.inputBg, borderRadius: 8, padding: 12, marginBottom: 14, borderLeft: "2px solid " + TURUNCU }}>
            {kayit.uzman && <div style={{ display: "flex", gap: 8, padding: "4px 0" }}><span style={{ minWidth: 70, color: t.text3, fontSize: 12, fontWeight: 600 }}>🔧 Uzman</span><span style={{ color: t.text2, fontSize: 14 }}>{kayit.uzman}</span></div>}
            {kayit.hekim && <div style={{ display: "flex", gap: 8, padding: "4px 0" }}><span style={{ minWidth: 70, color: t.text3, fontSize: 12, fontWeight: 600 }}>🩺 Hekim</span><span style={{ color: t.text2, fontSize: 14 }}>{kayit.hekim}</span></div>}
          </div>
        )}
        {kayit.tip === "fatura" && kayit.tutar && <div style={{ background: t.inputBg, borderRadius: 8, padding: 12, marginBottom: 14, borderLeft: "2px solid " + TURUNCU }}><span style={{ color: t.text3, fontSize: 12, fontWeight: 600 }}>💸 Tutar  </span><span style={{ color: t.text2, fontSize: 14 }}>{kayit.tutar}</span></div>}
        {kayit.tip === "evrak" && kayit.evrak_tur && <div style={{ background: t.inputBg, borderRadius: 8, padding: 12, marginBottom: 14, borderLeft: "2px solid " + TURUNCU }}><span style={{ color: t.text3, fontSize: 12, fontWeight: 600 }}>📋 Tür  </span><span style={{ color: t.text2, fontSize: 14 }}>{kayit.evrak_tur}</span></div>}
        {kayit.aciklama && <div style={{ background: t.inputBg, borderRadius: 8, padding: 12, marginBottom: 14, borderLeft: "3px solid " + TURUNCU }}><div style={{ fontSize: 10, fontWeight: 700, color: t.text4, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>NOTLAR</div><p style={{ margin: 0, lineHeight: 1.7, color: t.text2, fontSize: 14 }}>{kayit.aciklama}</p></div>}
        {kayit.ses_kayd && <div style={{ marginBottom: 16 }}><div style={{ fontSize: 10, fontWeight: 700, color: t.text4, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>SES KAYDI</div><audio controls src={kayit.ses_kayd} style={{ width: "100%" }} preload="metadata" /></div>}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.text4, letterSpacing: 1.5, textTransform: "uppercase" }}>FOTOĞRAFLAR {kayit.fotolar?.length > 0 ? "(" + kayit.fotolar.length + ")" : ""}</div>
            <button style={{ background: TURUNCU, border: "none", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }} onClick={() => fotoRef.current.click()}>{yukleniyor ? "⏳" : "+ Ekle"}</button>
            <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={fotoEkle} />
          </div>
          {kayit.fotolar?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {kayit.fotolar.map((f, i) => (
              <div key={i} style={{ position: "relative", width: "calc(50% - 4px)" }}>
                <img src={f} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} alt="" onClick={() => window.open(f, "_blank")} />
                <button onClick={() => fotoSil(f)} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.75)", border: "none", color: "#fff", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
              </div>
            ))}
          </div>}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: t.text4, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>DURUMU GÜNCELLE</div>
        <select style={{ ...inpStyle, marginBottom: 10 }} value={durum} onChange={e => setDurum(e.target.value)}>{durumlar.map(d => <option key={d}>{d}</option>)}</select>
        <button style={{ width: "100%", background: TURUNCU, border: "none", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12 }} onClick={() => onGuncelle(kayit.id, { durum })}>✓ Durumu Kaydet</button>
        <div style={{ fontSize: 10, fontWeight: 700, color: t.text4, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>EKLENME TARİHİ</div>
        <div style={{ color: t.text3, fontSize: 13, marginBottom: 16 }}>{fmtTarih(kayit.created_at)}</div>
        <button style={{ width: "100%", background: t.bg3, border: "1px solid " + t.border2, color: t.text2, borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 10 }} onClick={() => {
          const tip = kayit.tip === "fatura" ? "💰 Fatura" : kayit.tip === "atama" ? "👤 Atama" : "📁 Evrak";
          const tarih = new Date(kayit.created_at).toLocaleDateString("tr-TR");
          const satirlar = [
            tip + " Kaydı — " + kayit.musteri,
            "Durum: " + (kayit.durum || "-"),
            kayit.uzman ? "Uzman: " + kayit.uzman : "",
            kayit.hekim ? "Hekim: " + kayit.hekim : "",
            kayit.aciklama ? "Not: " + kayit.aciklama : "",
            "Tarih: " + tarih,
            kayit.atanan_kisi ? "Atanan: " + kayit.atanan_kisi : "",
          ].filter(Boolean).join("\n");
          if (navigator.share) {
            navigator.share({ title: kayit.musteri, text: satirlar });
          } else {
            navigator.clipboard.writeText(satirlar);
            showToast("Panoya kopyalandı ✓");
          }
        }}>📤 Paylaş</button>
        <button style={{ width: "100%", background: "transparent", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={() => onSil(kayit.id)}>🗑️ Kaydı Sil</button>
      </div>
    </div>
  );
}

function DuzenleModal({ kayit, t, onClose, onYukle, showToast }) {
  const [form, setForm] = useState({ musteri: kayit.musteri || "", durum: kayit.durum || "", aciklama: kayit.aciklama || "", tutar: kayit.tutar || "", uzman: kayit.uzman || "", hekim: kayit.hekim || "", evrak_tur: kayit.evrak_tur || "" });
  const [yukleniyor, setYukleniyor] = useState(false);
  const durumlar = kayit.tip === "fatura" ? FATURA_DURUMLAR : kayit.tip === "evrak" ? EVRAK_DURUMLAR : ["Yapılmadı", "Yapıldı"];
  const inpStyle = { width: "100%", background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 8, padding: "10px 12px", color: t.text, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: t.text3, letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" };

  const kaydet = async () => {
    if (!form.musteri.trim()) { showToast("Müşteri adı zorunlu!", "hata"); return; }
    setYukleniyor(true);
    const { error } = await supabase.from("isler").update({ musteri: form.musteri.trim(), durum: form.durum, aciklama: form.aciklama || null, tutar: form.tutar || null, uzman: form.uzman || null, hekim: form.hekim || null, evrak_tur: form.evrak_tur || null }).eq("id", kayit.id);
    setYukleniyor(false);
    if (error) { showToast("Hata: " + error.message, "hata"); return; }
    showToast("Güncellendi ✓"); onYukle(); onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && !yukleniyor && onClose()}>
      <div style={{ background: t.modalBg, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", borderTop: "2px solid " + TURUNCU }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, display: "flex", justifyContent: "space-between" }}>✏️ İşi Düzenle<button style={{ background: "none", border: "none", color: t.text3, fontSize: 20, cursor: "pointer" }} onClick={onClose}>✕</button></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>Müşteri Adı</label><input style={inpStyle} value={form.musteri} onChange={e => setForm({ ...form, musteri: e.target.value })} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>Durum</label><select style={inpStyle} value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>{durumlar.map(d => <option key={d}>{d}</option>)}</select></div>
        {kayit.tip === "fatura" && <div style={{ marginBottom: 14 }}><label style={lbl}>Tutar</label><input style={inpStyle} value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })} placeholder="Örn: 1500+KDV" /></div>}
        {kayit.tip === "atama" && (<>
          <div style={{ marginBottom: 14 }}><label style={lbl}>İSG Uzmanı</label><select style={inpStyle} value={form.uzman} onChange={e => setForm({ ...form, uzman: e.target.value })}><option value="">Seç...</option>{UZMANLAR.map(u => <option key={u}>{u}</option>)}</select></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>İşyeri Hekimi</label><select style={inpStyle} value={form.hekim} onChange={e => setForm({ ...form, hekim: e.target.value })}><option value="">Seç...</option>{HEKİMLER.map(h => <option key={h}>{h}</option>)}</select></div>
        </>)}
        <div style={{ marginBottom: 14 }}><label style={lbl}>Not / Açıklama</label><textarea style={{ ...inpStyle, height: 80, resize: "none" }} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} /></div>
        <button style={{ width: "100%", background: TURUNCU, border: "none", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: yukleniyor ? 0.7 : 1 }} onClick={kaydet} disabled={yukleniyor}>{yukleniyor ? "⏳ Kaydediliyor..." : "💾 Güncelle"}</button>
      </div>
    </div>
  );
}

function TamamlananlarModal({ kayitlar, t, onClose, onGeriAl, onSil }) {
  const [aktifTab, setAktifTab] = useState("fatura");
  const TABS = [
    { id: "fatura", label: "💰 Fatura" },
    { id: "atama", label: "👤 Atama" },
    { id: "evrak", label: "📁 Evrak" },
  ];
  const filtreliler = kayitlar.filter(k => k.tip === aktifTab);

  const KartBilgi = ({ k }) => {
    if (k.tip === "fatura" && k.tutar) return <div style={{ color: t.text3, fontSize: 12, marginTop: 3 }}>💸 {k.tutar}</div>;
    if (k.tip === "atama") return <div style={{ color: t.text3, fontSize: 12, marginTop: 3 }}>{k.uzman && "🔧 " + k.uzman.split("(")[0].trim()}{k.hekim && "  🩺 " + k.hekim}</div>;
    if (k.tip === "evrak" && k.evrak_tur) return <div style={{ color: t.text3, fontSize: 12, marginTop: 3 }}>📋 {k.evrak_tur}</div>;
    return null;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: t.modalBg, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", borderTop: "2px solid " + TURUNCU }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          ✅ Tamamlanan İşler ({kayitlar.length})
          <button style={{ background: "none", border: "none", color: t.text3, fontSize: 20, cursor: "pointer" }} onClick={onClose}>✕</button>
        </div>
        {/* SEKMELEr */}
        <div style={{ display: "flex", borderBottom: "1px solid " + t.border2, marginBottom: 16 }}>
          {TABS.map(tab => {
            const count = kayitlar.filter(k => k.tip === tab.id).length;
            const aktif = aktifTab === tab.id;
            return (
              <button key={tab.id} style={{ flex: 1, padding: "9px 4px", background: "none", border: "none", borderBottom: aktif ? "2px solid " + TURUNCU : "2px solid transparent", color: aktif ? TURUNCU : t.text3, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                onClick={() => setAktifTab(tab.id)}>
                {tab.label} {count > 0 && <span style={{ background: aktif ? TURUNCU : t.border2, color: aktif ? "#fff" : t.text2, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 5px" }}>{count}</span>}
              </button>
            );
          })}
        </div>
        {filtreliler.length === 0 && <div style={{ textAlign: "center", color: t.text3, padding: "30px 0" }}>Bu kategoride tamamlanan iş yok</div>}
        {filtreliler.map(k => (
          <div key={k.id} style={{ background: t.kartBg, borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid " + t.kartBorder, opacity: 0.85 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text3, textDecoration: "line-through" }}>{k.musteri}</div>
              <div style={{ color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#10B981" }}>✓ Tamam</div>
            </div>
            <KartBilgi k={k} />
            {k.aciklama && <div style={{ color: t.text4, fontSize: 12, marginTop: 4 }}>{k.aciklama.slice(0, 60)}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={{ flex: 1, background: t.secBtn, border: "none", color: t.text2, padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer" }} onClick={() => onGeriAl(k.id)}>↩ Geri Al</button>
              <button style={{ flex: 1, background: "transparent", border: "1px solid #EF4444", color: "#EF4444", padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer" }} onClick={() => onSil(k.id)}>🗑 Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EkleModal({ sekme, onClose, showToast, onYukle, t }) {
  const [form, setForm] = useState({ durum: sekme === "fatura" ? "Kesilecek" : sekme === "evrak" ? "Beklemede" : "Yapılmadı" });
  const [musteri, setMusteri] = useState("");
  const [oneri, setOneri] = useState([]);
  const [fotolar, setFotolar] = useState([]);
  const [sesBlob, setSesBlob] = useState(null);
  const [sesURL, setSesURL] = useState(null);
  const [sesMimeType, setSesMimeType] = useState("audio/webm");
  const [sesExt, setSesExt] = useState("webm");
  const [kayitYapiliyor, setKayitYapiliyor] = useState(false);
  const [kayitSure, setKayitSure] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(false);
  const fotoRef = useRef(); const mediaRef = useRef(); const chunksRef = useRef([]); const timerRef = useRef();

  const inpStyle = { width: "100%", background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: 8, padding: "10px 12px", color: t.text, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: t.text3, letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" };
  const fg = { marginBottom: 14, position: "relative" };

  const musteriDegis = (val) => { setMusteri(val); if (val.length > 1) setOneri(getMusteriGecmis().filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0, 5)); else setOneri([]); };
  const sesBaslat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const format = getSesFormat(); setSesMimeType(format.mimeType); setSesExt(format.ext);
      const options = MediaRecorder.isTypeSupported(format.mimeType) ? { mimeType: format.mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => { const blob = new Blob(chunksRef.current, { type: format.mimeType }); setSesBlob(blob); setSesURL(URL.createObjectURL(blob)); stream.getTracks().forEach(t => t.stop()); clearInterval(timerRef.current); };
      recorder.start(100); mediaRef.current = recorder; setKayitYapiliyor(true); setKayitSure(0);
      timerRef.current = setInterval(() => setKayitSure(s => s + 1), 1000);
    } catch { showToast("Mikrofon erişimi reddedildi", "hata"); }
  };
  const sesDur = () => { mediaRef.current?.stop(); setKayitYapiliyor(false); clearInterval(timerRef.current); };
  const fmtSure = (s) => Math.floor(s/60).toString().padStart(2,"0") + ":" + (s%60).toString().padStart(2,"0");

  const kaydet = async () => {
    if (!musteri.trim()) { showToast("Müşteri adı zorunlu!", "hata"); return; }
    setYukleniyor(true);
    try {
      const fotoURLler = [];
      for (const foto of fotolar) {
        const ad = Date.now() + "_" + Math.random().toString(36).slice(2) + "_" + foto.name;
        const { error } = await supabase.storage.from("fotolar").upload(ad, foto);
        if (!error) { const { data } = supabase.storage.from("fotolar").getPublicUrl(ad); fotoURLler.push(data.publicUrl); }
      }
      let sesKaydURL = null;
      if (sesBlob) {
        const ad = Date.now() + "_" + Math.random().toString(36).slice(2) + "." + sesExt;
        const { error } = await supabase.storage.from("sesler").upload(ad, sesBlob, { contentType: sesMimeType });
        if (!error) { const { data } = supabase.storage.from("sesler").getPublicUrl(ad); sesKaydURL = data.publicUrl; }
      }
      const { error } = await supabase.from("isler").insert({ tip: sekme, musteri: musteri.trim(), durum: form.durum, aciklama: form.aciklama || null, tutar: form.tutar || null, uzman: form.uzman || null, hekim: form.hekim || null, evrak_tur: form.evrak_tur || null, fotolar: fotoURLler.length > 0 ? fotoURLler : null, ses_kayd: sesKaydURL });
      if (error) { showToast("Hata: " + error.message, "hata"); setYukleniyor(false); return; }
      addMusteriGecmis(musteri.trim()); showToast("Kayıt eklendi ✓"); onYukle(); setYukleniyor(false); onClose();
    } catch (e) { showToast("Hata: " + e.message, "hata"); setYukleniyor(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && !yukleniyor && onClose()}>
      <div style={{ background: t.modalBg, borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", borderTop: "2px solid " + TURUNCU }}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 18, display: "flex", justifyContent: "space-between", color: t.text }}>
          {sekme === "fatura" ? "💰 Yeni Fatura" : sekme === "atama" ? "👤 Yeni Atama" : "📁 Yeni Evrak"}
          {!yukleniyor && <button style={{ background: "none", border: "none", color: t.text3, fontSize: 20, cursor: "pointer" }} onClick={onClose}>✕</button>}
        </div>
        <div style={fg}><label style={lbl}>Müşteri Adı *</label>
          <input style={inpStyle} placeholder="Firma adı yaz..." value={musteri} onChange={e => musteriDegis(e.target.value)} autoComplete="off" />
          {oneri.length > 0 && <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: t.inputBg, border: "1px solid " + t.inputBorder, borderRadius: "0 0 8px 8px", zIndex: 100 }}>{oneri.map(m => <div key={m} style={{ padding: "10px 12px", cursor: "pointer", fontSize: 14, borderTop: "1px solid " + t.border2, color: t.text2 }} onClick={() => { setMusteri(m); setOneri([]); }}>{m}</div>)}</div>}
        </div>
        {sekme === "fatura" && (<>
        </>)}
        {sekme === "atama" && (<>
          <div style={fg}><label style={lbl}>İSG Uzmanı</label><select style={inpStyle} value={form.uzman || ""} onChange={e => setForm({ ...form, uzman: e.target.value })}><option value="">Seç...</option>{UZMANLAR.map(u => <option key={u}>{u}</option>)}</select></div>
          <div style={fg}><label style={lbl}>İşyeri Hekimi</label><select style={inpStyle} value={form.hekim || ""} onChange={e => setForm({ ...form, hekim: e.target.value })}><option value="">Seç...</option>{HEKİMLER.map(h => <option key={h}>{h}</option>)}</select></div>
        </>)}
        {sekme === "evrak" && null
        <div style={fg}><label style={lbl}>Not / Açıklama</label><textarea style={{ ...inpStyle, height: 80, resize: "none" }} value={form.aciklama || ""} onChange={e => setForm({ ...form, aciklama: e.target.value })} /></div>
        <div style={fg}>
          <label style={lbl}>Fotoğraf</label>
          <button style={{ width: "100%", background: t.inputBg, border: "1px dashed " + TURUNCU + "40", borderRadius: 8, padding: 12, color: t.text2, fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={() => fotoRef.current.click()}>📷 {fotolar.length > 0 ? fotolar.length + " seçildi" : "Fotoğraf Ekle"}</button>
          <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setFotolar(Array.from(e.target.files))} />
          {fotolar.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{fotolar.map((f, i) => <img key={i} src={URL.createObjectURL(f)} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} alt="" />)}</div>}
        </div>
        <div style={fg}>
          <label style={lbl}>Ses Kaydı</label>
          {!sesURL ? (
            <button style={{ width: "100%", background: t.inputBg, border: "1px dashed " + (kayitYapiliyor ? "#EF4444" : TURUNCU + "40"), borderRadius: 8, padding: 12, color: kayitYapiliyor ? "#EF4444" : t.text2, fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={kayitYapiliyor ? sesDur : sesBaslat}>
              {kayitYapiliyor ? "⏹ Durdur  " + fmtSure(kayitSure) : "🎙 Ses Kaydı Başlat"}
            </button>
          ) : (
            <div><audio controls src={sesURL} style={{ width: "100%", marginTop: 4 }} />
              <button style={{ width: "100%", background: t.inputBg, border: "1px dashed " + t.border2, borderRadius: 8, padding: 10, color: t.text2, fontSize: 13, cursor: "pointer", marginTop: 6 }} onClick={() => { setSesBlob(null); setSesURL(null); }}>🗑 Sil</button>
            </div>
          )}
        </div>
        <button style={{ width: "100%", background: TURUNCU, border: "none", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: yukleniyor ? 0.7 : 1 }} onClick={kaydet} disabled={yukleniyor}>
          {yukleniyor ? "⏳ Kaydediliyor..." : "💾 Kaydet"}
        </button>
      </div>
    </div>
  );
}
