import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const UZMANLAR = [
  "Ertuğrul GÜNEY (C Sınıfı İGU)",
  "Yavuz CANPOLAT (A Sınıfı İGU)",
];
const HEKİMLER = [
  "Fahri Gurur POLAT",
  "Zehra Esra TEMELTAŞ",
];

const FATURA_DURUMLAR = ["Kesilecek", "Kesildi", "Eksik Kesildi", "Düzeltilecek", "Tamamlandı"];
const EVRAK_TURLER = ["Eksik Evrak", "Hatalı Evrak", "Güncellenmesi Gereken", "İmza Eksik", "Diğer"];
const EVRAK_DURUMLAR = ["Beklemede", "İşlemde", "Tamamlandı"];

const DURUM_RENK = {
  "Kesilecek": "#6B7280", "Kesildi": "#3B82F6", "Eksik Kesildi": "#EF4444",
  "Düzeltilecek": "#F59E0B", "Tamamlandı": "#10B981",
  "Beklemede": "#6B7280", "İşlemde": "#F59E0B",
  "Yapılmadı": "#EF4444", "Yapıldı": "#10B981",
};

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

// iPhone/iOS tespiti
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

// Desteklenen ses formatını bul
const getSesFormat = () => {
  if (isIOS()) return { mimeType: "audio/mp4", ext: "mp4" };
  if (MediaRecorder.isTypeSupported("audio/webm")) return { mimeType: "audio/webm", ext: "webm" };
  if (MediaRecorder.isTypeSupported("audio/ogg")) return { mimeType: "audio/ogg", ext: "ogg" };
  return { mimeType: "audio/mp4", ext: "mp4" };
};

