import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const UZMANLAR = ["Ertuğrul GÜNEY (C Sınıfı İGU)", "Yavuz CANPOLAT (A Sınıfı İGU)"];
const HEKİMLER = ["Fahri Gurur POLAT", "Zehra Esra TEMELTAŞ"];
const KİŞİLER = ["Berke", "Bahadır", "Bora", "Şafak", "Akad", "Semra"];
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
        <div style={s.headerIco}>🦺</div>
        <div style={{ flex: 1 }}>
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
          <KayitKart key={k.id} kayit={k} onDetay={() => { setSecili(k); setModal("detay"); }}
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
      {tamamlananAcik && <TamamlananlarModal kayitlar={tamamlananlar} onClose={() => setTamamlananAcik(false)} onGeriAl={(id) => { guncelle(id, { tamamlandi: false }); }} onSil={sil} />}
    </div>
  );
}

// ─── KAYDIRMA KARTI ─────────────────────────────────────────
function KayitKart({ kayit, onDetay, onTamamla, onKisiAta, onDuzenle }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const [kisiMenuAcik, setKisiMenuAcik] = useState(false);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setDragging(true); };
  const onTouchMove = (e) => {
    if (!dragging) return;
    const diff = e.touches[0].clientX - startX.current;
    setOffset(Math.max(-160, Math.min(120, diff)));
  };
  const onTouchEnd = () => {
    setDragging(false);
    if (offset < -80) setOffset(-160);
    else if (offset > 60) setOffset(120);
    else setOffset(0);
  };

  const kapat = () => setOffset(0);

  return (
    <div style={{ position: "relative", marginBottom: 10, borderRadius: 10, overflow: "hidden" }}>
      {/* ARKA PLAN BUTONLAR */}
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "space-between", borderRadius: 10 }}>
        {/* SAĞ TARAF - Düzenle */}
        <div style={{ background: "#3B82F6", width: 120, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: "10px 0 0 10px" }}
          onClick={() => { kapat(); onDuzenle(); }}>
          <div style={{ textAlign: "center", color: "#fff" }}>
            <div style={{ fontSize: 20 }}>✏️</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>Düzenle</div>
          </div>
        </div>
        {/* SOL TARAF - Tamamla + Ata */}
        <div style={{ display: "flex", width: 160 }}>
          <div style={{ background: "#8B5CF6", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
            onClick={() => { setKisiMenuAcik(!kisiMenuAcik); }}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 20 }}>👤</div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>Kişi Ata</div>
            </div>
          </div>
          <div style={{ background: "#10B981", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: "0 10px 10px 0" }}
            onClick={() => { kapat(); onTamamla(); }}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 20 }}>✅</div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>Tamamla</div>
            </div>
          </div>
        </div>
      </div>

      {/* KİŞİ MENÜSÜ */}
      {kisiMenuAcik && (
        <div style={{ position: "absolute", right: 0, top: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, zIndex: 100, minWidth: 140, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
          {KİŞİLER.map(k => (
            <div key={k} style={{ padding: "10px 14px", cursor: "pointer", color: "#F8FAFC", fontSize: 14, borderBottom: "1px solid #334155" }}
              onClick={() => { onKisiAta(kayit.atanan_kisi === k ? null : k); setKisiMenuAcik(false); kapat(); }}>
              {kayit.atanan_kisi === k ? "✓ " : ""}{k}
            </div>
          ))}
          <div style={{ padding: "10px 14px", cursor: "pointer", color: "#EF4444", fontSize: 13 }}
            onClick={() => { onKisiAta(null); setKisiMenuAcik(false); kapat(); }}>
            Kişiyi Kaldır
          </div>
        </div>
      )}

      {/* KART */}
      <div style={{ ...s.kart, marginBottom: 0, transform: `translateX(${offset}px)`, transition: dragging ? "none" : "transform 0.2s", position: "relative", zIndex: 1 }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={() => { if (offset === 0) onDetay(); }}>

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
  const [yeniFotolar, setYeniFotolar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const fotoRef = useRef();
  const durumlar = kayit.tip === "fatura" ? FATURA_DURUMLAR : kayit.tip === "evrak" ? EVRAK_DURUMLAR : ["Yapılmadı", "Yapıldı"];

  const fotoSil = async (url) => {
    const yeniFotoList = (kayit.fotolar || []).filter(f => f !== url);
    await supabase.from("isler").update({ fotolar: yeniFotoList }).eq("id", kayit.id);
    showToast("Fotoğraf silindi");
    onYukle();
    onClose();
  };

  const fotoEkle = async (e) => {
    const dosyalar = Array.from(e.target.files);
    if (!dosyalar.length) return;
    setYukleniyor(true);
    const urls = [...(kayit.fotolar || [])];
    for (const f of dosyalar) {
      const ad = `${Date.now()}_${Math.random().toString(36).slice(2)}_${f.name}`;
      const { error } = await supabase.storage.from("fotolar").upload(ad, f);
      if (!error) {
        const { data } = supabase.storage.from("fotolar").getPublicUrl(ad);
        urls.push(data.publicUrl);
      }
    }
    await supabase.from("isler").update({ fotolar: urls }).eq("id", kayit.id);
    showToast("Fotoğraf eklendi ✓");
    setYukleniyor(false);
    onYukle();
    onClose();
  };

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.modalBaslik}>{kayit.musteri}<button style={s.kapat} onClick={onClose}>✕</button></div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ ...s.durumBadge, background: DURUM_RENK[kayit.durum] || "#6B7280", display: "inline-block" }}>{kayit.durum}</div>
          {kayit.atanan_kisi && <div style={{ ...s.ustlenildiEtiket, display: "inline-block", marginLeft: 8 }}>👤 {kayit.atanan_kisi}</div>}
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

        {/* FOTOĞRAFLAR */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={s.notEtk}>FOTOĞRAFLAR {kayit.fotolar?.length > 0 ? `(${kayit.fotolar.length})` : ""}</div>
            <button style={{ background: "#0EA5E9", border: "none", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 12, cursor: "pointer" }} onClick={() => fotoRef.current.click()}>
              {yukleniyor ? "⏳" : "+ Fotoğraf Ekle"}
            </button>
            <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={fotoEkle} />
          </div>
          {kayit.fotolar?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {kayit.fotolar.map((f, i) => (
                <div key={i} style={{ position: "relative", width: "calc(50% - 4px)" }}>
                  <img src={f} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 8, cursor: "pointer" }} alt="" onClick={() => window.open(f, "_blank")} />
                  <button onClick={() => fotoSil(f)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", width: 24, height: 24, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
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
    musteri: kayit.musteri || "",
    durum: kayit.durum || "",
    aciklama: kayit.aciklama || "",
    tutar: kayit.tutar || "",
    uzman: kayit.uzman || "",
    hekim: kayit.hekim || "",
    evrak_tur: kayit.evrak_tur || "",
  });
  const [yukleniyor, setYukleniyor] = useState(false);

  const kaydet = async () => {
    if (!form.musteri.trim()) { showToast("Müşteri adı zorunlu!", "hata"); return; }
    setYukleniyor(true);
    const { error } = await supabase.from("isler").update({
      musteri: form.musteri.trim(),
      durum: form.durum,
      aciklama: form.aciklama || null,
      tutar: form.tutar || null,
      uzman: form.uzman || null,
      hekim: form.hekim || null,
      evrak_tur: form.evrak_tur || null,
    }).eq("id", kayit.id);
    setYukleniyor(false);
    if (error) { showToast("Hata: " + error.message, "hata"); return; }
    showToast("Güncellendi ✓");
    onYukle();
    onClose();
  };

  const durumlar = kayit.tip === "fatura" ? FATURA_DURUMLAR : kayit.tip === "evrak" ? EVRAK_DURUMLAR : ["Yapılmadı", "Yapıldı"];

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && !yukleniyor && onClose()}>
      <div style={s.modal}>
        <div style={s.modalBaslik}>✏️ İşi Düzenle<button style={s.kapat} onClick={onClose}>✕</button></div>

        <div style={s.fg}>
          <label style={s.lbl}>Müşteri Adı</label>
          <input style={s.inp} value={form.musteri} onChange={e => setForm({ ...form, musteri: e.target.value })} />
        </div>
        <div style={s.fg}>
          <label style={s.lbl}>Durum</label>
          <select style={s.inp} value={form.durum} onChange={e => setForm({ ...form, durum: e.target.value })}>
            {durumlar.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        {kayit.tip === "fatura" && (
          <div style={s.fg}>
            <label style={s.lbl}>Tutar</label>
            <input style={s.inp} value={form.tutar} onChange={e => setForm({ ...form, tutar: e.target.value })} placeholder="Örn: 1500+KDV" />
          </div>
        )}
        {kayit.tip === "atama" && (<>
          <div style={s.fg}>
            <label style={s.lbl}>İSG Uzmanı</label>
            <select style={s.inp} value={form.uzman} onChange={e => setForm({ ...form, uzman: e.target.value })}>
              <option value="">Seç...</option>
              {UZMANLAR.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div style={s.fg}>
            <label style={s.lbl}>İşyeri Hekimi</label>
            <select style={s.inp} value={form.hekim} onChange={e => setForm({ ...form, hekim: e.target.value })}>
              <option value="">Seç...</option>
              {HEKİMLER.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
        </>)}
        {kayit.tip === "evrak" && (
          <div style={s.fg}>
            <label style={s.lbl}>Evrak Türü</label>
            <select style={s.inp} value={form.evrak_tur} onChange={e => setForm({ ...form, evrak_tur: e.target.value })}>
              <option value="">Seç...</option>
              {EVRAK_TURLER.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div style={s.fg}>
          <label style={s.lbl}>Not / Açıklama</label>
          <textarea style={{ ...s.inp, height: 80, resize: "none" }} value={form.aciklama} onChange={e => setForm({ ...form, aciklama: e.target.value })} />
        </div>
        <button style={{ ...s.kaydetBtn, opacity: yukleniyor ? 0.7 : 1 }} onClick={kaydet} disabled={yukleniyor}>
          {yukleniyor ? "⏳ Kaydediliyor..." : "💾 Güncelle"}
        </button>
      </div>
    </div>
  );
}

// ─── TAMAMLANANLAR MODAL ─────────────────────────────────────
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
              <button style={{ flex: 1, background: "#334155", border: "none", color: "#94A3B8", padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer" }} onClick={() => onGeriAl(k.id)}>
                ↩ Geri Al
              </button>
              <button style={{ flex: 1, background: "transparent", border: "1px solid #EF4444", color: "#EF4444", padding: "8px", borderRadius: 8, fontSize: 13, cursor: "pointer" }} onClick={() => onSil(k.id)}>
                🗑 Sil
              </button>
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
  const fmtSure = (s) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const kaydet = async () => {
    if (!musteri.trim()) { showToast("Müşteri adı zorunlu!", "hata"); return; }
    setYukleniyor(true);
    try {
      const fotoURLler = [];
      for (const foto of fotolar) {
        const ad = `${Date.now()}_${Math.random().toString(36).slice(2)}_${foto.name}`;
        const { error } = await supabase.storage.from("fotolar").upload(ad, foto);
        if (!error) { const { data } = supabase.storage.from("fotolar").getPublicUrl(ad); fotoURLler.push(data.publicUrl); }
      }
      let sesKaydURL = null;
      if (sesBlob) {
        const ad = `${Date.now()}_${Math.random().toString(36).slice(2)}.${sesExt}`;
        const { error } = await supabase.storage.from("sesler").upload(ad, sesBlob, { contentType: sesMimeType });
        if (!error) { const { data } = supabase.storage.from("sesler").getPublicUrl(ad); sesKaydURL = data.publicUrl; }
      }
      const { error } = await supabase.from("isler").insert({
        tip: sekme, musteri: musteri.trim(), durum: form.durum,
        aciklama: form.aciklama || null, tutar: form.tutar || null,
        uzman: form.uzman || null, hekim: form.hekim || null,
        evrak_tur: form.evrak_tur || null,
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
          {oneri.length > 0 && (
            <div style={s.oneriKutu}>{oneri.map(m => <div key={m} style={s.oneriItem} onClick={() => { setMusteri(m); setOneri([]); }}>{m}</div>)}</div>
          )}
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
          <button style={s.medBtn} onClick={() => fotoRef.current.click()}>📷 {fotolar.length > 0 ? `${fotolar.length} seçildi` : "Fotoğraf Ekle"}</button>
          <input ref={fotoRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => setFotolar(Array.from(e.target.files))} />
          {fotolar.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {fotolar.map((f, i) => <img key={i} src={URL.createObjectURL(f)} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} alt="" />)}</div>}
        </div>
        <div style={s.fg}>
          <label style={s.lbl}>Ses Kaydı</label>
          {!sesURL ? (
            <button style={{ ...s.medBtn, borderColor: kayitYapiliyor ? "#EF4444" : "#334155", color: kayitYapiliyor ? "#EF4444" : "#94A3B8" }} onClick={kayitYapiliyor ? sesDur : sesBaslat}>
              {kayitYapiliyor ? `⏹ Durdur  ${fmtSure(kayitSure)}` : "🎙 Ses Kaydı Başlat"}
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
  header: { background: "#1E293B", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: "2px solid #334155" },
  headerIco: { width: 40, height: 40, background: "#0EA5E9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  headerBaslik: { fontSize: 17, fontWeight: 700, letterSpacing: 1, color: "#F8FAFC" },
  headerAlt: { fontSize: 11, color: "#64748B" },
  tamamlananBtn: { background: "#10B98120", border: "1px solid #10B98140", color: "#10B981", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 4 },
  sekmeler: { display: "flex", background: "#1E293B", borderBottom: "1px solid #334155" },
  sekmeBtn: { flex: 1, padding: "12px 4px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 },
  sekmeBtnAktif: { color: "#0EA5E9", borderBottom: "2px solid #0EA5E9" },
  badge: { background: "#0EA5E9", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 6px" },
  liste: { flex: 1, padding: "12px 12px 80px" },
  bos: { textAlign: "center", padding: "60px 20px", color: "#64748B" },
  kart: { background: "#1E293B", borderRadius: 10, padding: 14, cursor: "pointer", border: "1px solid #334155" },
  kartUst: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  kartMusteri: { fontSize: 16, fontWeight: 700, color: "#F8FAFC", flex: 1, marginRight: 8 },
  durumBadge: { color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" },
  kartAlt: { display: "flex", gap: 12, fontSize: 12, color: "#94A3B8", marginBottom: 4, flexWrap: "wrap" },
  kartNot: { color: "#64748B", fontSize: 12, marginTop: 4, lineHeight: 1.4 },
  kartMeta: { display: "flex", gap: 10, fontSize: 11, color: "#475569", marginTop: 6, flexWrap: "wrap" },
  ustlenildiEtiket: { background: "#8B5CF620", border: "1px solid #8B5CF640", color: "#A78BFA", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, marginBottom: 6, display: "block" },
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
