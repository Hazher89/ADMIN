import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "../lib/Toast";
import { UsersIcon } from "@heroicons/react/24/outline";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
    } catch (e) {
      showToast("Kunne ikke hente brukere", "error");
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newUser.name || !newUser.email || !newUser.role) return showToast("Fyll ut alle felter", "error");
    try {
      await addDoc(collection(db, "users"), newUser);
      showToast("Bruker opprettet", "success");
      setShowCreate(false);
      setNewUser({ name: "", email: "", role: "" });
      fetchUsers();
    } catch {
      showToast("Feil ved opprettelse", "error");
    }
  }

  async function handleEdit() {
    if (!selected) return;
    try {
      await updateDoc(doc(db, "users", selected.id), {
        name: selected.name,
        email: selected.email,
        role: selected.role
      });
      showToast("Bruker oppdatert", "success");
      setEditMode(false);
      fetchUsers();
    } catch {
      showToast("Feil ved oppdatering", "error");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "users", selected.id));
      showToast("Bruker slettet", "success");
      setSelected(null);
      fetchUsers();
    } catch {
      showToast("Feil ved sletting", "error");
    }
    setDeleting(false);
  }

  function exportToCSV() {
    const rows = filtered.map((u) => [u.name, u.email, u.role]);
    const csv = ["Navn,E-post,Rolle", ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brukere.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = users.filter(
    (u) =>
      (!search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
      (!roleFilter || u.role === roleFilter)
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground"><UsersIcon className="h-6 w-6 text-secondary" /> Brukere</h1>
        <div className="flex gap-2">
          <button className="bg-accent text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={exportToCSV} title="Eksporter filtrerte brukere til CSV">Eksporter CSV</button>
          <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition" onClick={() => setShowCreate(true)} title="Opprett ny bruker">Ny bruker</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <input className="px-4 py-2 rounded border" placeholder="Søk navn eller e-post..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="px-4 py-2 rounded border" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Alle roller</option>
          <option value="admin">Admin</option>
          <option value="leder">Leder</option>
          <option value="ansatt">Ansatt</option>
        </select>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-3 px-4">Navn</th>
              <th className="py-3 px-4">E-post</th>
              <th className="py-3 px-4">Rolle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="py-6 text-center text-muted">Laster brukere...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="py-6 text-center text-muted">Ingen brukere funnet</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id} className="hover:bg-primary/10 cursor-pointer transition" onClick={() => { setSelected(u); setEditMode(false); }}>
                <td className="py-2 px-4 font-medium">{u.name}</td>
                <td className="py-2 px-4">{u.email}</td>
                <td className="py-2 px-4">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Opprett bruker modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setShowCreate(false)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-4">Ny bruker</h2>
            <input className="mb-3 w-full" placeholder="Navn" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
            <input className="mb-3 w-full" placeholder="E-post" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            <select className="mb-3 w-full" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="">Velg rolle</option>
              <option value="admin">Admin</option>
              <option value="leder">Leder</option>
              <option value="ansatt">Ansatt</option>
            </select>
            <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleCreate} title="Opprett bruker">Opprett</button>
          </div>
        </div>
      )}
      {/* Detalj/rediger modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="card relative w-full max-w-md mx-auto">
            <button className="absolute top-3 right-3 text-muted text-xl font-bold hover:text-danger" onClick={() => setSelected(null)} aria-label="Lukk" title="Lukk">×</button>
            <h2 className="text-xl font-bold mb-2">{editMode ? "Rediger bruker" : "Brukerdetaljer"}</h2>
            <input className="mb-3 w-full" value={selected.name} disabled={!editMode} onChange={e => setSelected({ ...selected, name: e.target.value })} />
            <input className="mb-3 w-full" value={selected.email} disabled={!editMode} onChange={e => setSelected({ ...selected, email: e.target.value })} />
            <select className="mb-3 w-full" value={selected.role} disabled={!editMode} onChange={e => setSelected({ ...selected, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="leder">Leder</option>
              <option value="ansatt">Ansatt</option>
            </select>
            {editMode ? (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleEdit} title="Lagre endringer">Lagre</button>
            ) : (
              <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={() => setEditMode(true)} title="Rediger bruker">Rediger</button>
            )}
            <button className="mt-2 bg-danger text-white font-bold px-6 py-2 rounded-lg hover:scale-105 transition w-full" onClick={handleDelete} disabled={deleting} title="Slett bruker">{deleting ? "Sletter..." : "Slett"}</button>
          </div>
        </div>
      )}
    </div>
  );
} 