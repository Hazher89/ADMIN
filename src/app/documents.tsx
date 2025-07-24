import React, { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "./lib/Toast";
import { FileText } from "lucide-react";

interface Document {
  id: string;
  title: string;
  type: string;
  uploadedBy: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: "", type: "", uploadedBy: "" });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<Document | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "documents"));
      setDocuments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document)));
    } catch (e) {
      showToast("Kunne ikke hente dokumenter", "error");
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newDocument.title || !newDocument.type || !newDocument.uploadedBy) return showToast("Fyll ut alle felter", "error");
    try {
      await addDoc(collection(db, "documents"), newDocument);
      showToast("Dokument opprettet", "success");
      setShowCreate(false);
      setNewDocument({ title: "", type: "", uploadedBy: "" });
      fetchDocuments();
    } catch {
      showToast("Feil ved opprettelse", "error");
    }
  }

  async function handleEdit() {
    if (!selected) return;
    try {
      await updateDoc(doc(db, "documents", selected.id), {
        title: selected.title,
        type: selected.type,
        uploadedBy: selected.uploadedBy
      });
      showToast("Dokument oppdatert", "success");
      setEditMode(false);
      fetchDocuments();
    } catch {
      showToast("Feil ved oppdatering", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "documents", selected.id));
      showToast("Dokument slettet", "success");
      setSelected(null);
      fetchDocuments();
    } catch {
      showToast("Feil ved sletting", "error");
    }
    setDeleting(false);
  }

  function exportToCSV() {
    const rows = filtered.map((d) => [d.title, d.type, d.uploadedBy]);
    const csv = ["Tittel,Type,Lastet opp av", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dokumenter.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = documents.filter(
    (d) =>
      (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.uploadedBy.toLowerCase().includes(search.toLowerCase())) &&
      (!typeFilter || d.type === typeFilter)
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground"><FileText className="h-6 w-6 text-accent" /> Dokumenter</h1>
        <div className="flex gap-2">
          <button className="bg-accent text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={exportToCSV} title="Eksporter filtrerte dokumenter til CSV">Eksporter CSV</button>
          <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={() => setShowCreate(true)} title="Opprett nytt dokument">Nytt dokument</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <input className="px-4 py-2 rounded border" placeholder="Søk tittel eller opplaster..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-4 py-2 rounded border" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Alle typer</option>
          <option value="Rutine">Rutine</option>
          <option value="Instruks">Instruks</option>
          <option value="Sjekkliste">Sjekkliste</option>
          <option value="Annet">Annet</option>
        </select>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4">Tittel</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Lastet opp av</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="py-6 text-center text-muted">Laster dokumenter...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="py-6 text-center text-muted">Ingen dokumenter funnet</td></tr>
            ) : filtered.map((d) => (
              <tr key={d.id} className="hover:bg-primary/10 cursor-pointer transition" onClick={() => { setSelected(d); setEditMode(false); }}>
                <td className="py-2 px-4 font-medium">{d.title}</td>
                <td className="py-2 px-4">{d.type}</td>
                <td className="py-2 px-4">{d.uploadedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Opprett dokument modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setShowCreate(false)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-4">Nytt dokument</h2>
            <input className="mb-3 w-full" placeholder="Tittel" value={newDocument.title} onChange={e => setNewDocument({ ...newDocument, title: e.target.value })} />
            <select className="mb-3 w-full" value={newDocument.type} onChange={e => setNewDocument({ ...newDocument, type: e.target.value })}>
              <option value="">Velg type</option>
              <option value="Rutine">Rutine</option>
              <option value="Instruks">Instruks</option>
              <option value="Sjekkliste">Sjekkliste</option>
              <option value="Annet">Annet</option>
            </select>
            <input className="mb-3 w-full" placeholder="Lastet opp av" value={newDocument.uploadedBy} onChange={e => setNewDocument({ ...newDocument, uploadedBy: e.target.value })} />
            <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleCreate} title="Opprett dokument">Opprett</button>
          </div>
        </div>
      )}
      {/* Detalj/rediger modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setSelected(null)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-2">{editMode ? "Rediger dokument" : "Dokumentdetaljer"}</h2>
            <input className="mb-3 w-full" value={selected.title} disabled={!editMode} onChange={e => setSelected({ ...selected, title: e.target.value })} />
            <select className="mb-3 w-full" value={selected.type} disabled={!editMode} onChange={e => setSelected({ ...selected, type: e.target.value })}>
              <option value="Rutine">Rutine</option>
              <option value="Instruks">Instruks</option>
              <option value="Sjekkliste">Sjekkliste</option>
              <option value="Annet">Annet</option>
            </select>
            <input className="mb-3 w-full" value={selected.uploadedBy} disabled={!editMode} onChange={e => setSelected({ ...selected, uploadedBy: e.target.value })} />
            {editMode ? (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleEdit} title="Lagre endringer">Lagre</button>
            ) : (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={() => setEditMode(true)} title="Rediger dokument">Rediger</button>
            )}
            <button className="mt-2 bg-danger text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleDelete} disabled={deleting} title="Slett dokument">{deleting ? "Sletter..." : "Slett"}</button>
          </div>
        </div>
      )}
    </div>
  );
} 