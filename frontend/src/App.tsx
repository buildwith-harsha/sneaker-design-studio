import { Routes, Route, Navigate } from "react-router-dom";

import MyDesigns from "./components/MyDesigns";
import DesignEditor from "./components/DesignEditor";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/designs/new" replace />} />

      <Route path="/designs" element={<MyDesigns />} />

      <Route path="/designs/new" element={<DesignEditor />} />

      <Route path="/designs/:id" element={<DesignEditor />} />
    </Routes>
  );
}

export default App;
