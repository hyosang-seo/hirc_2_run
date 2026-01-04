import React, { useEffect, useState } from 'react';
import supabase from './Supabase';
import { useNavigate } from 'react-router-dom';

const RunningConfirm = ({ status }) => {
  const [sessionList, setSessionList] = useState([]); // session 데이터를 저장할 상태
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select(`name, uuid`)
        .eq('is_standard', 0)
        .not('closing_at', 'is', null)
        .eq('is_confirmed', 0);

      if (error) {
        console.error('Error fetching sessions:', error);
      } else {
        setSessionList(data); // 불러온 데이터를 상태에 저장
      }
    };

    fetchSession();
  }, [status]); // status가 바뀔 때마다 데이터를 다시 불러옴

  // 버튼 클릭 시 해당 세션의 is_confirmed를 1로 업데이트하는 함수
  const handleConfirm = async (uuid) => {
    const { error } = await supabase
      .from('sessions')
      .update({ is_confirmed: 1 }) // is_confirmed 값을 1로 업데이트
      .eq('uuid', uuid);

    if (error) {
      console.error('Error updating session:', error);
    } else {
      // 업데이트가 성공하면 페이지 새로고침
      window.location.reload(); // 페이지 새로고침
    }
  };

  return (
    <>
      <div>
        <h2>승인할 session 클릭하기</h2>
      </div>
      <div>
        {sessionList.length > 0 ? (
          sessionList.map((session) => (
            <button key={session.uuid} onClick={() => handleConfirm(session.uuid)}>
              {session.name}
            </button>
          ))
        ) : (
          <p>No sessions available<br />
          출석체크에서 러닝시작을 누르지 않으면 나타나지 않아요!</p>
        )}
      <button onClick={() => navigate('/')}>홈으로 가기</button>

      </div>
    </>
  );
};

export default RunningConfirm;