export default function App() {
  const [sekme, setSekme] = useState("fatura");
  const [kayitlar, setKayitlar] = useState([]);
  const [modal, setModal] = useState(null);
  const [secili, setSecili] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, tip = "ok") => {
    setToast({ msg, tip });
    setTimeout(() => setToast(null), 3500);
  };

  const yukle = async () => {
    const { data, error } = await supabase
      .from("isler")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { showToast("Veri yüklenemedi!", "hata"); return; }
    setKayitlar(data || []);
  };

  useEffect(() => {
    yukle();
    const channel = supabase
      .channel("isler_degisim")
      .on("postgres_changes", { event: "*", schema: "public", table: "isler" }, () => yukle())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const guncelle = async (id, data) => {
    const { error } = await supabase.from("isler").update(data).eq("id", id);
    if (error) { showToast("Hata: " + error.message, "hata"); return; }
    showToast("Güncellendi ✓");
    yukle();
  };

  const sil = async (id) => {
    if (!window.confirm("Bu kaydı silmek istiyor musun?")) return;
    await supabase.from("isler").delete().eq("id", id);
    setModal(null); setSecili(null);
    showToast("Silindi.");
    yukle();
  };

  const filtreliKayitlar = kayitlar.filter(k => k.tip === sekme);

  return (
    <div style={s.root}>
      {toast && <div style={{ ...s.toast, background: toast.tip === "hata" ? "#EF4444" : "#10B981" }}>{toast.msg}</div>}

      <div style={s.header}>
        <div style={s.headerIco}>🦺</div>
        <div>
          <div style={s.headerBaslik}>ISG TAKİP</div>
          <div style={s.headerAlt}>İş Sağlığı ve Güvenliği Yönetimi</div>
        </div>
      </div>

      <div style={s.sekmeler}>
        {[
          { id: "fatura", label: "💰 Fatura" },
          { id: "atama", label: "👤 Atama" },
          { id: "evrak", label: "📁 Evrak" },
        ].map(tab => {
          const count = kayitlar.filter(k => k.tip === tab.id).length;
          return (
            <button key={tab.id} style={{ ...s.sekmeBtn, ...(sekme === tab.id ? s.sekmeBtnAktif : {}) }} onClick={() => setSekme(tab.id)}>
              {tab.label}
              {count > 0 && <span style={s.badge}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div style={s.liste}>
        {filtreliKayitlar.length === 0 && (
          <div style={s.bos}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{sekme === "fatura" ? "💰" : sekme === "atama" ? "👤" : "📁"}</div>
            <div>Henüz kayıt yok</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Sağ alttaki + ile ekle</div>
          </div>
        )}
        {filtreliKayitlar.map(k => (
          <div key={k.id} style={s.kart} onClick={() => { setSecili(k); setModal("detay"); }}>
            <div style={s.kartUst}>
              <div style={s.kartMusteri}>{k.musteri}</div>
              <div style={{ ...s.durumBadge, background: DURUM_RENK[k.durum] || "#6B7280" }}>{k.durum}</div>
            </div>
            {k.tip === "atama" && (
              <div style={s.kartAlt}>
                {k.uzman && <span>🔧 {k.uzman.split("(")[0].trim()}</span>}
                {k.hekim && <span>🩺 {k.hekim}</span>}
              </div>
            )}
            {k.tip === "fatura" && k.tutar && <div style={s.kartAlt}><span>💸 {k.tutar}</span></div>}
            {k.tip === "evrak" && k.evrak_tur && <div style={s.kartAlt}><span>📋 {k.evrak_tur}</span></div>}
            {k.aciklama && <div style={s.kartNot}>{k.aciklama.slice(0, 70)}{k.aciklama.length > 70 ? "..." : ""}</div>}
            <div style={s.kartMeta}>
              {k.fotolar?.length > 0 && <span>📷 {k.fotolar.length}</span>}
              {k.ses_kayd && <span>🎙 Ses var</span>}
              <span>{fmtTarih(k.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      <button style={s.fabBtn} onClick={() => setModal("ekle")}>+</button>

      {modal === "ekle" && (
        <EkleModal sekme={sekme} onClose={() => setModal(null)} showToast={showToast} onYukle={yukle} />
      )}
      {modal === "detay" && secili && (
        <DetayModal kayit={secili} onClose={() => { setModal(null); setSecili(null); }} onGuncelle={guncelle} onSil={sil} />
      )}
    </div>
  );
}

function EkleModal({ sekme, onClose, showToast, onYukle }) {
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
  const fotoRef = useRef();
  const mediaRef = useRef();
  const chunksRef = useRef([]);
  const timerRef = useRef();

  const musteriDegis = (val) => {
    setMusteri(val);
    if (val.length > 1) setOneri(getMusteriGecmis().filter(m => m.toLowerCase().includes(val.toLowerCase())).slice(0, 5));
    else setOneri([]);
  };

  const sesBaslat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const format = getSesFormat();
      setSesMimeType(format.mimeType);
      setSesExt(format.ext);
      
      const options = MediaRecorder.isTypeSupported(format.mimeType) ? { mimeType: format.mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: format.mimeType });
        setSesBlob(blob);
        setSesURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
      };
      recorder.start(100);
      mediaRef.current = recorder;
      setKayitYapiliyor(true);
      setKayitSure(0);
      timerRef.current = setInterval(() => setKayitSure(s => s + 1), 1000);
    } catch (e) {
      showToast("Mikrofon erişimi reddedildi", "hata");
    }
  };

  const sesDur = () => {
    mediaRef.current?.stop();
    setKayitYapiliyor(false);
    clearInterval(timerRef.current);
  };

  const fmtSure = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const kaydet = async () => {
    if (!musteri.trim()) { showToast("Müşteri adı zorunlu!", "hata"); return; }
    setYukleniyor(true);
    try {
      const fotoURLler = [];
      for (const foto of fotolar) {
        const dosyaAdi = `${Date.now()}_${Math.random().toString(36).slice(2)}_${foto.name}`;
        const { error: uploadError } = await supabase.storage.from("fotolar").upload(dosyaAdi, foto);
        if (!uploadError) {
          const { data } = supabase.storage.from("fotolar").getPublicUrl(dosyaAdi);
          fotoURLler.push(data.publicUrl);
        }
      }

      let sesKaydURL = null;
      if (sesBlob) {
        const sesAdi = `${Date.now()}_${Math.random().toString(36).slice(2)}.${sesExt}`;
        const { error: sesError } = await supabase.storage.from("sesler").upload(sesAdi, sesBlob, { contentType: sesMimeType });
        if (!sesError) {
          const { data } = supabase.storage.from("sesler").getPublicUrl(sesAdi);
          sesKaydURL = data.publicUrl;
        } else {
          showToast("Ses yüklenemedi: " + sesError.message, "hata");
        }
      }

      const { error } = await supabase.from("isler").insert({
        tip: sekme,
        musteri: musteri.trim(),
        durum: form.durum,
        aciklama: form.aciklama || null,
        tutar: form.tutar || null,
        uzman: form.uzman || null,
        hekim: form.hekim || null,
        evrak_tur: form.evrak_tur || null,
        fotolar: fotoURLler.length > 0 ? fotoURLler : null,
        ses_kayd: sesKaydURL,
      });

      if (error) { showToast("Hata: " + error.message, "hata"); setYukleniyor(false); return; }

      addMusteriGecmis(musteri.trim());
      showToast("Kayıt eklendi ✓");
      onYukle();
      setYukleniyor(false);
      onClose();
    } catch (e) {
      showToast("Hata: " + e.message, "hata");
      setYukleniyor(false);
    }
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && !yukleniyor && onClose()}>
      <div style={s.modal}>
        <div style={s.modalBaslik}>
          {sekme === "fatura" ? "💰 Yeni Fatura Kaydı" : sekme === "atama" ? "👤 Yeni Atama" : "📁 Yeni Evrak Kaydı"}
          {!yukleniyor && <button style={s.kapat} onClick={onClose}>✕</button>}
        </div>

        <div style={s.fg}>
          <label style={s.lbl}>Müşteri Adı *</label>
          <input style={s.inp} placeholder="Firma adı yaz..." value={musteri} onChange={e => musteriDegis(e.target.value)} autoComplete="off" />
          {oneri.length > 0 && (
            <div style={s.oneriKutu}>
              {oneri.map(m => <div key={m} style={s.oneriItem} onClick={() => { setMusteri(m); setOneri([]); }}>{m}</div>)}
            </div>
          )}
        </div>

        {sekme === "fatura" && (<>
          <div style={s.fg}>
            <label style={s.lbl}>Fatura Durumu</label>
            <select style={s.inp} value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
              {FATURA_DURUMLAR.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={s.fg}>
            <label style={s.lbl}>Tutar</label>
            <input style={s.inp} type="text" placeholder="Örn: 1500 veya 1500+KDV" value={form.tutar || ""} onChange={e => setForm({ ...form, tutar: e.target.value })} />
          </div>
        </>)}

        {sekme === "atama" && (<>
          <div style={s.fg}>
            <label style={s.lbl}>İSG Uzmanı</label>
            <select style={s.inp} value={form.uzman || ""} onChange={e => setForm({ ...form, uzman: e.target.value })}>
              <option value="">Seç...</option>
              {UZMANLAR.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={s.fg}>
            <label style={s.lbl}>İşyeri Hekimi</label>
            <select style={s.inp} value={form.hekim || ""} onChange={e => setForm({ ...form, hekim: e.target.value })}>
              <option value="">Seç...</option>
              {HEKİMLER.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div style={s.fg}>
            <label style={s.lbl}>Durum</label>
            <select style={s.inp} value={form.durum || "Yapılmadı"} onChange={e => setForm({ ...form, durum: e.target.value })}>
              <option>Yapılmadı</option><option>Yapıldı</option>
            </select>
          </div>
        </>)}

        {sekme === "evrak" && (<>
          <div style={s.fg}>
            <label style={s.lbl}>Evrak Türü</label>
            <select style={s.inp} value={form.evrak_tur || ""} onChange={e => setForm({ ...form, evrak_tur: e.target.value })}>
              <option value="">Seç...</option>
              {EVRAK_TURLER.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={s.fg}>
            <label style={s.lbl}>Durum</label>
            <select style={s.inp} value={form.durum || "Beklemede"} onChange={e => setForm({ ...form, durum: e.target.value })}>
              {EVRAK_DURUMLAR.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </>)}

        <div style={s.fg}>
          <label style={s.lbl}>Not / Açıklama</label>
          <textarea style={{ ...s.inp, height: 80, resize: "none" }} placeholder="Notlarını buraya yaz..." value={form.aciklama || ""} onChange={e => setForm({ ...form, aciklama: e.target.value })} />
        </div>

        <div style={s.fg}>
          <label style={s.lbl}>Fotoğraf</label>
          <button style={s.medBtn} onClick={() => fotoRef.current.click()}>
            📷 {fotolar.length > 0 ? `${fotolar.length} fotoğraf seçildi` : "Fotoğraf Ekle"}
          </button>
          <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setFotolar(Array.from(e.target.files))} />
          {fotolar.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {fotolar.map((f, i) => <img key={i} src={URL.createObjectURL(f)} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} alt="" />)}
            </div>
          )}
        </div>

        <div style={s.fg}>
          <label style={s.lbl}>Ses Kaydı</label>
          {!sesURL ? (
            <button
              style={{ ...s.medBtn, borderColor: kayitYapiliyor ? "#EF4444" : "#334155", color: kayitYapiliyor ? "#EF4444" : "#94A3B8" }}
              onClick={kayitYapiliyor ? sesDur : sesBaslat}
            >
              {kayitYapiliyor ? `⏹ Durdur  ${fmtSure(kayitSure)}` : "🎙 Ses Kaydı Başlat"}
            </button>
          ) : (
            <div>
              <audio controls src={sesURL} style={{ width: "100%", marginTop: 4 }} />
              <button style={{ ...s.medBtn, marginTop: 6 }} onClick={() => { setSesBlob(null); setSesURL(null); }}>🗑 Ses Kaydını Sil</button>
            </div>
          )}
        </div>

        <button style={{ ...s.kaydetBtn, opacity: yukleniyor ? 0.7 : 1 }} onClick={kaydet} disabled={yukleniyor}>
          {yukleniyor ? "⏳ Kaydediliyor..." : "💾 Kaydet"}
        </button>
      </div>
    </div>
  );
}

function DetayModal({ kayit, onClose, onGuncelle, onSil }) {
  const [durum, setDurum] = useState(kayit.durum);
  const durumlar = kayit.tip === "fatura" ? FATURA_DURUMLAR : kayit.tip === "evrak" ? EVRAK_DURUMLAR : ["Yapılmadı", "Yapıldı"];

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalBaslik}>
          {kayit.musteri}
          <button style={s.kapat} onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ ...s.durumBadge, background: DURUM_RENK[kayit.durum] || "#6B7280", display: "inline-block" }}>{kayit.durum}</div>
        </div>

        {kayit.tip === "atama" && (kayit.uzman || kayit.hekim) && (
          <div style={s.infoKutu}>
            {kayit.uzman && <div style={s.infoSatir}><span style={s.infoEtk}>🔧 Uzman</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.uzman}</span></div>}
            {kayit.hekim && <div style={s.infoSatir}><span style={s.infoEtk}>🩺 Hekim</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.hekim}</span></div>}
          </div>
        )}
        {kayit.tip === "fatura" && kayit.tutar && (
          <div style={s.infoKutu}>
            <div style={s.infoSatir}><span style={s.infoEtk}>💸 Tutar</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.tutar}</span></div>
          </div>
        )}
        {kayit.tip === "evrak" && kayit.evrak_tur && (
          <div style={s.infoKutu}>
            <div style={s.infoSatir}><span style={s.infoEtk}>📋 Tür</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.evrak_tur}</span></div>
          </div>
        )}

        {kayit.aciklama && (
          <div style={s.notKutu}>
            <div style={s.notEtk}>NOTLAR</div>
            <p style={{ margin: 0, lineHeight: 1.7, color: "#D1D5DB", fontSize: 14 }}>{kayit.aciklama}</p>
          </div>
        )}

        {kayit.ses_kayd && (
          <div style={{ marginBottom: 16 }}>
            <div style={s.notEtk}>SES KAYDI</div>
            <audio controls src={kayit.ses_kayd} style={{ width: "100%", marginTop: 6 }} preload="metadata" />
          </div>
        )}

        {kayit.fotolar?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={s.notEtk}>FOTOĞRAFLAR ({kayit.fotolar.length})</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {kayit.fotolar.map((f, i) => (
                <img key={i} src={f} style={{ width: "calc(50% - 4px)", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} alt="" onClick={() => window.open(f, "_blank")} />
              ))}
            </div>
          </div>
        )}

        <div style={s.notEtk}>DURUMU GÜNCELLE</div>
        <div style={s.fg}>
          <select style={s.inp} value={durum} onChange={e => setDurum(e.target.value)}>
            {durumlar.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <button style={{ ...s.kaydetBtn, marginBottom: 12 }} onClick={() => onGuncelle(kayit.id, { durum })}>✓ Durumu Kaydet</button>

        <div style={s.notEtk}>EKLENME TARİHİ</div>
        <div style={{ color: "#64748B", fontSize: 13, marginBottom: 16 }}>{fmtTarih(kayit.created_at)}</div>

        <button style={s.silBtn} onClick={() => onSil(kayit.id)}>🗑️ Kaydı Sil</button>
      </div>
    </div>
  );
}

const s = {
  root: { background: "#0F172A", minHeight: "100vh", color: "#F8FAFC", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" },
  toast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", whiteSpace: "nowrap" },
  header: { background: "#1E293B", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: "2px solid #334155" },
  headerIco: { width: 40, height: 40, background: "#0EA5E9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  headerBaslik: { fontSize: 17, fontWeight: 700, letterSpacing: 1, color: "#F8FAFC" },
  headerAlt: { fontSize: 11, color: "#64748B" },
  sekmeler: { display: "flex", background: "#1E293B", borderBottom: "1px solid #334155" },
  sekmeBtn: { flex: 1, padding: "12px 4px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 },
  sekmeBtnAktif: { color: "#0EA5E9", borderBottom: "2px solid #0EA5E9" },
  badge: { background: "#0EA5E9", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 6px" },
  liste: { flex: 1, padding: "12px 12px 80px" },
  bos: { textAlign: "center", padding: "60px 20px", color: "#64748B" },
  kart: { background: "#1E293B", borderRadius: 10, padding: 14, marginBottom: 10, cursor: "pointer", border: "1px solid #334155" },
  kartUst: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  kartMusteri: { fontSize: 16, fontWeight: 700, color: "#F8FAFC", flex: 1, marginRight: 8 },
  durumBadge: { color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" },
  kartAlt: { display: "flex", gap: 12, fontSize: 12, color: "#94A3B8", marginBottom: 4, flexWrap: "wrap" },
  kartNot: { color: "#64748B", fontSize: 12, marginTop: 4, lineHeight: 1.4 },
  kartMeta: { display: "flex", gap: 10, fontSize: 11, color: "#475569", marginTop: 6, flexWrap: "wrap" },
  fabBtn: { position: "fixed", bottom: 24, right: "max(16px, calc(50% - 224px))", width: 56, height: 56, background: "#0EA5E9", border: "none", borderRadius: "50%", color: "#fff", fontSize: 32, cursor: "pointer", boxShadow: "0 4px 20px rgba(14,165,233,0.5)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "#1E293B", borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" },
  modalBaslik: { fontSize: 17, fontWeight: 700, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" },
  kapat: { background: "none", border: "none", color: "#64748B", fontSize: 20, cursor: "pointer", padding: 4 },
  fg: { marginBottom: 14, position: "relative" },
  lbl: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" },
  inp: { width: "100%", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#F8FAFC", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  oneriKutu: { position: "absolute", top: "100%", left: 0, right: 0, background: "#0F172A", border: "1px solid #334155", borderRadius: "0 0 8px 8px", zIndex: 100 },
  oneriItem: { padding: "10px 12px", cursor: "pointer", fontSize: 14, borderTop: "1px solid #1E293B", color: "#94A3B8" },
  medBtn: { width: "100%", background: "#0F172A", border: "1px dashed #334155", borderRadius: 8, padding: 12, color: "#94A3B8", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  kaydetBtn: { width: "100%", background: "#0EA5E9", border: "none", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 },
  silBtn: { width: "100%", background: "transparent", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  infoKutu: { background: "#0F172A", borderRadius: 8, padding: 12, marginBottom: 14 },
  infoSatir: { display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0" },
  infoEtk: { minWidth: 70, color: "#64748B", fontSize: 12, fontWeight: 600, paddingTop: 1 },
  notKutu: { background: "#0F172A", borderRadius: 8, padding: 12, marginBottom: 14, borderLeft: "3px solid #0EA5E9" },
  notEtk: { fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" },
};
