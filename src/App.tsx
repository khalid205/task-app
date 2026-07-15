import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import GetData from './GetData';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* الـ Navbar يظهر دائماً في كل الصفحات */}
      <Navbar /> 
      
      {/* التنقل بين الصفحات بناءً على الرابط */}
      <Routes>
        {/* ✅ تصحيح مسار الـ Route ليعرض المكون مباشرة */}
        <Route path="/" element={<GetData />} /> {/* قمنا بوضع GetData هنا لتعمل كصفحة رئيسية أيضاً عند فتح الموقع */}
        <Route path="/getdata" element={<GetData />} />
        <Route path="*" element={<div className="text-center my-5">الصفحة غير موجودة 404</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;