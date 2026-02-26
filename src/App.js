import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const UZMANLAR = ["Ertuğrul GÜNEY (C Sınıfı İGU)", "Yavuz CANPOLAT (A Sınıfı İGU)"];
const HEKİMLER = ["Fahri Gurur POLAT", "Zehra Esra TEMELTAŞ"];
const KİŞİLER = ["Berke", "Bahadır", "Bora", "Şafak", "Akad", "Semra"];
const FATURA_DURUMLAR = ["Kesilecek", "Kesildi", "Eksik Kesildi", "Düzeltilecek", "Tamamlandı"];
const EVRAK_TURLER = ["Eksik Evrak", "Hatalı Evrak", "Güncellenmesi Gereken", "İmza Eksik", "Diğer"];
const EVRAK_DURUMLAR = ["Beklemede", "İşlemde", "Tamamlandı"];

const TURUNCU = "#E85C0D";
const TURUNCU_KOYU = "#C14B0A";
const TURUNCU_ACIK = "#FF7A3020";

const DURUM_RENK = {
  "Kesilecek": "#6B7280", "Kesildi": "#3B82F6", "Eksik Kesildi": "#EF4444",
  "Düzeltilecek": "#F59E0B", "Tamamlandı": "#10B981",
  "Beklemede": "#6B7280", "İşlemde": "#F59E0B",
  "Yapılmadı": "#EF4444", "Yapıldı": "#10B981",
};

const LOGO = "data:image/png;base64,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";

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

export default function App() {
  const [sekme, setSekme] = useState("fatura");
  const [kayitlar, setKayitlar] = useState([]);
  const [modal, setModal] = useState(null);
  const [secili, setSecili] = useState(null);
  const [tamamlananAcik, setTamamlananAcik] = useState(false);
  const [toast, setToast] = useState(null);

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

  const aktifKayitlar = kayitlar.filter(k => k.tip === sekme && !k.tamamlandi);
  const tamamlananlar = kayitlar.filter(k => k.tamamlandi);

  return (
    <div style={s.root}>
      {toast && <div style={{ ...s.toast, background: toast.tip === "hata" ? "#EF4444" : "#10B981" }}>{toast.msg}</div>}

      <div style={s.header}>
        <img src={LOGO} alt="Pragmatik" style={{ height: 32, objectFit: "contain" }} />
        <div style={{ flex: 1, marginLeft: 10 }}>
          <div style={s.headerBaslik}>ISG TAKİP</div>
          <div style={s.headerAlt}>İş Sağlığı ve Güvenliği Yönetimi</div>
        </div>
        <button style={s.tamamlananBtn} onClick={() => setTamamlananAcik(true)}>
          ✅ <span style={{ fontSize: 11 }}>{tamamlananlar.length}</span>
        </button>
      </div>

      <div style={s.sekmeler}>
        {[{ id: "fatura", label: "💰 Fatura" }, { id: "atama", label: "👤 Atama" }, { id: "evrak", label: "📁 Evrak" }].map(tab => {
          const count = kayitlar.filter(k => k.tip === tab.id && !k.tamamlandi).length;
          return (
            <button key={tab.id} style={{ ...s.sekmeBtn, ...(sekme === tab.id ? s.sekmeBtnAktif : {}) }} onClick={() => setSekme(tab.id)}>
              {tab.label} {count > 0 && <span style={s.badge}>{count}</span>}
            </button>
          );
        })}
      </div>

      <div style={s.liste}>
        {aktifKayitlar.length === 0 && (
          <div style={s.bos}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{sekme === "fatura" ? "💰" : sekme === "atama" ? "👤" : "📁"}</div>
            <div>Henüz kayıt yok</div>
            <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Sağ alttaki + ile ekle</div>
          </div>
        )}
        {aktifKayitlar.map(k => (
          <KayitKart key={k.id} kayit={k}
            onDetay={() => { setSecili(k); setModal("detay"); }}
            onTamamla={() => guncelle(k.id, { tamamlandi: true })}
            onKisiAta={(kisi) => guncelle(k.id, { atanan_kisi: kisi })}
            onDuzenle={() => { setSecili(k); setModal("duzenle"); }}
          />
        ))}
      </div>

      <button style={s.fabBtn} onClick={() => setModal("ekle")}>+</button>

      {modal === "ekle" && <EkleModal sekme={sekme} onClose={() => setModal(null)} showToast={showToast} onYukle={yukle} />}
      {modal === "detay" && secili && <DetayModal kayit={secili} onClose={() => { setModal(null); setSecili(null); }} onGuncelle={guncelle} onSil={sil} onYukle={yukle} showToast={showToast} />}
      {modal === "duzenle" && secili && <DuzenleModal kayit={secili} onClose={() => { setModal(null); setSecili(null); }} onYukle={yukle} showToast={showToast} />}
      {tamamlananAcik && <TamamlananlarModal kayitlar={tamamlananlar} onClose={() => setTamamlananAcik(false)} onGeriAl={(id) => guncelle(id, { tamamlandi: false })} onSil={sil} />}
    </div>
  );
}

