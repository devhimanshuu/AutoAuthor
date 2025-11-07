import React from "react";
import {Routes, Route} from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import EditorPage from "./pages/EditorPage.jsx";
import ViewBookPage from "./pages/ViewBookPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";


const App = () => {
  return (
    <div>
     <Routes>
      <Route path="/" element={<LandingPage />}/>
      <Route path="/login" element={<LoginPage />}/>
      <Route path="/signup" element={<SignupPage />}/>
     

     <Route path="/dashboard" element={
       <ProtectedRoute>
         <DashboardPage />
       </ProtectedRoute>
     }/>
     <Route path="/editor/:bookId" element={
       <ProtectedRoute>
         <EditorPage />
       </ProtectedRoute>
     }/>
     <Route path="/view-book/:bookId" element={
       <ProtectedRoute>
         <ViewBookPage />
       </ProtectedRoute>
     }/>
     <Route path="/profile" element={
       <ProtectedRoute>
         <ProfilePage />
       </ProtectedRoute>
     }/>
     </Routes>
    </div>
  );
};

export default App;