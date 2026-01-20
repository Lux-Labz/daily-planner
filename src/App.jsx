import { useState, useRef } from "react";

const TASKS = [
  { name: "Work", category: "Productivity", color: "bg-blue-400" },
  { name: "Sleep", category: "Physical", color: "bg-purple-400" },
  { name: "Breakfast", category: "Physical", color: "bg-yellow-400" },
  { name: "Lunch", category: "Physical", color: "bg-orange-400" },
  { name: "Dinner", category: "Physical", color: "bg-red-400" },
  { name: "Family Time", category: "Social", color: "bg-green-400" },
  { name: "Prayer", category: "Spiritual", color: "bg-indigo-400" },
  { name: "Meditation", category: "Spiritual", color: "bg-teal-400" },
  { name: "Reading", category: "Mental", color: "bg-cyan-400" },
  { name: "Entertainment", category: "Social", color: "bg-pink-400" },
  { name: "Personal Projects", category: "Productivity", color: "bg-violet-400" },
  { name: "Home Projects", category: "Productivity", color: "bg-fuchsia-400" },
  { name: "Mass", category: "Spiritual", color: "bg-rose-400" },
  { name: "Rosary", category: "Spiritual", color: "bg-amber-400" },
  { name: "Benediction", category: "Spiritual", color: "bg-stone-400" },
  { name: "Prepare for Day", category: "Physical", color: "bg-lime-400" },
  { name: "Prepare for Night", category: "Physical", color: "bg-emerald-400" },
  { name: "Workout", category: "Physical", color: "bg-emerald-500" }
];

const TASK_COLORS = [
  'bg-blue-400',
  'bg-purple-400',
  'bg-yellow-400',
  'bg-orange-400',
  'bg-red-400',
  'bg-green-400',
  'bg-indigo-400',
  'bg-teal-400',
  'bg-cyan-400',
  'bg-pink-400',
  'bg-gray-400',
  'bg-lime-400',
  'bg-emerald-400',
  'bg-violet-400',
  'bg-fuchsia-400',
  'bg-rose-400',
  'bg-amber-400',
  'bg-stone-400',
  'bg-neutral-400',
  'bg-slate-400',
  'bg-zinc-400',
  'bg-sky-400',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-fuchsia-500'
];

const CATEGORY_COLORS = {
  Physical: "#10B981",
  Spiritual: "#8B5CF6",
  Social: "#EC4899",
  Mental: "#06B6D4",
  Productivity: "#3B82F6",
  Other: "#6B7280"
};

const SLOT_HEIGHT = 15;
const RESOLUTION = 30;
const MIN_DURATION = 30;
const DAY_MINUTES = 1440;

const formatTime12 = m => {
  const hour = Math.floor(m / 60);
  const minute = m % 60;
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;
};

