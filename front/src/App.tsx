import { BrowserRouter, Routes, Route } from 'react-router-dom';
import InvitePage from './pages/InvitePage';
import AdminPage from './pages/AdminPage'; 

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<InvitePage />} />
                <Route path="/admin" element={<AdminPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;