// import './App.css';
// import React, { useContext, useEffect } from "react";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "./pages/Main";
import QRPage from "./pages/QRPage";
import InfoPage from "./pages/InfoPage";
import Done from "./pages/Done";
import MakeSession from "./pages/MakeSession";
import ManageSessionMember from "./pages/ManageSessionMember";
import MakeInstanceSession from "./pages/MakeInstanceSession";
import RunningConfirm from "./pages/RunningConfirm";
import MemberAdmin from "./pages/MemberAdmin";
import CrewAttendance from './pages/CrewAttendance';
import Dashboard from './pages/Dashboard';


// import './App.css'; // Make sure to import the CSS file



function App() {

  return (
    <div className="App">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />}></Route>
        <Route path="/qr" element={<QRPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/InfoPage" element={<InfoPage />} />
        <Route path="/Done" element={<Done />} />
        <Route path="/MakeSession" element={<MakeSession />} />
        <Route path="/ManageSessionMember" element={<ManageSessionMember />} />
        <Route path="/MakeInstanceSession" element={<MakeInstanceSession />} />
        <Route path="/RunningConfirm" element={<RunningConfirm />} />
        <Route path="/MemberAdmin" element={<MemberAdmin />} />
        <Route path="/CrewAttendance" element={<CrewAttendance />} />
        <Route path="/Dashboard" element={<Dashboard />} />


      </Routes>
      </BrowserRouter>
    </div>


  );
}
export default App;