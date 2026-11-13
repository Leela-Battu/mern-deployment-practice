import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      setError("");
      const response = await fetch(`${API}/api/tasks`);
      if (!response.ok) throw new Error("Could not load tasks. Is the API running?");
      setTasks(await response.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTasks(); }, []);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const response = await fetch(`${API}/api/tasks`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not add task.");
      setTasks((current) => [data, ...current]);
      setTitle(""); setError("");
    } catch (err) { setError(err.message); }
  }

  async function toggleTask(id) {
    try {
      const response = await fetch(`${API}/api/tasks/${id}`, { method: "PATCH" });
      if (!response.ok) throw new Error("Could not update task.");
      const updated = await response.json();
      setTasks((current) => current.map((task) => task.id === id ? updated : task));
    } catch (err) { setError(err.message); }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`${API}/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete task.");
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) { setError(err.message); }
  }

  const visibleTasks = useMemo(() => tasks.filter((task) =>
    filter === "all" || (filter === "active" ? !task.completed : task.completed)
  ), [tasks, filter]);
  const completed = tasks.filter((task) => task.completed).length;

  return (
    <main className="shell">
      <header className="topbar"><div className="brand"><span className="brand-icon">D</span> DeployLab</div><span className="status"><i /> API-connected app</span></header>
      <section className="hero">
        <p className="eyebrow">YOUR DEPLOYMENT PLAYGROUND</p>
        <h1>Make it work.<br /><span>Then ship it.</span></h1>
        <p className="subtitle">A simple task manager to practice full-stack deployment on AWS EC2.</p>
        <div className="stats"><div><strong>{tasks.length}</strong><span>Total tasks</span></div><div><strong>{completed}</strong><span>Completed</span></div><div><strong>{tasks.length - completed}</strong><span>Remaining</span></div></div>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><p className="eyebrow">WORKSPACE</p><h2>Your tasks</h2></div><span className="count">{tasks.length} ITEMS</span></div>
        <form className="add-form" onSubmit={addTask}><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to get done?" maxLength="120" aria-label="New task" /><button type="submit">Add task <span>＋</span></button></form>
        <div className="filters">{["all", "active", "completed"].map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
        {error && <div className="error">{error}</div>}
        {loading ? <div className="empty">Loading tasks…</div> : visibleTasks.length === 0 ? <div className="empty"><span>✦</span><strong>Nothing here yet</strong><p>Add a task above and get started.</p></div> :
          <ul className="task-list">{visibleTasks.map((task) => <li key={task.id} className={task.completed ? "done" : ""}><button className="check" onClick={() => toggleTask(task.id)} aria-label="Toggle task">{task.completed ? "✓" : ""}</button><span className="task-title">{task.title}</span><button className="delete" onClick={() => deleteTask(task.id)} aria-label="Delete task">×</button></li>)}</ul>}
        <div className="panel-footer"><span>Saved automatically to your local JSON file</span><button onClick={loadTasks}>↻ Refresh</button></div>
      </section>
      <footer>Built for learning · React + Express + JSON file storage</footer>
    </main>
  );
}