const PieChart = ({ data }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <div className="text-center text-gray-500">No data</div>;

  let cumulative = 0;
  const slices = Object.entries(data).map(([category, value]) => {
    const percentage = value / total;
    const startAngle = cumulative * 2 * Math.PI;
    cumulative += percentage;
    const endAngle = cumulative * 2 * Math.PI;
    const largeArc = percentage > 0.5 ? 1 : 0;
    const x1 = 100 + 80 * Math.cos(startAngle);
    const y1 = 100 + 80 * Math.sin(startAngle);
    const x2 = 100 + 80 * Math.cos(endAngle);
    const y2 = 100 + 80 * Math.sin(endAngle);
    const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { category, pathData, color: CATEGORY_COLORS[category] || "#ccc", percentage };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {slices.map((slice, i) => (
          <path key={i} d={slice.pathData} fill={slice.color} />
        ))}
      </svg>
      <div className="mt-2 text-xs">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center mb-1">
            <div className="w-3 h-3 mr-2" style={{ backgroundColor: slice.color }}></div>
            <span>{slice.category}: {Math.round(slice.percentage * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [blocks, setBlocks] = useState([]);
  const [hoverMinute, setHoverMinute] = useState(null);
  const [ghostBlock, setGhostBlock] = useState(null);
  const [tasks, setTasks] = useState(TASKS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Physical');
  const [editingTask, setEditingTask] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [categories, setCategories] = useState(['Physical', 'Spiritual', 'Social', 'Mental', 'Productivity', 'Other']);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const timelineRef = useRef(null);
  const dragRef = useRef(null);

  const categoryTotals = blocks.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + b.duration;
    return acc;
  }, {});

  const addTask = () => {
    if (newName.trim()) {
      const randomColor = TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)];
      setTasks(prev => [...prev, { name: newName.trim(), category: newCategory, color: randomColor }]);
      setNewName('');
      setNewCategory('Physical');
      setShowAdd(false);
    }
  };

  const deleteTask = (name) => {
    setTasks(prev => prev.filter(t => t.name !== name));
    // Also remove blocks with this task
    setBlocks(prev => prev.filter(b => b.name !== name));
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setEditName(task.name);
    setEditCategory(task.category);
  };

  const saveEdit = () => {
    if (editName.trim()) {
      const randomColor = TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)];
      setTasks(prev => prev.map(t => t === editingTask ? { ...t, name: editName.trim(), category: editCategory, color: randomColor } : t));
      // Update blocks
      setBlocks(prev => prev.map(b => b.name === editingTask.name ? { ...b, name: editName.trim(), category: editCategory, color: randomColor } : b));
      setEditingTask(null);
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const addCategory = () => {
    if (newCatName.trim() && !categories.includes(newCatName.trim())) {
      setCategories(prev => [...prev, newCatName.trim()]);
      setNewCatName('');
      setShowAddCat(false);
    }
  };

  const deleteCategory = (cat) => {
    if (cat === "Other") return; // Cannot delete "Other"
    setCategories(prev => prev.filter(c => c !== cat));
    // Update tasks with this category to "Other"
    setTasks(prev => prev.map(t => t.category === cat ? { ...t, category: "Other" } : t));
    // Update blocks with this category to "Other"
    setBlocks(prev => prev.map(b => b.category === cat ? { ...b, category: "Other" } : b));
  };

  const startEditCat = (cat) => {
    setEditingCat(cat);
    setEditCatName(cat);
  };

  const saveEditCat = () => {
    if (editCatName.trim() && !categories.includes(editCatName.trim())) {
      setCategories(prev => prev.map(c => c === editingCat ? editCatName.trim() : c));
      // Update all tasks and blocks with this category
      setTasks(prev => prev.map(t => t.category === editingCat ? { ...t, category: editCatName.trim() } : t));
      setBlocks(prev => prev.map(b => b.category === editingCat ? { ...b, category: editCatName.trim() } : b));
      setEditingCat(null);
    }
  };

  const cancelEditCat = () => {
    setEditingCat(null);
  };

  const snapMinutes = px => Math.round(px / SLOT_HEIGHT) * RESOLUTION;

  const clampBlock = b => {
    let start = Math.max(0, Math.min(DAY_MINUTES - MIN_DURATION, b.start));
    let duration = Math.max(MIN_DURATION, Math.min(DAY_MINUTES - start, b.duration));
    return { ...b, start, duration };
  };

  const overlaps = (newBlock, excludeId = null) =>
    blocks.some(b =>
      b.id !== excludeId &&
      b.start < newBlock.start + newBlock.duration &&
      newBlock.start < b.start + b.duration
    );

  const updateBlock = (id, fn) => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id === id) {
          const updated = clampBlock(fn(b));
          return overlaps(updated, id) ? b : updated;
        }
        return b;
      })
    );
  };

  const beginMove = (e, block) => {
    if (dragRef.current) return;
    if (e.target.closest("button")) return;
    e.preventDefault();
    dragRef.current = { type: "move", id: block.id, startY: e.clientY, startBlock: block.start };
    setGhostBlock(block);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
  };

  const beginResize = (e, block, edge) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest("button")) return;
    dragRef.current = {
      type: "resize",
      id: block.id,
      edge,
      startY: e.clientY,
      startBlock: block.start,
      startDuration: block.duration
    };
    setGhostBlock(block);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endDrag);
  };

  const onMouseMove = e => {
    const d = dragRef.current;
    if (!d) return;
    const deltaMinutes = snapMinutes(e.clientY - d.startY);
    const rect = timelineRef.current.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    const currentMinute = snapMinutes(currentY);
    setHoverMinute(currentMinute);

    if (d.type === "move") {
      const newStart = d.startBlock + deltaMinutes;
      setGhostBlock(prev => prev ? { ...prev, start: Math.max(0, newStart) } : null);
      updateBlock(d.id, b => ({ ...b, start: d.startBlock + deltaMinutes }));
    } else {
      if (d.edge === "top") {
        const newStart = d.startBlock + deltaMinutes;
        const newDuration = d.startDuration - deltaMinutes;
        setGhostBlock(prev => prev ? { ...prev, start: Math.max(0, newStart), duration: Math.max(MIN_DURATION, newDuration) } : null);
      } else {
        const newDuration = d.startDuration + deltaMinutes;
        setGhostBlock(prev => prev ? { ...prev, duration: Math.max(MIN_DURATION, newDuration) } : null);
      }
      updateBlock(d.id, b =>
        d.edge === "top"
          ? { ...b, start: d.startBlock + deltaMinutes, duration: b.start + b.duration - (d.startBlock + deltaMinutes) }
          : { ...b, duration: d.startDuration + deltaMinutes }
      );
    }
  };

  const endDrag = e => {
    dragRef.current = null;
    setHoverMinute(null);
    setGhostBlock(null);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", endDrag);
  };

  const dropNewBlock = (task, y) => {
    const foundTask = tasks.find(t => t.name === task.name);
    if (!foundTask) return;
    const minutes = snapMinutes(y);
    const newBlock = clampBlock({ id: Date.now() + Math.random(), ...foundTask, start: minutes, duration: 30 });
    if (!overlaps(newBlock)) setBlocks(prev => [...prev, newBlock]);
  };

  const exportConfig = () => {
    const config = { categories, tasks, blocks };
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'time-management-config.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        if (config.categories && Array.isArray(config.categories)) setCategories(config.categories);
        if (config.tasks && Array.isArray(config.tasks)) setTasks(config.tasks);
        if (config.blocks && Array.isArray(config.blocks)) setBlocks(config.blocks);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 pt-16">
      <div className="fixed top-0 left-0 right-0 bg-slate-800 text-white p-2 z-50 flex justify-between items-center print:hidden">
        <h1 className="text-xl font-bold">Daily Planner <span className='text-xs font-normal'>(v0.1)</span></h1>
        <div className="flex gap-2">
          <button onClick={exportConfig} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">Export Config</button>
          <label className="px-4 py-2 bg-green-500 text-white rounded text-sm cursor-pointer">
            Import Config
            <input type="file" accept=".json" onChange={importConfig} className="hidden" />
          </label>
          <button onClick={() => window.print()} className="px-4 py-2 bg-green-500 text-white rounded text-sm">Print Chart</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 main">
        <style dangerouslySetInnerHTML={{__html: `html, body { height: 100%; overflow: hidden; } .main { height: calc(100vh - 4rem); } @media print { .no-print { display: none !important; } .time-chart { font-size: 10px; } .slot { height: 8px !important; } .block { border: 1px solid #000 !important; box-shadow: none !important; } .block span { font-size: 9px !important; color: #000 !important; } .main { flex-direction: row !important; gap: 0.25rem !important; } .main > div { padding: 0.25rem !important; } .main > div:first-child { display: none !important; } .main > div:nth-child(2) { display: none !important; } .main > div:nth-child(3) { width: 40% !important; } .main > div:nth-child(4) { width: 25% !important; } body { font-size: 12px; margin: 0; padding: 0; } }`}} />

        {/* Categories on the Left */}
        <div className="w-full sm:w-1/5 flex flex-col gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4 shadow-lg no-print overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2 text-slate-800">Categories</h2>
          <button onClick={() => setShowAddCat(true)} className="mb-2 px-2 py-1 bg-blue-500 text-white rounded text-sm">➕ Category</button>
          {showAddCat && (
            <div className="mb-2 p-2 bg-white/50 rounded">
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category Name" className="mr-2 p-1 border text-sm" />
              <button onClick={addCategory} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Save</button>
              <button onClick={() => setShowAddCat(false)} className="ml-2 px-2 py-1 bg-gray-500 text-white rounded text-sm">Cancel</button>
            </div>
          )}
          {categories.map(c => (
            editingCat === c ? (
              <div key={c} className="mb-2 p-2 bg-white/50 rounded">
                <input value={editCatName} onChange={e => setEditCatName(e.target.value)} placeholder="Category Name" className="mr-2 p-1 border text-sm" />
                <button onClick={saveEditCat} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Save</button>
                <button onClick={cancelEditCat} className="ml-2 px-2 py-1 bg-gray-500 text-white rounded text-sm">Cancel</button>
              </div>
            ) : (
              <div key={c} className="flex items-center mb-2">
                <span className="flex-1">{c}</span>
                {c !== "Other" && (
                  <>
                    <button onClick={() => startEditCat(c)} className="ml-2 px-1 py-1 bg-yellow-500 text-white rounded text-sm">✏️</button>
                    <button onClick={() => deleteCategory(c)} className="ml-2 px-1 py-1 bg-red-500 text-white rounded text-sm">🗑️</button>
                  </>
                )}
              </div>
            )
          ))}
        </div>

        {/* Task Icons in the Middle */}
        <div className="w-full sm:w-1/4 flex flex-col gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4 shadow-lg no-print overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2 text-slate-800">Tasks</h2>
          <button onClick={() => setShowAdd(true)} className="mb-2 px-2 py-1 bg-blue-500 text-white rounded text-sm">➕ Task</button>
          {showAdd && (
            <div className="mb-2 p-2 bg-white/50 rounded">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="mr-2 p-1 border text-sm" />
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="mr-2 p-1 border text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={addTask} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Save</button>
              <button onClick={() => setShowAdd(false)} className="ml-2 px-2 py-1 bg-gray-500 text-white rounded text-sm">Cancel</button>
            </div>
          )}
          {tasks.map(t => (
            editingTask === t ? (
              <div key={t.name} className="mb-2 p-2 bg-white/50 rounded">
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" className="mr-2 p-1 border text-sm" />
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="mr-2 p-1 border text-sm">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={saveEdit} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Save</button>
                <button onClick={cancelEdit} className="ml-2 px-2 py-1 bg-gray-500 text-white rounded text-sm">Cancel</button>
              </div>
            ) : (
              <div key={t.name} className="flex items-center mb-1">
                <div
                  draggable
                  onDragStart={e => e.dataTransfer.setData("task", JSON.stringify(t))}
                  className={`flex-1 px-2 py-1 rounded-lg text-white cursor-pointer shadow-md hover:shadow-lg transition-shadow text-xs ${t.color} bg-opacity-80`}
                >
                  {t.name} ({t.category})
                </div>
                <button onClick={() => startEdit(t)} className="ml-1 px-0.5 py-0.5 bg-yellow-500 text-white rounded text-xs">✏️</button>
                <button onClick={() => deleteTask(t.name)} className="ml-1 px-0.5 py-0.5 bg-red-500 text-white rounded text-xs">🗑️</button>
              </div>
            )
          ))}
        </div>

        {/* Time Chart on the Right */}
        <div className="w-full sm:w-2/5 flex flex-col bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4 shadow-lg">
          <h2 className="text-lg font-semibold mb-2 text-center text-slate-800">Time Chart</h2>
          <div
            ref={timelineRef}
            className="relative bg-white border rounded-lg shadow-inner time-chart overflow-y-auto"
            onDragOver={e => {
              e.preventDefault();
              const rect = timelineRef.current.getBoundingClientRect();
              setHoverMinute(snapMinutes(e.clientY - rect.top));
            }}
            onDrop={e => {
              const raw = e.dataTransfer.getData("task");
              if (!raw) return;
              const rect = timelineRef.current.getBoundingClientRect();
              dropNewBlock(JSON.parse(raw), e.clientY - rect.top);
              setHoverMinute(null);
            }}
          >
            {Array.from({ length: 48 }).map((_, i) => {
              const hour = Math.floor(i / 2);
              const minute = i % 2 === 0 ? 0 : 30;
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              const ampm = hour < 12 ? "AM" : "PM";
              return (
                <div key={i} className="border-b text-xs text-gray-500 pl-2" style={{ height: '15px' }}>
                  {minute === 0 ? `${displayHour}:00 ${ampm}` : ""}
                </div>
              );
            })}

            {hoverMinute !== null && !ghostBlock && (
              <div
                className="absolute left-0 right-0 h-[2px] bg-blue-500"
                style={{ top: (hoverMinute / RESOLUTION) * SLOT_HEIGHT }}
              />
            )}

            {ghostBlock && (
              <div
                className="absolute left-0 right-0 h-[2px] bg-blue-500"
                style={{ top: (ghostBlock.start / RESOLUTION) * SLOT_HEIGHT }}
              />
            )}

            {ghostBlock && (
              <div
                className={`absolute left-20 right-2 rounded-lg text-white shadow-lg block ${ghostBlock.color} bg-opacity-50`}
                style={{ top: (ghostBlock.start / RESOLUTION) * SLOT_HEIGHT, height: Math.max(SLOT_HEIGHT / 2, (ghostBlock.duration / RESOLUTION) * SLOT_HEIGHT) }}
              >
                <div className="pl-2 pr-1 pt-1 pb-1 text-sm select-none flex items-center justify-start h-full pointer-events-none text-left overflow-hidden opacity-75">
                  <span className="font-bold text-[10px] truncate">{ghostBlock.name} {formatTime12(ghostBlock.start)}–{formatTime12(ghostBlock.start + ghostBlock.duration)}</span>
                </div>
              </div>
            )}

            {blocks.map(b => {
              const minHeight = Math.max(SLOT_HEIGHT / 2, (b.duration / RESOLUTION) * SLOT_HEIGHT);
              return (
                  <div
                    key={b.id}
                    className={`absolute left-20 right-2 rounded-lg text-white cursor-grab active:cursor-grabbing shadow-lg block ${b.color} bg-opacity-90`}
                    style={{ top: (b.start / RESOLUTION) * SLOT_HEIGHT, height: minHeight }}
                    onMouseDown={e => beginMove(e, b)}
                    onDoubleClick={e => deleteBlock(b.id)}
                  >
                    {/* Top resize handle */}
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/50 cursor-ns-resize z-10 no-print"
                      onMouseDown={e => beginResize(e, b, "top")}
                    />

                    {/* Delete button */}
                    <button
                      className="absolute top-0 right-0 w-3 h-3 flex items-center justify-center text-[10px] font-bold
                                text-white bg-red-600 rounded shadow-md z-20 no-print"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBlocks(prev => prev.filter(block => block.id !== b.id));
                      }}
                      title="Delete block"
                    >
                      ×
                    </button>

                    {/* Block content */}
                    <div className="pl-2 pr-1 pt-1 pb-1 text-sm select-none flex items-center justify-start h-full pointer-events-none text-left overflow-hidden">
                      <span className="font-bold text-[10px] truncate">{b.name} {formatTime12(b.start)}–{formatTime12(b.start + b.duration)}</span>
                    </div>

                    {/* Bottom resize handle */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/50 cursor-ns-resize z-10 no-print"
                      onMouseDown={e => beginResize(e, b, "bottom")}
                    />
                  </div>
              );
            })}
          </div>
        </div>

        {/* Pie Chart on the Right */}
        <div className="w-full sm:w-1/4 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-4 shadow-lg overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2 text-center text-slate-800">Category Breakdown</h2>
          <PieChart data={categoryTotals} />
        </div>
      </div>
    </div>
  );
}
