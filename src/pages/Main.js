import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './Supabase'
import '../style/Main.css'; // CSS 파일 임포트

const Main = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    // Supabase에서 세션 테이블의 name 데이터를 가져옵니다.
    const fetchNames = async () => {
      const { data, error } = await supabase.schema('hirc').from('sessions').select('name, uuid, id').is('closing_at', null);
      if (error) {
        console.error('Error fetching names:', error);
      } else {
        setSessions(data);
      }
    };

    fetchNames();
  }, []);

  const handleAttendance = (id, name, uuid) => {
    navigate(`/qr?uuid=${encodeURIComponent(uuid)}&name=${encodeURIComponent(name)}&sessionId=${encodeURIComponent(id)}`);
    // 여기서 출석 체크 로직을 추가할 수 있습니다.
  };

  // "Session 만들기" 버튼 클릭 시 페이지 이동
  const handleCreateSession = () => {
      navigate('/MakeSession');
    };

  // "Session 만들기" 버튼 클릭 시 페이지 이동
  const handleCreateInstanceSession = () => {
    navigate('/MakeInstanceSession');
  };

  // "회원관리" 버튼 클릭 시 페이지 이동
  const handleMemberAdmin = () => {
    navigate('/MemberAdmin');
  };

  // "크루 출석현황" 버튼 클릭 시 페이지 이동
  const handleCrewAttendance = () => {
    navigate('/CrewAttendance');
  };

  // "대시보드" 버튼 클릭 시 페이지 이동
  const handleDashboard = () => {
    navigate('/Dashboard');
  };

  return (
    <div>
      <h1>hirc 출석 체크</h1>
      <button className="sessionMaker" onClick={handleDashboard}>🏆 대시보드</button>
      <button className="sessionMaker" onClick={handleCrewAttendance}>크루 출석현황</button>
      <button className="sessionMaker" onClick={handleMemberAdmin}>회원관리</button>
      <button className="sessionMaker" onClick={handleCreateSession}>Session 만들기</button>
      <button className="sessionMaker" onClick={handleCreateInstanceSession}>벙 Session 만들기</button>

      {/* sessionList */}
      {sessions.map((session, index) => (
        <button className="sessionList" key={index} onClick={() => handleAttendance(session.id, session.name, session.uuid)}>
          {session.name}
        </button>
      ))}

    </div>
  );
};

export default Main;
