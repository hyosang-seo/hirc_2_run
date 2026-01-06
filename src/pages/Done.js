import React, { useEffect, useState } from 'react';
import supabase from "./Supabase";
import { useLocation } from 'react-router-dom';

const Done = () => {
  console.log('supabase:', supabase);
  const [sessions, setSessions] = useState([]);
  const location = useLocation();
  const { name, secretNumber } = location.state || {};


  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1; // 월은 0부터 시작
    const day = date.getDate();
    return `${month}월 ${day}일`;
  };
  useEffect(() => {
    // 올해 시작일과 끝일을 계산
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString();


    const fetchSessions = async () => {
      try {
        // 예시: 현재 로그인한 사용자의 이름
        // const myName = '서효상';
        // const secret_number = 3724;

        // 1단계: 나와 관련된 workout_members에서 session_id 뽑기
        const { data: myMemberships, error: memberError } = await supabase
          .schema('hirc')
          .from('workout_members')
          .select('session_id')
          .eq('name', name)
          .eq('secret_number', secretNumber)
          .eq('status', 'done'); // 필요하면 조건 추가

        if (memberError) throw memberError;

        const mySessionIds = myMemberships.map((m) => m.session_id);

        // 2단계: session_id로 sessions 조회
        const { data: mySessions, error: sessionError } = await supabase
          .schema('hirc')
          .from('sessions')
          .select(`
            name,
            openning_at
          `)
          .in('id', mySessionIds)
          .gte('closing_at', startOfYear)
          .lte('closing_at', endOfYear)
          .order('closing_at', { ascending: false });

        if (sessionError) throw sessionError;

        setSessions(mySessions);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, [name, secretNumber]);

  return (
    <div>
      <h1>함께 건강하게 롱런해요~!!</h1>
      <h3>Let's run together</h3>

      <h2>올해의 참가 세션 목록</h2>
      <hr />
      <ul>
        {sessions.map(session => (
          <li key={session.id}>
            <h3>{session.name} : {formatDate(session.openning_at)}</h3>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Done;