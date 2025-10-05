// Teacher Portal - main entry point for teacher functionality
import React, { useState } from 'react';
import TeacherLogin from './TeacherLogin';
import TeacherDashboard from './TeacherDashboard';

const TeacherPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState<string>('');

  const handleLogin = (id: number, name: string) => {
    setTeacherId(id);
    setTeacherName(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setTeacherId(null);
    setTeacherName('');
  };

  if (!isLoggedIn || !teacherId) {
    return <TeacherLogin onLogin={handleLogin} />;
  }

  return (
    <TeacherDashboard
      teacherId={teacherId}
      teacherName={teacherName}
      onLogout={handleLogout}
    />
  );
};

export default TeacherPortal;
