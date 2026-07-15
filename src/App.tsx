import { HashRouter, Routes, Route } from 'react-router-dom'; // استيراد HashRouter
import Navbar from './Navbar';
import GetData from './GetData';

const App: React.FC = () => {
  return (
    <HashRouter> {/* استخدم HashRouter بدلاً من BrowserRouter */}
      <Navbar /> 
      <Routes>
        <Route path="/" element={<GetData />} />
        <Route path="/getdata" element={<GetData />} />
        <Route path="*" element={<div className="text-center my-5">الصفحة غير موجودة 404</div>} />
      </Routes>
    </HashRouter>
  );
};

export default App;