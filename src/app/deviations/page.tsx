import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "../lib/Toast";
import { AlertTriangle } from "lucide-react";

interface Deviation {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
}

export default function DeviationsPage() {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newDeviation, setNewDeviation] = useState({ title: "", description: "", status: "Åpen", severity: "Lav" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [selected, setSelected] = useState<Deviation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDeviations();
  }, []);

  async function fetchDeviations() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "deviations"));
      setDeviations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Deviation)));
    } catch (e) {
      showToast("Kunne ikke hente avvik", "error");
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newDeviation.title || !newDeviation.description) return showToast("Fyll ut alle felter", "error");
    try {
      await addDoc(collection(db, "deviations"), newDeviation);
      showToast("Avvik opprettet", "success");
      setShowCreate(false);
      setNewDeviation({ title: "", description: "", status: "Åpen", severity: "Lav" });
      fetchDeviations();
    } catch {
      showToast("Feil ved opprettelse", "error");
    }
  }

  async function handleEdit() {
    if (!selected) return;
    try {
      await updateDoc(doc(db, "deviations", selected.id), {
        title: selected.title,
        description: selected.description,
        status: selected.status,
        severity: selected.severity
      });
      showToast("Avvik oppdatert", "success");
      setEditMode(false);
      fetchDeviations();
    } catch {
      showToast("Feil ved oppdatering", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "deviations", selected.id));
      showToast("Avvik slettet", "success");
      setSelected(null);
      fetchDeviations();
    } catch {
      showToast("Feil ved sletting", "error");
    }
    setDeleting(false);
  }

  function exportToCSV() {
    const rows = filtered.map((d) => [d.title, d.description, d.status, d.severity]);
    const csv = ["Tittel,Beskrivelse,Status,Alvorlighetsgrad", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "avvik.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = deviations.filter(
    (d) =>
      (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())) &&
      (!statusFilter || d.status === statusFilter) &&
      (!severityFilter || d.severity === severityFilter)
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground"><AlertTriangle className="h-6 w-6 text-danger" /> Avvik</h1>
        <div className="flex gap-2">
          <button className="bg-accent text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={exportToCSV} title="Eksporter filtrerte avvik til CSV">Eksporter CSV</button>
          <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={() => setShowCreate(true)} title="Opprett nytt avvik">Nytt avvik</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <input className="px-4 py-2 rounded border" placeholder="Søk tittel eller beskrivelse..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-4 py-2 rounded border" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Alle statuser</option>
          <option value="Åpen">Åpen</option>
          <option value="Lukket">Lukket</option>
        </select>
        <select className="px-4 py-2 rounded border" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="">Alle alvorlighetsgrader</option>
          <option value="Lav">Lav</option>
          <option value="Middels">Middels</option>
          <option value="Høy">Høy</option>
        </select>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4">Tittel</th>
              <th className="py-3 px-4">Beskrivelse</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Alvorlighetsgrad</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-6 text-center text-muted">Laster avvik...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-6 text-center text-muted">Ingen avvik funnet</td></tr>
            ) : filtered.map((d) => (
              <tr key={d.id} className="hover:bg-primary/10 cursor-pointer transition" onClick={() => { setSelected(d); setEditMode(false); }}>
                <td className="py-2 px-4 font-medium">{d.title}</td>
                <td className="py-2 px-4">{d.description}</td>
                <td className="py-2 px-4">{d.status}</td>
                <td className="py-2 px-4">{d.severity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Opprett avvik modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setShowCreate(false)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-4">Nytt avvik</h2>
            <input className="mb-3 w-full" placeholder="Tittel" value={newDeviation.title} onChange={e => setNewDeviation({ ...newDeviation, title: e.target.value })} />
            <textarea className="mb-3 w-full" placeholder="Beskrivelse" value={newDeviation.description} onChange={e => setNewDeviation({ ...newDeviation, description: e.target.value })} />
            <select className="mb-3 w-full" value={newDeviation.status} onChange={e => setNewDeviation({ ...newDeviation, status: e.target.value })}>
              <option value="Åpen">Åpen</option>
              <option value="Lukket">Lukket</option>
            </select>
            <select className="mb-3 w-full" value={newDeviation.severity} onChange={e => setNewDeviation({ ...newDeviation, severity: e.target.value })}>
              <option value="Lav">Lav</option>
              <option value="Middels">Middels</option>
              <option value="Høy">Høy</option>
            </select>
            <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleCreate} title="Opprett avvik">Opprett</button>
          </div>
        </div>
      )}
      {/* Detalj/rediger modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setSelected(null)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-2">{editMode ? "Rediger avvik" : "Avviksdetaljer"}</h2>
            <input className="mb-3 w-full" value={selected.title} disabled={!editMode} onChange={e => setSelected({ ...selected, title: e.target.value })} />
            <textarea className="mb-3 w-full" value={selected.description} disabled={!editMode} onChange={e => setSelected({ ...selected, description: e.target.value })} />
            <select className="mb-3 w-full" value={selected.status} disabled={!editMode} onChange={e => setSelected({ ...selected, status: e.target.value })}>
              <option value="Åpen">Åpen</option>
              <option value="Lukket">Lukket</option>
            </select>
            <select className="mb-3 w-full" value={selected.severity} disabled={!editMode} onChange={e => setSelected({ ...selected, severity: e.target.value })}>
              <option value="Lav">Lav</option>
              <option value="Middels">Middels</option>
              <option value="Høy">Høy</option>
            </select>
            {editMode ? (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleEdit} title="Lagre endringer">Lagre</button>
            ) : (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={() => setEditMode(true)} title="Rediger avvik">Rediger</button>
            )}
            <button className="mt-2 bg-danger text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleDelete} disabled={deleting} title="Slett avvik">{deleting ? "Sletter..." : "Slett"}</button>
          </div>
        </div>
      )}
    </div>
  );
} 