// ─── KAYDIRMA KARTI ──────────────────────────────────────────
function KayitKart({ kayit, onDetay, onTamamla, onKisiAta, onDuzenle }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [kisiMenuAcik, setKisiMenuAcik] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDrag = useRef(false);
  const ESIK = 60;

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDrag.current = false;
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!isDrag.current && Math.abs(dy) > Math.abs(dx)) { setDragging(false); return; }
    if (Math.abs(dx) > 8) { isDrag.current = true; e.preventDefault(); }
    if (!isDrag.current) return;
    setOffset(Math.max(-160, Math.min(120, dx)));
  };

  const onTouchEnd = () => {
    setDragging(false);
    if (offset < -ESIK) setOffset(-160);
    else if (offset > ESIK) setOffset(120);
    else setOffset(0);
  };

  const kapat = () => { setOffset(0); setKisiMenuAcik(false); };

  return (
    <div style={{ position: "relative", marginBottom: 10, borderRadius: 10, overflow: "visible" }}>
      {/* ARKA BUTONLAR */}
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-between", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ background: "#3B82F6", width: 120, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: "10px 0 0 10px" }}
          onClick={() => { kapat(); onDuzenle(); }}>
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 22 }}>✏️</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>Düzenle</div>
          </div>
        </div>
        <div style={{ display: "flex", width: 160 }}>
          <div style={{ background: "#8B5CF6", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onClick={() => setKisiMenuAcik(v => !v)}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 22 }}>👤</div>
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>Kişi Ata</div>
            </div>
          </div>
          <div style={{ background: "#10B981", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: "0 10px 10px 0" }}
            onClick={() => { kapat(); onTamamla(); }}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 22 }}>✅</div>
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>Tamamla</div>
            </div>
          </div>
        </div>
      </div>

      {/* KİŞİ MENÜSÜ */}
      {kisiMenuAcik && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#1E293B", border: "1px solid #E85C0D40", borderRadius: 10, zIndex: 200, minWidth: 150, boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }}>
          {KİŞİLER.map(k => (
            <div key={k} style={{ padding: "11px 16px", cursor: "pointer", color: kayit.atanan_kisi === k ? "#E85C0D" : "#F8FAFC", fontSize: 14, borderBottom: "1px solid #334155", fontWeight: kayit.atanan_kisi === k ? 700 : 400, display: "flex", alignItems: "center", gap: 8 }}
              onClick={() => { onKisiAta(kayit.atanan_kisi === k ? null : k); setKisiMenuAcik(false); kapat(); }}>
              {kayit.atanan_kisi === k ? "✓ " : "  "}{k}
            </div>
          ))}
          <div style={{ padding: "10px 16px", cursor: "pointer", color: "#EF4444", fontSize: 13 }}
            onClick={() => { onKisiAta(null); setKisiMenuAcik(false); kapat(); }}>
            Kişiyi Kaldır
          </div>
        </div>
      )}

      {/* KART */}
      <div
        style={{ ...s.kart, marginBottom: 0, transform: "translateX(" + offset + "px)", transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)", position: "relative", zIndex: 1, userSelect: "none" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (Math.abs(offset) < 10 && !kisiMenuAcik) onDetay(); }}
      >
        {kayit.atanan_kisi && (
          <div style={s.ustlenildiEtiket}>👤 {kayit.atanan_kisi} üstlendi</div>
        )}
        <div style={s.kartUst}>
          <div style={s.kartMusteri}>{kayit.musteri}</div>
          <div style={{ ...s.durumBadge, background: DURUM_RENK[kayit.durum] || "#6B7280" }}>{kayit.durum}</div>
        </div>
        {kayit.tip === "atama" && (
          <div style={s.kartAlt}>
            {kayit.uzman && <span>🔧 {kayit.uzman.split("(")[0].trim()}</span>}
            {kayit.hekim && <span>🩺 {kayit.hekim}</span>}
          </div>
        )}
        {kayit.tip === "fatura" && kayit.tutar && <div style={s.kartAlt}><span>💸 {kayit.tutar}</span></div>}
        {kayit.tip === "evrak" && kayit.evrak_tur && <div style={s.kartAlt}><span>📋 {kayit.evrak_tur}</span></div>}
        {kayit.aciklama && <div style={s.kartNot}>{kayit.aciklama.slice(0, 70)}{kayit.aciklama.length > 70 ? "..." : ""}</div>}
        <div style={s.kartMeta}>
          {kayit.fotolar?.length > 0 && <span>📷 {kayit.fotolar.length}</span>}
          {kayit.ses_kayd && <span>🎙 Ses</span>}
          <span>{fmtTarih(kayit.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── DETAY MODAL ─────────────────────────────────────────────
function DetayModal({ kayit, onClose, onGuncelle, onSil, onYukle, showToast }) {
  const [durum, setDurum] = useState(kayit.durum);
  const [yukleniyor, setYukleniyor] = useState(false);
  const fotoRef = useRef();
  const durumlar = kayit.tip === "fatura" ? FATURA_DURUMLAR : kayit.tip === "evrak" ? EVRAK_DURUMLAR : ["Yapılmadı", "Yapıldı"];

  const fotoSil = async (url) => {
    const yeni = (kayit.fotolar || []).filter(f => f !== url);
    await supabase.from("isler").update({ fotolar: yeni }).eq("id", kayit.id);
    showToast("Fotoğraf silindi");
    onYukle(); onClose();
  };

  const fotoEkle = async (e) => {
    const dosyalar = Array.from(e.target.files);
    if (!dosyalar.length) return;
    setYukleniyor(true);
    const urls = [...(kayit.fotolar || [])];
    for (const f of dosyalar) {
      const ad = Date.now() + "_" + Math.random().toString(36).slice(2) + "_" + f.name;
      const { error } = await supabase.storage.from("fotolar").upload(ad, f);
      if (!error) { const { data } = supabase.storage.from("fotolar").getPublicUrl(ad); urls.push(data.publicUrl); }
    }
    await supabase.from("isler").update({ fotolar: urls }).eq("id", kayit.id);
    showToast("Fotoğraf eklendi ✓");
    setYukleniyor(false); onYukle(); onClose();
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalBaslik}>{kayit.musteri}<button style={s.kapat} onClick={onClose}>✕</button></div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ ...s.durumBadge, background: DURUM_RENK[kayit.durum] || "#6B7280", display: "inline-block" }}>{kayit.durum}</div>
          {kayit.atanan_kisi && <span style={{ ...s.ustlenildiEtiket, display: "inline-block", marginLeft: 8 }}>👤 {kayit.atanan_kisi}</span>}
        </div>
        {kayit.tip === "atama" && (kayit.uzman || kayit.hekim) && (
          <div style={s.infoKutu}>
            {kayit.uzman && <div style={s.infoSatir}><span style={s.infoEtk}>🔧 Uzman</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.uzman}</span></div>}
            {kayit.hekim && <div style={s.infoSatir}><span style={s.infoEtk}>🩺 Hekim</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.hekim}</span></div>}
          </div>
        )}
        {kayit.tip === "fatura" && kayit.tutar && (
          <div style={s.infoKutu}><div style={s.infoSatir}><span style={s.infoEtk}>💸 Tutar</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.tutar}</span></div></div>
        )}
        {kayit.tip === "evrak" && kayit.evrak_tur && (
          <div style={s.infoKutu}><div style={s.infoSatir}><span style={s.infoEtk}>📋 Tür</span><span style={{ color: "#CBD5E1", fontSize: 14 }}>{kayit.evrak_tur}</span></div></div>
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
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={s.notEtk}>FOTOĞRAFLAR {kayit.fotolar?.length > 0 ? "(" + kayit.fotolar.length + ")" : ""}</div>
            <button style={{ background: TURUNCU, border: "none", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }} onClick={() => fotoRef.current.click()}>
              {yukleniyor ? "⏳" : "+ Ekle"}
            </button>
            <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={fotoEkle} />
          </div>
          {kayit.fotolar?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kayit.fotolar.map((f, i) => (
                <div key={i} style={{ position: "relative", width: "calc(50% - 4px)" }}>
                  <img src={f} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} alt="" onClick={() => window.open(f, "_blank")} />
                  <button onClick={() => fotoSil(f)} style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.75)", border: "none", color: "#fff", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
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

// ─── DÜZENLE MODAL ───────────────────────────────────────────
function DuzenleModal({ kayit, onClose, onYukle, showToast }) {
  const [form, setForm] = useState({
    musteri: kayit.musteri || "", durum: kayit.durum || "",
    aciklama: kayit.aciklama || "", tutar: kayit.tutar || "",
    uzman: kayit.uzman || "", hekim: kayit.hekim || "", evrak_tur: kayit.evrak_tur || "",
  });
  const [yukleniyor, setYukleniyor] = useState(false);
  const durumlar = kayit.tip === "fatura" ? FATURA_DURUMLAR : kayit.tip === "evrak" ? EVRAK_DURUMLAR : ["Yapılmadı", "Yapıldı"];

  const kaydet = async () => {
    if (!form.musteri.trim()) { showToast("Müşteri adı zorunlu!", "hata"); return; }
    setYukleniyor(true);
    const { error } = await supabase.from("isler").update({
      musteri: form.musteri.trim(), durum: form.durum, aciklama: form.aciklama || null,
      tutar: form.tutar || null, uzman: form.uzman || null, hekim: form.hekim || null, evrak_tur: form.evrak_tur || null,
    }).eq("id", kayit.id);
    setYukleniyor(false);
    if (error) { showToast("Hata: " + error.message, "hata"); return; }
    showToast("Güncellendi ✓"); onYukle(); onClose();
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && !yukleniyor && onClose()}>
      <div style={s.modal}>
        <div style={s.modalBaslik}>✏️ İşi Düzenle<button style={s.kapat} onClick={onClose}>✕</button></div>
        <div style={s.fg}><label style={s.lbl}>Müşteri Adı</label><input style={s.inp} value={form.musteri} onChange={e => setForm({ ...form, musteri: e.target.value })} /></div>
        <div style={s.fg}><label style={s.lbl}>Durum</label>
          <select style={s.inp} value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
            {durumlar.map(d => <option key={d}>{d}</option>)}</select></div>
        {kayit.tip === "fatura" && <div style={s.fg}><label style={s.lbl}>Tutar</label><input style={s.inp} value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })} placeholder="Örn: 1500+KDV" /></div>}
        {kayit.tip === "atama" && (<>
          <div style={s.fg}><label style={s.lbl}>İSG Uzmanı</label>
            <select style={s.inp} value={form.uzman} onChange={e => setForm({ ...form, uzman: e.target.value })}>
              <option value="">Seç...</option>{UZMANLAR.map(u => <option key={u}>{u}</option>)}</select></div>
          <div style={s.fg}><label style={s.lbl}>İşyeri Hekimi</label>
            <select style={s.inp} value={form.hekim} onChange={e => setForm({ ...form, hekim: e.target.value })}>
              <option value="">Seç...</option>{HEKİMLER.map(h => <option key={h}>{h}</option>)}</select></div>
        </>)}
        {kayit.tip === "evrak" && <div style={s.fg}><label style={s.lbl}>Evrak Türü</label>
          <select style={s.inp} value={form.evrak_tur} onChange={e => setForm({ ...form, evrak_tur: e.target.value })}>
            <option value="">Seç...</option>{EVRAK_TURLER.map(t => <option key={t}>{t}</option>)}</select></div>}
        <div style={s.fg}><label style={s.lbl}>Not / Açıklama</label>
          <textarea style={{ ...s.inp, height: 80, resize: "none" }} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} /></div>
        <button style={{ ...s.kaydetBtn, opacity: yukleniyor ? 0.7 : 1 }} onClick={kaydet} disabled={yukleniyor}>
          {yukleniyor ? "⏳ Kaydediliyor..." : "💾 Güncelle"}</button>
      </div>
    </div>
  );
}

