import React, { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "./lib/Toast";
import { Calendar } from "lucide-react";

interface Shift {
  id: string;
  title: string;
  date: string;
  type: string;
  assignedTo: string;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newShift, setNewShift] = useState({ title: "", date: "", type: "Dag", assignedTo: "" });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<Shift | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchShifts();
  }, []);

  async function fetchShifts() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "shifts"));
      setShifts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shift)));
    } catch (e) {
      showToast("Kunne ikke hente skift", "error");
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newShift.title || !newShift.date || !newShift.type || !newShift.assignedTo) return showToast("Fyll ut alle felter", "error");
    try {
      await addDoc(collection(db, "shifts"), newShift);
      showToast("Skift opprettet", "success");
      setShowCreate(false);
      setNewShift({ title: "", date: "", type: "Dag", assignedTo: "" });
      fetchShifts();
    } catch {
      showToast("Feil ved opprettelse", "error");
    }
  }

  async function handleEdit() {
    if (!selected) return;
    try {
      await updateDoc(doc(db, "shifts", selected.id), {
        title: selected.title,
        date: selected.date,
        type: selected.type,
        assignedTo: selected.assignedTo
      });
      showToast("Skift oppdatert", "success");
      setEditMode(false);
      fetchShifts();
    } catch {
      showToast("Feil ved oppdatering", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "shifts", selected.id));
      showToast("Skift slettet", "success");
      setSelected(null);
      fetchShifts();
    } catch {
      showToast("Feil ved sletting", "error");
    }
    setDeleting(false);
  }

  function exportToCSV() {
    const rows = filtered.map((s) => [s.title, s.date, s.type, s.assignedTo]);
    const csv = ["Tittel,Dato,Type,Tildelt til", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skift.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = shifts.filter(
    (s) =>
      (!search || s.title.toLowerCase().includes(search.toLowerCase()) || s.assignedTo.toLowerCase().includes(search.toLowerCase())) &&
      (!typeFilter || s.type === typeFilter)
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground"><Calendar className="h-6 w-6 text-success" /> Skiftplan</h1>
        <div className="flex gap-2">
          <button className="bg-accent text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={exportToCSV} title="Eksporter filtrerte skift til CSV">Eksporter CSV</button>
          <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={() => setShowCreate(true)} title="Opprett nytt skift">Nytt skift</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <input className="px-4 py-2 rounded border" placeholder="Søk tittel eller tildelt..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-4 py-2 rounded border" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Alle typer</option>
          <option value="Dag">Dag</option>
          <option value="Kveld">Kveld</option>
          <option value="Natt">Natt</option>
        </select>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4">Tittel</th>
              <th className="py-3 px-4">Dato</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Tildelt til</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-6 text-center text-muted">Laster skift...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center text-muted">Ingen skift funnet</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="hover:bg-primary/10 cursor-pointer transition" onClick={() => { setSelected(s); setEditMode(false); }}>
                <td className="py-2 px-4 font-medium">{s.title}</td>
                <td className="py-2 px-4">{s.date}</td>
                <td className="py-2 px-4">{s.type}</td>
                <td className="py-2 px-4">{s.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Opprett skift modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setShowCreate(false)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-4">Nytt skift</h2>
            <input className="mb-3 w-full" placeholder="Tittel" value={newShift.title} onChange={e => setNewShift({ ...newShift, title: e.target.value })} />
            <input className="mb-3 w-full" type="date" value={newShift.date} onChange={e => setNewShift({ ...newShift, date: e.target.value })} />
            <select className="mb-3 w-full" value={newShift.type} onChange={e => setNewShift({ ...newShift, type: e.target.value })}>
              <option value="Dag">Dag</option>
              <option value="Kveld">Kveld</option>
              <option value="Natt">Natt</option>
            </select>
            <input className="mb-3 w-full" placeholder="Tildelt til" value={newShift.assignedTo} onChange={e => setNewShift({ ...newShift, assignedTo: e.target.value })} />
            <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleCreate} title="Opprett skift">Opprett</button>
          </div>
        </div>
      )}
      {/* Detalj/rediger modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setSelected(null)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-2">{editMode ? "Rediger skift" : "Skiftdetaljer"}</h2>
            <input className="mb-3 w-full" value={selected.title} disabled={!editMode} onChange={e => setSelected({ ...selected, title: e.target.value })} />
            <input className="mb-3 w-full" type="date" value={selected.date} disabled={!editMode} onChange={e => setSelected({ ...selected, date: e.target.value })} />
            <select className="mb-3 w-full" value={selected.type} disabled={!editMode} onChange={e => setSelected({ ...selected, type: e.target.value })}>
              <option value="Dag">Dag</option>
              <option value="Kveld">Kveld</option>
              <option value="Natt">Natt</option>
            </select>
            <input className="mb-3 w-full" value={selected.assignedTo} disabled={!editMode} onChange={e => setSelected({ ...selected, assignedTo: e.target.value })} />
            {editMode ? (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleEdit} title="Lagre endringer">Lagre</button>
            ) : (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={() => setEditMode(true)} title="Rediger skift">Rediger</button>
            )}
            <button className="mt-2 bg-danger text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleDelete} disabled={deleting} title="Slett skift">{deleting ? "Sletter..." : "Slett"}</button>
          </div>
        </div>
      )}
    </div>
  );
} 