// ─── TAMAMLANANLAR ───────────────────────────────────────────
function TamamlananlarModal({ kayitlar, onClose, onGeriAl, onSil }) {
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modal, maxHeight: "85vh" }}>
        <div style={s.modalBaslik}>✅ Tamamlanan İşler ({kayitlar.length})<button style={s.kapat} onClick={onClose}>✕</button></div>
        {kayitlar.length === 0 && <div style={{ textAlign: "center", color: "#64748B", padding: "40px 0" }}>Henüz tamamlanan iş yok</div>}
        {kayitlar.map(k => (
          <div key={k.id} style={{ ...s.kart, marginBottom: 10, opacity: 0.85 }}>
            <div style={s.kartUst}>
              <div style={{ ...s.kartMusteri, textDecoration: "line-through", color: "#64748B" }}>{k.musteri}</div>
              <div style={{ ...s.durumBadge, background: "#10B981" }}>✓ Tamamlandı</div>
            </div>
            {k.aciklama && <div style={s.kartNot}>{k.aciklama.slice(0, 60)}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={{ flex: 1, background: "#334155", border: "none", color: "#94A3B8", padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer" }} onClick={() => onGeriAl(k.id)}>↩ Geri Al</button>
              <button style={{ flex: 1, background: "transparent", border: "1px solid #EF4444", color: "#EF4444", padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer" }} onClick={() => onSil(k.id)}>🗑 Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EKLE MODAL ──────────────────────────────────────────────
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
      setSesMimeType(format.mimeType); setSesExt(format.ext);
      const options = MediaRecorder.isTypeSupported(format.mimeType) ? { mimeType: format.mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: format.mimeType });
        setSesBlob(blob); setSesURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
      };
      recorder.start(100);
      mediaRef.current = recorder;
      setKayitYapiliyor(true); setKayitSure(0);
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
      const { error } = await supabase.from("isler").insert({
        tip: sekme, musteri: musteri.trim(), durum: form.durum,
        aciklama: form.aciklama || null, tutar: form.tutar || null,
        uzman: form.uzman || null, hekim: form.hekim || null, evrak_tur: form.evrak_tur || null,
        fotolar: fotoURLler.length > 0 ? fotoURLler : null, ses_kayd: sesKaydURL,
      });
      if (error) { showToast("Hata: " + error.message, "hata"); setYukleniyor(false); return; }
      addMusteriGecmis(musteri.trim());
      showToast("Kayıt eklendi ✓"); onYukle(); setYukleniyor(false); onClose();
    } catch (e) { showToast("Hata: " + e.message, "hata"); setYukleniyor(false); }
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && !yukleniyor && onClose()}>
      <div style={s.modal}>
        <div style={s.modalBaslik}>
          {sekme === "fatura" ? "💰 Yeni Fatura" : sekme === "atama" ? "👤 Yeni Atama" : "📁 Yeni Evrak"}
          {!yukleniyor && <button style={s.kapat} onClick={onClose}>✕</button>}
        </div>
        <div style={s.fg}>
          <label style={s.lbl}>Müşteri Adı *</label>
          <input style={s.inp} placeholder="Firma adı yaz..." value={musteri} onChange={e => musteriDegis(e.target.value)} autoComplete="off" />
          {oneri.length > 0 && <div style={s.oneriKutu}>{oneri.map(m => <div key={m} style={s.oneriItem} onClick={() => { setMusteri(m); setOneri([]); }}>{m}</div>)}</div>}
        </div>
        {sekme === "fatura" && (<>
          <div style={s.fg}><label style={s.lbl}>Fatura Durumu</label>
            <select style={s.inp} value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
              {FATURA_DURUMLAR.map(d => <option key={d}>{d}</option>)}</select></div>
          <div style={s.fg}><label style={s.lbl}>Tutar</label>
            <input style={s.inp} type="text" placeholder="Örn: 1500+KDV" value={form.tutar || ""} onChange={e => setForm({ ...form, tutar: e.target.value })} /></div>
        </>)}
        {sekme === "atama" && (<>
          <div style={s.fg}><label style={s.lbl}>İSG Uzmanı</label>
            <select style={s.inp} value={form.uzman || ""} onChange={e => setForm({ ...form, uzman: e.target.value })}>
              <option value="">Seç...</option>{UZMANLAR.map(u => <option key={u}>{u}</option>)}</select></div>
          <div style={s.fg}><label style={s.lbl}>İşyeri Hekimi</label>
            <select style={s.inp} value={form.hekim || ""} onChange={e => setForm({ ...form, hekim: e.target.value })}>
              <option value="">Seç...</option>{HEKİMLER.map(h => <option key={h}>{h}</option>)}</select></div>
          <div style={s.fg}><label style={s.lbl}>Durum</label>
            <select style={s.inp} value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
              <option>Yapılmadı</option><option>Yapıldı</option></select></div>
        </>)}
        {sekme === "evrak" && (<>
          <div style={s.fg}><label style={s.lbl}>Evrak Türü</label>
            <select style={s.inp} value={form.evrak_tur || ""} onChange={e => setForm({ ...form, evrak_tur: e.target.value })}>
              <option value="">Seç...</option>{EVRAK_TURLER.map(t => <option key={t}>{t}</option>)}</select></div>
          <div style={s.fg}><label style={s.lbl}>Durum</label>
            <select style={s.inp} value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
              {EVRAK_DURUMLAR.map(d => <option key={d}>{d}</option>)}</select></div>
        </>)}
        <div style={s.fg}><label style={s.lbl}>Not / Açıklama</label>
          <textarea style={{ ...s.inp, height: 80, resize: "none" }} value={form.aciklama || ""} onChange={e => setForm({ ...form, aciklama: e.target.value })} /></div>
        <div style={s.fg}>
          <label style={s.lbl}>Fotoğraf</label>
          <button style={s.medBtn} onClick={() => fotoRef.current.click()}>📷 {fotolar.length > 0 ? fotolar.length + " seçildi" : "Fotoğraf Ekle"}</button>
          <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setFotolar(Array.from(e.target.files))} />
          {fotolar.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>{fotolar.map((f, i) => <img key={i} src={URL.createObjectURL(f)} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} alt="" />)}</div>}
        </div>
        <div style={s.fg}>
          <label style={s.lbl}>Ses Kaydı</label>
          {!sesURL ? (
            <button style={{ ...s.medBtn, borderColor: kayitYapiliyor ? "#EF4444" : "#334155", color: kayitYapiliyor ? "#EF4444" : "#94A3B8" }} onClick={kayitYapiliyor ? sesDur : sesBaslat}>
              {kayitYapiliyor ? "⏹ Durdur  " + fmtSure(kayitSure) : "🎙 Ses Kaydı Başlat"}
            </button>
          ) : (
            <div>
              <audio controls src={sesURL} style={{ width: "100%", marginTop: 4 }} />
              <button style={{ ...s.medBtn, marginTop: 6 }} onClick={() => { setSesBlob(null); setSesURL(null); }}>🗑 Sil</button>
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

const s = {
  root: { background: "#0F172A", minHeight: "100vh", color: "#F8FAFC", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" },
  toast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", color: "#fff", padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", whiteSpace: "nowrap" },
  header: { background: "#1A1A1A", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "2px solid #E85C0D" },
  headerBaslik: { fontSize: 15, fontWeight: 700, letterSpacing: 1, color: "#F8FAFC" },
  headerAlt: { fontSize: 10, color: "#64748B" },
  tamamlananBtn: { background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 4 },
  sekmeler: { display: "flex", background: "#1A1A1A", borderBottom: "1px solid #2A2A2A" },
  sekmeBtn: { flex: 1, padding: "12px 4px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 },
  sekmeBtnAktif: { color: "#E85C0D", borderBottom: "2px solid #E85C0D" },
  badge: { background: "#E85C0D", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 6px" },
  liste: { flex: 1, padding: "12px 12px 80px" },
  bos: { textAlign: "center", padding: "60px 20px", color: "#64748B" },
  kart: { background: "#1E293B", borderRadius: 10, padding: 14, cursor: "pointer", border: "1px solid #E85C0D30" },
  kartUst: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  kartMusteri: { fontSize: 16, fontWeight: 700, color: "#F8FAFC", flex: 1, marginRight: 8 },
  durumBadge: { color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" },
  kartAlt: { display: "flex", gap: 12, fontSize: 12, color: "#94A3B8", marginBottom: 4, flexWrap: "wrap" },
  kartNot: { color: "#64748B", fontSize: 12, marginTop: 4, lineHeight: 1.4 },
  kartMeta: { display: "flex", gap: 10, fontSize: 11, color: "#475569", marginTop: 6, flexWrap: "wrap" },
  ustlenildiEtiket: { background: "#E85C0D15", border: "1px solid #E85C0D40", color: "#E85C0D", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, marginBottom: 6 },
  fabBtn: { position: "fixed", bottom: 24, right: "max(16px, calc(50% - 224px))", width: 56, height: 56, background: "#E85C0D", border: "none", borderRadius: "50%", color: "#fff", fontSize: 32, cursor: "pointer", boxShadow: "0 4px 24px rgba(232,92,13,0.6)", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, zIndex: 500 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "#1A1A1A", borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", borderTop: "2px solid #E85C0D" },
  modalBaslik: { fontSize: 17, fontWeight: 700, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" },
  kapat: { background: "none", border: "none", color: "#64748B", fontSize: 20, cursor: "pointer", padding: 4 },
  fg: { marginBottom: 14, position: "relative" },
  lbl: { display: "block", fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" },
  inp: { width: "100%", background: "#0F172A", border: "1px solid #E85C0D30", borderRadius: 8, padding: "10px 12px", color: "#F8FAFC", fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  oneriKutu: { position: "absolute", top: "100%", left: 0, right: 0, background: "#0F172A", border: "1px solid #E85C0D30", borderRadius: "0 0 8px 8px", zIndex: 100 },
  oneriItem: { padding: "10px 12px", cursor: "pointer", fontSize: 14, borderTop: "1px solid #1E293B", color: "#94A3B8" },
  medBtn: { width: "100%", background: "#0F172A", border: "1px dashed #E85C0D40", borderRadius: 8, padding: 12, color: "#94A3B8", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  kaydetBtn: { width: "100%", background: "#E85C0D", border: "none", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 },
  silBtn: { width: "100%", background: "transparent", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  infoKutu: { background: "#0F172A", borderRadius: 8, padding: 12, marginBottom: 14, borderLeft: "2px solid #E85C0D" },
  infoSatir: { display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0" },
  infoEtk: { minWidth: 70, color: "#64748B", fontSize: 12, fontWeight: 600, paddingTop: 1 },
  notKutu: { background: "#0F172A", borderRadius: 8, padding: 12, marginBottom: 14, borderLeft: "3px solid #E85C0D" },
  notEtk: { fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" },
};
